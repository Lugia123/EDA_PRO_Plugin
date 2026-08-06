/**
 * 元器件库查询工具。
 *
 * 与 schematic 工具的分工：
 *  - eda_schematic_* 回答「这块板上用了什么」（数据来自网表）
 *  - eda_library_*   回答「库里有什么可以选」（数据来自器件库，含立创商城的百万级器件）
 *
 * 选型场景通常是：库里搜 → 看参数和 datasheet → 拿到 uuid/立创编号 → 后续放进原理图。
 */
import type { ToolDef } from './types.js';
import { optionalString, requireString } from './types.js';

const SEARCH_TIMEOUT_MS = 60_000;

/** 这些是内部标识或渲染参数，对选型没有意义 */
const NOISE_PROPS = new Set([
	'Symbol',
	'Footprint',
	'3D Model',
	'3D Model Title',
	'3D Model Transform',
	'Add into BOM',
	'Convert to PCB',
	'Supplier',
	'Manufacturer',
	'Manufacturer Part',
	'Supplier Part',
	'Datasheet',
	'Designator',
]);

export const libraryTools: ToolDef[] = [
	{
		name: 'eda_library_search',
		description:
			'在元器件库里按关键词搜索器件（覆盖立创商城的器件库）。用于选型：找某型号、某类器件有哪些可选。' +
			'\n\n返回型号名、厂商、立创商城编号（C 开头）、封装名、参数描述。' +
			'拿到立创编号后可用 eda_library_device 看完整参数与 datasheet。' +
			'\n\n注意这是**库**里的搜索，回答"有什么可以用"；要看"当前板子上用了什么"请用 eda_schematic_components。',
		inputSchema: {
			type: 'object',
			properties: {
				keyword: { type: 'string', description: '搜索词，如 AMS1117 / 0.1uF 0402 / STM32F103' },
				limit: { type: 'integer', description: '每页数量，默认 10，最大 50' },
				page: { type: 'integer', description: '页码，从 1 开始，默认 1' },
			},
			required: ['keyword'],
		},
		handler: async (args, ctx) => {
			const kw = requireString(args, 'keyword');
			const limit = Math.min(typeof args.limit === 'number' && args.limit > 0 ? args.limit : 10, 50);
			const page = typeof args.page === 'number' && args.page > 0 ? args.page : 1;
			const rows = await ctx.exec<Array<Record<string, unknown>>>(
				`return await eda.lib_Device.search(${JSON.stringify(kw)}, undefined, undefined, undefined, ${limit}, ${page});`,
				SEARCH_TIMEOUT_MS,
			);
			return {
				keyword: kw,
				page,
				returned: rows?.length ?? 0,
				hint: (rows?.length ?? 0) === limit ? '可能还有更多结果，翻下一页' : undefined,
				devices: (rows ?? []).map((d) => ({
					name: d.name,
					lcsc: d.supplierId || undefined,
					manufacturer: d.manufacturer || undefined,
					manufacturer_part: d.manufacturerId || undefined,
					footprint: d.footprintName || undefined,
					symbol: d.symbolName || undefined,
					description: d.description || undefined,
					device_uuid: d.uuid,
					library_uuid: d.libraryUuid,
				})),
			};
		},
	},
	{
		name: 'eda_library_device',
		description:
			'查器件在库里的完整信息：电气参数、封装、符号、**数据手册链接**、默认位号前缀。' +
			'\n\n用立创商城编号（如 C347222）查最方便；也可以用 device_uuid + library_uuid（从 eda_library_search 拿）。' +
			'\n\n要下载数据手册 PDF 到本地，把这里返回的 datasheet 链接交给 eda_download_datasheet。',
		inputSchema: {
			type: 'object',
			properties: {
				lcsc_id: { type: 'string', description: '立创商城编号，如 C347222' },
				device_uuid: { type: 'string', description: '器件 uuid（与 library_uuid 配合使用）' },
				library_uuid: { type: 'string', description: '所属库 uuid' },
			},
		},
		handler: async (args, ctx) => {
			const lcsc = optionalString(args, 'lcsc_id');
			const du = optionalString(args, 'device_uuid');
			const lu = optionalString(args, 'library_uuid');
			if (!lcsc && !du) throw new Error('请给出 lcsc_id，或 device_uuid + library_uuid');

			const raw = await ctx.exec<Record<string, unknown> | null>(
				`
				let uuid = ${JSON.stringify(du ?? null)};
				let libUuid = ${JSON.stringify(lu ?? null)};
				const lcsc = ${JSON.stringify(lcsc ?? null)};
				if (!uuid && lcsc) {
					const hit = await eda.lib_Device.getByLcscIds([lcsc]);
					if (!hit || !hit.length) return null;
					uuid = hit[0].uuid; libUuid = hit[0].libraryUuid;
				}
				const d = await eda.lib_Device.get(uuid, libUuid || undefined);
				if (!d) return null;
				return {
					uuid: d.uuid, libraryUuid: d.libraryUuid, name: d.name, description: d.description,
					property: d.property, association: d.association, subPartNames: d.subPartNames,
				};
			`,
				SEARCH_TIMEOUT_MS,
			);

			if (!raw) return { error: `未找到器件（${lcsc ?? du}）。若用立创编号，确认是 C 开头的商城编号。` };

			const prop = (raw.property ?? {}) as Record<string, unknown>;
			const other = (prop.otherProperty ?? {}) as Record<string, string>;
			const params: Record<string, string> = {};
			for (const [k, v] of Object.entries(other)) {
				if (!NOISE_PROPS.has(k) && v) params[k] = v;
			}
			const assoc = (raw.association ?? {}) as Record<string, unknown>;
			return {
				name: raw.name,
				description: raw.description || undefined,
				lcsc: prop.supplierId || undefined,
				manufacturer: prop.manufacturer || undefined,
				manufacturer_part: prop.manufacturerId || undefined,
				designator_prefix: prop.designator || undefined,
				datasheet: other.Datasheet || undefined,
				footprint: other['Supplier Footprint'] || undefined,
				parameters: params,
				device_uuid: raw.uuid,
				library_uuid: raw.libraryUuid,
				symbol_uuid: assoc.symbolUuid || undefined,
				footprint_uuid: assoc.footprintUuid || undefined,
				sub_parts: raw.subPartNames,
			};
		},
	},
];
