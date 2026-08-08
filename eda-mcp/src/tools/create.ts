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
			'\n\n给了 name 会创建后改名；不给则用 EDA 的默认命名（Board1、Board2…）。' +
			'\n**给了 name 时会顺带打开这块板的原理图页**：刚建的板文档没落盘，' +
			'不先保存一次的话 modifyBoardName 会静默失败（返回 true 但名字没变、重试多久都没用）。' +
			'工具会自动 openDocument → save → 改名 → 按 schematic uuid 重查确认，因此建板要花十几秒，' +
			'且结束后当前编辑器停在新板的图页上。仍未成功时 renamed=false 且 rename_failed 会说明。' +
			'\n\n注意作用在当前打开的工程上 —— 先用 eda_project_overview 确认是不是目标工程。',
		inputSchema: {
			type: 'object',
			properties: { name: { type: 'string', description: '板子名，可选；不给用 EDA 默认命名' } },
		},
		mutating: true,
		handler: async (args, ctx) => {
			const name = optionalString(args, 'name');
			const res = await ctx.exec<Record<string, unknown>>(
				`
				const proj = await eda.dmt_Project.getCurrentProjectInfo();
				if (!proj) return { ok: false, error: '当前没有打开的工程' };
				// 实测：这两个无参调用只产生游离文档，必须再 createBoard 绑定
				const schUuid = await eda.dmt_Schematic.createSchematic();
				const pcbUuid = await eda.dmt_Pcb.createPcb();
				if (!schUuid || !pcbUuid) return { ok: false, error: '创建原理图或 PCB 失败' };
				const createdName = await eda.dmt_Board.createBoard(schUuid, pcbUuid);
				if (!createdName) return { ok: false, error: '绑定板子失败' };

				// ── 定位刚建的板 ──
				// 关键：不能按名字查。板子没有 uuid，名字就是它的唯一标识，而
				// createBoard 给的是 EDA 默认命名（Board1、Board2…），工程里
				// 完全可能已经有个同名的旧板 —— 按名字 find 会撞上那个旧板，
				// 于是返回别人的 page uuid。这个坑真踩过：连着建两块板，两块都
				// 报告了第三块板的图页 uuid。
				//
				// 唯一可靠的判据是 schUuid：那是我们自己刚创建的原理图 uuid，
				// 全局唯一，谁也冒充不了。列表有缓存，所以要轮询等它出现，
				// 宁可多等 —— 拿到确定信息比快返回重要。
				let info;
				let attempts = 0;
				const tried = [];
				for (let i = 0; i < 8; i += 1) {
					attempts = i + 1;
					const all = (await eda.dmt_Board.getAllBoardsInfo()) || [];
					info = all.find(function (b) { return b.schematic && b.schematic.uuid === schUuid; });
					// pcb 字段偶尔比 schematic 晚挂上，等齐再收
					if (info && info.pcb) break;
					tried.push(all.length);
					info = undefined;
					await new Promise(function (r) { setTimeout(r, 500 + i * 500); });
				}
				if (!info) {
					return {
						ok: false,
						error: '板子建出来了，但查询不到它的完整信息 —— 轮询 ' + attempts +
							' 次都没在板子列表里找到 schematic.uuid=' + schUuid + ' 的板子。' +
							'板子本身应该是好的（默认名 ' + createdName + '），请在 EDA 界面里确认。' +
							'这里拒绝返回可能是别的板子的数据。',
						created_name: createdName,
						schematic_uuid: schUuid,
						pcb_uuid: pcbUuid,
						boards_seen_per_attempt: tried,
					};
				}

				// ── 交叉校验：拿到的这份数据必须处处自洽 ──
				const checks = {
					schematic_uuid_matches: info.schematic.uuid === schUuid,
					pcb_uuid_matches: !!info.pcb && info.pcb.uuid === pcbUuid,
					name_matches_create: info.name === createdName,
					in_current_project: info.parentProjectUuid === proj.uuid,
					has_page: !!(info.schematic.page && info.schematic.page.length),
				};
				const failed = Object.keys(checks).filter(function (k) { return !checks[k]; });
				if (failed.length) {
					return {
						ok: false,
						error: '查到的板子数据没通过交叉校验，不敢用：' + failed.join('、') +
							'。多半是查到了别的板子或半旧的缓存。板子本身应该已建好（' + createdName + '），请在 EDA 界面确认。',
						checks: checks,
						schematic_uuid: schUuid,
						pcb_uuid: pcbUuid,
					};
				}

				return {
					ok: true,
					board: {
						name: createdName,
						schematic: { uuid: info.schematic.uuid, name: info.schematic.name,
							pages: (info.schematic.page || []).map(function (p) { return { uuid: p.uuid, name: p.name }; }) },
						pcb: { uuid: info.pcb.uuid, name: info.pcb.name },
					},
					schematic_uuid: schUuid,
					project: proj.friendlyName || proj.name,
					// 这块板是靠什么认出来的、校验过哪些项 —— 便于调用方判断可信度
					identified_by: 'schematic.uuid === createSchematic() 的返回值',
					lookup_attempts: attempts,
					cross_checks: checks,
				};
			`,
				CREATE_TIMEOUT_MS,
			);

			// ── 改名：必须先把新板的原理图打开并保存 ──
			// 根因实测出来了：**刚创建的板子，它的原理图文档还没落盘，这时候
			// modifyBoardName 会静默失败** —— 返回 true，名字纹丝不动，等多久、
			// 重试几次都没用（等过 3 分钟仍然不行）。而对一块「存在有一会儿」的
			// 板改名一次就成。差别就是文档有没有保存过：
			//   openDocument(页) → activateDocument → sch_Document.save() → 改名 ✓
			// 顺带一提，modifySchematicName 在未落盘时是老老实实返回 false 的，
			// 只有 modifyBoardName 谎报成功 —— 又一条「返回值只作参考」的例证。
			const created = res as {
				ok?: boolean;
				board?: { name?: string; schematic?: { pages?: Array<{ uuid?: string }> } };
				schematic_uuid?: string;
			};
			if (!created?.ok || !name || !created.board?.name || created.board.name === name) {
				return res;
			}
			const firstPage = created.board.schematic?.pages?.[0]?.uuid ?? '';

			const renamed = await ctx.exec<Record<string, unknown>>(
				`
				const WANT = ${JSON.stringify(name)};
				const SCH = ${JSON.stringify(created.schematic_uuid ?? '')};
				const PAGE = ${JSON.stringify(firstPage)};
				const findMine = async function () {
					return ((await eda.dmt_Board.getAllBoardsInfo()) || [])
						.find(function (b) { return b.schematic && b.schematic.uuid === SCH; });
				};
				const taken = ((await eda.dmt_Board.getAllBoardsInfo()) || [])
					.some(function (b) { return b.name === WANT && !(b.schematic && b.schematic.uuid === SCH); });
				if (taken) {
					return { ok: false, reason: '工程里已经有一块板叫 ' + WANT + '，板名必须唯一' };
				}

				// 先让文档落盘，否则下面的改名会谎报成功
				let saved = false;
				if (PAGE) {
					const tab = await eda.dmt_EditorControl.openDocument(PAGE);
					if (tab) {
						await eda.dmt_EditorControl.activateDocument(tab);
						await new Promise(function (r) { setTimeout(r, 1200); });
						saved = (await eda.sch_Document.save().catch(function () { return false; })) === true;
						await new Promise(function (r) { setTimeout(r, 1200); });
					}
				}

				// 返回值不可信，判据一律是「按 schUuid 重查这块板叫什么」
				let tries = 0;
				for (let i = 0; i < 4; i += 1) {
					tries = i + 1;
					const mine = await findMine();
					if (!mine) break;
					if (mine.name === WANT) return { ok: true, tries: tries, saved: saved };
					await eda.dmt_Board.modifyBoardName(mine.name, WANT);
					await new Promise(function (r) { setTimeout(r, 800 + i * 800); });
					const back = await findMine();
					if (back && back.name === WANT) return { ok: true, tries: tries, saved: saved };
				}
				const last = await findMine();
				return { ok: false, tries: tries, saved: saved, current_name: last ? last.name : undefined };
			`,
				CREATE_TIMEOUT_MS,
			);

			const okRenamed = renamed?.ok === true;
			return {
				...created,
				board: { ...created.board, name: okRenamed ? name : created.board.name },
				renamed: okRenamed,
				rename_tries: renamed?.tries,
				rename_failed: okRenamed
					? undefined
					: `改名没成功${renamed?.reason ? `：${String(renamed.reason)}` : ''}。` +
						`板子以 ${String(renamed?.current_name ?? created.board.name)} 存在，板子本身是好的，请在 EDA 界面里手动改名。`,
			};
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
					error: '改名未生效（modifyBoardName 谎报了成功）。最常见的原因是**这块板刚建出来、'
						+ '原理图文档还没落盘** —— 此时改名一定失败且返回 true，等多久、重试多少次都没用。'
						+ '解法：先用 eda_open_document 打开这块板的原理图页，跑一次 eda_execute '
						+ '"await eda.sch_Document.save()"，再回来改名。'
						+ '（另一种可能是新名字与现有板子重名，板名在工程内必须唯一。）',
					boards: names,
				};
			`,
				CREATE_TIMEOUT_MS,
			);
		},
	},
];
