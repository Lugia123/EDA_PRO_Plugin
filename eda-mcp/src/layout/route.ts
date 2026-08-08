/**
 * 正交布线 —— 本质就是寻路。
 *
 * 在 GRID 网格上跑 A*，把器件当障碍绕开，只走横竖两个方向。
 * 与游戏寻路的区别只有三点：
 *   1. 拐弯要罚分（原理图讲究线走得直，宁可绕远也别来回折）
 *   2. 压到别的网络的线要重罚 —— 原理图里重合的导线会被判定为电气相连，
 *      那是实实在在的短路，不只是难看
 *   3. 同一网络已经布好的线是**免费**的：走上去就是搭了个 T 型分支，
 *      多点网络正是靠这个连成一片，而不是每两点之间各拉一条
 *
 * 布线不改变器件位置。位置由退火决定，这里只负责在给定摆放下把线走好；
 * 走不通或走得太丑，就把代价反馈回去让退火再调。
 */
import { GRID, type Layout, type Net, type Part, type Rotation, dirVec, partBox, pinWorld } from './model.js';

export interface RouteOptions {
	/** 障碍在器件包围盒基础上外扩多少，避免线贴着符号画 */
	clearance?: number;
	/** 搜索范围，超出就放弃 */
	bounds?: { minX: number; minY: number; maxX: number; maxY: number };
	/** 单条路径最多扩展多少个格子，防止病态情况下卡死 */
	maxExpand?: number;
}

export interface RoutedNet {
	netId: string;
	/** 每段折线，坐标已对齐网格 */
	paths: Array<Array<[number, number]>>;
	/** 没能连上的引脚 */
	failed: string[];
}

export interface RouteResult {
	nets: RoutedNet[];
	totalLength: number;
	totalBends: number;
	failedCount: number;
}

const key = (x: number, y: number): number => (x / GRID) * 100000 + y / GRID;

/** 极简二叉堆，A* 的开放集 */
class Heap {
	private a: Array<{ f: number; v: number }> = [];
	push(f: number, v: number): void {
		this.a.push({ f, v });
		let i = this.a.length - 1;
		while (i > 0) {
			const p = (i - 1) >> 1;
			if ((this.a[p] as { f: number }).f <= f) break;
			this.a[i] = this.a[p] as { f: number; v: number };
			i = p;
		}
		this.a[i] = { f, v };
	}
	pop(): { f: number; v: number } | undefined {
		const top = this.a[0];
		const last = this.a.pop();
		if (this.a.length && last) {
			let i = 0;
			for (;;) {
				const l = 2 * i + 1;
				const r = l + 1;
				let m = i;
				if (l < this.a.length && (this.a[l] as { f: number }).f < (m === i ? last.f : (this.a[m] as { f: number }).f)) m = l;
				if (r < this.a.length && (this.a[r] as { f: number }).f < (m === i ? last.f : (this.a[m] as { f: number }).f)) m = r;
				if (m === i) break;
				this.a[i] = this.a[m] as { f: number; v: number };
				i = m;
			}
			this.a[i] = last;
		}
		return top;
	}
	get size(): number {
		return this.a.length;
	}
}

const DIRS: Array<[number, number]> = [
	[GRID, 0],
	[-GRID, 0],
	[0, GRID],
	[0, -GRID],
];

