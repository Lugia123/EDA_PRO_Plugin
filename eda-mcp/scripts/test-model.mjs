/**
 * 引脚坐标变换的测试。
 *
 * 用例全是**从 EDA 真机上量出来的**，不是照着公式反推的 —— 这个 bug 的
 * 教训就是公式自洽但和 EDA 不一致：先镜像后旋转在 rot=180 时碰巧同解，
 * rot=90/270 时两个引脚整个对调，而位置、角度、导线端点看上去全是对的。
 * 所以这里钉的是实测值。
 *
 *   node scripts/test-model.mjs
 */
import { pinLocal, pinWorld } from '../dist/model.mjs';

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

// 两脚器件的原始定义：pin1 在左、pin2 在右
const part = {
	id: 'R',
	w: 40,
	h: 20,
	pins: [
		{ id: '1', dx: -20, dy: 0, dir: 180 },
		{ id: '2', dx: 20, dy: 0, dir: 0 },
	],
};
const p1 = part.pins[0];
const p2 = part.pins[1];

// ── 实测组 1：C1 rot=0 mirror=false @ (1110,210) → pin1 (-20,0)、pin2 (+20,0)
{
	const pl = { x: 1110, y: 210, rot: 0, mirror: false };
	const a = pinWorld(part, pl, p1);
	const b = pinWorld(part, pl, p2);
	check('C1 rot=0 无镜像 pin1', a.x === 1090 && a.y === 210, a);
	check('C1 rot=0 无镜像 pin2', b.x === 1130 && b.y === 210, b);
}

// ── 实测组 2：R2 rot=180 mirror=true @ (1160,980) → pin1 (-20,0)、pin2 (+20,0)
// 180° 旋转与水平镜像可交换，所以这一组两种实现都能过 —— 正因如此它掩盖了 bug
{
	const pl = { x: 1160, y: 980, rot: 180, mirror: true };
	const a = pinWorld(part, pl, p1);
	const b = pinWorld(part, pl, p2);
	check('R2 rot=180+镜像 pin1', a.x === 1140 && a.y === 980, a);
	check('R2 rot=180+镜像 pin2', b.x === 1180 && b.y === 980, b);
}

// ── 实测组 3：R1 rot=90 mirror=true @ (290,620) → pin1 (0,-20)、pin2 (0,+20)
// 这一组是分水岭：先镜像后旋转会把两个引脚算反，于是上拉电阻两端接反、
// RESET 接到 +3V3 上，而每一步自检都是绿的。
{
	const pl = { x: 290, y: 620, rot: 90, mirror: true };
	const a = pinWorld(part, pl, p1);
	const b = pinWorld(part, pl, p2);
	check('R1 rot=90+镜像 pin1 在上', a.x === 290 && a.y === 600, a);
	check('R1 rot=90+镜像 pin2 在下', b.x === 290 && b.y === 640, b);
}

// ── rot=270 也要对（另一个会暴露顺序错误的角度）
{
	const pl = { x: 0, y: 0, rot: 270, mirror: true };
	const a = pinWorld(part, pl, p1);
	// 旋转 270°：(-20,0) → (0,20)；再水平镜像：x=0 不变
	check('rot=270+镜像 pin1', a.x === 0 && a.y === 20, a);
}

// ── pinLocal 必须是 pinWorld 的逆 ──
{
	let ok = true;
	const bad = [];
	for (const rot of [0, 90, 180, 270]) {
		for (const mirror of [false, true]) {
			for (const pin of [p1, p2]) {
				const pl = { x: 500, y: 300, rot, mirror };
				const w = pinWorld(part, pl, pin);
				const back = pinLocal(pl, w, pin.id);
				if (back.dx !== pin.dx || back.dy !== pin.dy || back.dir !== pin.dir) {
					ok = false;
					bad.push({ rot, mirror, pin: pin.id, got: back, want: pin });
				}
			}
		}
	}
	check('pinLocal 是 pinWorld 的逆（16 种组合）', ok, bad.slice(0, 3));
}

console.log(`\n${pass} 通过, ${fail} 失败`);
process.exit(fail ? 1 : 0);
