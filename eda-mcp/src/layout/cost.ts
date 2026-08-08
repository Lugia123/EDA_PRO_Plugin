/**
 * 可读性代价函数 —— 这里定义了「一张原理图好不好看」到底是什么。
 *
 * 优化器唯一认得的就是这个数值，所以每一项权重都是在说：
 * 「我认为这个毛病有多严重」。调这些权重比改算法更能改变出图效果。
 *
 * 三类变量联合求最优：器件摆放、连线走向、文字位置。
 * 优化阶段不做真实布线（太慢），用曼哈顿距离和线段相交做快速估计；
 * 收敛之后再跑一次真正的 A* 布线。
 */
import {
	type Box,
	type Layout,
	type Net,
	type Part,
	SYMBOL_RESERVE,
	dirVec,
	overlapArea,
	partBox,
	pinWorld,
} from './model.js';

export interface Weights {
	/** 器件互相压住 —— 最严重，压住就没法看 */
	partOverlap: number;
	/** 文字互相压住，或文字压在器件上 */
	textOverlap: number;
	/** 连线总长 */
	wireLength: number;
	/** 连线交叉 */
	crossing: number;
	/** 引脚朝向与连线方向不符（要连的两个脚背对背，线得绕过器件）*/
	pinFacing: number;
	/** 网络的引脚散得太开（同一网络的引脚应该聚在一起）*/
	netSpread: number;
	/** 器件贴得太近 —— 不重叠不代表能看，导线得有地方走 */
	tooClose: number;
	/** 接地的引脚没朝下、接电源的引脚没朝上 */
	supplyDir: number;
	/** 整体占地面积 —— 没有这一项，网络少的时候器件会散得到处都是 */
	spread: number;
}

/** 器件之间至少要留出的间隙，小于它就开始罚。留给走线和文字。
 *
 * 60 是实测扫出来的：40 时退火会把器件挤到「看着近、实际没通道」的位置，
 * A* 有四条线走不通；60 起布线失败归零，而且**实际**线长反而更短
 * （估计线长 820 → 实际 1850 且失败，对比估计 1260 → 实际 1780 全通）。
 * 这个差距本身说明：曼哈顿估计骗得了代价函数，骗不过真实布线。 */
export const MIN_GAP = 60;

export const DEFAULT_WEIGHTS: Weights = {
	partOverlap: 8,
	// 文字压在一起比线长几个单位严重得多，权重要压过 wireLength
	textOverlap: 20,
	wireLength: 1,
	crossing: 400,
	pinFacing: 250,
	netSpread: 0.3,
	tooClose: 6,
	// 「电源在上、地在下」是原理图最强的视觉约定，值得给个不低的权重，
	// 让退火主动把器件转到地脚朝下的姿势，而不是事后硬掰符号方向。
	supplyDir: 60,
	// 占地面积。单位是「格数」，一个 600x400 的块约合 24 格，
	// 权重 4 意味着多占一格约等于多走 4 个单位线长 —— 够把器件收拢，又不至于挤成一堆
	// （挤过头会被 tooClose 拦住）。缺了这一项，组内网络少时器件会散得到处都是：
	// 实测 3 个器件的电源区占到 749x629，组框直接顶出图纸。
	spread: 4,
};

export interface CostBreakdown {
	total: number;
	partOverlap: number;
	textOverlap: number;
	wireLength: number;
	crossing: number;
	pinFacing: number;
	netSpread: number;
	tooClose: number;
	supplyDir: number;
	spread: number;
}

/** 两个盒子的间隙（负数表示重叠）。取两轴间隙的较大者：
 *  只要有一个方向拉开了，中间就有通道，不算挤。 */
function gapBetween(a: Box, b: Box): number {
	const gx = Math.max(a.minX - b.maxX, b.minX - a.maxX);
	const gy = Math.max(a.minY - b.maxY, b.minY - a.maxY);
	return Math.max(gx, gy);
}

/** 文字的外接框。字宽按字高的 0.6 估（中文按 1.0），与体检工具的口径一致 */
function labelBox(text: string, x: number, y: number, fontSize = 7): Box {
	let w = 0;
	for (let i = 0; i < text.length; i++) w += text.charCodeAt(i) > 127 ? fontSize : fontSize * 0.6;
	return { minX: x, minY: y - fontSize / 2, maxX: x + w, maxY: y + fontSize / 2 };
}

