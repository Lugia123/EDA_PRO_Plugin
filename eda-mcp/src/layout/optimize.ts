/**
 * 布局与布线的迭代编排。
 *
 * 一趟摆到最优不现实：退火用曼哈顿距离估线长，快，但它不知道线到底走不走得通 ——
 * 实测估计线长 820 的方案，真实布线要 1850 还有四条连不上；而估计 1260 的方案，
 * 真实只要 1780 且全通。估计骗得了代价函数，骗不过 A*。
 *
 * 所以做成循环：退火出摆放 → A* 真布线 → 用**真实**指标打分 → 换参数和种子再来一轮，
 * 留最好的那一轮。轮数越多越好，但收益递减，所以连续几轮没改善就停。
 */
import { type CostBreakdown, type Weights, DEFAULT_WEIGHTS, evaluate } from './cost.js';
import { type AnnealOptions, anneal } from './anneal.js';
import type { Layout, Net, Part } from './model.js';
import { type RouteResult, route } from './route.js';

export interface OptimizeOptions {
	/** 最多跑几轮 */
	rounds?: number;
	/** 连续多少轮没改善就收手 */
	patience?: number;
	/** 每轮退火的迭代次数 */
	iterations?: number;
	bounds?: AnnealOptions['bounds'];
	weights?: Weights;
	seed?: number;
	onRound?: (round: number, score: number, info: string) => void;
}

export interface OptimizeResult {
	layout: Layout;
	routed: RouteResult;
	cost: CostBreakdown;
	/** 综合评分，越小越好 */
	score: number;
	rounds: number;
	history: Array<{ round: number; score: number; wireLength: number; bends: number; failed: number }>;
}

/**
 * 用**真实布线结果**打分，而不是退火里的估计值。
 * 连不上的线最致命 —— 一条不通就等于图是错的，所以给极高的权重。
 */
function scoreOf(cost: CostBreakdown, routed: RouteResult): number {
	return (
		routed.failedCount * 100000 +
		cost.partOverlap * 8 +
		cost.textOverlap * 20 +
		cost.crossing * 400 +
		routed.totalLength * 1 +
		routed.totalBends * 30
	);
}

export function optimize(
	parts: Map<string, Part>,
	nets: Net[],
	initial: Layout,
	opts: OptimizeOptions = {},
): OptimizeResult {
	const {
		rounds = 8,
		patience = 3,
		iterations = 30000,
		bounds,
		weights = DEFAULT_WEIGHTS,
		seed = 1,
		onRound,
	} = opts;

	let best: OptimizeResult | null = null;
	let stale = 0;
	const history: OptimizeResult['history'] = [];

	for (let r = 0; r < rounds; r++) {
		// 每轮换种子；并让后面的轮次更看重"别挤在一起"，
		// 因为挤是布线失败的主因，前几轮若连不上，后几轮就该把器件推开
		const w: Weights = { ...weights, tooClose: weights.tooClose * (1 + r * 0.25) };
		// 第一轮从调用方给的初始摆放出发，之后从当前最优出发继续爬
		const from = best ? best.layout : initial;
		const a = anneal(parts, nets, from, { iterations, bounds, weights: w, seed: seed + r * 977 });
		const routed = route(parts, nets, a.layout);
		const cost = evaluate(parts, nets, a.layout, weights);
		const score = scoreOf(cost, routed);

		history.push({
			round: r + 1,
			score,
			wireLength: routed.totalLength,
			bends: routed.totalBends,
			failed: routed.failedCount,
		});
		if (onRound) {
			onRound(r + 1, score, `线长 ${routed.totalLength} 拐弯 ${routed.totalBends} 失败 ${routed.failedCount}`);
		}

		if (!best || score < best.score) {
			best = { layout: a.layout, routed, cost, score, rounds: r + 1, history };
			stale = 0;
		} else {
			stale += 1;
			if (stale >= patience) break;
		}
	}

	if (!best) {
		const routed = route(parts, nets, initial);
		const cost = evaluate(parts, nets, initial, weights);
		best = { layout: initial, routed, cost, score: scoreOf(cost, routed), rounds: 0, history };
	}
	best.history = history;
	return best;
}
