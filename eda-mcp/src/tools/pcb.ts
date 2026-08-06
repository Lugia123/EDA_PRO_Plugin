/**
 * PCB 只读工具。
 *
 * 关键约束：pcb_* 这组 API **绑定活动画布** —— 当前编辑器里开着原理图时调用会抛
 * 「指定的主题消息在对应的画布内没有相关订阅」。所以每个工具先检查当前是不是 PCB 编辑器，
 * 不是就返回可操作的提示，而不是把这个晦涩的内部错误抛给使用者。
 * 用 eda_open_document 可以把 PCB 切到前台。
 *
 * 与原理图 DRC 的重要差异：pcb_Drc.check(..., true) **会返回完整的错误明细树**
 * （分类 → 具体条目 → explanation.str），不像 sch_Drc 只给分类计数。
 */
import type { ToolContext, ToolDef } from './types.js';
import { optionalBool, optionalString, requireString } from './types.js';

const PCB_TIMEOUT_MS = 90_000;

/** 当前编辑器不是 PCB 时，pcb_* 全部不可用 —— 统一前置检查 */
const ENSURE_PCB = `
	const _pcb = await eda.dmt_Pcb.getCurrentPcbInfo().catch(() => null);
	if (!_pcb) {
		const boards = await eda.dmt_Board.getAllBoardsInfo();
		return { error: 'NOT_PCB_EDITOR', available_pcbs: boards.filter(b => b.pcb).map(b => ({ board: b.name, pcb_uuid: b.pcb.uuid, pcb_name: b.pcb.name })) };
	}
`;

function pcbHint(result: Record<string, unknown>): Record<string, unknown> {
	if (result?.error !== 'NOT_PCB_EDITOR') return result;
	return {
		error: '当前编辑器里没有打开 PCB —— pcb_* 接口绑定活动画布，必须先把 PCB 切到前台。',
		available_pcbs: result.available_pcbs,
		next_step: '用 eda_open_document(document_uuid: <上面某个 pcb_uuid>) 打开后重试。',
	};
}

