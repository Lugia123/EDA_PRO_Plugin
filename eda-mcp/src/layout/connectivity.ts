/**
 * 原理图连通性模型 —— 体检的底座（见 design.md §4.9）。
 *
 * 原来的体检是几何邻近判定：「引脚附近有没有导线端点」。它有两个治不好的
 * 毛病 ——
 *
 *   · 只认导线。端口和电源地符号靠**名字**相连，几何上离多远都是一个网络，
 *     于是用端口连的引脚被判成悬空。
 *   · 查不出误连。两条本不相干的网络被一根线连到一起（导线重合把反馈电阻
 *     短路那次），每个引脚附近都有线，几何判定一片祥和，电路已经废了。
 *
 * 所以改成建连通图：
 *
 *   节点 = 导线段 ∪ 端子（器件引脚、netflag、netport）
 *   边   = 几何重合（端点相接、点落在段上，含 T 型分支）
 *          ＋ 同名 netflag / netport 之间的虚拟边
 *   连通分量 = 图上**实际**形成的一个网络
 *
 * 有了实际网络，再跟声明的网络一比，漏连、误连、孤儿三类一次判完，
 * 而且每条结论都能指出具体是哪个引脚、并给出坐标。
 *
 * 这个文件是纯几何 + 并查集，不碰 EDA API，可以离线跑测试。
 */

/** 一段导线。net 是 EDA 上标注的网络名，仅作参考 —— 判连通只看几何 */
export interface Segment {
	x1: number;
	y1: number;
	x2: number;
	y2: number;
	net?: string;
}

/**
 * 一个接线端子。
 *
 * netflag / netport 的坐标要取**它自己那根引脚**的位置，不是符号中心 ——
 * 符号本体和连接点差着一截，用错了整条网络都判不出来。
 */
export interface Terminal {
	/** 引脚用 "位号.引脚号"，符号端口用自己的 primitiveId */
	id: string;
	x: number;
	y: number;
	kind: 'pin' | 'flag' | 'port';
	/** flag/port 的网络名；同名之间视为相连 */
	net?: string;
	/** 引脚被标了 NC，允许悬空 */
	nc?: boolean;
}

export interface NetGroup {
	index: number;
	/** 器件引脚，"位号.引脚号" */
	pins: string[];
	/** 落在这个分量里的电源地符号／端口名，去重 */
	names: string[];
	segments: number;
}

export interface Connectivity {
	groups: NetGroup[];
	/** 端子 id → 分量下标；不在任何分量里的端子不在表内 */
	of: Map<string, number>;
	/** 既不挨着任何导线、也没有同名伙伴的端子 */
	isolated: string[];
}

/** 容差：坐标都吸附在 0.01 inch 网格上，理论上应精确相等，留 1 个单位兜底 */
export const CONNECT_TOL = 1;

function dist2ToSegment(px: number, py: number, s: Segment): number {
	const dx = s.x2 - s.x1;
	const dy = s.y2 - s.y1;
	const len2 = dx * dx + dy * dy;
	let t = len2 === 0 ? 0 : ((px - s.x1) * dx + (py - s.y1) * dy) / len2;
	t = t < 0 ? 0 : t > 1 ? 1 : t;
	const qx = s.x1 + t * dx;
	const qy = s.y1 + t * dy;
	return Math.abs(px - qx) + Math.abs(py - qy);
}

/** 两段是否相接：任一端点落在对方身上就算，能覆盖 T 型分支 */
function segmentsTouch(a: Segment, b: Segment, tol: number): boolean {
	return (
		dist2ToSegment(a.x1, a.y1, b) <= tol ||
		dist2ToSegment(a.x2, a.y2, b) <= tol ||
		dist2ToSegment(b.x1, b.y1, a) <= tol ||
		dist2ToSegment(b.x2, b.y2, a) <= tol
	);
}

class DSU {
	private p: number[];
	constructor(n: number) {
		this.p = Array.from({ length: n }, (_, i) => i);
	}
	find(x: number): number {
		while (this.p[x] !== x) {
			const parent = this.p[x] as number;
			this.p[x] = this.p[parent] as number;
			x = this.p[x] as number;
		}
		return x;
	}
	union(a: number, b: number): void {
		const ra = this.find(a);
		const rb = this.find(b);
		if (ra !== rb) this.p[ra] = rb;
	}
}

