/**
 * 原理图地图 —— AI 与算法之间的契约，也是这张图的真相源。
 *
 * 之前的做法是：几何信息临时从 EDA 读、连接关系每次由 AI 重说一遍。
 * 两头都不可靠 —— EDA 侧读不到网络（sch_Net 在扩展上下文里返回空）、
 * 读不到文字的真实位置（只能按「位号在上型号在下」猜）、也读不出超长引脚名
 * 撑出来的视觉宽度；AI 侧则是图上不记得上次说过什么，每次优化都要从头交代。
 *
 * 地图把这些固化下来，跟原理图存在一起，于是：
 *
 *   AI 负责语义 —— 用什么器件、分几个区、谁连谁、哪条网络是电源哪条是信号
 *   算法负责几何 —— 位置微调、旋转角度、走线路径、文字往哪摆
 *   地图是契约  —— 两边都读它、都写它，谁也不用猜对方
 *
 * EDA 从「真相源」降级成「渲染目标」：地图能完整重建一张图，反之不行。
 */

/** 网络的性质。**由 AI 判定，不靠名字猜** ——
 *  AVDD_1V8 / VBAT_SW / VREF_2V5 既像电源又像信号，PWR_EN 听着像电源其实是普通 IO。
 *  规则只在 AI 没指明时给个默认建议。 */
export type NetKind = 'signal' | 'power' | 'ground' | 'analog_ground' | 'protect_ground';

/** 这条网络在图上怎么画出来 */
export type NetStyle =
	/** 画看得见的导线，块内连接用这个 */
	| 'wire'
	/** 放电源/地符号，同名自动相连，不拉线 */
	| 'symbol'
	/** 放 IN/OUT 端口，跨功能区用这个 */
	| 'port'
	/** 贴网络标签，兜底 */
	| 'label';

export interface MapPin {
	id: string;
	name?: string;
	/** 相对器件中心的偏移，器件未旋转时 */
	dx: number;
	dy: number;
	/** 引脚朝外的方向：0 右 / 90 上 / 180 左 / 270 下 */
	dir: 0 | 90 | 180 | 270;
}

/**
 * 器件上的文字。归属于器件，但**位置是可优化的变量** ——
 * 位号、型号、阻值往哪摆不影响电气，只影响能不能看清，
 * 所以交给算法在器件四周挑一个不压别人的位置。
 */
export interface MapLabel {
	/** Designator / Name / Value 之类 */
	key: string;
	text: string;
	/** 相对器件中心的偏移；算法会改写它 */
	dx: number;
	dy: number;
	fontSize?: number;
	visible?: boolean;
}

export interface MapPart {
	/** 位号，图内唯一 */
	id: string;
	/** 立创编号，重建这张图时靠它把器件放回来 */
	lcsc?: string;
	/** 符号包围盒，未旋转时 */
	w: number;
	h: number;
	pins: MapPin[];
	labels?: MapLabel[];
	place: { x: number; y: number; rot: 0 | 90 | 180 | 270; mirror: boolean };
	/** 所属功能区 */
	group?: string;
	/** 位置锁死，不参与优化（接口连接器之类要钉在图纸边缘）*/
	fixed?: boolean;
	/** EDA 里的图元 id，渲染时用来定位已有器件；重建时为空 */
	primitiveId?: string;
}

export interface MapNet {
	id: string;
	kind: NetKind;
	style: NetStyle;
	/** "位号.引脚号" */
	pins: string[];
	/** 算法产出的走线，重新优化时会被覆盖 */
	routes?: Array<Array<[number, number]>>;
}

/** 功能区。AI 划分，算法只负责把框画对、把成员摆进去 */
export interface MapGroup {
	id: string;
	title: string;
	note?: string;
	/** 期望的中心位置，算法会在附近安排 */
	anchor?: { x: number; y: number };
	/** 算法算出的实际边界 */
	box?: { minX: number; minY: number; maxX: number; maxY: number };
}

export interface SchematicMap {
	/** 地图格式版本，用于日后迁移 */
	version: 1;
	meta: {
		/** 图纸尺寸，0.01 inch */
		sheet: { w: number; h: number };
		grid: number;
		/** 这张图是干什么的，写给人看 */
		title?: string;
		updatedAt?: string;
	};
	groups: MapGroup[];
	parts: MapPart[];
	nets: MapNet[];
}

