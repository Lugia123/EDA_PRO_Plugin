/** 用 T3 LDO 的真实器件尺寸与拓扑，离线验证布局优化器 */
import { anneal } from '../src/layout/anneal.js';
import { evaluate } from '../src/layout/cost.js';
import type { Layout, Net, Part } from '../src/layout/model.js';
import { route } from '../src/layout/route.js';
import { optimize } from '../src/layout/optimize.js';

const parts = new Map<string, Part>([
	['U1', { id: 'U1', w: 91, h: 36, labels: [{ text: 'U1', dx: -45, dy: 26 }, { text: 'AMS1117-3.3', dx: -45, dy: -26 }],
		pins: [
			{ id: '1', dx: -60, dy: 10, dir: 180 }, { id: '2', dx: -60, dy: 0, dir: 180 },
			{ id: '3', dx: -60, dy: -10, dir: 180 }, { id: '4', dx: 50, dy: 0, dir: 0 },
		] }],
	['C1', { id: 'C1', w: 21, h: 17, labels: [{ text: 'C1', dx: -10, dy: 16 }, { text: '10uF', dx: -10, dy: -16 }],
		pins: [{ id: '1', dx: -20, dy: 0, dir: 180 }, { id: '2', dx: 20, dy: 0, dir: 0 }] }],
	['C2', { id: 'C2', w: 21, h: 17, labels: [{ text: 'C2', dx: -10, dy: 16 }, { text: '100nF', dx: -10, dy: -16 }],
		pins: [{ id: '1', dx: -20, dy: 0, dir: 180 }, { id: '2', dx: 20, dy: 0, dir: 0 }] }],
	['C3', { id: 'C3', w: 21, h: 17, labels: [{ text: 'C3', dx: -10, dy: 16 }, { text: '10uF', dx: -10, dy: -16 }],
		pins: [{ id: '1', dx: -20, dy: 0, dir: 180 }, { id: '2', dx: 20, dy: 0, dir: 0 }] }],
	['C4', { id: 'C4', w: 21, h: 17, labels: [{ text: 'C4', dx: -10, dy: 16 }, { text: '100nF', dx: -10, dy: -16 }],
		pins: [{ id: '1', dx: -20, dy: 0, dir: 180 }, { id: '2', dx: 20, dy: 0, dir: 0 }] }],
	['R1', { id: 'R1', w: 21, h: 9, labels: [{ text: 'R1', dx: -10, dy: 14 }, { text: '1k', dx: -10, dy: -14 }],
		pins: [{ id: '1', dx: -20, dy: 0, dir: 180 }, { id: '2', dx: 20, dy: 0, dir: 0 }] }],
	['LED1', { id: 'LED1', w: 21, h: 26, labels: [{ text: 'LED1', dx: -10, dy: 20 }],
		pins: [{ id: '1', dx: -20, dy: 0, dir: 180 }, { id: '2', dx: 20, dy: 0, dir: 0 }] }],
]);

const nets: Net[] = [
	{ id: '+5V', pins: ['U1.3', 'C1.2', 'C2.2'] },
	{ id: '+3V3', pins: ['U1.2', 'U1.4', 'C3.2', 'C4.2', 'R1.1'] },
	{ id: 'LED_A', pins: ['R1.2', 'LED1.1'] },
	{ id: 'GND', pins: ['U1.1', 'C1.1', 'C2.1', 'C3.1', 'C4.1', 'LED1.2'] },
];

// 初始摆放：全部横排堆在一块，模拟「AI 随手放个大概位置」
const initial: Layout = new Map([
	['U1', { x: 700, y: 600, rot: 0, mirror: false }],
	['C1', { x: 480, y: 640, rot: 0, mirror: false }],
	['C2', { x: 480, y: 540, rot: 0, mirror: false }],
	['C3', { x: 920, y: 640, rot: 0, mirror: false }],
	['C4', { x: 920, y: 540, rot: 0, mirror: false }],
	['R1', { x: 700, y: 400, rot: 0, mirror: false }],
	['LED1', { x: 900, y: 400, rot: 0, mirror: false }],
]);

const before = evaluate(parts, nets, initial);
const beforeRoute = route(parts, nets, initial);

console.log('=== 起点（模拟 AI 随手摆的位置，全横排）===');
console.log(`  估计代价 ${Math.round(before.total)} | 真实布线: 线长 ${beforeRoute.totalLength} 拐弯 ${beforeRoute.totalBends} 失败 ${beforeRoute.failedCount}`);

console.log('\n=== 迭代优化 ===');
const t0 = Date.now();
const r = optimize(parts, nets, initial, {
  rounds: 8,
  iterations: 30000,
  bounds: { minX: 200, minY: 200, maxX: 1400, maxY: 1000 },
  onRound: (n, score, info) => console.log(`  第 ${n} 轮  评分 ${Math.round(score).toString().padStart(6)}  ${info}`),
});
const ms = Date.now() - t0;

console.log(`\n共 ${r.rounds} 轮 / ${ms}ms`);
console.log(`最终: 线长 ${r.routed.totalLength} 拐弯 ${r.routed.totalBends} 失败 ${r.routed.failedCount}`);
console.log(`      器件重叠 ${Math.round(r.cost.partOverlap)} 文字重叠 ${Math.round(r.cost.textOverlap)} 交叉 ${r.cost.crossing}`);
const wl = (1 - r.routed.totalLength / beforeRoute.totalLength) * 100;
console.log(`相对起点: 线长 ${wl > 0 ? '-' : '+'}${Math.abs(wl).toFixed(0)}%  拐弯 ${beforeRoute.totalBends} → ${r.routed.totalBends}`);

console.log('\n最终摆放:');
for (const [id, pl] of [...r.layout].sort()) {
  console.log(`  ${id.padEnd(5)} (${pl.x}, ${pl.y})  转 ${pl.rot}°${pl.mirror ? ' 镜像' : ''}`);
}
const vert = [...r.layout.values()].filter((p) => p.rot === 90 || p.rot === 270).length;
console.log(`\n竖放 ${vert} / ${r.layout.size}（起点全部横排）`);