/**
 * 建连通图。
 *
 * 段数上千时两两比较会有点慢（O(n²)），但一张原理图的导线段是几十到几百的
 * 量级，实测 T5 的 39 段跑下来是微秒级，先不做空间索引 —— 真慢了再说，
 * 提前优化只会让这段本来就不好懂的代码更难读。
 */
export function buildConnectivity(segs: Segment[], terms: Terminal[], tol = CONNECT_TOL): Connectivity {
	const nSeg = segs.length;
	const dsu = new DSU(nSeg + terms.length);

	// 段与段
	for (let i = 0; i < nSeg; i++) {
		for (let j = i + 1; j < nSeg; j++) {
			if (segmentsTouch(segs[i] as Segment, segs[j] as Segment, tol)) dsu.union(i, j);
		}
	}

	// 端子挂到它落在的每一段上
	const touched = new Set<number>();
	terms.forEach((t, k) => {
		for (let i = 0; i < nSeg; i++) {
			if (dist2ToSegment(t.x, t.y, segs[i] as Segment) <= tol) {
				dsu.union(nSeg + k, i);
				touched.add(k);
			}
		}
	});

	// 端子之间直接重合也算连上 —— 符号紧贴引脚放置时没有中间导线
	for (let a = 0; a < terms.length; a++) {
		for (let b = a + 1; b < terms.length; b++) {
			const ta = terms[a] as Terminal;
			const tb = terms[b] as Terminal;
			if (Math.abs(ta.x - tb.x) + Math.abs(ta.y - tb.y) <= tol) {
				dsu.union(nSeg + a, nSeg + b);
				touched.add(a);
				touched.add(b);
			}
		}
	}

	// 同名的电源地符号／端口：虚拟边。这是它们存在的意义 ——
	// 不拉线也相连，几何上隔着半张图也是一个网络。
	const byName = new Map<string, number[]>();
	terms.forEach((t, k) => {
		if (t.kind === 'pin' || !t.net) return;
		const list = byName.get(t.net) ?? [];
		list.push(k);
		byName.set(t.net, list);
	});
	for (const list of byName.values()) {
		for (let i = 1; i < list.length; i++) {
			dsu.union(nSeg + (list[0] as number), nSeg + (list[i] as number));
			touched.add(list[0] as number);
			touched.add(list[i] as number);
		}
	}

	// 收集分量
	const buckets = new Map<number, { pins: string[]; names: Set<string>; segs: number }>();
	for (let i = 0; i < nSeg; i++) {
		const r = dsu.find(i);
		const b = buckets.get(r) ?? { pins: [], names: new Set<string>(), segs: 0 };
		b.segs += 1;
		buckets.set(r, b);
	}
	terms.forEach((t, k) => {
		if (!touched.has(k)) return;
		const r = dsu.find(nSeg + k);
		const b = buckets.get(r) ?? { pins: [], names: new Set<string>(), segs: 0 };
		if (t.kind === 'pin') b.pins.push(t.id);
		else if (t.net) b.names.add(t.net);
		buckets.set(r, b);
	});

	const groups: NetGroup[] = [];
	const rootToIndex = new Map<number, number>();
	for (const [root, b] of buckets) {
		rootToIndex.set(root, groups.length);
		groups.push({
			index: groups.length,
			pins: b.pins.sort(),
			names: [...b.names].sort(),
			segments: b.segs,
		});
	}

	const of = new Map<string, number>();
	terms.forEach((t, k) => {
		if (!touched.has(k)) return;
		const gi = rootToIndex.get(dsu.find(nSeg + k));
		if (gi != null) of.set(t.id, gi);
	});

	const isolated = terms.filter((_, k) => !touched.has(k)).map((t) => t.id);
	return { groups, of, isolated };
}

export interface DeclaredNet {
	id: string;
	pins: string[];
}

export interface ConnectivityDiff {
	/** 声明在同一网络、实际却没连在一起 */
	broken: Array<{ net: string; expected: string[]; actual: string[][]; note: string }>;
	/** 不同声明网络的引脚落进了同一个连通分量 —— 短路 */
	shorts: Array<{ nets: string[]; pins: string[]; note: string }>;
	/** 不属于任何网络，且没有 NC 标记 */
	orphans: string[];
	ok: boolean;
}

/**
 * 拿实际连通性去否证声明。
 *
 * 这里的每一条都是**可否证的断言** —— 说某个引脚没连上，就能指出它在哪个
 * 分量、该在哪个分量。这跟「附近没找到线」那种说法不是一个量级的证据。
 */
