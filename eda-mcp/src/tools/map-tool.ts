/**
 * 地图工具：存取、导入、校验。
 *
 * 地图是 AI 与算法之间的契约（见 design.md §4.8），它必须跟原理图存在一起 ——
 * 换台机器、别人打开工程，地图都还在，才谈得上「下次接着优化」。
 * 载体选了 sch_PrimitiveText：实测单个文字图元存 60000 字符仍然无损。
 */
import { EMPTY_MAP, type SchematicMap, guessNetKind, defaultStyle, validateMap } from '../layout/map.js';
import type { ToolDef } from './types.js';

const ENSURE_SCH = `
	const _page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
	if (!_page) return { error: 'NOT_SCH_EDITOR' };
`;

/** 地图文字图元的标记前缀，靠它在图上认出哪一条是地图 */
const MARK = 'EDAMCP_MAP_V1:';
/** 地图存放的位置：图纸左下角外侧，字号最小，不干扰读图 */
const MAP_X = -400;
const MAP_Y = -400;

export const mapTools: ToolDef[] = [
	{
		name: 'eda_map_save',
		description:
			'【写操作】把原理图地图存进当前页。' +
			'\n\n地图是这张图的真相源：器件几何、引脚、连接、分区、网络性质全在里面。' +
			'存进图纸而不是本地文件，换台机器、别人打开工程都还在，才谈得上下次接着优化。' +
			'\n\n写入前会做引用校验（位号是否重复、网络引用的引脚是否存在、分区是否有定义），' +
			'有问题直接报错不写 —— 存进去一份自相矛盾的地图，后面每一步都会跟着错。',
		inputSchema: {
			type: 'object',
			properties: {
				map: { type: 'object', description: '完整的地图对象，结构见 src/layout/map.ts 的 SchematicMap' },
			},
			required: ['map'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const map = args.map as SchematicMap;
			if (!map || typeof map !== 'object') throw new Error('map 必须是对象');
			const errs = validateMap(map);
			if (errs.length) return { ok: false, errors: errs, note: '地图自身有矛盾，没有写入。逐条修掉再存。' };

			map.version = 1;
			map.meta = { ...(map.meta ?? { sheet: { w: 1170, h: 825 }, grid: 10 }), updatedAt: new Date().toISOString() };
			const payload = MARK + JSON.stringify(map);

			const r = await ctx.exec<Record<string, unknown>>(
				`
				${ENSURE_SCH}
				const PAYLOAD = ${JSON.stringify(payload)};
				const MARK = ${JSON.stringify(MARK)};
				// 先清掉旧地图，避免读的时候撞见两份
				const olds = await eda.sch_PrimitiveText.getAll();
				let removed = 0;
				for (const t of olds) {
					if (String(t.content || '').indexOf(MARK) === 0) {
						await eda.sch_PrimitiveText.delete(t.primitiveId).catch(() => {});
						removed += 1;
					}
				}
				// 签名是 create(x, y, text)，坐标在前
				const t = await eda.sch_PrimitiveText.create(${MAP_X}, ${MAP_Y}, PAYLOAD);
				if (!t) return { ok: false, error: '地图写入失败' };
				await new Promise((r) => setTimeout(r, 400));
				const back = await eda.sch_PrimitiveText.getAll();
				const got = back.filter((x) => x.primitiveId === t.primitiveId)[0];
				const len = got ? String(got.content || '').length : 0;
				return { ok: len === PAYLOAD.length, removed_old: removed, bytes: PAYLOAD.length, read_back: len };
			`,
				120_000,
			);
			return {
				...r,
				parts: map.parts.length,
				nets: map.nets.length,
				groups: map.groups.length,
				note: r.ok ? '地图已随图纸保存。' : '写回后长度对不上，地图可能被截断了。',
			};
		},
	},
	{
		name: 'eda_map_load',
		description:
			'【只读】读回存在当前页里的原理图地图。没有地图时返回 exists:false，' +
			'不当作错误 —— 首次使用或从别处导入的图本来就没有。',
		inputSchema: { type: 'object', properties: {} },
		handler: async (_args, ctx) => {
			const r = await ctx.exec<{ error?: string; raw?: string | null }>(
				`
				${ENSURE_SCH}
				const MARK = ${JSON.stringify(MARK)};
				const all = await eda.sch_PrimitiveText.getAll();
				for (const t of all) {
					const c = String(t.content || '');
					if (c.indexOf(MARK) === 0) return { raw: c.slice(MARK.length) };
				}
				return { raw: null };
			`,
				60_000,
			);
			if (r.error) return { error: '当前编辑器里没有打开原理图页' };
			if (!r.raw) return { exists: false, map: EMPTY_MAP, note: '这张图还没有地图。用 eda_map_import 从现有图生成一份。' };
			try {
				const map = JSON.parse(r.raw) as SchematicMap;
				return {
					exists: true,
					map,
					parts: map.parts?.length ?? 0,
					nets: map.nets?.length ?? 0,
					groups: map.groups?.length ?? 0,
				};
			} catch (e) {
				return { exists: true, error: `地图解析失败：${e instanceof Error ? e.message : String(e)}`, raw_length: r.raw.length };
			}
		},
	},
	{
		name: 'eda_map_import',
		description:
			'【只读】从当前已画好的原理图反向生成一份地图，不必重画。' +
			'\n\n器件几何、引脚、位置从 EDA 读（那是客观事实）；导线与网络归属从文档源码解析 —— ' +
			'`sch_Net.getAllNets()` 在扩展上下文里返回空，只能走 getDocumentSource。' +
			'\n\n**网络性质（信号／电源／地）只按名字给了个猜测**，AI 必须逐条过目：' +
			'AVDD_1V8 / VBAT_SW 既像电源又像信号，PWR_EN 听着像电源其实是普通 IO。' +
			'改好之后用 eda_map_save 存回去。',
		inputSchema: { type: 'object', properties: {} },
		handler: async (_args, ctx) => {
			const r = await ctx.exec<Record<string, unknown>>(
				`
				${ENSURE_SCH}
				await new Promise((r) => setTimeout(r, 800));
				const src = await eda.sys_FileManager.getDocumentSource();
				const lines = String(src).split(String.fromCharCode(10));

				// 导线的网络名挂在 ATTR(key=NET) 上，parentId 指向 WIRE
				const wireNet = {};
				for (const ln of lines) {
					if (ln.indexOf('"type":"ATTR"') < 0) continue;
					const q = ln.indexOf('||');
					if (q < 0) continue;
					let b = ln.slice(q + 2);
					const l = b.lastIndexOf('|');
					if (l >= 0) b = b.slice(0, l);
					let o = null;
					try { o = JSON.parse(b); } catch (e) { continue; }
					if (String(o.key) === 'NET') wireNet[String(o.parentId)] = String(o.value);
				}
				// LINE 通过 lineGroup 归属到 WIRE，于是每段线都知道自己属于哪条网络
				const segs = [];
				for (const ln of lines) {
					if (ln.indexOf('"type":"LINE"') < 0) continue;
					const q = ln.indexOf('||');
					if (q < 0) continue;
					let b = ln.slice(q + 2);
					const l = b.lastIndexOf('|');
					if (l >= 0) b = b.slice(0, l);
					let o = null;
					try { o = JSON.parse(b); } catch (e) { continue; }
					if (o.startX == null) continue;
					const net = wireNet[String(o.lineGroup)];
					if (net) segs.push({ net: net, x1: o.startX, y1: -o.startY, x2: o.endX, y2: -o.endY });
				}

				const all = await eda.sch_PrimitiveComponent.getAll();
				const parts = [];
				const pinRefs = [];
				for (const c of all) {
					if (c.componentType !== 'part') continue;
					const bb = await eda.sch_Primitive.getPrimitivesBBox([c.primitiveId]).catch(() => null);
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(() => []);
					const des = String(c.designator || '');
					parts.push({
						id: des,
						primitiveId: c.primitiveId,
						name: String(c.name || ''),
						x: c.x, y: c.y,
						rot: ((Number(c.rotation) || 0) % 360 + 360) % 360,
						mirror: c.mirror === true,
						w: bb ? Math.max(10, bb.maxX - bb.minX) : 40,
						h: bb ? Math.max(10, bb.maxY - bb.minY) : 40,
						pins: (pins || []).map((p) => ({
							n: String(p.pinNumber != null ? p.pinNumber : p.number),
							name: String(p.pinName || ''),
							x: p.x, y: p.y,
							dir: ((Number(p.rotation) || 0) % 360 + 360) % 360,
						})),
					});
					for (const p of (pins || [])) {
						pinRefs.push({ ref: des + '.' + String(p.pinNumber != null ? p.pinNumber : p.number), x: p.x, y: p.y });
					}
				}

				// 引脚落在哪条线段上，就属于哪条网络（点到线段距离，T 型分支也算）
				const d2 = (px, py, s) => {
					const dx = s.x2 - s.x1, dy = s.y2 - s.y1;
					const len2 = dx * dx + dy * dy;
					let t = len2 === 0 ? 0 : ((px - s.x1) * dx + (py - s.y1) * dy) / len2;
					t = t < 0 ? 0 : t > 1 ? 1 : t;
					const qx = s.x1 + t * dx, qy = s.y1 + t * dy;
					return Math.sqrt((px - qx) * (px - qx) + (py - qy) * (py - qy));
				};
				const nets = {};
				for (const pr of pinRefs) {
					for (const s of segs) {
						if (d2(pr.x, pr.y, s) < 2) {
							if (!nets[s.net]) nets[s.net] = [];
							if (nets[s.net].indexOf(pr.ref) < 0) nets[s.net].push(pr.ref);
							break;
						}
					}
				}
				// 电源地符号也算网络成员：它们本身是器件，引脚落在线上
				for (const c of all) {
					if (c.componentType !== 'netflag' && c.componentType !== 'netport') continue;
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(() => []);
					const nm = String(c.name || '');
					if (!nm) continue;
					if (!nets[nm]) nets[nm] = [];
				}

				const tb = _page.titleBlockData || {};
				return {
					sheet: {
						w: tb.Width && tb.Width.value ? Number(tb.Width.value) : 1170,
						h: tb.Height && tb.Height.value ? Number(tb.Height.value) : 825,
					},
					parts: parts,
					nets: nets,
					wire_segments: segs.length,
				};
			`,
				180_000,
			);
			if (r.error) return { error: '当前编辑器里没有打开原理图页' };

			const rawParts = (r.parts ?? []) as Array<Record<string, unknown>>;
			const rawNets = (r.nets ?? {}) as Record<string, string[]>;
			const sheet = (r.sheet ?? { w: 1170, h: 825 }) as { w: number; h: number };

			const map: SchematicMap = {
				version: 1,
				meta: { sheet, grid: 10, updatedAt: new Date().toISOString() },
				groups: [],
				parts: rawParts.map((p) => {
					const rot = p.rot as 0 | 90 | 180 | 270;
					const mirror = p.mirror as boolean;
					const cx = p.x as number;
					const cy = p.y as number;
					return {
						id: p.id as string,
						primitiveId: p.primitiveId as string,
						w: p.w as number,
						h: p.h as number,
						place: { x: cx, y: cy, rot, mirror },
						// 引脚存本地定义：世界坐标减去摆放，再逆转回去
						pins: (p.pins as Array<Record<string, unknown>>).map((q) => {
							const rx = (q.x as number) - cx;
							const ry = (q.y as number) - cy;
							const rad = (-rot * Math.PI) / 180;
							const cos = Math.round(Math.cos(rad));
							const sin = Math.round(Math.sin(rad));
							let dx = rx * cos - ry * sin;
							const dy = rx * sin + ry * cos;
							let dir = (((q.dir as number) - rot + 360) % 360) as 0 | 90 | 180 | 270;
							if (mirror) {
								dx = -dx;
								dir = ((180 - dir + 360) % 360) as 0 | 90 | 180 | 270;
							}
							return { id: q.n as string, name: q.name as string, dx, dy, dir };
						}),
						labels: [
							{ key: 'Designator', text: p.id as string, dx: -10, dy: (p.h as number) / 2 + 12 },
							{ key: 'Name', text: String(p.name ?? '').slice(0, 20), dx: -10, dy: -((p.h as number) / 2 + 12) },
						].filter((l) => l.text),
					};
				}),
				nets: Object.entries(rawNets).map(([id, pins]) => {
					const kind = guessNetKind(id);
					return { id, kind, style: defaultStyle(kind), pins };
				}),
			};

			const guessed = map.nets.filter((n) => n.kind !== 'signal').map((n) => `${n.id}=${n.kind}`);
			const lonely = map.nets.filter((n) => n.pins.length < 2).map((n) => n.id);
			return {
				map,
				parts: map.parts.length,
				nets: map.nets.length,
				wire_segments: r.wire_segments,
				guessed_kinds: guessed,
				single_pin_nets: lonely,
				note:
					'**这只是初稿**。网络性质是按名字猜的，请逐条核对 guessed_kinds —— ' +
					'名字判断不了 AVDD_1V8 是电源还是信号、PWR_EN 是不是普通 IO。' +
					'分区也是空的，需要你按功能划。改好后用 eda_map_save 存回图纸。',
			};
		},
	},
	{
		name: 'eda_map_verify',
		description:
			'【只读】拿地图里的器件几何跟 EDA 里的真实符号比对。' +
			'\n\n**AI 手写地图后必跑**。引脚数量、引脚号、引脚坐标、符号尺寸都是库里的客观事实，' +
			'凭记忆填必然出错；而错的引脚号会一路带到渲染，表现为「线连到了不存在的脚上」，' +
			'到那时很难追是哪一步编错的。' +
			'\n\n权责分明：几何以 EDA 为准（客观事实），连接与分区以地图为准（设计意图）。' +
			'所以这里只报几何差异，不碰网络。',
		inputSchema: {
			type: 'object',
			properties: {
				map: { type: 'object', description: '要校验的地图；不传则读图纸里存的那份' },
			},
		},
		handler: async (args, ctx) => {
			let map = args.map as SchematicMap | undefined;
			if (!map) {
				const loaded = await ctx.exec<{ error?: string; raw?: string | null }>(
					`
					${ENSURE_SCH}
					const MARK = ${JSON.stringify(MARK)};
					const all = await eda.sch_PrimitiveText.getAll();
					for (const t of all) {
						const c = String(t.content || '');
						if (c.indexOf(MARK) === 0) return { raw: c.slice(MARK.length) };
					}
					return { raw: null };
				`,
					60_000,
				);
				if (!loaded.raw) return { error: '没传 map，图纸里也没有存地图' };
				map = JSON.parse(loaded.raw) as SchematicMap;
			}

			const real = await ctx.exec<Record<string, unknown>>(
				`
				${ENSURE_SCH}
				const all = await eda.sch_PrimitiveComponent.getAll();
				const out = {};
				for (const c of all) {
					if (c.componentType !== 'part') continue;
					const bb = await eda.sch_Primitive.getPrimitivesBBox([c.primitiveId]).catch(() => null);
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(() => []);
					out[String(c.designator || '')] = {
						w: bb ? Math.round(bb.maxX - bb.minX) : null,
						h: bb ? Math.round(bb.maxY - bb.minY) : null,
						pins: (pins || []).map((p) => String(p.pinNumber != null ? p.pinNumber : p.number)).sort(),
					};
				}
				return { parts: out };
			`,
				120_000,
			);
			if (real.error) return { error: '当前编辑器里没有打开原理图页' };
			const actual = (real.parts ?? {}) as Record<string, { w: number | null; h: number | null; pins: string[] }>;

			const issues: Array<{ part: string; problem: string; map: string; eda: string }> = [];
			for (const p of map.parts) {
				const a = actual[p.id];
				if (!a) {
					issues.push({ part: p.id, problem: '图上没有这个器件', map: `${p.pins.length} 个引脚`, eda: '不存在' });
					continue;
				}
				const mapPins = p.pins.map((q) => q.id).sort();
				if (mapPins.join(',') !== a.pins.join(',')) {
					issues.push({ part: p.id, problem: '引脚号对不上', map: mapPins.join(','), eda: a.pins.join(',') });
				}
				if (a.w != null && Math.abs(a.w - p.w) > 2) {
					issues.push({ part: p.id, problem: '符号宽度对不上', map: String(p.w), eda: String(a.w) });
				}
				if (a.h != null && Math.abs(a.h - p.h) > 2) {
					issues.push({ part: p.id, problem: '符号高度对不上', map: String(p.h), eda: String(a.h) });
				}
			}
			const extra = Object.keys(actual).filter((d) => d && !map.parts.some((p) => p.id === d));

			return {
				checked: map.parts.length,
				issues,
				not_in_map: extra,
				verdict: issues.length === 0 && extra.length === 0 ? '一致' : `${issues.length + extra.length} 处对不上`,
				note:
					issues.length || extra.length
						? '几何以 EDA 为准 —— 按 eda 那一列改地图，别反过来。not_in_map 是图上有、地图里漏掉的器件。'
						: '地图与图纸一致，可以往下走。',
			};
		},
	},
];
