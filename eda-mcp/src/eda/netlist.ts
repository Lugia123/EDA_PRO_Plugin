/**
 * 网表（.enet）获取与解析。
 *
 * 为什么用网表而不是解析原理图源码：
 *  - 网表是 EDA 自己算出来的连接关系，引脚 → 网络的映射直接可用；
 *    从 documentSource 的几何图元反推连线归属既复杂又脆弱。
 *  - 网表只含真实器件（Convert to PCB = yes）。实测同一页 documentSource 有 140 个
 *    COMPONENT，网表只有 56 个 —— 差额是电源符号、网络标志等非器件图元。
 *    做 BOM / 器件清单时，网表的口径才是对的。
 *  - 器件属性（型号、封装、立创编号、Datasheet URL、电气参数）都在网表里，
 *    省掉一次次查库。
 *
 * 解析放在 MCP 侧：150 KB 文本经 WebSocket 回传不进 AI context，
 * 在这里解析成结构化数据后只回传精简结果。
 */

/** 在 EDA 里执行：导出当前原理图的网表并返回文本 */
export const FETCH_NETLIST_CODE = `
	const f = await eda.sch_ManufactureData.getNetlistFile();
	if (!f) return null;
	return await f.text();
`;

export interface NetlistPin {
	/** 引脚在网表里的键（形如 gge1p1，仅内部使用） */
	key: string;
	/** 引脚名，如 OUT / VCC */
	name: string;
	/** 引脚号，如 1 / A3 */
	number: string;
	/** 所连网络名；未连接时为空 */
	net: string;
}

export interface NetlistComponent {
	/** 网表内部 id，如 gge1 */
	id: string;
	props: Record<string, string>;
	pins: NetlistPin[];
}

export interface Netlist {
	version: string;
	components: NetlistComponent[];
}

export interface NetInfo {
	name: string;
	/** 连接到该网络的引脚，按位号排序 */
	nodes: Array<{ designator: string; pin: string; pin_name: string }>;
}

export function parseNetlist(text: string): Netlist {
	const raw = JSON.parse(text) as {
		version?: string;
		components?: Record<string, { props?: Record<string, string>; pinInfoMap?: Record<string, unknown> }>;
	};
	const components: NetlistComponent[] = [];
	for (const [id, c] of Object.entries(raw.components ?? {})) {
		const pins: NetlistPin[] = [];
		for (const [key, p] of Object.entries(c.pinInfoMap ?? {})) {
			const pin = p as { name?: string; number?: string; net?: string };
			pins.push({ key, name: pin.name ?? '', number: pin.number ?? '', net: pin.net ?? '' });
		}
		pins.sort((a, b) => naturalCompare(a.number, b.number));
		components.push({ id, props: c.props ?? {}, pins });
	}
	components.sort((a, b) => naturalCompare(designatorOf(a), designatorOf(b)));
	return { version: raw.version ?? '?', components };
}

export function designatorOf(c: NetlistComponent): string {
	return c.props.Designator ?? c.id;
}

/** 器件的显示型号：优先厂商型号，退化到名称字段 */
export function partNumberOf(c: NetlistComponent): string {
	const name = c.props.Name;
	// Name 常是 "={Manufacturer Part}" 这种模板串，不能直接用
	const literalName = name && !name.startsWith('={') ? name : undefined;
	return c.props['Manufacturer Part'] ?? literalName ?? c.props.DeviceName ?? '';
}

/** 精简视图：AI 浏览器件清单时够用的字段 */
export function briefComponent(c: NetlistComponent): Record<string, unknown> {
	return {
		designator: designatorOf(c),
		part: partNumberOf(c),
		value: c.props.Value || undefined,
		footprint: c.props.FootprintName || c.props['Supplier Footprint'] || undefined,
		lcsc: c.props['Supplier Part'] || undefined,
		manufacturer: c.props.Manufacturer || undefined,
		pins: c.pins.length,
	};
}

/** 完整视图：单个器件的全部属性 + 引脚连接 */
export function detailComponent(c: NetlistComponent): Record<string, unknown> {
	// 这些是内部标识，对使用者没有意义，剔除以减少噪音
	const INTERNAL = new Set(['Symbol', 'Device', 'Footprint', '3D Model', '3D Model Transform', 'Unique ID', 'Channel ID', 'Group ID', 'Reuse Block']);
	const props: Record<string, string> = {};
	for (const [k, v] of Object.entries(c.props)) {
		if (!INTERNAL.has(k) && v !== '') props[k] = v;
	}
	return {
		designator: designatorOf(c),
		part: partNumberOf(c),
		props,
		datasheet: c.props.Datasheet || undefined,
		pins: c.pins.map((p) => ({ number: p.number, name: p.name, net: p.net || null })),
	};
}

/** 由引脚映射反向聚合出网络 → 节点 */
export function buildNets(components: NetlistComponent[]): NetInfo[] {
	const map = new Map<string, NetInfo>();
	for (const c of components) {
		const d = designatorOf(c);
		for (const p of c.pins) {
			if (!p.net) continue;
			let net = map.get(p.net);
			if (!net) {
				net = { name: p.net, nodes: [] };
				map.set(p.net, net);
			}
			net.nodes.push({ designator: d, pin: p.number, pin_name: p.name });
		}
	}
	const nets = [...map.values()];
	for (const n of nets) n.nodes.sort((a, b) => naturalCompare(a.designator, b.designator) || naturalCompare(a.pin, b.pin));
	// 引脚多的网络（电源/地）排前面，通常也是使用者最先关心的
	nets.sort((a, b) => b.nodes.length - a.nodes.length || a.name.localeCompare(b.name));
	return nets;
}

/**
 * EDA 自动生成的网络名形如 $1N9877，对人没有含义。
 * 区分出来便于 AI 判断哪些是设计者命名的有意义网络。
 */
export function isAutoNetName(name: string): boolean {
	return /^\$\d*N\d+$/.test(name);
}

/** R1 < R2 < R10 这样的自然序，避免字典序把 R10 排到 R2 前面 */
function naturalCompare(a: string, b: string): number {
	return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
}
