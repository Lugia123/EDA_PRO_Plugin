/**
 * 原理图布局的几何模型 —— 与电路无关。
 *
 * 原理图的导线不承载任何电气意义（不像 PCB 要管阻抗和长度），它只是「这两点相连」
 * 的视觉表达。线绕个弯、走长一点都无所谓，只要看得清。
 * 所以这里刻意不引入任何电路概念：没有网络类型、没有信号流向、没有器件语义。
 * 剩下的是一道纯粹的几何题：
 *
 *   若干矩形，边界上有固定的连接点，可旋转 0/90/180/270、可镜像；
 *   给定若干「点对点」的连接需求；
 *   求每个矩形的位置与朝向、每条连接的正交路径，
 *   使得矩形不重叠、文字不重叠、线短、交叉少、拐弯少、对齐网格。
 *
 * 单位统一为 0.01 inch，与 EDA 的图元坐标一致。网格 GRID = 10（0.1 inch）。
 */

/** 图纸网格，所有坐标最终都要落在它的整数倍上 */
export const GRID = 10;

export type Rotation = 0 | 90 | 180 | 270;

/** 引脚在器件本地坐标系里的位置（器件未旋转、原点在器件中心时） */
export interface PinDef {
	/** 引脚号，器件内唯一 */
	id: string;
	/** 相对器件中心的偏移 */
	dx: number;
	dy: number;
	/** 引脚朝外的方向（0 右 / 90 上 / 180 左 / 270 下），本地坐标系 */
	dir: Rotation;
}

/** 一个可摆放的物体 */
export interface Part {
	id: string;
	/** 符号包围盒（不含引脚引线），本地坐标系、未旋转时的宽高 */
	w: number;
	h: number;
	pins: PinDef[];
	/** 附着的文字（位号、型号、值），相对器件中心的偏移与内容长度 */
	labels?: Array<{ text: string; dx: number; dy: number }>;
	/** 为 true 时不参与优化，位置锁死（比如接口连接器要钉在图纸边缘）*/
	fixed?: boolean;
	/**
	 * 这些引脚外侧要留出空间挂电源符号或地符号。
	 * 不留的话布局收紧后符号会压在邻近器件上 —— 符号不是 part，
	 * 优化器看不见它们，只能靠这里替它们占位。
	 */
	stubPins?: string[];
	/** stubPins 里哪些是接电源的（该朝上）；其余按接地处理（该朝下）*/
	stubUp?: string[];
}

/** 电源／地符号连引出线占的地方，约一格半见方 */
export const SYMBOL_RESERVE = 55;

/** 一条连接需求：把这些引脚接到一起 */
export interface Net {
	id: string;
	/** "位号.引脚号" 列表，两个及以上 */
	pins: string[];
}

/** 某个物体的摆放状态 */
export interface Placement {
	x: number;
	y: number;
	rot: Rotation;
	mirror: boolean;
	/**
	 * 每个 label 选中了第几号候选位（对应 LABEL_SLOTS）。
	 *
	 * 文字往哪摆不影响电气，只影响能不能看清，所以它是**状态的一部分**、
	 * 跟着退火一起优化，而不是钉死在器件上的装饰。缺了这一维，
	 * 密集处的位号和型号只能眼睁睁互相压着。
	 */
	labelSlots?: number[];
}

/**
 * 文字的候选位：器件包围盒外围八个方位。
 * dx/dy 是相对包围盒中心的倍率，实际偏移 = 倍率 × (半宽或半高 + 间隙)。
 */
export const LABEL_SLOTS: Array<{ name: string; fx: number; fy: number }> = [
	{ name: '上', fx: 0, fy: 1 },
	{ name: '下', fx: 0, fy: -1 },
	{ name: '右', fx: 1, fy: 0 },
	{ name: '左', fx: -1, fy: 0 },
	{ name: '右上', fx: 1, fy: 1 },
	{ name: '左上', fx: -1, fy: 1 },
	{ name: '右下', fx: 1, fy: -1 },
	{ name: '左下', fx: -1, fy: -1 },
];

/** 文字与器件边缘之间留的间隙 */
export const LABEL_GAP = 12;

