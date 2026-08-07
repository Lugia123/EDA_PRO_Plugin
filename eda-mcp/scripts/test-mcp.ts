/**
 * MCP 工具层端到端自测 —— 用官方 SDK 的 Client 以 stdio 直连本 server。
 *
 *   npm run test:mcp
 *
 * 走的是真实 MCP 协议（initialize / tools/list / tools/call），
 * 因此覆盖到「工具在 Claude Code 里会怎么表现」，而不只是内部函数调用。
 * 好处是不必先把 plugin 装进 Claude Code（装了也要重启会话才生效）。
 *
 * 前置：EDA 里的 eda-bridge 扩展已配对。本脚本会 spawn 自己的 MCP 进程，
 * 它自带 bridge；若此时 dev-bridge 还占着 49630，MCP 会退到 49631，
 * 而扩展连的是 49630 —— 所以跑本测试前应先停掉 dev-bridge，
 * 等扩展重连到 MCP 自己的 bridge（脚本会等）。
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = join(here, '..', 'dist', 'index.js');

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail?: unknown) => {
	if (ok) {
		pass++;
		console.log(`  ✅ ${name}`);
	} else {
		fail++;
		console.log(`  ❌ ${name}${detail !== undefined ? ` → ${JSON.stringify(detail).slice(0, 300)}` : ''}`);
	}
};

/** 工具返回的是 content[].text，统一解析成对象 */
function parse(res: unknown): Record<string, unknown> {
	const content = (res as { content?: Array<{ type: string; text?: string }> }).content ?? [];
	const text = content.map((c) => c.text ?? '').join('\n');
	try {
		return JSON.parse(text) as Record<string, unknown>;
	} catch {
		return { _raw: text };
	}
}

const transport = new StdioClientTransport({ command: 'node', args: [serverEntry] });
const client = new Client({ name: 'eda-mcp-selftest', version: '1.0.0' }, { capabilities: {} });

console.log('\n═══ MCP 工具层自测 ═══\n');
await client.connect(transport);
console.log('▶ 已连接 MCP server（stdio）\n');

const EXPECTED_TOOLS = [
	'eda_add_net_identifier',
	'eda_add_schematic_text',
	'eda_arrange_block',
	'eda_arrange_components',
	'eda_auto_layout',
	'eda_auto_route',
	'eda_component_detail',
	'eda_component_pins',
	'eda_connect_pins',
	'eda_create_board',
	'eda_create_project',
	'eda_create_schematic_page',
	'eda_current_context',
	'eda_delete_primitives',
	'eda_download_datasheet',
	'eda_draw_wire',
	'eda_execute',
	'eda_label_pin_net',
	'eda_library_device',
	'eda_library_search',
	'eda_list_projects',
	'eda_open_document',
	'eda_open_project',
	'eda_pair_start',
	'eda_pcb_drc',
	'eda_pcb_nets',
	'eda_pcb_overview',
	'eda_place_component',
	'eda_project_overview',
	'eda_rename_board',
	'eda_schematic_components',
	'eda_schematic_drc',
	'eda_schematic_nets',
	'eda_schematic_primitives',
	'eda_set_page_size',
	'eda_status',
	'eda_unpair',
];

// 1. tools/list
console.log('[1] tools/list');
const { tools } = await client.listTools();
const names = tools.map((t) => t.name).sort();
check(`返回 ${EXPECTED_TOOLS.length} 个工具`, tools.length === EXPECTED_TOOLS.length, names);
check('工具名符合预期', JSON.stringify(names) === JSON.stringify(EXPECTED_TOOLS), names);
check('每个工具都有描述', tools.every((t) => (t.description ?? '').length > 20));
check('eda_execute 声明了必填 code', JSON.stringify((tools.find((t) => t.name === 'eda_execute')?.inputSchema as { required?: string[] })?.required) === '["code"]');

// 2. eda_status
console.log('\n[2] eda_status');
const st = parse(await client.callTool({ name: 'eda_status', arguments: {} }));
check('bridge 已监听端口', typeof st.bridge_port === 'number' && (st.bridge_port as number) > 0, st.bridge_port);
check('已配对（此前真机配对过）', st.paired === true, st);
check('返回配对文件路径', typeof st.pairing_file === 'string');
console.log(`     bridge_port=${String(st.bridge_port)} clients=${JSON.stringify(st.connected_clients)}`);