export const EMPTY_MAP: SchematicMap = {
	version: 1,
	meta: { sheet: { w: 1170, h: 825 }, grid: 10 },
	groups: [],
	parts: [],
	nets: [],
};

/** 网络性质的**默认建议** —— 仅在 AI 没指明时用，绝不覆盖 AI 的判断 */
export function guessNetKind(name: string): NetKind {
	const u = name.toUpperCase();
	if (u === 'AGND' || u === 'GNDA') return 'analog_ground';
	if (u === 'PGND' || u === 'EARTH' || u === 'FGND') return 'protect_ground';
	if (['GND', 'DGND', 'SGND', 'VSS', 'VEE', 'GNDD'].includes(u)) return 'ground';
	if (u.startsWith('VCC') || u.startsWith('VDD') || u.startsWith('VBAT') || u === 'V+') return 'power';
	const c0 = u.charCodeAt(0);
	if (((c0 >= 48 && c0 <= 57) || u.charAt(0) === '+') && u.includes('V')) return 'power';
	return 'signal';
}

/** 按性质给出默认画法：电源地用符号，其余画线 */
export function defaultStyle(kind: NetKind): NetStyle {
	return kind === 'signal' ? 'wire' : 'symbol';
}

/** 基本校验：引用得对得上，不然渲染时才炸就晚了 */
export function validateMap(m: SchematicMap): string[] {
	const errs: string[] = [];
	const ids = new Set<string>();
	for (const p of m.parts) {
		if (ids.has(p.id)) errs.push(`位号重复: ${p.id}`);
		ids.add(p.id);
		if (!p.pins.length) errs.push(`${p.id} 没有引脚`);
		if (p.group && !m.groups.some((g) => g.id === p.group)) errs.push(`${p.id} 归属的分区不存在: ${p.group}`);
	}
	for (const n of m.nets) {
		if (n.pins.length < 2 && n.style === 'wire') {
			errs.push(`网络 ${n.id} 只有 ${n.pins.length} 个引脚，画不成线`);
		}
		for (const ref of n.pins) {
			const dot = ref.lastIndexOf('.');
			const part = dot > 0 ? m.parts.find((p) => p.id === ref.slice(0, dot)) : undefined;
			if (!part) {
				errs.push(`网络 ${n.id} 引用了不存在的位号: ${ref}`);
			} else if (!part.pins.some((q) => q.id === ref.slice(dot + 1))) {
				errs.push(`网络 ${n.id} 引用了不存在的引脚: ${ref}`);
			}
		}
	}
	return errs;
}

/** 地图文字图元的标记前缀，靠它在图上认出哪一条是地图 */
export const MAP_MARK = 'EDAMCP_MAP_V1:';

/**
 * 地图存进图纸时**格式化**成多行。
 *
 * 两个理由：
 *
 *   人要能看。地图是这张图的真相源，出问题时第一件事就是打开它对一眼；
 *   六七千字符挤成一行谁也读不了。
 *
 *   画布不能被撑爆。地图是一个文字图元，单行时它的渲染宽度有两万多个单位
 *   （图纸本身才 1655），包围盒被一路撑到二十多米宽，`zoomToAllPrimitives`
 *   和界面上的「适应全部」直接失效，缩放卡在 7%，电路缩成左上角一个点。
 *
 * 缩进给 1 个空格：JSON.stringify 的多行输出天然一行一个字段，最长的行也就
 * 是个引脚名，比之前按 96 字符硬切还短，而且切在合法位置 —— 硬切片会把
 * 字符串从中间劈开，只能靠读回时删掉所有换行才拼得回来。
 */
export function packMap(map: SchematicMap): string {
	return `${MAP_MARK}\n${JSON.stringify(map, null, 1)}`;
}

/**
 * 读回地图。
 *
 * 新格式是格式化过的 JSON，换行和缩进都在合法位置，直接 parse 即可。
 * 旧格式是按 96 字符硬切的 —— 切点可能落在字符串中间，必须先把换行全删掉
 * 才拼得回原文。两种都要能读，图纸上还存着老地图。
 */
export function unpackMap(rawAfterMark: string): SchematicMap {
	try {
		return JSON.parse(rawAfterMark) as SchematicMap;
	} catch {
		return JSON.parse(rawAfterMark.replace(/[\r\n]+/g, '')) as SchematicMap;
	}
}