export function diffConnectivity(
	conn: Connectivity,
	declared: DeclaredNet[],
	terms: Terminal[],
): ConnectivityDiff {
	const broken: ConnectivityDiff['broken'] = [];
	const shorts: ConnectivityDiff['shorts'] = [];

	for (const net of declared) {
		if (net.pins.length < 2) continue;
		const buckets = new Map<string, string[]>();
		for (const ref of net.pins) {
			const gi = conn.of.get(ref);
			const key = gi == null ? 'none' : String(gi);
			buckets.set(key, [...(buckets.get(key) ?? []), ref]);
		}
		if (buckets.size > 1) {
			const actual = [...buckets.values()];
			broken.push({
				net: net.id,
				expected: net.pins,
				actual,
				note:
					`声明为同一网络，实际却分成了 ${buckets.size} 组：` +
					actual.map((g) => `[${g.join(' ')}]`).join(' 与 ') +
					'（其中 none 表示压根没接到任何导线）',
			});
		}
	}

	// 反向：同一个连通分量里出现了分属不同声明网络的引脚
	const netOfPin = new Map<string, string>();
	for (const net of declared) for (const ref of net.pins) netOfPin.set(ref, net.id);
	for (const g of conn.groups) {
		const names = new Set<string>();
		for (const ref of g.pins) {
			const n = netOfPin.get(ref);
			if (n) names.add(n);
		}
		// 符号/端口名也算一路声明来源
		for (const n of g.names) names.add(n);
		if (names.size > 1) {
			shorts.push({
				nets: [...names].sort(),
				pins: g.pins,
				note: `这些引脚在图上连成了一片，但它们分属 ${names.size} 条不同的网络 —— 短路`,
			});
		}
	}

	const ncSet = new Set(terms.filter((t) => t.nc).map((t) => t.id));
	const orphans = conn.isolated.filter((id) => !ncSet.has(id));

	return { broken, shorts, orphans, ok: broken.length === 0 && shorts.length === 0 && orphans.length === 0 };
}

/** 器件包围盒，用于判断导线是否从器件身上压过去 */
export interface PartBox {
	id: string;
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

export interface Crossing {
	part: string;
	seg: Segment;
	note: string;
}

/**
 * 找出压在器件身上的导线。
 *
 * 为什么需要单独查：A* 走线会绕开器件（器件 bbox 的格子进了 blocked 集合），
 * 但**电源地符号和端口的引出线不过 A\***，是从引脚直接画出去的直线 ——
 * 那条线穿过谁没人管。图上看就是一根线从芯片身上横穿过去。
 *
 * bbox 要往里收一点再判：引脚本来就长在器件边缘上，不收缩的话每根正常的
 * 引脚连线都会被判成"穿过器件"，又是一屏假警报。
 */
export function findCrossings(segs: Segment[], boxes: PartBox[], shrink = 6): Crossing[] {
	const out: Crossing[] = [];
	for (const b of boxes) {
		const x0 = b.minX + shrink;
		const y0 = b.minY + shrink;
		const x1 = b.maxX - shrink;
		const y1 = b.maxY - shrink;
		if (x1 <= x0 || y1 <= y0) continue; // 器件太小，收缩后没了，跳过
		for (const s of segs) {
			if (segmentHitsBox(s, x0, y0, x1, y1)) {
				out.push({
					part: b.id,
					seg: s,
					note: `网络 ${s.net || '(无名)'} 的导线从 ${b.id} 身上压过去了`,
				});
			}
		}
	}
	return out;
}

/** 线段与矩形是否相交（含线段完全在矩形内）—— Liang-Barsky 裁剪 */
function segmentHitsBox(s: Segment, x0: number, y0: number, x1: number, y1: number): boolean {
	let t0 = 0;
	let t1 = 1;
	const dx = s.x2 - s.x1;
	const dy = s.y2 - s.y1;
	const tests: Array<[number, number]> = [
		[-dx, s.x1 - x0],
		[dx, x1 - s.x1],
		[-dy, s.y1 - y0],
		[dy, y1 - s.y1],
	];
	for (const [p, q] of tests) {
		if (p === 0) {
			if (q < 0) return false; // 平行且在外侧
			continue;
		}
		const r = q / p;
		if (p < 0) {
			if (r > t1) return false;
			if (r > t0) t0 = r;
		} else {
			if (r < t0) return false;
			if (r < t1) t1 = r;
		}
	}
	return t0 < t1;
}
