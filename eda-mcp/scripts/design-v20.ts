/**
 * 按功能分区重画 SV30 / V2.0_Encoder —— 演示 eda-schematic-layout skill 的完整流程。
 *
 *   npx tsx scripts/design-v20.ts /tmp/v20-bp.json [--project-uuid <uuid>]
 *
 * 与 replicate.ts 的区别：那个照搬原图坐标，这个**按功能重新规划布局**。
 * 分区是人（AI）读懂电路后定的，写死在下面的 BLOCKS 里；脚本只负责执行。
 *
 * 电路理解：4-20mA 电流环 → V/F 转换 → RS485 输出的传感器接口板。
 *   BNC(RF1) 4-20mA 输入 → TVS 保护 → LM334 恒流源 / REF3030 基准 → OPA2340 调理
 *   → CD4052 多路开关 → LM331 V/F 转换 → 74HC14 整形 → SN65HVD72 RS485 输出
 *   ATTINY85 经 GPIO_A/GPIO_B 控制多路开关；RJ45 进 +24V 与 485 差分对；
 *   +24V 经 F3 保险丝、SMBJ24A TVS、AMS1117 得到 3.3V。
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = join(here, '..', 'dist', 'index.js');
const bpPath = process.argv[2] ?? '/tmp/v20-bp.json';

/**
 * 功能分区 —— 这是设计决策，不是算出来的。
 * 图纸 A3（1650×1170），信号自左向右流：输入接口 → 模拟调理 → 转换 → 数字 → 通信输出。
 */
interface BlockDef { name: string; x: number; y: number; cols: number; members: string[] }
const BLOCKS: BlockDef[] = [
	// 左列：电源与对外接口（信号入口）
	{ name: '电源 +24V→3.3V', x: 120, y: 150, cols: 4, members: ['F3', 'U4', 'L1', 'U1', 'C11', 'C12', 'C13', 'C18'] },
	{ name: '4-20mA 输入与保护', x: 120, y: 520, cols: 2, members: ['RF1', 'D3', 'C2', 'R6'] },
	{ name: 'RJ45 接口', x: 120, y: 870, cols: 2, members: ['RJ1', 'R22', 'R23', 'R24'] },

	// 中左列：基准偏置与模拟前端
	{ name: '基准与恒流源', x: 540, y: 150, cols: 4, members: ['U6', 'R11', 'R12', 'C4', 'U3', 'D2', 'R2', 'R3'] },
	{ name: '模拟前端 OPA2340', x: 540, y: 520, cols: 4, members: ['U5', 'R5', 'R15', 'R16', 'R17', 'D4', 'C19'] },
	{ name: '多路开关 CD4052', x: 540, y: 870, cols: 2, members: ['U8', 'R8', 'R13', 'C3'] },

	// 中右列：V/F 转换与整形
	{ name: 'V/F 转换 LM331', x: 950, y: 150, cols: 3, members: ['U11', 'C6', 'C7', 'C8', 'R18', 'R19'] },
	{ name: '整形 74HC14', x: 950, y: 520, cols: 2, members: ['U12', 'R25'] },

	// 右列：数字与通信输出
	{ name: 'MCU ATTINY85', x: 1300, y: 150, cols: 3, members: ['U9', 'C5', 'C9', 'R14', 'C10'] },
	{ name: 'RS485 SN65HVD72', x: 1300, y: 520, cols: 3, members: ['U13', 'R20', 'R21', 'C15', 'C16', 'C17', 'D5'] },
	{ name: '调试排针', x: 1300, y: 870, cols: 1, members: ['H1'] },
];

const PITCH_X = 110;
const PITCH_Y = 120;

interface Comp { des: string; lcsc?: string; part?: string; pins: Array<{ n: string; net: string | null }> }
// 蓝本可能带 result 包装（直接来自工具返回），也可能已经解包，两种都收
const raw = JSON.parse(readFileSync(bpPath, 'utf-8')) as { result?: { components: Comp[] } } & { components?: Comp[] };
const comps: Comp[] = raw.result?.components ?? raw.components ?? [];
if (!comps.length) { console.error('❌ 蓝本里没有 components'); process.exit(1); }
const byDes = new Map(comps.map((c) => [c.des, c]));

// 校验分区覆盖了全部器件 —— 漏一个就说明我的分区没想全
const assigned = new Set(BLOCKS.flatMap((b) => b.members));
const missing = comps.map((c) => c.des).filter((d) => !assigned.has(d));
const unknown = [...assigned].filter((d) => !byDes.has(d));
if (missing.length || unknown.length) {
	console.error(`❌ 分区未覆盖全部器件：漏了 ${missing.join(',') || '无'}；多余 ${unknown.join(',') || '无'}`);
	process.exit(1);
}
console.log(`▶ 分区规划：${BLOCKS.length} 个功能区，覆盖 ${assigned.size} 个器件\n`);

