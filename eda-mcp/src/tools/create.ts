/**
 * 工程与文档的创建（写操作）。
 *
 * 实测出来的创建语义（文档没写清楚）：
 *   createSchematic() / createPcb() 无参调用只产生**游离文档**，不会出现在板子列表里；
 *   必须再调 createBoard(schUuid, pcbUuid) 把两者绑成一块板。
 *   createBoard() 无参调用返回 undefined，什么也不会创建。
 *   createBoard 的返回值是**板子名称**（如 "Board1_1"），不是 uuid —— 与类型声明的
 *   `Promise<string | undefined>` 一致但含义容易误解。
 *
 * 按 design.md §0 铁律 5，这些工具都会改用户的工程，描述里必须写清楚。
 * 删除类操作（deleteProject / deleteBoard / deletePcb）**故意不提供** ——
 * 误删的代价远大于省下的手工操作，让用户在 EDA 界面里删。
 */
import type { ToolDef } from './types.js';
import { optionalString, requireString } from './types.js';

const CREATE_TIMEOUT_MS = 60_000;

export const createTools: ToolDef[] = [
	{
		name: 'eda_create_project',
		description:
			'【写操作】新建一个工程。默认建在当前团队下。' +
			'\n\n创建后**不会自动切换**过去，当前编辑的工程保持不变；要切过去用 eda_open_project。' +
			'\n\n注意这会在用户的立创账号里真实创建工程，动手前先跟用户确认名称。',
		inputSchema: {
			type: 'object',
			properties: {
				name: { type: 'string', description: '工程名（显示名）' },
				description: { type: 'string', description: '工程描述，可选' },
				team_uuid: { type: 'string', description: '目标团队 uuid，可选，默认当前团队' },
			},
			required: ['name'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const name = requireString(args, 'name');
			const desc = optionalString(args, 'description');
			const team = optionalString(args, 'team_uuid');
			return ctx.exec(
				`
				const team = ${JSON.stringify(team ?? null)} || (await eda.dmt_Team.getCurrentTeamInfo())?.uuid;
				if (!team) return { ok: false, error: '拿不到团队 uuid' };
				const uuid = await eda.dmt_Project.createProject(
					${JSON.stringify(name)}, undefined, team, undefined, ${JSON.stringify(desc ?? '')}
				);
				if (!uuid) return { ok: false, error: '创建失败，可能是同名工程已存在或无权限' };
				return { ok: true, project_uuid: uuid, name: ${JSON.stringify(name)},
					note: '工程已创建但未切换过去，需要编辑的话用 eda_open_project 打开' };
			`,
				CREATE_TIMEOUT_MS,
			);
		},
	},
	{
		name: 'eda_create_board',
		description:
			'【写操作】在**当前工程**里新建一块板子，自动配好一张原理图（含 1 页）和一个 PCB。' +
			'\n\n这是"新建板子"的正确做法：底层要先建原理图和 PCB 再绑定，本工具已封装。' +
			'\n\n给了 name 会尝试创建后改名；不给则用 EDA 的默认命名（Board1、Board2…）。' +
			'\n**改名不保证成功**：EDA 的 modifyBoardName 实测不稳定（有时返回 true 却没生效，' +
			'有时直接返回 false，原因未查明）。改名失败时板子仍会以默认名正常建好，' +
			'返回里 renamed=false 且 rename_failed 会说明——这时请让用户在 EDA 界面里手动改名。' +
			'\n\n注意作用在当前打开的工程上 —— 先用 eda_project_overview 确认是不是目标工程。',
		inputSchema: {
			type: 'object',
			properties: { name: { type: 'string', description: '板子名，可选；不给用 EDA 默认命名' } },
		},
		mutating: true,
		handler: async (args, ctx) => {
			const name = optionalString(args, 'name');
			return ctx.exec(
				`
				const proj = await eda.dmt_Project.getCurrentProjectInfo();
				if (!proj) return { ok: false, error: '当前没有打开的工程' };
				// 实测：这两个无参调用只产生游离文档，必须再 createBoard 绑定
				const schUuid = await eda.dmt_Schematic.createSchematic();
				const pcbUuid = await eda.dmt_Pcb.createPcb();
				if (!schUuid || !pcbUuid) return { ok: false, error: '创建原理图或 PCB 失败' };
				const createdName = await eda.dmt_Board.createBoard(schUuid, pcbUuid);
				if (!createdName) return { ok: false, error: '绑定板子失败' };

				// 先按创建时的名字取回完整信息 —— 改名放在后面，因为改名可能失败，
				// 失败时我们仍要有 sch/pcb 的 uuid 可返回。
				// 刚建好的板偶尔查到时 pcb 字段还没挂上，重查一次即可。
				let info = (await eda.dmt_Board.getAllBoardsInfo()).find(b => b.name === createdName);
				if (!info?.pcb) {
					await new Promise(r => setTimeout(r, 400));
					info = (await eda.dmt_Board.getAllBoardsInfo()).find(b => b.name === createdName) || info;
				}

				const want = ${JSON.stringify(name ?? null)};
				let finalName = createdName;
				let renameNote;
				if (want && want !== createdName) {
					// modifyBoardName 的返回值不可信（实测有时返回 true 却没生效），
					// 一律以「重新查询列表里有没有新名字」为准。
					await eda.dmt_Board.modifyBoardName(createdName, want);
					const names = (await eda.dmt_Board.getAllBoardsInfo()).map(b => b.name);
					if (names.includes(want)) {
						finalName = want;
					} else {
						renameNote = '改名未生效，板子以默认名 ' + createdName + ' 创建（板子本身是好的）。'
							+ 'EDA 的 modifyBoardName 实测不稳定，原因未查明；请让用户在 EDA 界面里手动改名。';
					}
				}

				return {
					ok: true,
					board: {
						name: finalName,
						uuid: info?.uuid,
						schematic: info?.schematic ? { uuid: info.schematic.uuid, name: info.schematic.name,
							pages: (info.schematic.page || []).map(p => ({ uuid: p.uuid, name: p.name })) } : null,
						pcb: info?.pcb ? { uuid: info.pcb.uuid, name: info.pcb.name } : null,
					},
					renamed: finalName === want,
					rename_failed: renameNote,
					project: proj.friendlyName || proj.name,
				};
			`,
				CREATE_TIMEOUT_MS,
			);
		},
	},
	{
		name: 'eda_create_schematic_page',
		description:
			'【写操作】给已有的原理图加一页。schematic_uuid 从 eda_project_overview 的 boards[].schematic.uuid 拿。' +
			'\n\n适用于原理图内容多、需要分页组织的情况（如电源一页、MCU 一页）。',
		inputSchema: {
			type: 'object',
			properties: {
				schematic_uuid: { type: 'string', description: '目标原理图 uuid' },
				name: { type: 'string', description: '页名，可选；不给用默认命名' },
			},
			required: ['schematic_uuid'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const uuid = requireString(args, 'schematic_uuid');
			const name = optionalString(args, 'name');
			return ctx.exec(
				`
				const pageUuid = await eda.dmt_Schematic.createSchematicPage(${JSON.stringify(uuid)});
				if (!pageUuid) return { ok: false, error: '建页失败，请确认 schematic_uuid 正确' };
				const want = ${JSON.stringify(name ?? null)};
				let renamed = false;
				if (want) renamed = await eda.dmt_Schematic.modifySchematicPageName(pageUuid, want);
				const info = await eda.dmt_Schematic.getSchematicPageInfo(pageUuid);
				return { ok: true, page: { uuid: pageUuid, name: info?.name }, renamed };
			`,
				CREATE_TIMEOUT_MS,
			);
		},
	},
	{
		name: 'eda_rename_board',
		description:
			'【写操作】给板子改名。板名在工程内唯一，重名会失败。' +
			'\n\n**这个功能不可靠**：EDA 的 modifyBoardName 实测时灵时不灵（有时返回 true 却没生效，' +
			'有时返回 false，与名字长短、是否含中文、是否刚刷新页面都无稳定关系，原因未查明）。' +
			'本工具以「改完重新查列表」为准，不信 API 返回值；失败时如实报错。' +
			'\n\n连续失败就别重试了，让用户在 EDA 界面里手动改。',
		inputSchema: {
			type: 'object',
			properties: {
				current_name: { type: 'string', description: '当前板名' },
				new_name: { type: 'string', description: '新板名' },
			},
			required: ['current_name', 'new_name'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const from = requireString(args, 'current_name');
			const to = requireString(args, 'new_name');
			return ctx.exec(
				`
				const boards = await eda.dmt_Board.getAllBoardsInfo();
				if (!boards.some(b => b.name === ${JSON.stringify(from)})) {
					return { ok: false, error: '当前工程里没有板子 ' + ${JSON.stringify(from)}, boards: boards.map(b => b.name) };
				}
				// 返回值不可信，以重新查询为准。
				// 判据必须是「新名出现 且 旧名消失」—— 只看新名存在的话，
				// 目标名恰好是另一块已存在的板时会误判成功。
				await eda.dmt_Board.modifyBoardName(${JSON.stringify(from)}, ${JSON.stringify(to)});
				const names = (await eda.dmt_Board.getAllBoardsInfo()).map(b => b.name);
				if (names.includes(${JSON.stringify(to)}) && !names.includes(${JSON.stringify(from)})) {
					return { ok: true, from: ${JSON.stringify(from)}, to: ${JSON.stringify(to)} };
				}
				return {
					ok: false,
					error: '改名未生效。EDA 的 modifyBoardName 实测不稳定，原因未查明；'
						+ '若新名字与现有板子重名也会失败。建议让用户在 EDA 界面里手动改名。',
					boards: names,
				};
			`,
				CREATE_TIMEOUT_MS,
			);
		},
	},
];