// 3. 等扩展连到本进程的 bridge
console.log('\n[3] 等待 EDA 扩展连入本进程的 bridge（最多 120s）');
let connected = false;
/** 当前编辑器类型；原理图相关测试需要 'schematic'，否则跳过而不是判失败 */
let editorKind = 'unknown';
/** 当前原理图里是否有器件；空图时内容类断言无意义 */
let hasComponents = false;
for (let i = 0; i < 60; i++) {
	const s = parse(await client.callTool({ name: 'eda_status', arguments: {} }));
	const clients = (s.connected_clients ?? []) as unknown[];
	if (clients.length > 0) {
		connected = true;
		console.log(`     已连接：${JSON.stringify(clients[0])}`);
		break;
	}
	await new Promise((r) => setTimeout(r, 2000));
}
check('EDA 扩展已连入', connected);

// 4. eda_execute
if (connected) {
	console.log('\n[4] eda_execute');
	const r1 = parse(await client.callTool({ name: 'eda_execute', arguments: { code: 'return 6*7;' } }));
	check('执行算术返回 42', r1.result === 42, r1);

	const r2 = parse(
		await client.callTool({ name: 'eda_execute', arguments: { code: 'return eda.sys_Environment.getEditorCurrentVersion();' } }),
	);
	check('取回 EDA 版本号', typeof r2.result === 'string' && /^\d+\.\d+/.test(r2.result as string), r2);

	const r3 = parse(await client.callTool({ name: 'eda_execute', arguments: { code: 'throw new Error("故意失败");' } }));
	check('代码抛错时如实回报', JSON.stringify(r3).includes('故意失败'), r3);

	const r4 = parse(await client.callTool({ name: 'eda_execute', arguments: { code: 'return await eda.dmt_Project.getCurrentProjectInfo();' } }));
	const proj = (r4.result ?? {}) as Record<string, unknown>;
	check('取回真实工程信息', typeof proj === 'object' && Object.keys(proj).length > 0, Object.keys(proj));
} else {
	console.log('\n[4] eda_execute —— 跳过（扩展未连入）');
}

// 5. 工程结构工具（M1-1）
if (connected) {
	console.log('\n[5] 工程结构工具');

	const ov = parse(await client.callTool({ name: 'eda_project_overview', arguments: {} }));
	const project = ov.project as { uuid?: string; name?: string } | undefined;
	const boards = (ov.boards ?? []) as Array<{ name?: string; schematic?: unknown; pcb?: unknown }>;
	check('overview 返回工程名与 uuid', !!project?.name && !!project?.uuid, project);
	check('overview 返回板子列表', boards.length > 0, boards.map((b) => b.name));
	check('每块板都带原理图或 PCB', boards.every((b) => b.schematic !== undefined && b.pcb !== undefined), boards[0]);
	check('已裁掉噪音字段 itemType', !JSON.stringify(ov).includes('itemType'));
	check('已裁掉噪音字段 titleBlockData', !JSON.stringify(ov).includes('titleBlockData'));
	console.log(`     工程「${String(project?.name)}」共 ${boards.length} 块板：${boards.map((b) => b.name).join(', ')}`);

	const cc = parse(await client.callTool({ name: 'eda_current_context', arguments: {} }));
	check('current_context 能判断编辑器类型', ['schematic', 'pcb', 'other'].includes(String(cc.editor)), cc);
	editorKind = String(cc.editor);
	// board 只有在编辑器里打开了文档时才有值；editor=other（如停在开始页）时为 null 是正确行为
	if (editorKind !== 'other') {
		check('current_context 返回当前板', !!(cc.board as { name?: string } | null)?.name, cc.board);
	}
	console.log(`     当前：editor=${editorKind} board=${JSON.stringify(cc.board)}`);

	const lp = parse(await client.callTool({ name: 'eda_list_projects', arguments: {} }));
	const projects = (lp.projects ?? []) as Array<{ uuid?: string; name?: string; team?: string }>;
	check('list_projects 返回工程', projects.length > 0, lp);
	check('每个工程含 uuid/name/team', projects.every((p) => !!p.uuid && !!p.name && !!p.team), projects[0]);
	console.log(`     可见工程 ${projects.length} 个：${projects.map((p) => p.name).join(', ')}`);

	// 打开「当前已打开的工程」——幂等，不会改变用户看到的内容
	if (project?.uuid) {
		const op = parse(await client.callTool({ name: 'eda_open_project', arguments: { project_uuid: project.uuid } }));
		check('open_project 幂等打开当前工程成功', op.ok === true, op);
	}

	// 无效 uuid 必须被"拦在调用之前"。
	// 早期版本这里直接调 openProject 试错，结果 EDA 把编辑器切到「开始页」、
	// 清空了当前工程上下文，导致后续所有测试连环失败 —— 该行为已在工具里做前置校验拦截。
	const badOpen = parse(await client.callTool({ name: 'eda_open_project', arguments: { project_uuid: 'not-a-real-uuid' } }));
	check('open_project 拦截无效 uuid', badOpen.ok === false && String(badOpen.error ?? '').includes('不在可访问列表'), badOpen);

	// 拦截不应改变编辑器状态：不管之前是 schematic / pcb / other，之后都该一样
	const stillThere = parse(await client.callTool({ name: 'eda_current_context', arguments: {} }));
	check('拦截后编辑器状态未被破坏', String(stillThere.editor) === editorKind, { before: editorKind, after: stillThere.editor });
} else {
	console.log('\n[5] 工程结构工具 —— 跳过（扩展未连入）');
}

