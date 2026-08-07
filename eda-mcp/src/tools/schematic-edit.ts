/**
 * 原理图写入工具。
 *
 * ⚠️ 真机验证状态：接口签名来自官方类型包 @jlceda/pro-api-types（确凿），
 * 工具层逻辑用 scripts/mock-eda.ts 验证过；但**在真实 EDA 上的端到端验证尚未完成** ——
 * 开发当晚扩展存在重连缺陷（已修，需重新导入 .eext 才生效），导致无法稳定连通做写入实测。
 * 导入新扩展后跑 `npm run test:mcp`，第 [12] 段会在沙箱工程里覆盖这些工具。
 *
 * 坐标系：单位 0.01 inch（官方 V3 格式规范），旋转角逆时针为正、角度制。
 * A4 图纸约 1170 × 830。
 *
 * 所有工具都作用于**当前打开的原理图页**。先用 eda_open_document 切到目标页。
 */
import type { ToolDef } from './types.js';
import { optionalString, requireString } from './types.js';

const EDIT_TIMEOUT_MS = 60_000;

/** 与 pcb 工具同构的前置检查：写原理图必须当前就在原理图编辑器里 */
const ENSURE_SCH = `
	const _page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
	if (!_page) return { error: 'NOT_SCH_EDITOR' };
`;

function schHint(r: Record<string, unknown>): Record<string, unknown> {
	if (r?.error !== 'NOT_SCH_EDITOR') return r;
	return {
		error: '当前编辑器里没有打开原理图页 —— 原理图接口绑定活动画布。',
		next_step: '先用 eda_project_overview 找到目标页 uuid，再用 eda_open_document 打开，然后重试。',
	};
}

