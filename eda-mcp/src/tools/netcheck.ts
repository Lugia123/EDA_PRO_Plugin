/**
 * 原理图体检 —— 建在连通性模型上（design.md §4.9）。
 *
 * 取代原来那套几何邻近判定。差别不在精度，在**能查出什么**：
 *
 *   旧：引脚附近有没有导线端点 → 只能发现漏连的一部分
 *   新：图上实际形成的网络 vs 地图声明的网络 → 漏连、误连短路、孤儿一次判完
 *
 * 「引脚附近有没有线」只是漏连的特例；误连它根本查不出来 —— 而导线重合把
 * 反馈电阻短路那次，每个引脚附近都有线，几何判定一片祥和，电路已经废了。
 *
 * 判据出过一次假阳性就必须先修判据。上一版报了 36 处问题，逐条查下来多数是
 * 它自己错的（把图纸标题栏当器件、把端口连接判成悬空、图纸尺寸取错字段），
 * 这种体检比不体检更坏 —— 真问题会被淹在假警报里。
 */
import { MAP_MARK, type SchematicMap } from '../layout/map.js';
import {
	type PartBox,
	type Segment,
	type Terminal,
	buildConnectivity,
	diffConnectivity,
	findCrossings,
} from '../layout/connectivity.js';
import type { ToolDef } from './types.js';

const ENSURE_SCH = `
	const _page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
	if (!_page) return { error: 'NOT_SCH_EDITOR' };
`;

/**
 * 采集判定所需的原始数据。
 *
 * 几个要命的细节，错一个整套结论就废：
 *   · 导线坐标属性叫 `line`，不是 `points`
 *   · netflag / netport 的连接点是**它自己那根引脚**，不是符号中心
 *   · 没有引脚的 part 是图纸标题栏（Drawing-Symbol_*），不是电路器件
 *   · 图纸尺寸要取 Width / Height，Size 字段是展示用的、常年停在 A4
 */
const COLLECT = `
	${ENSURE_SCH}
	const flat = function (L) {
		const o = [];
		if (!L) return o;
		if (Array.isArray(L[0])) { for (const s of L) for (const v of s) o.push(v); }
		else { for (const v of L) o.push(v); }
		return o;
	};

	// line 是**段列表**，每 4 个数一段 (x1,y1,x2,y2) —— 不是点序列。
	// 按点序列（步长 2）解析会把上一段的终点和下一段的起点连成一条虚假的
	// 斜线，凭空造出跨网络的连接：实测 RESET 因此被并进 GND，报出根本
	// 不存在的短路。段内必然正交，可以拿这个自检解析对不对。
	const segs = [];
	for (const w of (await eda.sch_PrimitiveWire.getAll()) || []) {
		const p = flat(w.line);
		for (let i = 0; i + 3 < p.length; i += 4) {
			segs.push({ x1: p[i], y1: p[i + 1], x2: p[i + 2], y2: p[i + 3], net: String(w.net || '') });
		}
	}
	// 解析自检：原理图导线一律正交，出现斜段就说明步长错了
	let skew = 0;
	for (const s of segs) { if (s.x1 !== s.x2 && s.y1 !== s.y2) skew += 1; }

	const terms = [];
	const parts = [];
	const decorations = [];
	for (const c of (await eda.sch_PrimitiveComponent.getAll()) || []) {
		const pins = (await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(function () { return []; })) || [];
		const t = String(c.componentType || '');
		if (t === 'part') {
			const des = String(c.designator || '');
			// 图纸标题栏也是 part，但它没有引脚 —— 这是唯一稳的判据
			if (!pins.length) { decorations.push({ id: c.primitiveId, xy: [c.x, c.y] }); continue; }
			parts.push({ des: des, xy: [c.x, c.y], pins: pins.length });
			for (const p of pins) {
				const n = String(p.pinNumber != null ? p.pinNumber : p.number);
				terms.push({ id: des + '.' + n, x: p.x, y: p.y, kind: 'pin', nc: p.noConnected === true });
			}
		} else if (t === 'netflag' || t === 'netport') {
			// 连接点是符号的引脚，不是符号本体
			const a = pins[0];
			terms.push({
				id: String(c.primitiveId),
				x: a ? a.x : c.x,
				y: a ? a.y : c.y,
				kind: t === 'netflag' ? 'flag' : 'port',
				net: String(c.net || c.name || ''),
			});
		}
	}

	// 图纸尺寸：Width / Height 才是真的（Size 字段是展示用的，常年停在 A4）。
	// 取不到就**明说取不到**，绝不拿 A4 兜底 —— 实测 titleBlockData 有时整个
	// 读回来是空的，一兜底就把 A3 图纸上所有 x>1170 的器件全报成出框，
	// 一屏假警报。宁可不查这一项。
	const tb = _page.titleBlockData || {};
	const num = function (k) {
		const v = tb[k] && tb[k].value;
		const n = Number(v);
		return isFinite(n) && n > 0 ? n : null;
	};
	const sw = num('Width');
	const sh = num('Height');
	const sheet = sw && sh ? { w: sw, h: sh } : null;

	// 地图：拿它当声明的真相源
	let mapRaw = null;
	const MARKTXT = ${JSON.stringify(MAP_MARK)};
	const texts = [];
	for (const t of (await eda.sch_PrimitiveText.getAll()) || []) {
		const c = String(t.content || '');
		if (c.indexOf(MARKTXT) === 0) { mapRaw = c.slice(MARKTXT.length); continue; }
		texts.push({ x: t.x, y: t.y, s: c.slice(0, 40) });
	}

	return { skew: skew, segs: segs, terms: terms, parts: parts, decorations: decorations, sheet: sheet, mapRaw: mapRaw, texts: texts };
`;