// 6. 原理图读取（M1-2）—— 需要编辑器里正开着一张原理图
if (connected && editorKind === 'schematic') {
	console.log('\n[6] 原理图读取');

	const all = parse(await client.callTool({ name: 'eda_schematic_components', arguments: {} }));
	const comps = (all.components ?? []) as Array<Record<string, unknown>>;
	check('能取到网表并返回器件总数', typeof all.total_in_schematic === 'number', all);
	// 空原理图（比如刚建的板）是合法状态，内容相关的断言就没意义了
	hasComponents = comps.length > 0;
	if (!hasComponents) {
		console.log('     当前原理图没有器件（空图），跳过内容相关断言');
	}
	if (hasComponents) {
	check('器件含位号与引脚数', comps.every((c) => !!c.designator && typeof c.pins === 'number'), comps[0]);
	check('清单口径为真实器件（少于原理图图元数）', (all.total_in_schematic as number) < 140, all.total_in_schematic);
	console.log(`     ${String(all.total_in_schematic)} 个器件，例：${JSON.stringify(comps[0])}`);

	// 用当前原理图里真实存在的位号前缀来测，避免依赖某个特定工程的内容
	const anyDes = String(comps[0]?.designator ?? 'U1');
	const prefix = (/^([A-Za-z]+)/.exec(anyDes)?.[1] ?? 'U').toUpperCase();
	const res = parse(await client.callTool({ name: 'eda_schematic_components', arguments: { designator_filter: prefix } }));
	const rs = (res.components ?? []) as Array<{ designator?: string }>;
	const sameKind = new RegExp(`^${prefix}\\d+$`, 'i');
	check('位号前缀筛选只命中同类', rs.length > 0 && rs.every((c) => sameKind.test(String(c.designator))), rs.slice(0, 5));
	console.log(`     位号前缀 ${prefix} 命中 ${rs.length} 个：${rs.slice(0, 8).map((c) => c.designator).join(', ')}`);

	const kwWord = String((comps[0] as { part?: string })?.part ?? '').slice(0, 6) || 'AMS';
	const kw = parse(await client.callTool({ name: 'eda_schematic_components', arguments: { keyword: kwWord } }));
	check('关键词搜索命中型号', ((kw.components ?? []) as unknown[]).length > 0, { kwWord, kw });

	const u1 = parse(await client.callTool({ name: 'eda_component_detail', arguments: { designator: anyDes } }));
	const u1pins = (u1.pins ?? []) as Array<{ net?: string | null }>;
	check('器件详情返回属性', Object.keys((u1.props ?? {}) as object).length > 5, Object.keys((u1.props ?? {}) as object).length);
	// net 为 null 是合法的（器件还没连线），只要求引脚结构完整
	check('器件详情返回引脚', u1pins.length > 0 && u1pins.every((p) => 'net' in p), u1pins);
	check('剔除了内部标识字段', !Object.keys((u1.props ?? {}) as object).includes('3D Model Transform'));
	console.log(`     ${anyDes} = ${String(u1.part)}，${u1pins.length} 脚，datasheet=${String(u1.datasheet ?? '无')}`);

	const bad = parse(await client.callTool({ name: 'eda_component_detail', arguments: { designator: 'ZZ999' } }));
	check('未知位号给出可读错误', String(bad.error ?? '').includes('找不到'), bad);

	const nets = parse(await client.callTool({ name: 'eda_schematic_nets', arguments: {} }));
	const netList = (nets.nets ?? []) as Array<{ name?: string; pin_count?: number }>;
	// 全未连线的原理图没有网络，是合法状态
	check('网络查询返回结构正确', typeof nets.total_nets === 'number' && Array.isArray(nets.nets), nets);
	check('默认折叠自动命名网络', !netList.some((n) => /^\$\d*N\d+$/.test(String(n.name))), netList.slice(0, 5));
	check('按连接数降序', netList.every((n, i) => i === 0 || (netList[i - 1]!.pin_count ?? 0) >= (n.pin_count ?? 0)));
	console.log(`     ${String(nets.total_nets)} 个网络，前三：${netList.slice(0, 3).map((n) => `${n.name}(${n.pin_count})`).join(', ')}`);

	if (netList.length > 0) {
		const gnd = parse(await client.callTool({ name: 'eda_schematic_nets', arguments: { net_name: String(netList[0]?.name) } }));
		const nodes = (gnd.nodes ?? []) as Array<{ designator?: string; pin?: string }>;
		check('指定网络返回节点明细', nodes.length > 0 && nodes.every((n) => !!n.designator && !!n.pin), nodes.slice(0, 3));
		console.log(`     ${String(gnd.net)} 挂 ${nodes.length} 个引脚，例：${nodes.slice(0, 3).map((n) => `${n.designator}.${n.pin}`).join(' ')}`);
	} else {
		console.log('     当前原理图没有已命名网络，跳过网络明细断言');
	}
	}
} else {
	console.log(`\n[6] 原理图读取 —— 跳过（${connected ? `编辑器当前是 ${editorKind}，不是原理图` : '扩展未连入'}）`);
}

