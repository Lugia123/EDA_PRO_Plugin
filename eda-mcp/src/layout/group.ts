/**
 * 分组布局：先各自在一片空地上摆好，再作为整体拼到一起。
 *
 * 直接把全图器件丢给退火，分组信息就白给了，而且十几个器件的解空间远比
 * 四五个器件的难爬。分治之后：
 *
 *   组内 —— 每组在自己的局部坐标系里独立优化，只看本组器件和组内连线
 *   组间 —— 把每组当成一个大矩形来摆，跨组连接多的靠得近，之间留出走线通道
 *
 * 框是布局的**产物**：等组内摆完，量出实际包围盒再画。预先划一块地往里塞，
 * 塞不下要返工、塞不满则留白难看。
 */
import { anneal } from './anneal.js';
import { DEFAULT_WEIGHTS, type Weights, evaluate } from './cost.js';
import { GRID, type Layout, type Net, type Part, type Placement, snap } from './model.js';
import { route, type RouteResult } from './route.js';

/** 组内器件到组框边缘留多少 */
export const GROUP_PADDING = 60;
/** 组与组之间至少留多少，给跨组走线用 */
export const GROUP_GAP = 140;

export interface GroupBox {
	id: string;
	title?: string;
	note?: string;
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export interface GroupLayoutResult {
	layout: Layout;
	groups: GroupBox[];
	routed: RouteResult;
	/** 两端不在同一组的网络，应当用端口而不是拉线 */
	crossGroupNets: string[];
	perGroup: Array<{ id: string; parts: number; w: number; h: number; wireLength: number; bends: number }>;
	/** 装不下、越界之类需要人过目的事 */
	warnings: string[];
}

export interface GroupLayoutOptions {
	iterations?: number;
	weights?: Weights;
	seed?: number;
	/** 整张图可用的范围 */
	sheet?: { w: number; h: number };
	margin?: number;
	/**
	 * AI 指定的组中心。给了 anchor 的组在组间摆放里**锁死** —— 这是 AI 的终审意见。
	 *
	 * 算法只认线长、交叉、重叠，不懂阅读习惯：信号从左往右流、电源区在左上、
	 * 接口贴图纸边缘、相关的区要挨着。这些只有 AI 知道，所以最后一步交给它。
	 * 而组内摆完之后每组已经塌缩成一个已知尺寸的矩形，AI 面对的是「几个矩形怎么摆」，
	 * 尺寸都在手上，拼起来很准。没给 anchor 的组仍由算法安排。
	 */
	anchors?: Map<string, { x: number; y: number }>;
	/**
	 * 图上**已经被占掉**的区域（逐层递进时前面层的地盘，见 design.md §4.11）。
	 *
	 * 两处生效：组间摆放时当作不可移动的假器件参与退火，重叠代价会把组推开；
	 * 最终布线时作为 A* 的障碍，线不会从别人的地盘里穿过去。
	 */
	obstacles?: Array<{ minX: number; minY: number; maxX: number; maxY: number }>;
}

const groupOf = (partId: string, assign: Map<string, string>): string => assign.get(partId) ?? '_default';

/** 网络的引脚落在哪些组里 */
function netGroups(net: Net, assign: Map<string, string>): Set<string> {
	const gs = new Set<string>();
	for (const ref of net.pins) {
		const dot = ref.lastIndexOf('.');
		if (dot > 0) gs.add(groupOf(ref.slice(0, dot), assign));
	}
	return gs;
}

export function layoutByGroups(
	parts: Map<string, Part>,
	nets: Net[],
	assign: Map<string, string>,
	titles: Map<string, { title?: string; note?: string }>,
	opts: GroupLayoutOptions = {},
): GroupLayoutResult {
	const {
		iterations = 20000,
		weights = DEFAULT_WEIGHTS,
		seed = 7,
		sheet = { w: 1655, h: 1170 },
		margin = 120,
		anchors,
		obstacles = [],
	} = opts;

	// ── 分组 ──
	const members = new Map<string, string[]>();
	for (const id of parts.keys()) {
		const g = groupOf(id, assign);
		if (!members.has(g)) members.set(g, []);
		members.get(g)?.push(id);
	}
	const groupIds = [...members.keys()];

	// 组内网络（两端都在本组）与跨组网络
	const innerNets = new Map<string, Net[]>();
	const crossGroupNets: string[] = [];
	for (const n of nets) {
		const gs = netGroups(n, assign);
		if (gs.size === 1) {
			const g = [...gs][0] as string;
			if (!innerNets.has(g)) innerNets.set(g, []);
			innerNets.get(g)?.push(n);
		} else {
			crossGroupNets.push(n.id);
		}
	}

	// ── 第一层：每组在原点附近的空地上独立优化 ──
	const localLayout = new Map<string, Layout>();
	const localSize = new Map<string, { w: number; h: number; minX: number; minY: number }>();
	const perGroup: GroupLayoutResult['perGroup'] = [];

	for (const g of groupIds) {
		const ids = members.get(g) ?? [];
		const sub = new Map<string, Part>();
		for (const id of ids) {
			const p = parts.get(id);
			if (p) sub.set(id, p);
		}
		// 起手把本组器件在原点附近铺开，别叠在一起，否则退火要花很多轮把它们拆散
		const init: Layout = new Map();
		const cols = Math.max(1, Math.ceil(Math.sqrt(ids.length)));
		// 起手间距按器件实际尺寸给，别一上来就摊得太开 ——
		// 退火收拢的速度远不如一开始就摆得紧凑
		let step = 0;
		for (const id of ids) {
			const p = sub.get(id);
			if (p) step = Math.max(step, Math.max(p.w, p.h));
		}
		step = snap(Math.max(90, step + 60));
		ids.forEach((id, i) => {
			init.set(id, {
				x: snap((i % cols) * step),
				y: snap(Math.floor(i / cols) * step),
				rot: 0,
				mirror: false,
			});
		});

		// 组内要比全局更「抱团」。组的语义就是这些器件是一伙的 —— 哪怕它们
		// 之间没有一根直接的连线，也该挨在一起。
		//
		// 默认权重里 spread 只有 4，唯一的聚拢力来自连线长度；一旦某个组内部
		// 是几条互不相连的支路，那几簇之间就没有任何力。实测 led 区的
		// LED1-R2 和 LED2-R3 两对之间没有共同网络，结果被摆到相距 700，
		// 一个组裂成两簇、还各自出了图纸，而每簇内部看着都挺合理。
		const innerWeights: Weights = { ...weights, spread: weights.spread * 8 };
		const inner = innerNets.get(g) ?? [];
		const a =
			sub.size > 1
				? anneal(sub, inner, init, { iterations, weights: innerWeights, seed: seed + g.length * 31 })
				: {
						layout: init,
						cost: evaluate(sub, inner, init, innerWeights),
						initialCost: evaluate(sub, inner, init, innerWeights),
						iterations: 0,
						accepted: 0,
					};
		const r = route(sub, inner, a.layout);

		// 量出实际占地 —— 组框就是照这个画的
		let minX = Infinity;
		let minY = Infinity;
		let maxX = -Infinity;
		let maxY = -Infinity;
		for (const [id, pl] of a.layout) {
			const p = sub.get(id);
			if (!p) continue;
			const swap = pl.rot === 90 || pl.rot === 270;
			const w = swap ? p.h : p.w;
			const h = swap ? p.w : p.h;
			minX = Math.min(minX, pl.x - w / 2);
			minY = Math.min(minY, pl.y - h / 2);
			maxX = Math.max(maxX, pl.x + w / 2);
			maxY = Math.max(maxY, pl.y + h / 2);
		}
		// 走线也算进占地，否则框会把线切掉
		for (const rn of r.nets) {
			for (const path of rn.paths) {
				for (const [x, y] of path) {
					minX = Math.min(minX, x);
					minY = Math.min(minY, y);
					maxX = Math.max(maxX, x);
					maxY = Math.max(maxY, y);
				}
			}
		}
		if (!Number.isFinite(minX)) {
			minX = 0;
			minY = 0;
			maxX = 0;
			maxY = 0;
		}
		localLayout.set(g, a.layout);
		localSize.set(g, {
			w: maxX - minX + 2 * GROUP_PADDING,
			h: maxY - minY + 2 * GROUP_PADDING,
			minX,
			minY,
		});
		perGroup.push({
			id: g,
			parts: ids.length,
			w: Math.round(maxX - minX),
			h: Math.round(maxY - minY),
			wireLength: r.totalLength,
			bends: r.totalBends,
		});
	}

	// ── 第二层：把每组当一个大矩形来摆 ──
	// 组之间的耦合强度：跨组网络越多，两组越该靠近
	const affinity = new Map<string, number>();
	for (const n of nets) {
		const gs = [...netGroups(n, assign)];
		for (let i = 0; i < gs.length; i++) {
			for (let j = i + 1; j < gs.length; j++) {
				const k = [gs[i], gs[j]].sort().join('|');
				affinity.set(k, (affinity.get(k) ?? 0) + 1);
			}
		}
	}

	/**
	 * 把一个起点从障碍里挪出来。
	 *
	 * 退火的平移一次只走几十个单位，从一块八百宽的障碍中心爬出去要很多步，
	 * 而中途每一步都还压在障碍上、代价居高不下 —— 实测就这么卡在局部最优，
	 * 整个组原地不动。起点直接放到障碍外面，退火才有意义。
	 */
	const dodgeObstacles = (x: number, y: number, w: number, h: number): { x: number; y: number } => {
		let cx = x;
		let cy = y;
		for (let guard = 0; guard < 60; guard += 1) {
			const box = { minX: cx - w / 2, minY: cy - h / 2, maxX: cx + w / 2, maxY: cy + h / 2 };
			const hit = obstacles.find(
				(o) => box.minX < o.maxX && o.minX < box.maxX && box.minY < o.maxY && o.minY < box.maxY,
			);
			if (!hit) break;
			cx = hit.maxX + w / 2 + GROUP_GAP; // 先往右让
			if (cx + w / 2 > sheet.w - margin) {
				// 右边放不下了就换到障碍下方，从左边重新开始
				cx = margin + w / 2;
				cy = hit.maxY + h / 2 + GROUP_GAP;
			}
		}
		return { x: snap(cx), y: snap(cy) };
	};

	// 组当作「器件」，跨组耦合当作「网络」，直接复用同一套退火
	const gParts = new Map<string, Part>();
	const gInit: Layout = new Map();
	let cursorX = margin;
	let cursorY = margin;
	let rowH = 0;
	for (const g of groupIds) {
		const s = localSize.get(g);
		if (!s) continue;
		const pinned = anchors?.get(g);
		gParts.set(g, {
			id: g,
			w: s.w + GROUP_GAP,
			h: s.h + GROUP_GAP,
			pins: [{ id: 'c', dx: 0, dy: 0, dir: 0 }],
			// anchor 是**软**约束：拿它当起点，但仍参与退火。
			// 原来这里按 `fixed: pinned != null` 锁死，结果 AI 随手给的三个
			// 等距 anchor 一旦装不下（某个组比间距还宽），组框就直接叠在一起，
			// 算法明明有重叠代价却动不了它们。MapGroup.anchor 的语义本来就是
			// 「期望位置，算法在附近安排」—— 实现跟设计对齐。
			fixed: false,
		});
		if (pinned) {
			const safe = dodgeObstacles(pinned.x, pinned.y, s.w, s.h);
			gInit.set(g, { x: safe.x, y: safe.y, rot: 0, mirror: false });
			continue;
		}
		// 没指定的按行铺开当起点，交给退火去挪
		if (cursorX + s.w > sheet.w - margin && rowH > 0) {
			cursorX = margin;
			cursorY += rowH + GROUP_GAP;
			rowH = 0;
		}
		const safe = dodgeObstacles(cursorX + s.w / 2, cursorY + s.h / 2, s.w, s.h);
		gInit.set(g, { x: safe.x, y: safe.y, rot: 0, mirror: false });
		cursorX += s.w + GROUP_GAP;
		rowH = Math.max(rowH, s.h);
	}
	// 已占区域作为**不可移动的假器件**参与组间摆放 —— 退火本来就有重叠代价，
	// 借它把组推开，比另写一套避让逻辑可靠。这些假器件不参与任何网络，
	// 摆完之后从结果里剔掉。
	const obstacleIds = new Set<string>();
	obstacles.forEach((o, i) => {
		const id = `__obstacle_${i}`;
		obstacleIds.add(id);
		gParts.set(id, {
			id,
			w: Math.max(GRID, o.maxX - o.minX),
			h: Math.max(GRID, o.maxY - o.minY),
			pins: [],
			fixed: true,
		});
		gInit.set(id, { x: snap((o.minX + o.maxX) / 2), y: snap((o.minY + o.maxY) / 2), rot: 0, mirror: false });
	});

	const gNets: Net[] = [...affinity.entries()].map(([k, cnt]) => ({
		id: `aff:${k}`,
		// 耦合越强，重复越多次，等价于加权
		pins: k.split('|').flatMap((g) => Array.from({ length: Math.min(3, cnt) }, () => `${g}.c`)),
	}));
	// 组不能转，只能挪 —— 组内已经摆好了，整体旋转会让文字全倒
	const gWeights: Weights = { ...weights, pinFacing: 0, supplyDir: 0 };
	// 判据要用 gParts.size 而不是 groupIds.length：障碍是以假器件的形式加进
	// gParts 的，只有一个真组、但有障碍时**照样要跑退火**把组从障碍里挪出来。
	// 按 groupIds 判断的话，单组场景直接采用初始位置，障碍等于没传。
	const gRes =
		gParts.size > 1
			? anneal(gParts, gNets, gInit, {
					// 组间摆放看着简单（只有几个矩形），但解空间是离散的、代价面很崎岖：
					// 三个区排成一行、一列、还是 2x2，差别巨大。迭代给足才找得到能塞进图纸的排布。
					iterations: Math.max(20000, iterations),
					weights: gWeights,
					seed: seed + 101,
					bounds: { minX: margin, minY: margin, maxX: sheet.w - margin, maxY: sheet.h - margin },
				})
			: { layout: gInit, cost: evaluate(gParts, gNets, gInit, gWeights), initialCost: evaluate(gParts, gNets, gInit, gWeights), iterations: 0, accepted: 0 };

	// ── 平移合并：把每组的局部结果搬到它在整图里的位置 ──
	const layout: Layout = new Map();
	const groups: GroupBox[] = [];
	for (const g of groupIds) {
		if (obstacleIds.has(g)) continue; // 假器件不是真的组
		const size = localSize.get(g);
		const gp = gRes.layout.get(g);
		const local = localLayout.get(g);
		if (!size || !gp || !local) continue;
		// 组框左下角 = 组中心 - 半宽高
		const originX = snap(gp.x - size.w / 2 + GROUP_PADDING - size.minX);
		const originY = snap(gp.y - size.h / 2 + GROUP_PADDING - size.minY);
		for (const [id, pl] of local) {
			layout.set(id, { ...pl, x: snap(pl.x + originX), y: snap(pl.y + originY) } as Placement);
		}
		const t = titles.get(g) ?? {};
		groups.push({
			id: g,
			title: t.title,
			note: t.note,
			minX: snap(gp.x - size.w / 2),
			minY: snap(gp.y - size.h / 2),
			maxX: snap(gp.x + size.w / 2),
			maxY: snap(gp.y + size.h / 2),
		});
	}

	// ── 越界处理 ──
	// 组间退火的 bounds 只管住组中心，管不住组的边缘，所以框还是可能探出图纸。
	// 先整体平移看能不能塞进去；塞不下就如实报出来，让人决定换大图纸还是拆分区。
	const warnings: string[] = [];
	if (groups.length) {
		const allMinX = Math.min(...groups.map((g) => g.minX));
		const allMinY = Math.min(...groups.map((g) => g.minY));
		const allMaxX = Math.max(...groups.map((g) => g.maxX));
		const allMaxY = Math.max(...groups.map((g) => g.maxY));
		const needW = allMaxX - allMinX;
		const needH = allMaxY - allMinY;
		const availW = sheet.w - 2 * margin;
		const availH = sheet.h - 2 * margin;

		let dx = 0;
		let dy = 0;
		if (needW <= availW) dx = snap(margin - allMinX);
		else warnings.push(`所有分区横向共需 ${Math.round(needW)}，图纸只有 ${Math.round(availW)} 可用 —— 换更大的图纸，或把分区拆细`);
		if (needH <= availH) dy = snap(margin - allMinY);
		else warnings.push(`所有分区纵向共需 ${Math.round(needH)}，图纸只有 ${Math.round(availH)} 可用 —— 换更大的图纸，或把分区拆细`);

		// 有障碍时，整体归位不能把布局又推回障碍里。
		//
		// 这两段逻辑各自都对：退火把组挪出了障碍，归位把图贴回图纸左上角不留
		// 白边。凑在一起就废了 —— 实测组被退火正确摆到 x=1040，归位算出
		// dx=-790，一平移正好落回 800 宽的障碍中央，前面所有避让白做。
		// 宁可留白，也不能把布局推到已占区域上。
		if (obstacles.length && (dx !== 0 || dy !== 0)) {
			const wouldHit = groups.some((g) =>
				obstacles.some(
					(o) =>
						g.minX + dx < o.maxX && o.minX < g.maxX + dx && g.minY + dy < o.maxY && o.minY < g.maxY + dy,
				),
			);
			if (wouldHit) {
				dx = 0;
				dy = 0;
			}
		}

		if (dx !== 0 || dy !== 0) {
			for (const [id, pl] of layout) layout.set(id, { ...pl, x: pl.x + dx, y: pl.y + dy });
			for (const g of groups) {
				g.minX += dx;
				g.maxX += dx;
				g.minY += dy;
				g.maxY += dy;
			}
		}
		for (const g of groups) {
			if (g.minX < 0 || g.minY < 0 || g.maxX > sheet.w || g.maxY > sheet.h) {
				const pinned = anchors?.get(g.id);
				warnings.push(
					pinned
						? `分区 ${g.id} 越出图纸 —— 它的位置是指定的 (${pinned.x},${pinned.y})，而该区实际占 ${Math.round(g.maxX - g.minX)}×${Math.round(g.maxY - g.minY)}，挪一下 anchor`
						: `分区 ${g.id} 越出图纸`,
				);
			}
		}
	}

	// ── 全图布线：组内线重走一遍（坐标变了），跨组线也一并走 ──
	const routed = route(parts, nets, layout, { obstacles });
	if (routed.failedCount) warnings.push(`${routed.failedCount} 条连接没走通，多半是分区之间没留够通道`);

	return { layout, groups, routed, crossGroupNets, perGroup, warnings };
}
