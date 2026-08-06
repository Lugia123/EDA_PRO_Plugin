/**
 * 工程结构工具 —— AI 的"地图"，几乎每个任务开头都要用。
 *
 * 实测得出的两条要点（文档没写对）：
 *  1. getAllBoardsInfo() 返回的 board 已内嵌 schematic（含 pages）和 pcb，
 *     **一次调用就是完整树**，不必再分别调 getAllSchematicsInfo / getAllPcbsInfo。
 *  2. getAllProjectsUuid() 的 teamUuid 文档标为可选，但不传时返回空数组，
 *     必须显式传入 —— 见 eda_list_projects。
 *
 * 返回值做了裁剪：去掉 itemType（恒定）、重复的 parentProjectUuid、
 * titleBlockData（单页就有 32 个键，全是图框排版噪音）。原始数据可用 eda_execute 取。
 */
import type { ToolDef } from './types.js';
import { optionalBool, optionalString, requireString } from './types.js';

export const projectTools: ToolDef[] = [
	{
		name: 'eda_project_overview',
		description:
			'当前工程全貌：工程名与 uuid、所属团队、以及全部板子（每块板含其原理图 uuid + 页列表、PCB uuid）。' +
			'\n\n这是操作 EDA 的起点 —— 后续按原理图 / PCB 操作时需要的 uuid 都来自这里。' +
			'\n\n返回值已裁剪掉图框排版等噪音字段；需要原始结构用 eda_execute 调 dmt_Board.getAllBoardsInfo()。',
		inputSchema: { type: 'object', properties: {} },
		handler: async (_args, ctx) =>
			ctx.exec(`
				const proj = await eda.dmt_Project.getCurrentProjectInfo();
				if (!proj) return { error: '当前没有打开的工程，请先让用户在 EDA 里打开一个工程' };
				const boards = await eda.dmt_Board.getAllBoardsInfo();
				const team = await eda.dmt_Team.getCurrentTeamInfo().catch(() => null);
				const ws = await eda.dmt_Workspace.getCurrentWorkspaceInfo().catch(() => null);
				return {
					project: { uuid: proj.uuid, name: proj.friendlyName || proj.name, description: proj.description || undefined },
					team: team ? { uuid: team.uuid, name: team.name } : undefined,
					workspace: ws ? { uuid: ws.uuid, name: ws.name } : undefined,
					boards: (boards || []).map(b => ({
						name: b.name,
						uuid: b.uuid,
						schematic: b.schematic ? {
							uuid: b.schematic.uuid,
							name: b.schematic.name,
							pages: (b.schematic.page || []).map(p => ({ uuid: p.uuid, name: p.name })),
						} : null,
						pcb: b.pcb ? { uuid: b.pcb.uuid, name: b.pcb.name } : null,
					})),
				};
			`),
	},
	{
		name: 'eda_current_context',
		description:
			'当前正在编辑的对象：哪块板、哪一页原理图、哪个 PCB。' +
			'\n\n用户说「这个原理图」「当前这块板」时，用本工具把指代解析成具体 uuid。' +
			'\n注意：打开原理图时 current_pcb 为 null，反之亦然 —— 由此可判断用户此刻在哪个编辑器里。',
		inputSchema: { type: 'object', properties: {} },
		handler: async (_args, ctx) =>
			ctx.exec(`
				const pick = (o, keys) => o ? Object.fromEntries(keys.filter(k => o[k] !== undefined).map(k => [k, o[k]])) : null;
				const board = await eda.dmt_Board.getCurrentBoardInfo().catch(() => null);
				const page  = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
				const sch   = await eda.dmt_Schematic.getCurrentSchematicInfo().catch(() => null);
				const pcb   = await eda.dmt_Pcb.getCurrentPcbInfo().catch(() => null);
				return {
					board: pick(board, ['uuid', 'name']),
					schematic: pick(sch, ['uuid', 'name']),
					schematic_page: pick(page, ['uuid', 'name', 'parentSchematicUuid']),
					pcb: pick(pcb, ['uuid', 'name']),
					editor: page ? 'schematic' : pcb ? 'pcb' : 'other',
				};
			`),
	},
	{
		name: 'eda_list_projects',
		description:
			'列出可访问的工程（uuid + 名称 + 所属团队），用于查找或切换工程。' +
			'\n\n默认只列当前团队；include_all_teams=true 时遍历全部团队（个人 + 各协作团队）。' +
			'\n注意每个工程要单独取一次详情（约 250ms），团队工程多时会慢，非必要不要开 include_all_teams。',
		inputSchema: {
			type: 'object',
			properties: {
				include_all_teams: { type: 'boolean', description: '是否遍历所有团队，默认 false（只查当前团队）' },
				team_uuid: { type: 'string', description: '可选，指定团队 uuid；给出时忽略 include_all_teams' },
			},
		},
		handler: async (args, ctx) => {
			const all = optionalBool(args, 'include_all_teams');
			const teamUuid = optionalString(args, 'team_uuid');
			return ctx.exec(
				`
				const wantAll = ${all};
				const fixedTeam = ${JSON.stringify(teamUuid ?? null)};
				let teams;
				if (fixedTeam) {
					const list = await eda.dmt_Team.getAllTeamsInfo();
					teams = list.filter(t => t.uuid === fixedTeam);
					if (!teams.length) return { error: '找不到团队 ' + fixedTeam };
				} else if (wantAll) {
					teams = await eda.dmt_Team.getAllTeamsInfo();
				} else {
					const cur = await eda.dmt_Team.getCurrentTeamInfo();
					teams = cur ? [cur] : [];
				}
				const out = [];
				for (const t of teams) {
					// 实测：teamUuid 文档标可选，但不传返回空数组，必须显式传
					const uuids = await eda.dmt_Project.getAllProjectsUuid(t.uuid);
					for (const u of uuids) {
						const p = await eda.dmt_Project.getProjectInfo(u);
						if (p) out.push({ uuid: p.uuid, name: p.friendlyName || p.name, team: t.name, team_uuid: t.uuid, folder_uuid: p.folderUuid || undefined });
					}
				}
				return { count: out.length, projects: out };
			`,
				60_000,
			);
		},
	},
	{
		name: 'eda_open_project',
		description:
			'在 EDA 里打开指定 uuid 的工程（切换当前工程）。uuid 从 eda_list_projects 获取。' +
			'\n\n会改变用户界面显示的内容，但不修改工程数据。切换后建议再调 eda_project_overview 确认。' +
			'\n\n本工具会先校验 uuid 是否属于可访问的工程，无效 uuid 直接返回错误而不会真的去打开' +
			'—— 因为实测发现 EDA 的 openProject 遇到不存在的 uuid 不是干净失败，而是把编辑器切到空白的「开始页」，' +
			'导致当前工程上下文丢失、后续所有 getCurrent* 调用返回空。',
		inputSchema: {
			type: 'object',
			properties: { project_uuid: { type: 'string', description: '目标工程 uuid' } },
			required: ['project_uuid'],
		},
		handler: async (args, ctx) => {
			const uuid = requireString(args, 'project_uuid');
			return ctx.exec(
				`
				const target = ${JSON.stringify(uuid)};
				// 先校验：openProject 对无效 uuid 会把编辑器切到「开始页」并清空上下文，
				// 那种状态很难自动恢复（要靠用户手动点回工程），所以宁可多花一次查询也不能试错。
				const teams = await eda.dmt_Team.getAllTeamsInfo();
				let known = false;
				for (const t of teams) {
					const uuids = await eda.dmt_Project.getAllProjectsUuid(t.uuid);
					if (uuids.includes(target)) { known = true; break; }
				}
				if (!known) {
					return { ok: false, error: '工程 ' + target + ' 不在可访问列表中，已阻止打开（避免清空当前工程上下文）。请用 eda_list_projects 确认 uuid。' };
				}
				const ok = await eda.dmt_Project.openProject(target);
				if (!ok) return { ok: false, error: '打开失败，uuid 有效但 EDA 拒绝打开，可能是权限或网络问题' };
				const proj = await eda.dmt_Project.getCurrentProjectInfo();
				return { ok: true, current_project: proj ? { uuid: proj.uuid, name: proj.friendlyName || proj.name } : null };
			`,
				60_000,
			);
		},
	},
];