// 7. 原理图 DRC（M1-4）—— 同样需要开着有内容的原理图
if (connected && editorKind === 'schematic' && hasComponents) {
	console.log('\n[7] 原理图 DRC');
	const drc = parse(await client.callTool({ name: 'eda_schematic_drc', arguments: {} }));
	check('DRC 返回通过与否', typeof drc.passed === 'boolean', drc);
	check('DRC 返回 error/warning 计数', typeof drc.errors === 'number' && typeof drc.warnings === 'number', drc);
	check('未要求 UI 时不打开面板', drc.ui_opened === false, drc);
	check('说明了 API 只给汇总的限制', String(drc.note ?? '').includes('分类计数'), drc.note);
	console.log(`     passed=${String(drc.passed)} errors=${String(drc.errors)} warnings=${String(drc.warnings)}`);
} else {
	console.log(`\n[7] 原理图 DRC —— 跳过（${connected ? `编辑器当前是 ${editorKind}` : '扩展未连入'}）`);
}

// 8. 元器件库（M1-3）
if (connected) {
	console.log('\n[8] 元器件库');

	const search = parse(await client.callTool({ name: 'eda_library_search', arguments: { keyword: 'AMS1117', limit: 5 } }));
	const devs = (search.devices ?? []) as Array<Record<string, unknown>>;
	check('库搜索有结果', devs.length > 0, search);
	check('结果含型号与 uuid', devs.every((d) => !!d.name && !!d.device_uuid), devs[0]);
	console.log(`     搜到 ${devs.length} 个：${devs.slice(0, 3).map((d) => `${String(d.name)}(${String(d.lcsc ?? '-')})`).join(', ')}`);

	const dev = parse(await client.callTool({ name: 'eda_library_device', arguments: { lcsc_id: 'C347222' } }));
	check('按立创编号查到器件', String(dev.name ?? '').includes('AMS1117'), dev.name);
	check('返回 datasheet 链接', typeof dev.datasheet === 'string' && String(dev.datasheet).startsWith('http'), dev.datasheet);
	check('返回电气参数', Object.keys((dev.parameters ?? {}) as object).length > 3, Object.keys((dev.parameters ?? {}) as object));
	check('剔除了噪音字段', !Object.keys((dev.parameters ?? {}) as object).includes('3D Model Transform'));
	check('返回默认位号前缀', typeof dev.designator_prefix === 'string', dev.designator_prefix);
	console.log(`     C347222 = ${String(dev.name)}，位号前缀 ${String(dev.designator_prefix)}，参数 ${Object.keys((dev.parameters ?? {}) as object).length} 项`);

	const miss = parse(await client.callTool({ name: 'eda_library_device', arguments: { lcsc_id: 'C000000000' } }));
	check('不存在的编号给出可读错误', String(miss.error ?? '').includes('未找到'), miss);
} else {
	console.log('\n[8] 元器件库 —— 跳过（扩展未连入）');
}