/** 某个 label 在当前摆放下的落点（世界坐标）*/
export function labelWorld(
	part: Part,
	pl: Placement,
	index: number,
): { x: number; y: number } {
	const label = part.labels?.[index];
	if (!label) return { x: pl.x, y: pl.y };
	const slotIdx = pl.labelSlots?.[index];
	if (slotIdx == null) {
		// 没参与优化的，沿用器件自带的偏移
		return { x: pl.x + label.dx, y: pl.y + label.dy };
	}
	const slot = LABEL_SLOTS[slotIdx % LABEL_SLOTS.length] as (typeof LABEL_SLOTS)[number];
	const swap = pl.rot === 90 || pl.rot === 270;
	const halfW = (swap ? part.h : part.w) / 2;
	const halfH = (swap ? part.w : part.h) / 2;
	return {
		x: pl.x + slot.fx * (halfW + LABEL_GAP),
		y: pl.y + slot.fy * (halfH + LABEL_GAP),
	};
}

export type Layout = Map<string, Placement>;

/** 轴对齐包围盒 */
export interface Box {
	minX: number;
	minY: number;
	maxX: number;
	maxY: number;
}

/**
 * 旋转 + 镜像后，引脚在世界坐标系里的位置和朝向。
 *
 * 约定与 EDA 一致：**y 轴向上为正**，旋转角逆时针为正。
 * 镜像沿竖直轴翻转（左右互换），这与 EDA 的 mirror 语义一致 ——
 * 用镜像而不是旋转 180° 是因为后者会把文字也转倒。
 */
export function pinWorld(part: Part, pl: Placement, pin: PinDef): { x: number; y: number; dir: Rotation } {
	let { dx, dy } = pin;
	let dir = pin.dir;
	if (pl.mirror) {
		dx = -dx;
		dir = ((180 - dir + 360) % 360) as Rotation;
	}
	const rad = (pl.rot * Math.PI) / 180;
	const cos = Math.round(Math.cos(rad));
	const sin = Math.round(Math.sin(rad));
	const rx = dx * cos - dy * sin;
	const ry = dx * sin + dy * cos;
	return {
		x: pl.x + rx,
		y: pl.y + ry,
		dir: (((dir + pl.rot) % 360 + 360) % 360) as Rotation,
	};
}

/** 旋转后的包围盒（90/270 度会交换宽高）*/
export function partBox(part: Part, pl: Placement): Box {
	const swap = pl.rot === 90 || pl.rot === 270;
	const w = swap ? part.h : part.w;
	const h = swap ? part.w : part.h;
	return { minX: pl.x - w / 2, minY: pl.y - h / 2, maxX: pl.x + w / 2, maxY: pl.y + h / 2 };
}

/** 两个盒子的重叠面积，不相交为 0 */
export function overlapArea(a: Box, b: Box): number {
	const w = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
	const h = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
	return w > 0 && h > 0 ? w * h : 0;
}

/** 朝向对应的单位向量（世界坐标系，y 向上）*/
export function dirVec(dir: Rotation): [number, number] {
	if (dir === 0) return [1, 0];
	if (dir === 90) return [0, 1];
	if (dir === 180) return [-1, 0];
	return [0, -1];
}

export const snap = (v: number): number => Math.round(v / GRID) * GRID;

/**
 * pinWorld 的逆运算：已知引脚此刻在世界坐标里的位置和朝向，加上器件当前的摆放，
 * 反推它在器件本地坐标系里的定义。
 *
 * 从 EDA 读回来的永远是世界坐标，而优化器要的是本地定义（跟摆放无关的那部分），
 * 所以每次接入现有图纸都要先过这一步。器件当初就不是 rot=0 摆的，不能直接相减。
 */
export function pinLocal(
	pl: Placement,
	world: { x: number; y: number; dir: Rotation },
	id: string,
): PinDef {
	const rx = world.x - pl.x;
	const ry = world.y - pl.y;
	// 先转回去
	const rad = (-pl.rot * Math.PI) / 180;
	const cos = Math.round(Math.cos(rad));
	const sin = Math.round(Math.sin(rad));
	let dx = rx * cos - ry * sin;
	const dy = rx * sin + ry * cos;
	let dir = (((world.dir - pl.rot) % 360 + 360) % 360) as Rotation;
	// 再翻回来
	if (pl.mirror) {
		dx = -dx;
		dir = ((180 - dir + 360) % 360) as Rotation;
	}
	return { id, dx, dy, dir };
}