function num(args: Record<string, unknown>, key: string): number {
	const v = args[key];
	if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${key} 必填（number，单位 0.01 inch）`);
	return v;
}

export const schematicEditTools: ToolDef[] = [
	{
		name: 'eda_place_component',
		description:
			'【写操作】在当前原理图页放置一个元器件。' +
			'\n\n用立创商城编号（lcsc_id）最方便，也可以直接给 device_uuid + library_uuid（从 eda_library_search 拿）。' +
			'\n\n**坐标单位是 0.01 inch**（A4 图纸约 1170 × 830），rotation 逆时针为正。' +
			'放置后位号由 EDA 按器件的默认前缀自动编号。' +
			'\n\n放完建议调 eda_schematic_components 确认，再跑 eda_schematic_drc 看有没有新增 error。',
		inputSchema: {
			type: 'object',
			properties: {
				lcsc_id: { type: 'string', description: '立创商城编号，如 C347222' },
				device_uuid: { type: 'string', description: '器件 uuid（与 library_uuid 配合）' },
				library_uuid: { type: 'string', description: '库 uuid' },
				x: { type: 'number', description: 'X 坐标，单位 0.01 inch' },
				y: { type: 'number', description: 'Y 坐标，单位 0.01 inch' },
				rotation: { type: 'number', description: '旋转角度（逆时针为正），默认 0' },
				mirror: { type: 'boolean', description: '是否镜像，默认 false' },
			},
			required: ['x', 'y'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const lcsc = optionalString(args, 'lcsc_id');
			const du = optionalString(args, 'device_uuid');
			const lu = optionalString(args, 'library_uuid');
			if (!lcsc && !(du && lu)) throw new Error('请给出 lcsc_id，或 device_uuid + library_uuid');
			const x = num(args, 'x');
			const y = num(args, 'y');
			const rotation = typeof args.rotation === 'number' ? args.rotation : 0;
			const mirror = args.mirror === true;

			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				let uuid = ${JSON.stringify(du ?? null)}, libUuid = ${JSON.stringify(lu ?? null)};
				const lcsc = ${JSON.stringify(lcsc ?? null)};
				if (!uuid && lcsc) {
					const hit = await eda.lib_Device.getByLcscIds([lcsc]);
					if (!hit || !hit.length) return { ok: false, error: '库里找不到立创编号 ' + lcsc };
					uuid = hit[0].uuid; libUuid = hit[0].libraryUuid;
				}
				const before = (await eda.sch_PrimitiveComponent.getAll()).length;
				const c = await eda.sch_PrimitiveComponent.create(
					{ libraryUuid: libUuid, uuid }, ${x}, ${y}, undefined, ${rotation}, ${mirror}
				);
				const after = await eda.sch_PrimitiveComponent.getAll();
				if (!c && after.length === before) return { ok: false, error: '放置失败，EDA 未返回图元且器件数没有增加' };
				return {
					ok: true,
					placed: c ? { primitive_id: c.primitiveId, designator: c.designator, x: c.x, y: c.y } : null,
					component_count: { before, after: after.length },
					page: _page.name,
				};
			`,
					EDIT_TIMEOUT_MS,
				),
			);
		},
	},
	{
		name: 'eda_draw_wire',
		description:
			'【写操作】在当前原理图页画导线。points 是坐标数组 [x1,y1,x2,y2,…]，单位 0.01 inch。' +
			'\n\n网络归属规则（官方）：不指定 net 时——没有端点落在图元上则为空网络；' +
			'有一个端点落在某网络的图元上则跟随该网络；端点落在多个不同网络上则**创建失败**。' +
			'指定 net 时——未显式命名网络的相接图元会跟随本网络；已显式命名的则创建失败。' +
			'\n\n所以给多点连线时，先确认两端引脚的网络状态，避免撞网络。',
		inputSchema: {
			type: 'object',
			properties: {
				points: {
					type: 'array',
					items: { type: 'number' },
					description: '折线坐标 [x1,y1,x2,y2,...]，至少两个点（4 个数），单位 0.01 inch',
				},
				net: { type: 'string', description: '网络名，可选；不给则按端点所触图元推断' },
			},
			required: ['points'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const pts = args.points;
			if (!Array.isArray(pts) || pts.length < 4 || pts.length % 2 !== 0 || pts.some((n) => typeof n !== 'number')) {
				throw new Error('points 必须是偶数个数字且至少 4 个（两个点），单位 0.01 inch');
			}
			const net = optionalString(args, 'net');
			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				const w = await eda.sch_PrimitiveWire.create(${JSON.stringify(pts)}, ${JSON.stringify(net ?? undefined)});
				if (!w) return { ok: false, error: '导线创建失败。常见原因：端点落在多个不同网络的图元上，或与已显式命名网络的图元冲突。' };
				return { ok: true, wire: { primitive_id: w.primitiveId, net: w.net ?? ${JSON.stringify(net ?? null)} }, page: _page.name };
			`,
					EDIT_TIMEOUT_MS,
				),
			);
		},
	},
	{
		name: 'eda_add_net_identifier',
		description:
			'【写操作】在当前原理图页放置网络标识：网络标签（NetLabel）、电源/地符号（NetFlag）或网络端口（NetPort）。' +
			'\n\n- kind=label：普通网络标签，贴在导线上给网络命名' +
			'\n- kind=power / ground / analog_ground / protect_ground：电源与各类地符号' +
			'\n- kind=port_in / port_out / port_bi：层次图网络端口' +
			'\n\n坐标单位 0.01 inch。',
		inputSchema: {
			type: 'object',
			properties: {
				kind: {
					type: 'string',
					enum: ['label', 'power', 'ground', 'analog_ground', 'protect_ground', 'port_in', 'port_out', 'port_bi'],
					description: '标识类型',
				},
				net: { type: 'string', description: '网络名，如 GND / VCC_3V3' },
				x: { type: 'number', description: 'X 坐标，单位 0.01 inch' },
				y: { type: 'number', description: 'Y 坐标，单位 0.01 inch' },
				rotation: { type: 'number', description: '旋转角度，默认 0（label 不适用）' },
			},
			required: ['kind', 'net', 'x', 'y'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const kind = requireString(args, 'kind');
			const net = requireString(args, 'net');
			const x = num(args, 'x');
			const y = num(args, 'y');
			const rotation = typeof args.rotation === 'number' ? args.rotation : 0;

			const FLAG: Record<string, string> = {
				power: 'Power',
				ground: 'Ground',
				analog_ground: 'AnalogGround',
				protect_ground: 'ProtectGround',
			};
			const PORT: Record<string, string> = { port_in: 'IN', port_out: 'OUT', port_bi: 'BI' };

			let call: string;
			if (kind === 'label') {
				call = `await eda.sch_PrimitiveAttribute.createNetLabel(${x}, ${y}, ${JSON.stringify(net)})`;
			} else if (FLAG[kind]) {
				call = `await eda.sch_PrimitiveComponent.createNetFlag(${JSON.stringify(FLAG[kind])}, ${JSON.stringify(net)}, ${x}, ${y}, ${rotation})`;
			} else if (PORT[kind]) {
				call = `await eda.sch_PrimitiveComponent.createNetPort(${JSON.stringify(PORT[kind])}, ${JSON.stringify(net)}, ${x}, ${y}, ${rotation})`;
			} else {
				throw new Error(`未知 kind: ${kind}`);
			}

			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				const p = ${call};
				if (!p) return { ok: false, error: '创建失败，请确认坐标在图纸范围内、网络名合法' };
				return { ok: true, kind: ${JSON.stringify(kind)}, net: ${JSON.stringify(net)}, primitive_id: p.primitiveId, page: _page.name };
			`,
					EDIT_TIMEOUT_MS,
				),
			);
		},
	},
	{
		name: 'eda_add_schematic_text',
		description: '【写操作】在当前原理图页放置一段文字（注释、标题等）。坐标单位 0.01 inch。',
		inputSchema: {
			type: 'object',
			properties: {
				content: { type: 'string', description: '文字内容' },
				x: { type: 'number', description: 'X 坐标，单位 0.01 inch' },
				y: { type: 'number', description: 'Y 坐标，单位 0.01 inch' },
				rotation: { type: 'number', description: '旋转角度，默认 0' },
				font_size: { type: 'number', description: '字号，可选' },
			},
			required: ['content', 'x', 'y'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const content = requireString(args, 'content');
			const x = num(args, 'x');
			const y = num(args, 'y');
			const rotation = typeof args.rotation === 'number' ? args.rotation : 0;
			const size = typeof args.font_size === 'number' ? args.font_size : null;
			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				const t = await eda.sch_PrimitiveText.create(${x}, ${y}, ${JSON.stringify(content)}, ${rotation}, null, null, ${size});
				if (!t) return { ok: false, error: '文字创建失败' };
				return { ok: true, primitive_id: t.primitiveId, page: _page.name };
			`,
					EDIT_TIMEOUT_MS,
				),
			);
		},
	},
	{
		name: 'eda_delete_primitives',
		description:
			'【写操作·不可撤销】删除当前原理图页上的图元，按图元 id。' +
			'\n\nid 从 eda_schematic_primitives 或各创建工具的返回值里拿。' +
			'\n\n**动手前必须跟用户确认要删什么**——本工具不做二次确认，EDA 侧也不一定能撤销。' +
			'不要凭猜测删除，不确定就先列出来给用户看。',
		inputSchema: {
			type: 'object',
			properties: {
				primitive_ids: { type: 'array', items: { type: 'string' }, description: '要删除的图元 id 数组' },
				kind: {
					type: 'string',
					enum: ['component', 'wire', 'text', 'attribute'],
					description: '图元类型，决定用哪个接口删除',
				},
			},
			required: ['primitive_ids', 'kind'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const ids = args.primitive_ids;
			if (!Array.isArray(ids) || !ids.length || ids.some((i) => typeof i !== 'string')) {
				throw new Error('primitive_ids 必须是非空字符串数组');
			}
			const kind = requireString(args, 'kind');
			const API: Record<string, string> = {
				component: 'sch_PrimitiveComponent',
				wire: 'sch_PrimitiveWire',
				text: 'sch_PrimitiveText',
				attribute: 'sch_PrimitiveAttribute',
			};
			const api = API[kind];
			if (!api) throw new Error(`未知 kind: ${kind}`);
			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				const ok = await eda.${api}.delete(${JSON.stringify(ids)});
				return { ok: ok === true, deleted_count: ${ids.length}, kind: ${JSON.stringify(kind)}, page: _page.name,
					note: ok ? undefined : '接口返回 false，可能 id 不存在或类型不匹配' };
			`,
					EDIT_TIMEOUT_MS,
				),
			);
		},
	},
	{
		name: 'eda_schematic_primitives',
		description:
			'列出当前原理图页上的器件图元（含图元 id、位号、坐标）。' +
			'\n\n与 eda_schematic_components 的区别：那个读网表（含型号/封装/参数，口径是"会上 PCB 的器件"）；' +
			'这个读画布图元（含 primitive_id 和坐标，包含网络标志等非 BOM 图元），用于**定位和编辑**。' +
			'要改动或删除图元时用这个拿 id。',
		inputSchema: {
			type: 'object',
			properties: {
				all_pages: { type: 'boolean', description: '是否跨所有原理图页，默认 false（只当前页）' },
			},
		},
		handler: async (args, ctx) => {
			const allPages = args.all_pages === true;
			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				const list = await eda.sch_PrimitiveComponent.getAll(undefined, ${allPages});
				return {
					page: _page.name,
					all_pages: ${allPages},
					count: list.length,
					primitives: list.map(c => ({
						primitive_id: c.primitiveId,
						designator: c.designator,
						x: c.x, y: c.y,
						rotation: c.rotation,
						locked: c.locked,
					})),
				};
			`,
					EDIT_TIMEOUT_MS,
				),
			);
		},
	},
];