// 9. 数据手册下载（M4）—— 按位号取链接要读网表，需要开着有内容的原理图
if (connected && editorKind === 'schematic' && hasComponents) {
	console.log('\n[9] 数据手册下载');
	const tmpDir = '/tmp/eda-mcp-datasheet-test';

	// 从当前原理图里挑一个真实位号，不写死某个工程的器件
	const listForDs = parse(await client.callTool({ name: 'eda_schematic_components', arguments: {} }));
	const dsDes = String(((listForDs.components ?? []) as Array<{ designator?: string }>)[0]?.designator ?? '');
	const ok = parse(await client.callTool({ name: 'eda_download_datasheet', arguments: { designator: dsDes, save_dir: tmpDir } }));
	// 两种结果都算通过：直链 PDF 下载成功，或链接是网页时如实报告（实测 54 个器件里 29 个是网页）
	const downloaded = ok.ok === true && typeof ok.saved_path === 'string' && (ok.size_kb as number) > 0;
	const honestlyRefused = String(ok.error ?? '').includes('不是 PDF') && String(ok.hint ?? '').includes('浏览器');
	const noField = String(ok.error ?? '').includes('没有 Datasheet 字段'); // 沙箱里手工放的器件可能没这个属性
	check('按位号取手册：下载成功或如实说明原因', downloaded || honestlyRefused || noField, ok);
	console.log(`     ${dsDes} → ${downloaded ? `${String(ok.saved_path)} (${String(ok.size_kb)} KB)` : String(ok.error)}`);

	// SSRF 防护
	const ssrf = parse(await client.callTool({ name: 'eda_download_datasheet', arguments: { url: 'http://127.0.0.1:49630/health' } }));
	check('拒绝内网地址', JSON.stringify(ssrf).includes('拒绝下载内网地址'), ssrf);

	const badProto = parse(await client.callTool({ name: 'eda_download_datasheet', arguments: { url: 'file:///etc/passwd' } }));
	check('拒绝非 http(s) 协议', JSON.stringify(badProto).includes('只支持 http/https'), badProto);

	const noSuch = parse(await client.callTool({ name: 'eda_download_datasheet', arguments: { designator: 'ZZ999' } }));
	check('位号不存在时给出可读错误', String(noSuch.error ?? '').includes('没有位号'), noSuch);
} else {
	console.log(`\n[9] 数据手册下载 —— 跳过（${!connected ? '扩展未连入' : editorKind !== 'schematic' ? `编辑器当前是 ${editorKind}` : '当前原理图是空图'}）`);
}

