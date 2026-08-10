/**
 * 分组布局的障碍避让测试（design.md §4.11 的地基之二）。
 *
 * 逐层递进要求：这一层的器件必须避开前面层已占的地盘。组间摆放是靠把障碍
 * 当作「不可移动的假器件」参与退火实现的 —— 这里验证它真的推开了。
 *
 *   node scripts/test-group.mjs
 */
import { layoutByGroups } from '../dist/group.mjs';

let pass = 0;
let fail = 0;
function check(name, cond, detail) {
	if (cond) { pass += 1; console.log(`  ok   ${name}`); }
	else { fail += 1; console.log(`  FAIL ${name}${detail ? '  ' + JSON.stringify(detail) : ''}`); }
}

function mkParts(n) {
	const parts = new Map();
	const assign = new Map();
	for (let i = 0; i < n; i += 1) {
		const id = `R${i + 1}`;
		parts.set(id, {
			id,
			w: 40,
			h: 20,
			pins: [
				{ id: '1', dx: -20, dy: 0, dir: 180 },
				{ id: '2', dx: 20, dy: 0, dir: 0 },
			],
		});
		assign.set(id, 'g1');
	}
	return { parts, assign };
}

const boxOf = (p, pl) => {
	const swap = pl.rot === 90 || pl.rot === 270;
	const w = swap ? p.h : p.w;
	const h = swap ? p.w : p.h;
	return { minX: pl.x - w / 2, minY: pl.y - h / 2, maxX: pl.x + w / 2, maxY: pl.y + h / 2 };
};
const overlaps = (a, b) => a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;

// ── 1. 不给障碍：布局能正常产出 ──
{
	const { parts, assign } = mkParts(4);
	const nets = [{ id: 'N', pins: ['R1.2', 'R2.1'] }];
	const r = layoutByGroups(parts, nets, assign, new Map(), { iterations: 4000 });
	check('无障碍 → 所有器件都摆了', r.layout.size === 4, { got: r.layout.size });
}

// ── 2. 给一大块障碍：器件不能压在上面 ──
{
	const { parts, assign } = mkParts(4);
	const nets = [{ id: 'N', pins: ['R1.2', 'R2.1'] }];
	// 占住图纸左半边
	const wall = { minX: 0, minY: 0, maxX: 800, maxY: 1170 };
	const r = layoutByGroups(parts, nets, assign, new Map(), {
		iterations: 8000,
		obstacles: [wall],
	});
	check('有障碍 → 所有器件仍都摆了', r.layout.size === 4, { got: r.layout.size });
	const hit = [];
	for (const [id, pl] of r.layout) {
		const p = parts.get(id);
		if (p && overlaps(boxOf(p, pl), wall)) hit.push({ id, at: [pl.x, pl.y] });
	}
	check('器件不压在障碍上', hit.length === 0, hit);
	check('障碍假器件没混进结果', ![...r.layout.keys()].some((k) => k.startsWith('__obstacle')), [...r.layout.keys()]);
	check('组框里也没有假组', !r.groups.some((g) => g.id.startsWith('__obstacle')), r.groups.map((g) => g.id));
}

// ── 3. 走线也要绕开障碍 ──
{
	const { parts, assign } = mkParts(2);
	const nets = [{ id: 'N', pins: ['R1.2', 'R2.1'] }];
	const r = layoutByGroups(parts, nets, assign, new Map(), {
		iterations: 4000,
		obstacles: [{ minX: 0, minY: 0, maxX: 700, maxY: 1170 }],
	});
	const pts = [];
	for (const n of r.routed.nets) for (const p of n.paths) for (const q of p) pts.push(q);
	const inside = pts.filter((q) => q[0] >= 0 && q[0] <= 700 && q[1] >= 0 && q[1] <= 1170);
	check('走线端点不落在障碍内', inside.length === 0, inside.slice(0, 3));
}

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
