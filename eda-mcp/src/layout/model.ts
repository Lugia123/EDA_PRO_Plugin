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
}

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
