/**
 * 原理图读取工具。
 *
 * 数据源统一是网表（见 eda/netlist.ts 里为什么不解析原理图源码）。
 * 网表反映的是**当前打开的那块板**的原理图；多板工程要先用 eda_open_project /
 * 让用户切换到目标板，再调这里的工具。
 */
import { briefComponent, buildNets, designatorOf, detailComponent, FETCH_NETLIST_CODE, isAutoNetName, parseNetlist } from '../eda/netlist.js';
import type { NetlistComponent } from '../eda/netlist.js';
import type { ToolContext, ToolDef } from './types.js';
import { optionalBool, optionalString, requireString } from './types.js';

/** 网表导出偶尔要几秒，给足超时 */
const NETLIST_TIMEOUT_MS = 90_000;

async function fetchComponents(ctx: ToolContext): Promise<NetlistComponent[]> {
	const text = await ctx.exec<string | null>(FETCH_NETLIST_CODE, NETLIST_TIMEOUT_MS);
	if (!text) throw new Error('EDA 没有返回网表 —— 请确认当前打开的是原理图（不是 PCB 或开始页），可用 eda_current_context 确认');
	return parseNetlist(text).components;
}

/** 位号前缀匹配：R 命中 R1/R12，不命中 RJ1；也支持直接给完整位号 */
function matchDesignator(d: string, filter: string): boolean {
	const f = filter.toUpperCase();
	const u = d.toUpperCase();
	if (u === f) return true;
	const m = /^([A-Z]+)(\d+)$/.exec(u);
	return m ? m[1] === f : u.startsWith(f);
}

export const schematicTools: ToolDef[] = [
	{
		name: 'eda_schematic_components',
		description:
			'当前原理图的器件清单：位号、型号、封装、立创商城编号、厂商、引脚数。' +
			'\n\n数据来自 EDA 导出的网表，只含真实器件（会上 PCB 的），不含电源符号 / 网络标志等图元' +
			'—— 所以数量会比原理图上看到的图元少，这是对的。' +
			'\n\n用 designator_filter 按位号筛选（给 "R" 匹配所有电阻 R1/R2…，给 "U1" 精确匹配）；' +
			'用 keyword 按型号/描述搜索。器件多时先筛再看，不要一次性拉全部。',
		inputSchema: {
			type: 'object',
			properties: {
				designator_filter: { type: 'string', description: '位号前缀或完整位号，如 R / C / U1' },
				keyword: { type: 'string', description: '在型号、厂商、描述里搜索的关键词，如 AMS1117 / 电阻' },
				limit: { type: 'integer', description: '最多返回多少个，默认 200' },
			},
		},
		handler: async (args, ctx) => {
			const comps = await fetchComponents(ctx);
			const df = optionalString(args, 'designator_filter');
			const kw = optionalString(args, 'keyword')?.toLowerCase();
			const limit = typeof args.limit === 'number' && args.limit > 0 ? args.limit : 200;

			let list = comps;
			if (df) list = list.filter((c) => matchDesignator(designatorOf(c), df));
			if (kw) {
				list = list.filter((c) =>
					Object.values(c.props).some((v) => typeof v === 'string' && v.toLowerCase().includes(kw)),
				);
			}
			const total = list.length;
			return {
				total_in_schematic: comps.length,
				matched: total,
				returned: Math.min(total, limit),
				components: list.slice(0, limit).map(briefComponent),
				hint: total > limit ? `还有 ${total - limit} 个未返回，请缩小筛选条件` : undefined,
			};
		},
	},
	{
		name: 'eda_component_detail',
		description:
			'单个器件的完整信息：全部属性（电气参数、封装、Datasheet 链接等）与每个引脚所连的网络。' +
			'\n\n按位号查询。要看多个器件先用 eda_schematic_components 列清单。',
		inputSchema: {
			type: 'object',
			properties: { designator: { type: 'string', description: '器件位号，如 U1 / R12' } },
			required: ['designator'],
		},
		handler: async (args, ctx) => {
			const want = requireString(args, 'designator').toUpperCase();
			const comps = await fetchComponents(ctx);
			const hit = comps.find((c) => designatorOf(c).toUpperCase() === want);
			if (!hit) {
				const near = comps
					.map(designatorOf)
					.filter((d) => d.toUpperCase().startsWith(want.replace(/\d+$/, '')))
					.slice(0, 15);
				return { error: `找不到位号 ${want}`, similar: near };
			}
			return detailComponent(hit);
		},
	},
	{
		name: 'eda_schematic_nets',
		description:
			'当前原理图的网络（连接关系）：每个网络名下挂着哪些器件的哪些引脚。' +
			'\n\n不带参数时返回网络概览（按连接数排序，电源/地在前）；给 net_name 时返回该网络的完整节点列表。' +
			'\n\n形如 $1N9877 的是 EDA 自动命名的匿名网络（多为两点间的普通连线），' +
			'默认折叠不展开，需要时用 include_auto_named=true。',
		inputSchema: {
			type: 'object',
			properties: {
				net_name: { type: 'string', description: '指定网络名，如 GND / VCC_3V3；给出时返回该网络的全部节点' },
				include_auto_named: { type: 'boolean', description: '是否包含 $1N… 形式的自动命名网络，默认 false' },
				limit: { type: 'integer', description: '概览模式下最多返回多少个网络，默认 100' },
			},
		},
		handler: async (args, ctx) => {
			const comps = await fetchComponents(ctx);
			const nets = buildNets(comps);
			const target = optionalString(args, 'net_name');

			if (target) {
				const hit = nets.find((n) => n.name.toLowerCase() === target.toLowerCase());
				if (!hit) {
					return {
						error: `找不到网络 ${target}`,
						available: nets.filter((n) => !isAutoNetName(n.name)).map((n) => n.name).slice(0, 40),
					};
				}
				return { net: hit.name, pin_count: hit.nodes.length, nodes: hit.nodes };
			}

			const includeAuto = optionalBool(args, 'include_auto_named');
			const limit = typeof args.limit === 'number' && args.limit > 0 ? args.limit : 100;
			const named = nets.filter((n) => includeAuto || !isAutoNetName(n.name));
			const autoCount = nets.length - nets.filter((n) => !isAutoNetName(n.name)).length;
			return {
				total_nets: nets.length,
				auto_named_nets: autoCount,
				returned: Math.min(named.length, limit),
				nets: named.slice(0, limit).map((n) => ({ name: n.name, pin_count: n.nodes.length })),
				hint: includeAuto ? undefined : `另有 ${autoCount} 个自动命名网络未列出，需要时设 include_auto_named=true`,
			};
		},
	},
];