// 10. 创建类工具（M3-1）—— 只在测试工程里跑
if (connected) {
	const ov = parse(await client.callTool({ name: 'eda_project_overview', arguments: {} }));
	const projName = String((ov.project as { name?: string } | undefined)?.name ?? '');
	const isSandbox = /测试|test|sandbox/i.test(projName);

	if (!isSandbox) {
		console.log(`\n[10] 创建类工具 —— 跳过：当前工程「${projName}」不是测试工程`);
		console.log('     写入类测试只在名字含「测试/test」的工程里跑，避免污染真实设计');
	} else {
		console.log(`\n[10] 创建类工具（沙箱工程「${projName}」）`);
		const boardsBefore = ((ov.boards ?? []) as unknown[]).length;

		// 板名必须是 ASCII —— EDA 不接受中文/空格（实测）
		const stamp = `AIBoard_${String(Date.now()).slice(-6)}`;
		const nb = parse(await client.callTool({ name: 'eda_create_board', arguments: { name: stamp } }));
		const board = (nb.board ?? {}) as { name?: string; schematic?: { uuid?: string; pages?: unknown[] }; pcb?: { uuid?: string } };
		check('建板成功', nb.ok === true, nb);
		// 改名不可靠（EDA 侧问题），这里只要求「要么改成功，要么如实报告失败」
		check(
			'改名结果如实反映',
			(nb.renamed === true && board.name === stamp) || (nb.renamed === false && !!nb.rename_failed),
			{ renamed: nb.renamed, name: board.name, note: nb.rename_failed },
		);
		check('自动配了原理图且含 1 页', !!board.schematic?.uuid && (board.schematic.pages ?? []).length === 1, board.schematic);
		check('自动配了 PCB', !!board.pcb?.uuid, board.pcb);
		console.log(`     新板「${String(board.name)}」sch=${String(board.schematic?.uuid)} pcb=${String(board.pcb?.uuid)}`);

		const ov2 = parse(await client.callTool({ name: 'eda_project_overview', arguments: {} }));
		check('新板立即出现在 overview 里', ((ov2.boards ?? []) as unknown[]).length === boardsBefore + 1, {
			before: boardsBefore,
			after: ((ov2.boards ?? []) as unknown[]).length,
		});

		if (board.schematic?.uuid) {
			const pg = parse(
				await client.callTool({ name: 'eda_create_schematic_page', arguments: { schematic_uuid: board.schematic.uuid, name: 'PwrPage' } }),
			);
			check('加页成功', pg.ok === true, pg);
			check('新页有 uuid', !!(pg.page as { uuid?: string } | undefined)?.uuid, pg.page);
		}

		// 用板子的实际名字（可能是默认名）来测改名；同样只要求结果如实
		const actualName = String(board.name);
		const rn = parse(await client.callTool({ name: 'eda_rename_board', arguments: { current_name: actualName, new_name: `${actualName}b` } }));
		check('改名要么成功要么如实报错', rn.ok === true || String(rn.error ?? '').includes('未生效'), rn);

		const rnBad = parse(await client.callTool({ name: 'eda_rename_board', arguments: { current_name: '不存在的板', new_name: 'x' } }));
		check('对不存在的板给出可读错误', rnBad.ok === false && String(rnBad.error ?? '').includes('没有板子'), rnBad);

		// 关键性质：改名工具绝不能在没生效时报成功
		const rnCheck = parse(await client.callTool({ name: 'eda_rename_board', arguments: { current_name: actualName, new_name: 'Board2' } }));
		check('与现有板重名时不谎报成功', rnCheck.ok === false, rnCheck);

		// —— 自动连线（M4-1）：放两个器件，按引脚号把它们连起来 ——
		const c1 = parse(await client.callTool({ name: 'eda_place_component', arguments: { lcsc_id: 'C347222', x: 1000, y: 1000 } }));
		const c2 = parse(await client.callTool({ name: 'eda_place_component', arguments: { lcsc_id: 'C347222', x: 1400, y: 1200 } }));
		const d1 = (c1.placed as { designator?: string } | null)?.designator;
		const d2 = (c2.placed as { designator?: string } | null)?.designator;
		check('连线测试用的两个器件都放好了', !!d1 && !!d2 && d1 !== d2, { d1, d2 });

		if (d1 && d2) {
			const pins = parse(await client.callTool({ name: 'eda_component_pins', arguments: { designator: d1 } }));
			const pl = (pins.pins ?? []) as Array<{ number?: string; x?: number; y?: number; rotation?: number }>;
			check('引脚带绝对坐标', pl.length > 0 && pl.every((p) => typeof p.x === 'number' && typeof p.y === 'number'), pl.slice(0, 2));
			check('引脚带朝向', pl.every((p) => typeof p.rotation === 'number'), pl[0]);
			console.log(`     ${d1} 有 ${pl.length} 脚，例：#${String(pl[0]?.number)} @(${String(pl[0]?.x)},${String(pl[0]?.y)}) 朝向 ${String(pl[0]?.rotation)}`);

			const conn = parse(await client.callTool({ name: 'eda_connect_pins', arguments: { from: `${d1}.3`, to: `${d2}.3`, net: 'AI_LINK' } }));
			check('按引脚号自动连线成功', conn.ok === true, conn);
			check('返回实际走线路径', Array.isArray(conn.path) && (conn.path as unknown[]).length >= 4, conn.path);
			console.log(`     ${String(conn.from)} → ${String(conn.to)}  route=${String(conn.route)} path=${JSON.stringify(conn.path)}`);

			// 连线后网络应该真的建立了 —— 用网表复核，这才是真正的验证
            const netsAfter = parse(await client.callTool({ name: 'eda_schematic_nets', arguments: { net_name: 'AI_LINK' } }));
			const nodes = (netsAfter.nodes ?? []) as Array<{ designator?: string; pin?: string }>;
			check('网表里能查到这条新网络且**两端引脚都挂上了**', nodes.length >= 2, netsAfter);
			console.log(`     网表复核 AI_LINK: ${nodes.map((n) => `${n.designator}.${n.pin}`).join(' ')}`);

			const badPin = parse(await client.callTool({ name: 'eda_connect_pins', arguments: { from: `${d1}.999`, to: `${d2}.1` } }));
			check('引脚不存在时给出可读错误', badPin.ok === false && String(badPin.error ?? '').includes('找不到引脚'), badPin);
		}

		const pgBad = parse(await client.callTool({ name: 'eda_create_schematic_page', arguments: { schematic_uuid: 'bogus-uuid' } }));
		check('无效原理图 uuid 加页失败且可读', pgBad.ok === false, pgBad);
	}
} else {
	console.log('\n[10] 创建类工具 —— 跳过（扩展未连入）');
}

