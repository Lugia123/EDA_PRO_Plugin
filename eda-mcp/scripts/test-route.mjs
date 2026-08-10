/**
 * A* 布线的离线测试，重点是**障碍避让**。
 *
 * 逐层递进（design.md §4.11）全靠这条：前面层占掉的地方要作为硬约束传进来，
 * 这一层的线才不会从别人的地盘里穿过去。
 *
 *   node scripts/test-route.mjs
 */
import { route } from '../dist/route.mjs';

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
	if (cond) { pass += 1; console.log(`  ok   ${name}`); }
	else { fail += 1; console.log(`  FAIL ${name}${detail ? '  ' + JSON.stringify(detail) : ''}`); }
}

/** 两个单脚器件，引脚朝对方 */
function twoPins(ax, ay, bx, by) {
	const parts = new Map([
		['A', { id: 'A', w: 20, h: 20, pins: [{ id: '1', dx: 10, dy: 0, dir: 0 }] }],
		['B', { id: 'B', w: 20, h: 20, pins: [{ id: '1', dx: -10, dy: 0, dir: 180 }] }],
	]);
	const layout = new Map([
		['A', { x: ax, y: ay, rot: 0, mirror: false }],
		['B', { x: bx, y: by, rot: 0, mirror: false }],
	]);
	return { parts, layout, nets: [{ id: 'N1', pins: ['A.1', 'B.1'] }] };
}

/**
 * 路径的所有**线段**。
 *
 * 不能只看点：poly 会把共线的中间点压掉，一条横穿障碍的直线最后只剩两个
 * 端点，两端都在障碍外 —— 按点判定会得出「没穿过」的错误结论。
 */
function segmentsOf(res) {
	const out = [];
	for (const n of res.nets) {
		for (const p of n.paths) {
			for (let i = 0; i + 1 < p.length; i += 1) out.push([p[i], p[i + 1]]);
		}
	}
	return out;
}

/** 线段与矩形是否相交（Liang-Barsky） */
function segHitsBox(a, b, r) {
	let t0 = 0;
	let t1 = 1;
	const dx = b[0] - a[0];
	const dy = b[1] - a[1];
	const tests = [[-dx, a[0] - r.minX], [dx, r.maxX - a[0]], [-dy, a[1] - r.minY], [dy, r.maxY - a[1]]];
	for (const [p, q] of tests) {
		if (p === 0) { if (q < 0) return false; continue; }
		const t = q / p;
		if (p < 0) { if (t > t1) return false; if (t > t0) t0 = t; }
		else { if (t < t0) return false; if (t < t1) t1 = t; }
	}
	return t0 < t1;
}

const hitsOf = (res, box) => segmentsOf(res).filter(([a, b]) => segHitsBox(a, b, box));

// ── 1. 没有障碍时能连通 ──
{
	const { parts, layout, nets } = twoPins(0, 0, 400, 0);
	const r = route(parts, nets, layout);
	check('无障碍 → 连通', r.failedCount === 0, { failed: r.failedCount });
}

// ── 2. 障碍挡在正中间，路径必须绕开 ──
{
	const { parts, layout, nets } = twoPins(0, 0, 400, 0);
	// 挡住直线通道，但上下留了口子
	const wall = { minX: 150, minY: -100, maxX: 250, maxY: 100 };
	const r = route(parts, nets, layout, { obstacles: [wall] });
	check('有障碍 → 仍连通', r.failedCount === 0, { failed: r.failedCount });
	const hit = hitsOf(r, wall);
	check('路径不穿过障碍', hit.length === 0, hit.slice(0, 2));
}

// ── 3. 同一场景不给障碍时，路径确实会走直线穿过那块地方 ──
//    —— 证明上面那条不是碰巧绕开的
{
	const { parts, layout, nets } = twoPins(0, 0, 400, 0);
	const wall = { minX: 150, minY: -100, maxX: 250, maxY: 100 };
	const r = route(parts, nets, layout);
	const hit = hitsOf(r, wall);
	check('不给障碍时路径本来会穿过该区域（对照）', hit.length > 0, { hit: hit.length });
}

// ── 4. 障碍完全封死 → 判为走不通，而不是穿过去 ──
{
	const { parts, layout, nets } = twoPins(0, 0, 400, 0);
	// 上下都封到边界之外，没有缝隙
	const wall = { minX: 150, minY: -5000, maxX: 250, maxY: 5000 };
	const r = route(parts, nets, layout, { obstacles: [wall] });
	check('封死 → 报走不通', r.failedCount > 0, { failed: r.failedCount });
	const hit = hitsOf(r, wall);
	check('封死 → 也不会硬穿过去', hit.length === 0, hit.slice(0, 2));
}

// ── 5. 障碍在 bounds 之外也要生效（边界要把障碍包进来）──
{
	const { parts, layout, nets } = twoPins(0, 0, 400, 0);
	const far = { minX: 2000, minY: 2000, maxX: 2200, maxY: 2200 };
	const r = route(parts, nets, layout, { obstacles: [far] });
	check('远处的障碍不影响连通', r.failedCount === 0, { failed: r.failedCount });
}

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
