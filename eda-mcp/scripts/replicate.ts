/**
 * 按蓝本在沙箱工程里复刻一张原理图 —— 端到端检验「AI 能不能自动画原理图」。
 *
 *   npx tsx scripts/replicate.ts <blueprint.json> [--limit N] [--nets-limit N] [--no-nets] [--board NAME]
 *
 * 蓝本格式（由读取脚本生成）：
 *   { components: [{des, lcsc, part, pos:{x,y,rotation,mirror}, pins:[{n,net}]}], nets: {netName: ["U1.3", ...]} }
 *
 * 全程只用 MCP 工具，不走 eda_execute 抄近路 —— 这样跑通才说明工具本身够用。
 *
 * 安全：只在名字含「测试/test/sandbox」的工程里运行，否则直接退出。
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = join(here, '..', 'dist', 'index.js');

const args = process.argv.slice(2);
const bpPath = args.find((a) => !a.startsWith('--'));
if (!bpPath) {
	console.error('用法: npx tsx scripts/replicate.ts <blueprint.json> [--limit N] [--nets-limit N] [--no-nets]');
	process.exit(1);
}
const numArg = (name: string, dflt: number) => {
	const i = args.indexOf(`--${name}`);
	return i >= 0 && args[i + 1] ? Number(args[i + 1]) : dflt;
};
const LIMIT = numArg('limit', Infinity);
const NETS_LIMIT = numArg('nets-limit', Infinity);
const NO_NETS = args.includes('--no-nets');
const BOARD = (() => {
	const i = args.indexOf('--board');
	return i >= 0 && args[i + 1] ? args[i + 1]! : `Replica_${String(Date.now()).slice(-6)}`;
})();

interface Pin { n: string; net: string | null }
interface Comp { des: string; lcsc?: string; part?: string; pos?: { x: number; y: number; rotation?: number; mirror?: boolean } | null; pins: Pin[] }
interface Blueprint { components: Comp[]; nets: Record<string, string[]> }

const raw = JSON.parse(readFileSync(bpPath, 'utf-8')) as { result?: Blueprint } & Partial<Blueprint>;
const bp: Blueprint = (raw.result ?? raw) as Blueprint;

const transport = new StdioClientTransport({ command: 'node', args: [serverEntry] });
const client = new Client({ name: 'eda-replicate', version: '1.0.0' }, { capabilities: {} });

function parse(res: unknown): Record<string, unknown> {
	const content = (res as { content?: Array<{ text?: string }> }).content ?? [];
	const text = content.map((c) => c.text ?? '').join('\n');
	try {
		return JSON.parse(text) as Record<string, unknown>;
	} catch {
		return { _raw: text };
	}
}
const call = async (name: string, a: Record<string, unknown> = {}) => parse(await client.callTool({ name, arguments: a }));

const t0 = Date.now();
const el = () => `${((Date.now() - t0) / 1000).toFixed(0)}s`;

await client.connect(transport);
console.log('▶ 已连接 MCP\n');

// 等扩展连入
let ready = false;
for (let i = 0; i < 150; i++) {
	const s = await call('eda_status');
	if (((s.connected_clients ?? []) as unknown[]).length > 0) { ready = true; break; }
	await new Promise((r) => setTimeout(r, 2000));
}
if (!ready) { console.error('❌ EDA 扩展未连入（等了 300 秒）'); process.exit(1); }

// 安全闸：只在沙箱工程里动手
const ov = await call('eda_project_overview');
const projName = String((ov.project as { name?: string } | undefined)?.name ?? '');
if (!/测试|test|sandbox|replica|复刻/i.test(projName)) {
	console.error(`❌ 当前工程「${projName}」不是沙箱工程，拒绝写入。请先切到测试工程。`);
	process.exit(1);
}
console.log(`▶ 沙箱工程「${projName}」，目标板 ${BOARD}\n`);

// 1) 建板 + 打开它的原理图页
const nb = await call('eda_create_board', { name: BOARD });
if (nb.ok !== true) { console.error('❌ 建板失败', nb); process.exit(1); }
const board = nb.board as { name?: string; schematic?: { pages?: Array<{ uuid?: string }> } };
const pageUuid = board.schematic?.pages?.[0]?.uuid;
if (!pageUuid) { console.error('❌ 新板没有原理图页', nb); process.exit(1); }
const opened = await call('eda_open_document', { document_uuid: pageUuid });
if (opened.ok !== true || opened.editor !== 'schematic') { console.error('❌ 打开原理图页失败', opened); process.exit(1); }
console.log(`[${el()}] 已建板「${String(board.name)}」并打开其原理图页`);

// 1.5) 按蓝本的坐标范围挑图纸 —— 默认 A4 只有 1170×825(0.01inch)，大图会掉到图框外
{
	const xs = bp.components.map((c) => c.pos?.x ?? 0);
	const ys = bp.components.map((c) => c.pos?.y ?? 0);
	const maxX = Math.max(...xs, 0);
	const maxY = Math.max(...ys, 0);
	// 留 10% 余量给图框和器件本身的尺寸
	const needW = maxX * 1.1;
	const needH = maxY * 1.1;
	const SHEETS: Array<[string, number, number]> = [
		['A4', 1170, 825], ['A3', 1650, 1170], ['A2', 2340, 1650], ['A1', 3300, 2340], ['A0', 4680, 3300],
	];
	const pick = SHEETS.find(([, w, h]) => w >= needW && h >= needH) ?? SHEETS[SHEETS.length - 1]!;
	const r = await call('eda_set_page_size', { size: pick[0] });
	console.log(`[${el()}] 图纸 → ${pick[0]}（蓝本最远坐标 ${maxX},${maxY}）ok=${String(r.ok)} 实际=${String(r.size ?? r.page_size ?? '?')}`);
}
console.log('');

// 2) 放器件
const todo = bp.components.filter((c) => c.des && c.lcsc).slice(0, LIMIT);
console.log(`[${el()}] 放置 ${todo.length} 个器件…`);
const placedOk: string[] = [];
const placeFail: Array<{ des: string; err: unknown }> = [];
for (const c of todo) {
	const r = await call('eda_place_component', {
		lcsc_id: c.lcsc,
		x: c.pos?.x ?? 500,
		y: c.pos?.y ?? 500,
		rotation: c.pos?.rotation ?? 0,
		mirror: c.pos?.mirror ?? false,
		designator: c.des,
	});
	const got = (r.placed as { designator?: string } | undefined)?.designator;
	if (r.ok === true && got === c.des) placedOk.push(c.des);
	else placeFail.push({ des: c.des, err: r.ok === true ? `位号变成了 ${String(got)}（${String(r.designator_note ?? '')}）` : r });
	if ((placedOk.length + placeFail.length) % 10 === 0) {
		console.log(`   [${el()}] ${placedOk.length + placeFail.length}/${todo.length}…`);
	}
}
console.log(`[${el()}] 器件完成：成功 ${placedOk.length}，失败 ${placeFail.length}`);
for (const f of placeFail.slice(0, 5)) console.log(`   ❌ ${f.des}: ${JSON.stringify(f.err).slice(0, 160)}`);

// 3) 连接：给每个引脚引出一小段带网络名的线
//    不用长距离连线 —— 自动 L 型路径在密集图里会大量交叉，而交叉重合的导线会被 EDA
//    判定为电气相连，把不相干的网络并成一片（实测一次复刻里 81 个引脚被误并）。
//    同名网络本来就电气相连，短引出线足够，且互不干扰。
const netStats = { tried: 0, ok: 0, fail: 0 };
const netFails: Array<{ net: string; pair: string; err: string }> = [];
if (!NO_NETS) {
	const placedSet = new Set(placedOk);
	const jobs: Array<{ des: string; pin: string; net: string }> = [];
	for (const c of bp.components) {
		if (!placedSet.has(c.des)) continue;
		for (const p of c.pins) if (p.net) jobs.push({ des: c.des, pin: p.n, net: p.net });
	}
	const limited = jobs.slice(0, NETS_LIMIT === Infinity ? jobs.length : NETS_LIMIT);
	console.log(`\n[${el()}] 标注网络：${limited.length} 个引脚…`);
	for (const j of limited) {
		netStats.tried++;
		const r = await call('eda_label_pin_net', { designator: j.des, pin: j.pin, net: j.net });
		if (r.ok === true) netStats.ok++;
		else {
			netStats.fail++;
			if (netFails.length < 40) netFails.push({ net: j.net, pair: `${j.des}.${j.pin}`, err: String(r.error ?? r._raw ?? '').slice(0, 110) });
		}
		if (netStats.tried % 40 === 0) console.log(`   [${el()}] ${netStats.ok}/${netStats.tried}…`);
	}
	console.log(`[${el()}] 网络标注完成：成功 ${netStats.ok}，失败 ${netStats.fail}`);
}

// 4) 复核：网表口径对比 + DRC
console.log(`\n[${el()}] 复核…`);
const comps2 = await call('eda_schematic_components');
const nets2 = await call('eda_schematic_nets', { include_auto_named: true });
const drc = await call('eda_schematic_drc');
console.log(`   复刻件数 ${String(comps2.total_in_schematic)}（原图 ${bp.components.length}）`);
console.log(`   网络数   ${String(nets2.total_nets)}（原图 ${Object.keys(bp.nets).length}）`);
console.log(`   DRC      errors=${String(drc.errors)} warnings=${String(drc.warnings)}`);

if (netFails.length) {
	console.log(`\n连线失败样例（共 ${netStats.fail} 条）：`);
	for (const f of netFails.slice(0, 12)) console.log(`   ${f.net}  ${f.pair}  ${f.err}`);
}

console.log(`\n═══ 用时 ${el()}；器件 ${placedOk.length}/${todo.length}，连线 ${netStats.ok}/${netStats.tried} ═══`);
await client.close();
process.exit(0);
