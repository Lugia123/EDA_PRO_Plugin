/** 分组两层布局 PoC：用 T5 的三分区拓扑，看组内独立优化 + 组间拼接的效果 */
import { layoutByGroups } from '../src/layout/group.js';
import type { Net, Part } from '../src/layout/model.js';

const R = (id: string) => ({ id, w: 21, h: 9, labels: [{ text: id, dx: -10, dy: 14 }],
	pins: [{ id: '1', dx: -20, dy: 0, dir: 180 as const }, { id: '2', dx: 20, dy: 0, dir: 0 as const }] });
const C = (id: string) => ({ id, w: 21, h: 17, labels: [{ text: id, dx: -10, dy: 16 }],
	pins: [{ id: '1', dx: -20, dy: 0, dir: 180 as const }, { id: '2', dx: 20, dy: 0, dir: 0 as const }] });
const LED = (id: string) => ({ id, w: 21, h: 26, labels: [{ text: id, dx: -10, dy: 20 }],
	pins: [{ id: '1', dx: -20, dy: 0, dir: 180 as const }, { id: '2', dx: 20, dy: 0, dir: 0 as const }] });
const SW = (id: string) => ({ id, w: 41, h: 41, labels: [{ text: id, dx: -10, dy: 28 }],
	pins: [{ id: '1', dx: -30, dy: 20, dir: 180 as const }, { id: '2', dx: 30, dy: 20, dir: 0 as const },
		{ id: '3', dx: -30, dy: -20, dir: 180 as const }, { id: '4', dx: 30, dy: -20, dir: 0 as const }] });

const parts = new Map<string, Part>([
	['U1', { id: 'U1', w: 91, h: 36, labels: [{ text: 'U1', dx: -45, dy: 26 }, { text: 'AMS1117-3.3', dx: -45, dy: -26 }],
		pins: [{ id: '1', dx: -60, dy: 10, dir: 180 }, { id: '2', dx: -60, dy: 0, dir: 180 },
			{ id: '3', dx: -60, dy: -10, dir: 180 }, { id: '4', dx: 50, dy: 0, dir: 0 }] }],
	['C1', C('C1')], ['C2', C('C2')],
	['U2', { id: 'U2', w: 541, h: 51, labels: [{ text: 'U2', dx: -270, dy: 34 }, { text: 'ATTINY85', dx: -270, dy: -34 }],
		pins: [{ id: '1', dx: -280, dy: 15, dir: 180 }, { id: '2', dx: -280, dy: 5, dir: 180 },
			{ id: '3', dx: -280, dy: -5, dir: 180 }, { id: '4', dx: -280, dy: -15, dir: 180 },
			{ id: '5', dx: 280, dy: -15, dir: 0 }, { id: '6', dx: 280, dy: -5, dir: 0 },
			{ id: '7', dx: 280, dy: 5, dir: 0 }, { id: '8', dx: 280, dy: 15, dir: 0 }] }],
	['C3', C('C3')], ['R1', R('R1')], ['SW1', SW('SW1')],
	['R2', R('R2')], ['R3', R('R3')], ['R4', R('R4')],
	['LED1', LED('LED1')], ['LED2', LED('LED2')], ['SW2', SW('SW2')],
]);

const assign = new Map<string, string>([
	['U1', 'pwr'], ['C1', 'pwr'], ['C2', 'pwr'],
	['U2', 'mcu'], ['C3', 'mcu'], ['R1', 'mcu'], ['SW1', 'mcu'],
	['R2', 'io'], ['R3', 'io'], ['R4', 'io'], ['LED1', 'io'], ['LED2', 'io'], ['SW2', 'io'],
]);
const titles = new Map([
	['pwr', { title: '电源 +5V→+3V3', note: 'AMS1117-3.3 线性稳压' }],
	['mcu', { title: 'MCU ATTINY85', note: '复位上拉与去耦' }],
	['io', { title: '指示与按键', note: 'LED1/LED2 状态指示，SW2 用户按键' }],
]);
const nets: Net[] = [
	{ id: 'RESET', pins: ['U2.1', 'R1.1', 'SW1.1'] },
	{ id: 'LED1_A', pins: ['R2.2', 'LED1.1'] },
	{ id: 'LED2_A', pins: ['R3.2', 'LED2.1'] },
	{ id: 'IO_KEY', pins: ['R4.2', 'SW2.1'] },
	{ id: 'IO_LED1', pins: ['U2.5', 'R2.1'] },
	{ id: 'IO_LED2', pins: ['U2.6', 'R3.1'] },
	{ id: 'VIN_5V', pins: ['U1.3', 'C1.2'] },
	{ id: 'V3V3', pins: ['U1.2', 'U1.4', 'C2.2', 'U2.8'] },
];

console.log('=== 算法自动摆组 ===');
let t = Date.now();
const auto = layoutByGroups(parts, nets, assign, titles, { iterations: 20000 });
console.log(`${Date.now() - t}ms  线长 ${auto.routed.totalLength} 拐弯 ${auto.routed.totalBends} 未连 ${auto.routed.failedCount}`);
console.log('每组（摆完就塌缩成一个已知尺寸的矩形，AI 拼接时心里有数）:');
for (const g of auto.perGroup) console.log(`  ${g.id.padEnd(5)} ${g.parts} 个器件  ${g.w}×${g.h}  组内线长 ${g.wireLength}`);
console.log('组框:');
for (const g of auto.groups) console.log(`  ${g.id.padEnd(5)} (${g.minX},${g.minY})-(${g.maxX},${g.maxY})  ${g.title ?? ''}`);
console.log('跨组网络（该走端口）:', auto.crossGroupNets.join(', '));
if (auto.warnings.length) console.log('提示:', auto.warnings.join(' / '));

console.log('\n=== AI 终审：按阅读习惯指定组位置（电源左上、MCU 居中、IO 右下）===');
t = Date.now();
const curated = layoutByGroups(parts, nets, assign, titles, {
	iterations: 20000,
	anchors: new Map([['pwr', { x: 350, y: 900 }], ['mcu', { x: 850, y: 600 }], ['io', { x: 1350, y: 300 }]]),
});
console.log(`${Date.now() - t}ms  线长 ${curated.routed.totalLength} 拐弯 ${curated.routed.totalBends} 未连 ${curated.routed.failedCount}`);
for (const g of curated.groups) console.log(`  ${g.id.padEnd(5)} (${g.minX},${g.minY})-(${g.maxX},${g.maxY})`);
const vert = [...curated.layout.values()].filter((p) => p.rot === 90 || p.rot === 270).length;
console.log(`竖放 ${vert} / ${curated.layout.size}`);
if (curated.warnings.length) console.log('提示:', curated.warnings.join(' / '));