// 11. PCB 只读工具（M3-3）
if (connected) {
	console.log('\n[11] PCB 只读工具');

	// pcb_* 绑定活动画布：先确认没开 PCB 时给的是可操作提示，而不是内部错误
	if (editorKind === 'schematic') {
		const notPcb = parse(await client.callTool({ name: 'eda_pcb_overview', arguments: {} }));
		check('未开 PCB 时给出可操作提示', String(notPcb.error ?? '').includes('绑定活动画布') && Array.isArray(notPcb.available_pcbs), notPcb);
		check('提示里列出了可用的 PCB', ((notPcb.available_pcbs ?? []) as unknown[]).length > 0, notPcb.available_pcbs);
	}

	// 找当前板的 PCB 并打开
	const ov = parse(await client.callTool({ name: 'eda_project_overview', arguments: {} }));
	const boards = (ov.boards ?? []) as Array<{ name?: string; pcb?: { uuid?: string } | null }>;
	const cc0 = parse(await client.callTool({ name: 'eda_current_context', arguments: {} }));
	const curBoardName = (cc0.board as { name?: string } | null)?.name;
	const target = boards.find((b) => b.name === curBoardName && b.pcb?.uuid) ?? boards.find((b) => b.pcb?.uuid);

	if (target?.pcb?.uuid) {
		const opened = parse(await client.callTool({ name: 'eda_open_document', arguments: { document_uuid: target.pcb.uuid } }));
		check('打开 PCB 文档成功', opened.ok === true && opened.editor === 'pcb', opened);

		const pov = parse(await client.callTool({ name: 'eda_pcb_overview', arguments: {} }));
		check('PCB 概况返回层数', typeof pov.copper_layers === 'number', pov);
		check('PCB 概况返回网络数', typeof pov.net_count === 'number', pov);
		console.log(`     PCB「${JSON.stringify(pov.pcb)}」${String(pov.copper_layers)} 层，${String(pov.net_count)} 个网络`);

		const pnets = parse(await client.callTool({ name: 'eda_pcb_nets', arguments: {} }));
		const nl = (pnets.nets ?? []) as Array<{ name?: string; length?: number; routed?: boolean }>;
		// 刚建的空 PCB 没有任何网络，这是合法状态 —— 只要求接口正确返回结构
		check('PCB 网络查询返回结构正确', typeof pnets.total === 'number' && Array.isArray(pnets.nets), pnets);
		check('每个网络带长度与是否已布线', nl.every((n) => 'length' in n && 'routed' in n), nl[0]);
		check('按长度降序', nl.every((n, i) => i === 0 || (nl[i - 1]!.length ?? 0) >= (n.length ?? 0)));
		check('标注了长度单位的不确定性', String(pnets.length_unit_note ?? '').includes('单位'), pnets.length_unit_note);
		console.log(`     ${nl.length} 网络，未布线 ${String(pnets.unrouted)}，最长 ${String(nl[0]?.name)}=${String(nl[0]?.length)}`);

		const pdrc = parse(await client.callTool({ name: 'eda_pcb_drc', arguments: {} }));
		const cats = (pdrc.categories ?? []) as Array<{ category?: string; count?: number; items?: Array<{ message?: string }> }>;
		check('PCB DRC 返回结果', typeof pdrc.passed === 'boolean' && typeof pdrc.total_issues === 'number', pdrc);
		if ((pdrc.total_issues as number) > 0) {
			check('PCB DRC 带明细描述（区别于原理图 DRC）', cats.length > 0 && cats.some((c) => (c.items ?? []).some((i) => !!i.message)), cats);
			console.log(`     DRC ${String(pdrc.total_issues)} 项：${cats.map((c) => `${c.category}`).join(', ')}`);
			console.log(`     首条：${String(cats[0]?.items?.[0]?.message ?? '').slice(0, 90)}`);
		}

		// 把编辑器还原到原理图，避免影响后续测试与用户视图
		const back = boards.find((b) => b.name === curBoardName);
		const schPage = (ov.boards as Array<{ name?: string; schematic?: { pages?: Array<{ uuid?: string }> } }>)
			.find((b) => b.name === back?.name)?.schematic?.pages?.[0]?.uuid;
		if (schPage) await client.callTool({ name: 'eda_open_document', arguments: { document_uuid: schPage } });
	} else {
		console.log('     当前工程没有 PCB，跳过');
	}
} else {
	console.log('\n[11] PCB 只读工具 —— 跳过（扩展未连入）');
}