const transport = new StdioClientTransport({ command: 'node', args: [serverEntry] });
const client = new Client({ name: 'design-v20', version: '1.0.0' }, { capabilities: {} });
const parse = (r: unknown) => {
	const c = (r as { content?: Array<{ text?: string }> }).content ?? [];
	try { return JSON.parse(c.map((x) => x.text ?? '').join('')) as Record<string, unknown>; } catch { return { _raw: c.map((x) => x.text).join('') }; }
};
const call = async (n: string, a: Record<string, unknown> = {}) => parse(await client.callTool({ name: n, arguments: a }));
const t0 = Date.now();
const el = () => `${((Date.now() - t0) / 1000).toFixed(0)}s`;

await client.connect(transport);
let ready = false;
for (let i = 0; i < 150; i++) {
	const s = await call('eda_status');
	if (((s.connected_clients ?? []) as unknown[]).length > 0) { ready = true; break; }
	await new Promise((r) => setTimeout(r, 2000));
}
if (!ready) { console.error('❌ 扩展未连入'); process.exit(1); }

const ov = await call('eda_project_overview');
const projName = String((ov.project as { name?: string } | undefined)?.name ?? '');
if (!/测试|test|sandbox|replica|复刻|design/i.test(projName)) {
	console.error(`❌ 当前工程「${projName}」不是沙箱工程，拒绝写入`);
	process.exit(1);
}
console.log(`[${el()}] 工程「${projName}」`);

// 1) 建板并打开原理图页
const nb = await call('eda_create_board', { name: 'V20_Encoder_Zoned' });
const board = nb.board as { name?: string; schematic?: { pages?: Array<{ uuid?: string }> } };
const pageUuid = board.schematic?.pages?.[0]?.uuid;
if (!pageUuid) { console.error('❌ 建板失败', nb); process.exit(1); }
await call('eda_open_document', { document_uuid: pageUuid });

// 2) 先设图纸，再放器件 —— 顺序反了器件会掉到图框外
const sheet = await call('eda_set_page_size', { size: 'A3' });
console.log(`[${el()}] 图纸 A3：ok=${String(sheet.ok)} size=${String(sheet.size ?? '?')}`);

// 3) 按分区放器件
console.log(`\n[${el()}] 放置器件（按功能区）…`);
const placedOk: string[] = [];
for (const b of BLOCKS) {
	for (let i = 0; i < b.members.length; i++) {
		const des = b.members[i]!;
		const c = byDes.get(des)!;
		const gx = i % b.cols;
		const gy = Math.floor(i / b.cols);
		const r = await call('eda_place_component', {
			lcsc_id: c.lcsc,
			x: b.x + gx * PITCH_X,
			y: b.y + gy * PITCH_Y,
			designator: des,
		});
		if (r.ok === true && (r.placed as { designator?: string } | undefined)?.designator === des) placedOk.push(des);
	}
	console.log(`   [${el()}] ${b.name.padEnd(20)} ${b.members.length} 件`);
}
console.log(`[${el()}] 器件 ${placedOk.length}/${assigned.size}`);

// 4) 声明网络（只表达电气意图，几何交给 auto_route）
console.log(`\n[${el()}] 声明网络…`);
let netOk = 0, netTried = 0;
for (const c of comps) {
	if (!placedOk.includes(c.des)) continue;
	for (const p of c.pins) {
		if (!p.net) continue;
		netTried++;
		const r = await call('eda_label_pin_net', { designator: c.des, pin: p.n, net: p.net });
		if (r.ok === true) netOk++;
	}
}
console.log(`[${el()}] 网络标注 ${netOk}/${netTried}`);

// 5) 让 EDA 把线画好
console.log(`\n[${el()}] 自动布线…`);
const ar = await call('eda_auto_route');
console.log(`[${el()}] ${JSON.stringify({ ok: ar.ok, before: ar.before, after: ar.after, ms: ar.elapsed_ms })}`);

// 6) 验收
const drc = await call('eda_schematic_drc');
const nets = await call('eda_schematic_nets', { include_auto_named: true });
const cs = await call('eda_schematic_components');
console.log(`\n[${el()}] 验收：器件 ${String(cs.total_in_schematic)}／网络 ${String(nets.total_nets)}／DRC errors=${String(drc.errors)} warnings=${String(drc.warnings)}`);
console.log(`\n═══ 用时 ${el()} ═══`);
await client.close();
process.exit(0);
