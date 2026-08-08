/**
 * 模拟退火布局优化。
 *
 * 为什么是退火而不是一趟算法：一次就摆到最优不现实 —— 挪动一个器件会同时改变
 * 线长、交叉、朝向匹配好几项代价，彼此还互相拉扯。退火的做法是不断做小改动
 * （挪一下、转个角、翻一面、跟别人换个位置），变好就留下，变差也按一定概率留下，
 * 温度越低越挑剔。这样能爬出局部最优，而且随时可以停下来拿当前最好的结果。
 *
 * 与电路无关：这里只有矩形、连接点和折线，不认识电阻电容，也不关心信号方向。
 */
import { type CostBreakdown, type Weights, DEFAULT_WEIGHTS, evaluate } from './cost.js';
import { GRID, LABEL_SLOTS, type Layout, type Net, type Part, type Placement, type Rotation, snap } from './model.js';

export interface AnnealOptions {
	/** 迭代轮数，越多越好但越慢 */
	iterations?: number;
	/** 初始温度：允许接受多差的改动 */
	startTemp?: number;
	endTemp?: number;
	/** 单次平移的最大格数 */
	maxShiftGrids?: number;
	/** 布局允许的范围，超出会被夹回来 */
	bounds?: { minX: number; minY: number; maxX: number; maxY: number };
	weights?: Weights;
	/** 固定的随机种子，保证结果可复现（便于回归对比）*/
	seed?: number;
	/** 每隔多少轮回调一次，用于观察收敛 */
	onProgress?: (iter: number, cost: number, temp: number) => void;
}

/** 可复现的伪随机数（xorshift32）—— Math.random 会让回归对比失去意义 */
function makeRng(seed: number): () => number {
	let s = seed >>> 0 || 1;
	return () => {
		s ^= s << 13;
		s >>>= 0;
		s ^= s >> 17;
		s ^= s << 5;
		s >>>= 0;
		return s / 4294967296;
	};
}

const ROTS: Rotation[] = [0, 90, 180, 270];

export interface AnnealResult {
	layout: Layout;
	cost: CostBreakdown;
	initialCost: CostBreakdown;
	iterations: number;
	accepted: number;
}

export function anneal(
	parts: Map<string, Part>,
	nets: Net[],
	initial: Layout,
	opts: AnnealOptions = {},
): AnnealResult {
	const {
		iterations = 20000,
		startTemp = 2000,
		endTemp = 1,
		maxShiftGrids = 6,
		weights = DEFAULT_WEIGHTS,
		seed = 12345,
		bounds,
		onProgress,
	} = opts;

	const rng = makeRng(seed);
	const movable = [...parts.keys()].filter((id) => !parts.get(id)?.fixed);
	if (!movable.length) {
		const c = evaluate(parts, nets, initial, weights);
		return { layout: initial, cost: c, initialCost: c, iterations: 0, accepted: 0 };
	}

	const cur: Layout = new Map();
	for (const [k, v] of initial) {
		const p = parts.get(k);
		const n = p?.labels?.length ?? 0;
		// 文字一开始都放器件上方（EDA 的常见默认），之后由退火自己挑位置
		cur.set(k, { ...v, labelSlots: v.labelSlots ? [...v.labelSlots] : new Array(n).fill(0) });
	}
	let curCost = evaluate(parts, nets, cur, weights);
	const initialCost = curCost;

	let best: Layout = new Map([...cur].map(([k, v]) => [k, { ...v }]));
	let bestCost = curCost;
	let accepted = 0;

	const clamp = (pl: Placement): Placement => {
		if (!bounds) return pl;
		return {
			...pl,
			x: Math.min(Math.max(pl.x, bounds.minX), bounds.maxX),
			y: Math.min(Math.max(pl.y, bounds.minY), bounds.maxY),
		};
	};

	for (let i = 0; i < iterations; i++) {
		// 几何降温
		const temp = startTemp * Math.pow(endTemp / startTemp, i / iterations);

		const id = movable[Math.floor(rng() * movable.length)] as string;
		const old = cur.get(id);
		if (!old) continue;
		const before = { ...old };

		const move = rng();
		const labelCount = parts.get(id)?.labels?.length ?? 0;
		if (labelCount && move < 0.15) {
			// 换个位置摆文字。位号和型号往哪放不影响电气，只影响看不看得清，
			// 所以它跟位置、角度一样是可优化的变量。
			const slots = [...(before.labelSlots ?? new Array(labelCount).fill(0))];
			const which = Math.floor(rng() * labelCount);
			slots[which] = Math.floor(rng() * LABEL_SLOTS.length);
			cur.set(id, { ...before, labelSlots: slots });
		} else if (move < 0.6) {
			// 平移：温度高时步子大，低时精调
			const scale = Math.max(1, Math.round((maxShiftGrids * temp) / startTemp));
			const dx = (Math.floor(rng() * (2 * scale + 1)) - scale) * GRID;
			const dy = (Math.floor(rng() * (2 * scale + 1)) - scale) * GRID;
			cur.set(id, clamp({ ...before, x: snap(before.x + dx), y: snap(before.y + dy) }));
		} else if (move < 0.82) {
			// 转角 —— 这一步是「器件永远横排」的解药
			cur.set(id, { ...before, rot: ROTS[Math.floor(rng() * 4)] as Rotation });
		} else if (move < 0.9) {
			// 翻面：让引脚朝向反过来，比旋转 180° 好，文字不会倒
			cur.set(id, { ...before, mirror: !before.mirror });
		} else {
			// 与另一个器件交换位置，用来跳出「整体次序不对」的局部最优
			const other = movable[Math.floor(rng() * movable.length)] as string;
			const op = cur.get(other);
			if (!op || other === id) continue;
			cur.set(id, clamp({ ...before, x: op.x, y: op.y }));
			cur.set(other, clamp({ ...op, x: before.x, y: before.y }));
			const cost2 = evaluate(parts, nets, cur, weights);
			const delta2 = cost2.total - curCost.total;
			if (delta2 <= 0 || rng() < Math.exp(-delta2 / temp)) {
				curCost = cost2;
				accepted += 1;
				if (cost2.total < bestCost.total) {
					bestCost = cost2;
					best = new Map([...cur].map(([k, v]) => [k, { ...v }]));
				}
			} else {
				cur.set(id, before);
				cur.set(other, op);
			}
			if (onProgress && i % 500 === 0) onProgress(i, curCost.total, temp);
			continue;
		}

		const cost = evaluate(parts, nets, cur, weights);
		const delta = cost.total - curCost.total;
		if (delta <= 0 || rng() < Math.exp(-delta / temp)) {
			curCost = cost;
			accepted += 1;
			if (cost.total < bestCost.total) {
				bestCost = cost;
				best = new Map([...cur].map(([k, v]) => [k, { ...v }]));
			}
		} else {
			cur.set(id, before);
		}

		if (onProgress && i % 500 === 0) onProgress(i, curCost.total, temp);
	}

	return { layout: best, cost: bestCost, initialCost, iterations, accepted };
}