// 12. 原理图写入（M3-2）—— 只在沙箱工程 + 打开着原理图时跑
if (connected && editorKind === 'schematic') {
	const ovS = parse(await client.callTool({ name: 'eda_project_overview', arguments: {} }));
	const pname = String((ovS.project as { name?: string } | undefined)?.name ?? '');
	if (!/测试|test|sandbox/i.test(pname)) {
		console.log(`\n[12] 原理图写入 —— 跳过：当前工程「${pname}」不是沙箱工程`);
	} else {
		console.log(`\n[12] 原理图写入（沙箱「${pname}」）`);

		const p0 = parse(await client.callTool({ name: 'eda_schematic_primitives', arguments: {} }));
		const n0 = (p0.count as number) ?? 0;
		check('能列出画布图元并给出 primitive_id', typeof p0.count === 'number', p0);

		const place = parse(await client.callTool({ name: 'eda_place_component', arguments: { lcsc_id: 'C347222', x: 300, y: 300 } }));
		check('放置器件成功', place.ok === true, place);
		const placed = place.placed as { primitive_id?: string; designator?: string } | null;
		check('返回图元 id 与位号', !!placed?.primitive_id, placed);
		console.log(`     放置 ${String(placed?.designator)} @ (300,300) id=${String(placed?.primitive_id)}`);

		const wire = parse(await client.callTool({ name: 'eda_draw_wire', arguments: { points: [600, 300, 700, 300, 700, 400], net: 'AI_TEST_NET' } }));
		check('画导线成功', wire.ok === true, wire);

		// 顺序有意为之：netLabel 在前、netFlag 在后。
		// 实测 createNetFlag 执行后扩展会重连一次，把紧跟其后的请求打断，
		// 所以把会引发断连的操作放在这一组的最后。
		// 网络标签必须落在导线上，否则 EDA 会等用户点击、接口一直不返回（表现为执行超时）。
		// 上面 eda_draw_wire 画的是 [600,300 → 700,300 → 700,400]，取线上的一点。
		const label = parse(await client.callTool({ name: 'eda_add_net_identifier', arguments: { kind: 'label', net: 'AI_TEST_NET', x: 650, y: 300 } }));
		// 实测 createNetLabel 每次执行都会让扩展重连，回包必丢。动作本身通常已生效，
		// 所以这里要求的是「要么成功，要么明确告知可能已生效」——绝不能报成普通失败诱导重试。
		const labelHonest = label.ok === true || String(label._raw ?? JSON.stringify(label)).includes('很可能已经生效');
		check('网络标签：成功或明确提示可能已生效', labelHonest, label);

		const flag = parse(await client.callTool({ name: 'eda_add_net_identifier', arguments: { kind: 'ground', net: 'GND', x: 700, y: 450 } }));
		check('放置地符号成功', flag.ok === true, flag);

		const text = parse(await client.callTool({ name: 'eda_add_schematic_text', arguments: { content: 'AI test', x: 300, y: 200 } }));
		check('放置文字成功', text.ok === true, text);

		const p1 = parse(await client.callTool({ name: 'eda_schematic_primitives', arguments: {} }));
		check('图元数量增加', ((p1.count as number) ?? 0) > n0, { before: n0, after: p1.count });

		// 删掉刚放的器件，验证删除并保持沙箱整洁
		if (placed?.primitive_id) {
			const del = parse(await client.callTool({
				name: 'eda_delete_primitives',
				arguments: { primitive_ids: [placed.primitive_id], kind: 'component' },
			}));
			check('删除图元成功', del.ok === true, del);
		}

		const badWire = parse(await client.callTool({ name: 'eda_draw_wire', arguments: { points: [1, 2, 3] } }));
		check('非法 points 被拒绝', JSON.stringify(badWire).includes('偶数个数字'), badWire);
	}
} else {
	console.log(`\n[12] 原理图写入 —— 跳过（${connected ? `编辑器是 ${editorKind}` : '扩展未连入'}）`);
}

// 13. 参数校验
console.log('\n[13] 参数校验');
const bad = parse(await client.callTool({ name: 'eda_execute', arguments: { code: '' } }));
check('空 code 被拒绝', JSON.stringify(bad).includes('必填'), bad);

await client.close();
console.log(`\n═══ 结果：${pass} 通过 / ${fail} 失败 ═══\n`);
process.exit(fail === 0 ? 0 : 1);