/** 两条线段是否真正交叉（共端点、共线重叠都不算交叉，另有惩罚）*/
function segCross(a1: [number, number], a2: [number, number], b1: [number, number], b2: [number, number]): boolean {
	const d = (p: [number, number], q: [number, number], r: [number, number]) =>
		(q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0]);
	const d1 = d(b1, b2, a1);
	const d2 = d(b1, b2, a2);
	const d3 = d(a1, a2, b1);
	const d4 = d(a1, a2, b2);
	return ((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0));
}

export function evaluate(
	parts: Map<string, Part>,
	nets: Net[],
	layout: Layout,
	weights: Weights = DEFAULT_WEIGHTS,
): CostBreakdown {
	const ids = [...parts.keys()];
	const boxes = new Map<string, Box>();
	// 挂符号的引脚，在它朝外那一侧占一块地。符号本身不是 part，
	// 不替它占位的话，布局一收紧符号就压到邻居身上了。
	const reserved: Box[] = [];
	for (const id of ids) {
		const p = parts.get(id);
		const pl = layout.get(id);
		if (!p || !pl) continue;
		boxes.set(id, partBox(p, pl));
		for (const pid of p.stubPins ?? []) {
			const pin = p.pins.find((q) => q.id === pid);
			if (!pin) continue;
			const w = pinWorld(p, pl, pin);
			const [vx, vy] = dirVec(w.dir);
			const cx = w.x + (vx * SYMBOL_RESERVE) / 2;
			const cy = w.y + (vy * SYMBOL_RESERVE) / 2;
			const half = SYMBOL_RESERVE / 2;
			reserved.push({ minX: cx - half, minY: cy - half, maxX: cx + half, maxY: cy + half });
		}
	}

	// ── 器件重叠，以及「不重叠但贴太近」──
	let partOverlap = 0;
	let tooClose = 0;
	for (let i = 0; i < ids.length; i++) {
		const a = boxes.get(ids[i] as string);
		if (!a) continue;
		for (let j = i + 1; j < ids.length; j++) {
			const b = boxes.get(ids[j] as string);
			if (!b) continue;
			partOverlap += overlapArea(a, b);
			const gap = gapBetween(a, b);
			// 只罚 0 到 MIN_GAP 之间的：已经重叠的交给 partOverlap，离得远的不管
			if (gap >= 0 && gap < MIN_GAP) tooClose += MIN_GAP - gap;
		}
		// 别的器件压到本器件的符号占位上，同样算重叠
		for (const rbox of reserved) {
			const ov = overlapArea(a, rbox);
			// 占位是从自己的引脚长出来的，跟自己重叠不算数
			if (ov > 0 && !(rbox.minX >= a.minX && rbox.maxX <= a.maxX && rbox.minY >= a.minY && rbox.maxY <= a.maxY)) {
				partOverlap += ov * 0.6;
			}
		}
	}

	// ── 文字重叠：文字之间，以及文字压在器件上 ──
	const texts: Box[] = [];
	for (const id of ids) {
		const p = parts.get(id);
		const pl = layout.get(id);
		if (!p || !pl) continue;
		for (const l of p.labels ?? []) texts.push(labelBox(l.text, pl.x + l.dx, pl.y + l.dy));
	}
	let textOverlap = 0;
	for (let i = 0; i < texts.length; i++) {
		const t = texts[i] as Box;
		for (let j = i + 1; j < texts.length; j++) textOverlap += overlapArea(t, texts[j] as Box);
		for (const id of ids) {
			const b = boxes.get(id);
			if (b) textOverlap += overlapArea(t, b);
		}
	}

	// ── 整体占地：所有器件的总包围盒，按格计 ──
	let spread = 0;
	{
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (const b of boxes.values()) {
			minX = Math.min(minX, b.minX);
			minY = Math.min(minY, b.minY);
			maxX = Math.max(maxX, b.maxX);
			maxY = Math.max(maxY, b.maxY);
		}
		if (Number.isFinite(minX)) {
			const w = maxX - minX;
			const h = maxY - minY;
			// 只罚面积的话，器件会排成一条竖线 —— 那样面积最小，但完全不能看。
			// 原理图偏横向（图纸是横的、信号左右流），所以再罚一项偏离 1.4:1 的宽高比。
			const area = (w / 100) * (h / 100);
			const aspectPenalty = Math.abs(w - h * 1.4) / 100;
			spread = area + aspectPenalty * 3;
		}
	}

	// ── 电源地引脚的朝向：接地的该朝下（270），接电源的该朝上（90）──
	let supplyDir = 0;
	for (const id of ids) {
		const p = parts.get(id);
		const pl = layout.get(id);
		if (!p || !pl) continue;
		for (const pid of p.stubPins ?? []) {
			const pin = p.pins.find((q) => q.id === pid);
			if (!pin) continue;
			const w = pinWorld(p, pl, pin);
			const want = (p.stubUp ?? []).includes(pid) ? 90 : 270;
			if (w.dir !== want) supplyDir += w.dir === (want + 180) % 360 ? 2 : 1; // 完全反向罚双倍
		}
	}

	// ── 连线：用每条网络的最小生成树近似，边取曼哈顿距离 ──
	const pinPos = (ref: string): { x: number; y: number; dir: number } | null => {
		const dot = ref.lastIndexOf('.');
		if (dot <= 0) return null;
		const part = parts.get(ref.slice(0, dot));
		const pl = layout.get(ref.slice(0, dot));
		if (!part || !pl) return null;
		const pin = part.pins.find((q) => q.id === ref.slice(dot + 1));
		return pin ? pinWorld(part, pl, pin) : null;
	};

	let wireLength = 0;
	let netSpread = 0;
	let pinFacing = 0;
	const segments: Array<[[number, number], [number, number]]> = [];

	for (const net of nets) {
		const pts = net.pins.map(pinPos).filter((q): q is { x: number; y: number; dir: number } => q != null);
		if (pts.length < 2) continue;

		// 最小生成树（Prim），网络内点数都很小，O(n²) 足够
		const used = [0];
		const rest = pts.map((_, i) => i).slice(1);
		while (rest.length) {
			let best = Infinity;
			let bi = 0;
			let bu = 0;
			for (const u of used) {
				const pu = pts[u] as { x: number; y: number; dir: number };
				for (let k = 0; k < rest.length; k++) {
					const pv = pts[rest[k] as number] as { x: number; y: number; dir: number };
					const d = Math.abs(pu.x - pv.x) + Math.abs(pu.y - pv.y);
					if (d < best) {
						best = d;
						bi = k;
						bu = u;
					}
				}
			}
			const v = rest[bi] as number;
			const pu = pts[bu] as { x: number; y: number; dir: number };
			const pv = pts[v] as { x: number; y: number; dir: number };
			wireLength += best;
			segments.push([
				[pu.x, pu.y],
				[pv.x, pv.y],
			]);
			// 引脚朝向：连出去的方向应该跟引脚朝外的方向一致，否则线得绕回器件背后
			for (const [from, to] of [
				[pu, pv],
				[pv, pu],
			] as Array<[typeof pu, typeof pu]>) {
				const [vx, vy] = dirVec(from.dir as 0 | 90 | 180 | 270);
				const dx = to.x - from.x;
				const dy = to.y - from.y;
				const len = Math.abs(dx) + Math.abs(dy) || 1;
				const align = (vx * dx + vy * dy) / len; // 1 完全同向，-1 完全背对
				if (align < 0) pinFacing += -align;
			}
			used.push(v);
			rest.splice(bi, 1);
		}

		const xs = pts.map((p) => p.x);
		const ys = pts.map((p) => p.y);
		netSpread += Math.max(...xs) - Math.min(...xs) + (Math.max(...ys) - Math.min(...ys));
	}

	// ── 交叉 ──
	let crossing = 0;
	for (let i = 0; i < segments.length; i++) {
		const si = segments[i];
		if (!si) continue;
		for (let j = i + 1; j < segments.length; j++) {
			const sj = segments[j];
			if (sj && segCross(si[0], si[1], sj[0], sj[1])) crossing += 1;
		}
	}

	const total =
		weights.partOverlap * partOverlap +
		weights.textOverlap * textOverlap +
		weights.wireLength * wireLength +
		weights.crossing * crossing +
		weights.pinFacing * pinFacing +
		weights.netSpread * netSpread +
		weights.tooClose * tooClose +
		weights.supplyDir * supplyDir +
		weights.spread * spread;

	return { total, partOverlap, textOverlap, wireLength, crossing, pinFacing, netSpread, tooClose, supplyDir, spread };
}
