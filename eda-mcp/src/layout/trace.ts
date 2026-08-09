/**
 * 布局／布线／渲染的过程日志。
 *
 * 为什么要有：出问题时唯一能看的只有最终那张图，于是每次都得靠猜 ——
 * 「引脚没连上」到底是布局把器件摆歪了、走线算错了、还是画线那步没画上？
 * 前一轮为了定位「导线差半格」翻了三个文件的源码，靠人肉推演网格数学才
 * 找到根因。这类问题应该由日志直接指出来。
 *
 * 原则：
 *   · 默认打开。关掉要显式传 trace:false —— 平时省下的那点开销远不如
 *     出问题时抓瞎的代价。
 *   · 记的是**能判定对错的数据**，不是「开始走线」这类流水账。
 *     引脚要的坐标、实际落点、两者差多少 —— 这种才有用。
 *   · 自带体检：端点对不上引脚、网络被静默跳过，直接升级成 issue，
 *     不用人去比对数字。
 */

export type TraceLevel = 'info' | 'warn' | 'error';

export interface TraceEntry {
	step: string;
	level: TraceLevel;
	msg: string;
	data?: Record<string, unknown>;
}

export class Trace {
	private entries: TraceEntry[] = [];
	private step = '(未命名)';
	readonly enabled: boolean;

	constructor(enabled = true) {
		this.enabled = enabled;
	}

	/** 切换当前步骤名，之后的记录都归到它名下 */
	at(step: string): this {
		this.step = step;
		return this;
	}

	log(msg: string, data?: Record<string, unknown>): void {
		this.push('info', msg, data);
	}

	warn(msg: string, data?: Record<string, unknown>): void {
		this.push('warn', msg, data);
	}

	error(msg: string, data?: Record<string, unknown>): void {
		this.push('error', msg, data);
	}

	private push(level: TraceLevel, msg: string, data?: Record<string, unknown>): void {
		if (!this.enabled) return;
		this.entries.push({ step: this.step, level, msg, ...(data ? { data } : {}) });
	}

	/** 只有 warn / error —— 出问题时先看这个 */
	issues(): TraceEntry[] {
		return this.entries.filter((e) => e.level !== 'info');
	}

	all(): TraceEntry[] {
		return this.entries;
	}

	/** 给返回值用的紧凑形态：正常时只回统计，有问题时把问题列出来 */
	summary(): { steps: number; issues: number; lines: string[] } {
		const bad = this.issues();
		return {
			steps: new Set(this.entries.map((e) => e.step)).size,
			issues: bad.length,
			lines: bad.map((e) => `[${e.step}] ${e.msg}${e.data ? ' ' + JSON.stringify(e.data) : ''}`),
		};
	}

	/** 人读的完整流水，问题行前面加标记 */
	format(): string[] {
		return this.entries.map((e) => {
			const mark = e.level === 'error' ? '!! ' : e.level === 'warn' ? ' ! ' : '   ';
			return `${mark}[${e.step}] ${e.msg}${e.data ? ' ' + JSON.stringify(e.data) : ''}`;
		});
	}
}

/**
 * 走线结果自检：每条网络的每个引脚，是否真的落在自己那条线上。
 *
 * 这一步是「引脚差半格」那个 bug 的直接产物 —— 当时 route() 报
 * unrouted:0、渲染报 24 根线全画上了，而图上没有一个引脚是连着的。
 * 各步自报的成功数说明不了连接成立，只有坐标能。
 */
export function checkRouteEndpoints(
	trace: Trace,
	nets: Array<{ id: string; pins: string[]; paths: Array<Array<[number, number]>> }>,
	pinXY: Map<string, { x: number; y: number }>,
	tol = 1,
): number {
	trace.at('走线自检');
	let bad = 0;
	for (const net of nets) {
		const pts: Array<[number, number]> = [];
		for (const path of net.paths) for (const p of path) pts.push(p);
		if (!pts.length) {
			trace.error(`网络 ${net.id} 一个点都没有 —— 线没画出来`, { pins: net.pins });
			bad += net.pins.length;
			continue;
		}
		for (const ref of net.pins) {
			const xy = pinXY.get(ref);
			if (!xy) {
				trace.warn(`网络 ${net.id} 的引脚 ${ref} 在布局里找不到`, {});
				bad += 1;
				continue;
			}
			let best = Infinity;
			for (const [px, py] of pts) {
				const d = Math.abs(px - xy.x) + Math.abs(py - xy.y);
				if (d < best) best = d;
			}
			if (best > tol) {
				trace.error(`引脚 ${ref} 没落在 ${net.id} 的线上`, {
					引脚: [xy.x, xy.y],
					最近点差: best,
				});
				bad += 1;
			}
		}
	}
	if (bad === 0) trace.log(`${nets.length} 条网络的引脚端点全部对齐`, {});
	return bad;
}