export const pcbTools: ToolDef[] = [
	{
		name: 'eda_open_document',
		description:
			'在 EDA 编辑器里打开并激活一个文档（PCB 或原理图页），uuid 从 eda_project_overview 拿。' +
			'\n\n用途：原理图类接口和 PCB 类接口都**只对当前活动画布生效**，' +
			'要读 PCB 就得先把 PCB 打开。本工具是在同一工程内切标签页，不会重载页面、不会断开连接' +
			'（与 eda_open_project 切换工程不同）。',
		inputSchema: {
			type: 'object',
			properties: { document_uuid: { type: 'string', description: 'PCB uuid 或原理图页 uuid' } },
			required: ['document_uuid'],
		},
		handler: async (args, ctx) => {
			const uuid = requireString(args, 'document_uuid');
			return ctx.exec(
				`
				const tabId = await eda.dmt_EditorControl.openDocument(${JSON.stringify(uuid)});
				if (!tabId) return { ok: false, error: '打开失败，请确认 uuid 是本工程内的 PCB 或原理图页' };
				await eda.dmt_EditorControl.activateDocument(tabId);
				await new Promise(r => setTimeout(r, 1200));   // 画布订阅建立需要一点时间
				const pcb = await eda.dmt_Pcb.getCurrentPcbInfo().catch(() => null);
				const page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
				return { ok: true, tab_id: tabId, editor: pcb ? 'pcb' : page ? 'schematic' : 'other',
					opened: pcb ? { type: 'pcb', name: pcb.name, uuid: pcb.uuid } : page ? { type: 'schematic_page', name: page.name, uuid: page.uuid } : null };
			`,
				PCB_TIMEOUT_MS,
			);
		},
	},
	{
		name: 'eda_pcb_overview',
		description:
			'当前 PCB 的概况：名称、铜层数、网络数量、当前所在层。' +
			'\n\n需要编辑器里正开着 PCB；没开会返回可用的 PCB 列表和打开方法。',
		inputSchema: { type: 'object', properties: {} },
		handler: async (_args, ctx) =>
			pcbHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_PCB}
				const layers = await eda.pcb_Layer.getTheNumberOfCopperLayers().catch(() => null);
				const names = await eda.pcb_Net.getAllNetsName().catch(() => []);
				const cur = eda.pcb_Layer.getCurrentLayer?.() ?? null;
				return {
					pcb: { name: _pcb.name, uuid: _pcb.uuid },
					copper_layers: layers,
					net_count: names.length,
					current_layer: cur && typeof cur === 'object' ? { id: cur.id, name: cur.name } : cur,
				};
			`,
					PCB_TIMEOUT_MS,
				),
			),
	},
	{
		name: 'eda_pcb_nets',
		description:
			'当前 PCB 的网络列表与走线长度。用于长度匹配核对、找未布线网络。' +
			'\n\n长度为 0 表示该网络在 PCB 上还没有走线（只有飞线）。' +
			'\n**单位**：官方文档未说明 getNetLength 的单位，实测数值在 mil 量级' +
			'（例：一条约 2339 的走线）。用于相对比较是可靠的，需要绝对值时请在 EDA 界面核对一条已知走线再换算。',
		inputSchema: {
			type: 'object',
			properties: {
				net_name: { type: 'string', description: '只查指定网络' },
				include_auto_named: { type: 'boolean', description: '是否包含 $1N… 自动命名网络，默认 true（PCB 侧这类很常见）' },
			},
		},
		handler: async (args, ctx) => {
			const one = optionalString(args, 'net_name');
			const includeAuto = optionalBool(args, 'include_auto_named', true);
			return pcbHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_PCB}
				const one = ${JSON.stringify(one ?? null)};
				const includeAuto = ${includeAuto};
				let names = await eda.pcb_Net.getAllNetsName();
				if (one) {
					names = names.filter(n => n.toLowerCase() === one.toLowerCase());
					if (!names.length) return { error: '找不到网络 ' + one, available: (await eda.pcb_Net.getAllNetsName()).slice(0, 40) };
				} else if (!includeAuto) {
					names = names.filter(n => !/^\\$\\d*N\\d+$/.test(n));
				}
				const out = [];
				for (const n of names) {
					const len = await eda.pcb_Net.getNetLength(n).catch(() => null);
					out.push({ name: n, length: len, routed: typeof len === 'number' && len > 0 });
				}
				out.sort((a, b) => (b.length ?? 0) - (a.length ?? 0));
				return {
					pcb: _pcb.name,
					total: out.length,
					unrouted: out.filter(x => !x.routed).length,
					nets: out,
					length_unit_note: '单位未在官方文档中说明，数值在 mil 量级；相对比较可靠，绝对值请自行核对',
				};
			`,
					PCB_TIMEOUT_MS,
				),
			);
		},
	},
	{
		name: 'eda_pcb_drc',
		description:
			'对当前 PCB 跑 DRC，返回**带明细的错误树**：分类、条数、每条的具体描述。' +
			'\n\n注意与 eda_schematic_drc 不同 —— 原理图 DRC 只能拿到分类计数，PCB DRC 能拿到具体问题描述。' +
			'\n\n常见分类：Connection Error（连接错误，通常是未布线）、Netlist Error（PCB 与原理图网表不一致，' +
			'需要在 EDA 里执行「导入变更」）、间距/线宽等规则错误。',
		inputSchema: {
			type: 'object',
			properties: {
				show_ui: { type: 'boolean', description: '是否同时在 EDA 底部打开 DRC 面板，默认 false' },
				max_items_per_category: { type: 'integer', description: '每个分类最多返回几条明细，默认 20' },
			},
		},
		handler: async (args, ctx) => {
			const showUi = optionalBool(args, 'show_ui');
			const maxItems = typeof args.max_items_per_category === 'number' ? args.max_items_per_category : 20;
			return pcbHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_PCB}
				const raw = await eda.pcb_Drc.check(true, ${showUi}, true);
				const MAX = ${maxItems};
				const title = t => Array.isArray(t) ? t.join(' ') : String(t ?? '');
				// 结构是 [{ name, title, count, list: [ { title, count, list: [ {explanation, objs, ...} ] } ] }]
				const flatten = (nodes) => {
					const out = [];
					for (const n of nodes || []) {
						const kids = n.list || [];
						const leaves = kids.filter(k => k.explanation || k.globalIndex);
						const branches = kids.filter(k => !(k.explanation || k.globalIndex));
						if (leaves.length) {
							out.push({
								category: title(n.title) || n.name,
								count: n.count ?? leaves.length,
								items: leaves.slice(0, MAX).map(l => ({
									message: l.explanation?.str ?? title(l.title),
									objects: Array.isArray(l.objs) ? l.objs.slice(0, 8) : undefined,
								})),
								truncated: leaves.length > MAX ? leaves.length - MAX : undefined,
							});
						}
						if (branches.length) out.push(...flatten(branches));
					}
					return out;
				};
				const cats = flatten(raw);
				const total = cats.reduce((s, c) => s + (c.count || 0), 0);
				return {
					pcb: _pcb.name,
					passed: total === 0,
					total_issues: total,
					categories: cats,
					ui_opened: ${showUi},
				};
			`,
					PCB_TIMEOUT_MS,
				),
			);
		},
	},
];
