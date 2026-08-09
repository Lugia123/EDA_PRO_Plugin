/**
 * 连通性模型的离线测试。
 *
 * 这是布局内核第一个有测试的模块。挑的用例都是**真实踩过的坑**，
 * 而不是随手编的样例 —— 每一条都对应一次线上误判：
 *
 *   T型分支      引脚落在导线中间，旧体检只比端点，判成断开
 *   端口相连     几何上隔着半张图，靠同名相连，旧体检判成悬空
 *   导线重合短路 每个引脚附近都有线，几何判定一片祥和，电路已经废了
 *   差半格       A* 网格 10、引脚 y 是 5 的奇数倍，端点永远差 5
 *
 *   node scripts/test-connectivity.mjs
 */
import { buildConnectivity, diffConnectivity } from '../dist/connectivity.mjs';

let pass = 0;
let fail = 0;

function check(name, cond, detail) {
	if (cond) {
		pass += 1;
		console.log(`  ok   ${name}`);
	} else {
		fail += 1;
		console.log(`  FAIL ${name}${detail ? '  ' + JSON.stringify(detail) : ''}`);
	}
}

// ── 1. 直连：两个引脚被一根线连起来 ──
{
	const segs = [{ x1: 0, y1: 0, x2: 100, y2: 0 }];
	const terms = [
		{ id: 'R1.1', x: 0, y: 0, kind: 'pin' },
		{ id: 'R2.1', x: 100, y: 0, kind: 'pin' },
	];
	const c = buildConnectivity(segs, terms);
	check('直连 → 同一分量', c.of.get('R1.1') === c.of.get('R2.1') && c.of.get('R1.1') != null);
	check('直连 → 没有孤儿', c.isolated.length === 0, c.isolated);
}

// ── 2. T 型分支：引脚落在导线中间，不是端点 ──
{
	const segs = [{ x1: 0, y1: 0, x2: 100, y2: 0 }];
	const terms = [
		{ id: 'R1.1', x: 0, y: 0, kind: 'pin' },
		{ id: 'R2.1', x: 50, y: 0, kind: 'pin' }, // 正中间
		{ id: 'R3.1', x: 100, y: 0, kind: 'pin' },
	];
	const c = buildConnectivity(segs, terms);
	const g = c.of.get('R1.1');
	check('T 型分支 → 三个引脚同一分量', g != null && c.of.get('R2.1') === g && c.of.get('R3.1') === g, {
		R1: c.of.get('R1.1'),
		R2: c.of.get('R2.1'),
		R3: c.of.get('R3.1'),
	});
}

// ── 3. 同名端口：几何上隔开，靠名字相连 ──
{
	const segs = [
		{ x1: 0, y1: 0, x2: 50, y2: 0 },
		{ x1: 900, y1: 500, x2: 950, y2: 500 },
	];
	const terms = [
		{ id: 'U2.7', x: 0, y: 0, kind: 'pin' },
		{ id: 'p1', x: 50, y: 0, kind: 'port', net: 'IO_KEY' },
		{ id: 'p2', x: 900, y: 500, kind: 'port', net: 'IO_KEY' },
		{ id: 'R4.2', x: 950, y: 500, kind: 'pin' },
	];
	const c = buildConnectivity(segs, terms);
	check(
		'同名端口 → 两端引脚同一分量',
		c.of.get('U2.7') != null && c.of.get('U2.7') === c.of.get('R4.2'),
		{ U2_7: c.of.get('U2.7'), R4_2: c.of.get('R4.2') },
	);
	check('同名端口 → 声明网络判定通过', diffConnectivity(c, [{ id: 'IO_KEY', pins: ['U2.7', 'R4.2'] }], terms).broken.length === 0);
}

// ── 4. 电源地符号：同名 netflag 相连 ──
{
	const segs = [
		{ x1: 0, y1: 0, x2: 0, y2: -40 },
		{ x1: 600, y1: 0, x2: 600, y2: -40 },
	];
	const terms = [
		{ id: 'C1.2', x: 0, y: 0, kind: 'pin' },
		{ id: 'f1', x: 0, y: -40, kind: 'flag', net: 'GND' },
		{ id: 'C2.2', x: 600, y: 0, kind: 'pin' },
		{ id: 'f2', x: 600, y: -40, kind: 'flag', net: 'GND' },
	];
	const c = buildConnectivity(segs, terms);
	check('同名地符号 → 两个电容同一分量', c.of.get('C1.2') != null && c.of.get('C1.2') === c.of.get('C2.2'));
}

// ── 5. 短路：两条本该独立的网络被连成一片 ──
{
	// FB 与 AOUT 折返到同一条竖线上 —— 反馈电阻被旁路，DRC 不报
	const segs = [
		{ x1: 0, y1: 0, x2: 100, y2: 0 },
		{ x1: 100, y1: 0, x2: 100, y2: 100 },
		{ x1: 100, y1: 100, x2: 0, y2: 100 },
	];
	const terms = [
		{ id: 'U1.1', x: 0, y: 0, kind: 'pin' },
		{ id: 'U1.2', x: 0, y: 100, kind: 'pin' },
	];
	const c = buildConnectivity(segs, terms);
	const d = diffConnectivity(c, [{ id: 'FB', pins: ['U1.1', 'R1.1'] }, { id: 'AOUT', pins: ['U1.2', 'R1.2'] }], terms);
	check('导线重合 → 报出短路', d.shorts.length === 1, d.shorts);
	check('短路条目里两条网络都点名了', d.shorts[0]?.nets.join(',') === 'AOUT,FB', d.shorts[0]?.nets);
}

// ── 6. 差半格：端点没接到引脚上 ──
{
	// A* 网格 10，引脚 y=255 —— 线只能画到 260
	const segs = [{ x1: 200, y1: 260, x2: 300, y2: 260 }];
	const terms = [
		{ id: 'U2.1', x: 300, y: 255, kind: 'pin' },
		{ id: 'R1.2', x: 200, y: 260, kind: 'pin' },
	];
	const c = buildConnectivity(segs, terms);
	check('差 5 → U2.1 判为未接入', c.of.get('U2.1') == null, { got: c.of.get('U2.1') });
	const d = diffConnectivity(c, [{ id: 'RESET', pins: ['U2.1', 'R1.2'] }], terms);
	check('差 5 → 报出断开', d.broken.length === 1, d.broken);
}

// ── 7. NC 引脚不算孤儿 ──
{
	const segs = [];
	const terms = [
		{ id: 'U2.2', x: 0, y: 0, kind: 'pin', nc: true },
		{ id: 'U2.9', x: 50, y: 0, kind: 'pin' },
	];
	const c = buildConnectivity(segs, terms);
	const d = diffConnectivity(c, [], terms);
	check('NC 引脚不报孤儿', !d.orphans.includes('U2.2'), d.orphans);
	check('非 NC 的悬空引脚要报', d.orphans.includes('U2.9'), d.orphans);
}

// ── 8. 端子直接贴着端子（符号紧贴引脚，中间没导线）──
{
	const c = buildConnectivity([], [
		{ id: 'C3.1', x: 100, y: 100, kind: 'pin' },
		{ id: 'f9', x: 100, y: 100, kind: 'flag', net: '+3V3' },
	]);
	check('符号贴着引脚 → 相连', c.of.get('C3.1') != null && c.of.get('C3.1') === c.of.get('f9'));
}

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