interface Collected {
	error?: string;
	skew: number;
	segs: Segment[];
	terms: Terminal[];
	parts: Array<{ des: string; xy: [number, number]; pins: number; box: { minX: number; minY: number; maxX: number; maxY: number } | null }>;
	decorations: Array<{ id: string; xy: [number, number] }>;
	sheet: { w: number; h: number } | null;
	mapRaw: string | null;
	texts: Array<{ x: number; y: number; s: string }>;
}

export const netcheckTools: ToolDef[] = [
	{
		name: 'eda_check_schematic',
		description:
			'【只读】原理图体检 —— 建立连通性模型，拿图上**实际**形成的网络去否证地图里**声明**的网络。' +
			'\n\n**画完必跑**。DRC 查的是已有网络之间的冲突，查不出「引脚压根没进网络」：' +
			'实测一次布线后 148 个引脚只剩 60 个还连着，DRC 依旧报 errors 0。' +
			'\n\n判据不是「引脚附近有没有线」，而是连通分量：' +
			'节点是引脚／导线段／电源地符号／端口，边是几何重合加**同名符号端口的虚拟边**。' +
			'因此用端口跨区相连、用符号连电源地，都能正确判为连通 —— 这是旧判据做不到的。' +
			'\n\n查出三类错：' +
			'\n· **broken** 声明在同一网络、实际断成几段（每段列出具体引脚）' +
			'\n· **shorts** 分属不同网络的引脚连成了一片 —— 短路，DRC 通常不报，肉眼也看不出' +
			'\n· **orphans** 不属于任何网络又没打 NC 的引脚' +
			'\n\n没有地图时只能报 orphans 和几何问题，报不了 broken / shorts —— ' +
			'先跑 eda_map_import 生成地图，体检才有声明可比。',
		inputSchema: {
			type: 'object',
			properties: {
				allow_floating: {
					type: 'array',
					items: { type: 'string' },
					description: '允许悬空的引脚，如 ["U2.2","U2.3"]。已打 NC 标记的会自动放过，不用重复填。',
				},
				verbose: { type: 'boolean', description: '连同实际网络分组一起返回，便于人工核对' },
			},
		},
		handler: async (args, ctx) => {
			const allow = new Set(
				Array.isArray(args.allow_floating) ? (args.allow_floating as string[]).map((s) => s.toUpperCase()) : [],
			);
			const d = await ctx.exec<Collected>(COLLECT, 180_000);
			if (d.error) return { error: '当前编辑器里没有打开原理图页' };

			const conn = buildConnectivity(d.segs, d.terms);

			// 声明来自地图；没有地图就只能做弱判定
			let map: SchematicMap | null = null;
			if (d.mapRaw) {
				try {
					map = JSON.parse(d.mapRaw.replace(/[\r\n]+/g, '')) as SchematicMap;
				} catch {
					map = null;
				}
			}
			const declared = (map?.nets ?? []).map((n) => ({ id: n.id, pins: n.pins }));
			const diff = diffConnectivity(conn, declared, d.terms);
			const orphans = diff.orphans.filter((id) => !allow.has(id.toUpperCase()));

			// ── 几何问题：只看电路图元，图纸装饰与地图文字排除在外 ──
			const out: Array<{ what: string; xy: [number, number] }> = [];
			if (d.sheet) {
				for (const p of d.parts) {
					if (p.xy[0] < 0 || p.xy[1] < 0 || p.xy[0] > d.sheet.w || p.xy[1] > d.sheet.h) {
						out.push({ what: p.des, xy: p.xy });
					}
				}
			}

			// 导线压在器件身上：A* 会绕开器件，但符号／端口的引出线不过 A*，
			// 是从引脚直接画出去的直线，穿过谁没人管。
			const boxes: PartBox[] = d.parts
				.filter((p) => p.box)
				.map((p) => ({ id: p.des, ...(p.box as { minX: number; minY: number; maxX: number; maxY: number }) }));
			const crossings = findCrossings(d.segs, boxes);

			const problems =
				diff.broken.length + diff.shorts.length + orphans.length + out.length + crossings.length;
			return {
				page_sheet: d.sheet ?? '读不到（titleBlockData 为空），本次跳过出框检查',
				skew_segments: d.skew || undefined,
				counted: {
					parts: d.parts.length,
					pins: d.terms.filter((t) => t.kind === 'pin').length,
					wire_segments: d.segs.length,
					flags_and_ports: d.terms.filter((t) => t.kind !== 'pin').length,
					// 图纸标题栏这类装饰单独列，免得被当成器件对不上数
					decorations_ignored: d.decorations.length,
				},
				declared_nets: declared.length,
				actual_nets: conn.groups.length,
				broken: diff.broken,
				shorts: diff.shorts,
				orphans,
				outside_sheet: out,
				wires_crossing_parts: crossings.map((c) => ({
					part: c.part,
					net: c.seg.net || '(无名)',
					from: [c.seg.x1, c.seg.y1],
					to: [c.seg.x2, c.seg.y2],
				})),
				actual_groups: args.verbose === true ? conn.groups : undefined,
				verdict: problems === 0 ? '通过' : `发现 ${problems} 处问题`,
				note:
					declared.length === 0
						? '图纸里没有地图，本次只查了孤儿引脚和出框 —— 断线与短路查不了。跑 eda_map_import 生成地图后再体检。'
						: problems === 0
							? '实际连通性与地图声明完全一致。'
							: '先看 shorts（短路最致命且肉眼难发现），再看 broken，最后 orphans。',
			};
		},
	},
];