export function route(
	parts: Map<string, Part>,
	nets: Net[],
	layout: Layout,
	opts: RouteOptions = {},
): RouteResult {
	const { clearance = 10, maxExpand = 60000 } = opts;

	// 边界：包住所有器件再留出余量
	let bMinX = Infinity;
	let bMinY = Infinity;
	let bMaxX = -Infinity;
	let bMaxY = -Infinity;
	for (const [id, pl] of layout) {
		const p = parts.get(id);
		if (!p) continue;
		const b = partBox(p, pl);
		bMinX = Math.min(bMinX, b.minX);
		bMinY = Math.min(bMinY, b.minY);
		bMaxX = Math.max(bMaxX, b.maxX);
		bMaxY = Math.max(bMaxY, b.maxY);
	}
	const pad = 200;
	const bounds = opts.bounds ?? {
		minX: Math.floor((bMinX - pad) / GRID) * GRID,
		minY: Math.floor((bMinY - pad) / GRID) * GRID,
		maxX: Math.ceil((bMaxX + pad) / GRID) * GRID,
		maxY: Math.ceil((bMaxY + pad) / GRID) * GRID,
	};

	// 器件占用的格子（含 clearance）。引脚所在格要挖开，否则线出不来。
	const blocked = new Set<number>();
	for (const [id, pl] of layout) {
		const p = parts.get(id);
		if (!p) continue;
		const b = partBox(p, pl);
		const x0 = Math.floor((b.minX - clearance) / GRID) * GRID;
		const x1 = Math.ceil((b.maxX + clearance) / GRID) * GRID;
		const y0 = Math.floor((b.minY - clearance) / GRID) * GRID;
		const y1 = Math.ceil((b.maxY + clearance) / GRID) * GRID;
		for (let x = x0; x <= x1; x += GRID) for (let y = y0; y <= y1; y += GRID) blocked.add(key(x, y));
	}
	const pinCells = new Map<string, { x: number; y: number; dir: Rotation }>();
	for (const [id, pl] of layout) {
		const p = parts.get(id);
		if (!p) continue;
		for (const pin of p.pins) {
			const w = pinWorld(p, pl, pin);
			const gx = Math.round(w.x / GRID) * GRID;
			const gy = Math.round(w.y / GRID) * GRID;
			pinCells.set(`${id}.${pin.id}`, { x: gx, y: gy, dir: w.dir });
			blocked.delete(key(gx, gy));
			// 把引脚正前方一格也挖开，保证有出口
			const [vx, vy] = dirVec(w.dir);
			blocked.delete(key(gx + vx * GRID, gy + vy * GRID));
		}
	}

	/** 已布线格子 → 网络 id。同网络免费共享，异网络重罚 */
	const occupied = new Map<number, string>();
	const result: RoutedNet[] = [];
	let totalLength = 0;
	let totalBends = 0;
	let failedCount = 0;

	for (const net of nets) {
		const endpoints = net.pins
			.map((ref) => ({ ref, cell: pinCells.get(ref) }))
			.filter((e): e is { ref: string; cell: { x: number; y: number; dir: Rotation } } => e.cell != null);
		if (endpoints.length < 2) continue;

		const paths: Array<Array<[number, number]>> = [];
		const failed: string[] = [];
		// 已接入本网络的格子：起手是第一个引脚，之后每布好一段就并进来
		const connected = new Set<number>([key((endpoints[0] as (typeof endpoints)[0]).cell.x, (endpoints[0] as (typeof endpoints)[0]).cell.y)]);

		for (let i = 1; i < endpoints.length; i++) {
			const target = endpoints[i] as (typeof endpoints)[number];
			const goal = key(target.cell.x, target.cell.y);
			if (connected.has(goal)) continue;

			// 从目标引脚出发，找到「任意一个已接入本网络的格子」即可 —— 天然形成 T 型分支
			const open = new Heap();
			const gScore = new Map<number, number>();
			const cameFrom = new Map<number, number>();
			const start = goal;
			gScore.set(start, 0);
			// 启发式：到最近的已连接格子的曼哈顿距离
			const conn = [...connected].map((k) => ({ x: Math.floor(k / 100000) * GRID, y: (k % 100000) * GRID }));
			const h = (x: number, y: number): number => {
				let m = Infinity;
				for (const c of conn) m = Math.min(m, Math.abs(x - c.x) + Math.abs(y - c.y));
				return m;
			};
			open.push(h(target.cell.x, target.cell.y), start);

			let found: number | null = null;
			let expanded = 0;
			while (open.size && expanded < maxExpand) {
				const cur = open.pop();
				if (!cur) break;
				const cx = Math.floor(cur.v / 100000) * GRID;
				const cy = (cur.v % 100000) * GRID;
				if (connected.has(cur.v) && cur.v !== start) {
					found = cur.v;
					break;
				}
				expanded += 1;
				const g = gScore.get(cur.v) ?? Infinity;
				const prev = cameFrom.get(cur.v);
				for (const [dx, dy] of DIRS) {
					const nx = cx + dx;
					const ny = cy + dy;
					if (nx < bounds.minX || nx > bounds.maxX || ny < bounds.minY || ny > bounds.maxY) continue;
					const nk = key(nx, ny);
					// 器件挡路（终点格除外）
					if (blocked.has(nk) && !connected.has(nk)) continue;
					let step = GRID;
					// 拐弯罚分：原理图讲究线走直
					if (prev != null) {
						const px = Math.floor(prev / 100000) * GRID;
						const py = (prev % 100000) * GRID;
						if ((px - cx === 0) !== (cx - nx === 0)) step += GRID * 2;
					}
					// 压到别的网络的线 —— 视觉上重合，电气上短路
					const owner = occupied.get(nk);
					if (owner && owner !== net.id) step += GRID * 40;
					const ng = g + step;
					if (ng < (gScore.get(nk) ?? Infinity)) {
						gScore.set(nk, ng);
						cameFrom.set(nk, cur.v);
						open.push(ng + h(nx, ny), nk);
					}
				}
			}

			if (found == null) {
				failed.push(target.ref);
				failedCount += 1;
				continue;
			}

			// 回溯成折线，并把中间的直线点压掉
			const cells: number[] = [];
			let cur: number | undefined = found;
			while (cur != null) {
				cells.push(cur);
				cur = cameFrom.get(cur);
			}
			const raw: Array<[number, number]> = cells.map((k) => [Math.floor(k / 100000) * GRID, (k % 100000) * GRID]);
			const poly: Array<[number, number]> = [];
			for (let k = 0; k < raw.length; k++) {
				const a = raw[k - 1];
				const b = raw[k] as [number, number];
				const c = raw[k + 1];
				if (!a || !c) {
					poly.push(b);
					continue;
				}
				const collinear = (a[0] === b[0] && b[0] === c[0]) || (a[1] === b[1] && b[1] === c[1]);
				if (!collinear) poly.push(b);
			}
			paths.push(poly);
			totalBends += Math.max(0, poly.length - 2);
			for (let k = 1; k < raw.length; k++) {
				const a = raw[k - 1] as [number, number];
				const b = raw[k] as [number, number];
				totalLength += Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]);
			}
			for (const k of cells) {
				connected.add(k);
				occupied.set(k, net.id);
			}
		}

		result.push({ netId: net.id, paths, failed });
	}

	return { nets: result, totalLength, totalBends, failedCount };
}
