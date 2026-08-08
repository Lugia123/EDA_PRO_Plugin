/**
 * 把自建布局内核接到 EDA 上。
 *
 * EDA 自带的 autoLayout / autoRouting 只按连接关系排，不理解可读性：
 * 不旋转器件（所以永远横排）、不管文字重叠、布线还会把导线从引脚上扯掉。
 * 这个工具改用 src/layout 里的退火 + A*，在 Node 侧算好再一次性写回。
 *
 * 算的时候完全不碰 EDA，所以可以离线跑、可以单测、迭代八轮也只要两秒。
 */
import { optimize } from '../layout/optimize.js';
import { type Layout, type Net, type Part, type Placement, type Rotation, pinLocal } from '../layout/model.js';
import type { ToolDef } from './types.js';

const ENSURE_SCH = `
	const _page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
	if (!_page) return { error: 'NOT_SCH_EDITOR' };
`;

interface RawPart {
	des: string;
	id: string;
	x: number;
	y: number;
	rot: number;
	mirror: boolean;
	w: number;
	h: number;
	pins: Array<{ n: string; x: number; y: number; dir: number }>;
	labels: Array<{ text: string; dx: number; dy: number }>;
}

export const layoutTools: ToolDef[] = [
	{
		name: 'eda_optimize_layout',
		description:
			'【写操作】重新摆放器件并重新走线，目标是**人能看懂**：器件不重叠、文字不重叠、' +
			'连线短、交叉少、拐弯少、该竖放的竖放。' +
			'\n\n这是自建的布局器，不是 EDA 自带的 —— EDA 的 autoLayout 只按连接关系排，' +
			'从不旋转器件（所以图上永远只有横排），也不管文字重叠；它的 autoRouting 还会' +
			'把导线从引脚上扯掉。' +
			'\n\n做法：模拟退火决定每个器件的位置与朝向（平移／转角／翻面／交换），' +
			'A\\* 在网格上走正交线（拐弯罚分、压别的网络重罚、同网络的线可共用成 T 型分支），' +
			'两者交替迭代若干轮，用**真实布线结果**打分留最好的一轮。' +
			'\n\n**你只需要给出网络表**（哪个脚连哪个脚）和大致的摆放，位置和角度交给它。' +
			'把接口连接器之类必须钉在固定位置的器件填进 keep_fixed。' +
			'\n\n注意它会清掉当前页的导线重画。电源与地不要放进 nets —— 那些该用符号，' +
			'放进来会把所有器件拉到一起。',
		inputSchema: {
			type: 'object',
			properties: {
				nets: {
					type: 'object',
					description: '{ 网络名: ["位号.引脚号", …] }，与 eda_arrange_block 同格式。只放信号网。',
					additionalProperties: { type: 'array', items: { type: 'string' } },
				},
				keep_fixed: {
					type: 'array',
					items: { type: 'string' },
					description: '位置锁死、不参与优化的位号，如 ["RJ1","RF1"]',
				},
				bounds: {
					type: 'object',
					description: '允许摆放的矩形范围（0.01 inch），不给则用图纸尺寸留边',
					properties: {
						minX: { type: 'number' },
						minY: { type: 'number' },
						maxX: { type: 'number' },
						maxY: { type: 'number' },
					},
				},
				rounds: { type: 'number', description: '迭代轮数，默认 8。越多越好但越慢' },
				iterations: { type: 'number', description: '每轮退火迭代次数，默认 30000' },
				dry_run: { type: 'boolean', description: '只算不写，用来先看看能优化到什么程度' },
			},
			required: ['nets'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const netsIn = (args.nets && typeof args.nets === 'object' ? args.nets : {}) as Record<string, string[]>;
			const fixed = new Set((Array.isArray(args.keep_fixed) ? (args.keep_fixed as string[]) : []).map((s) => String(s).toUpperCase()));
			const dryRun = args.dry_run === true;
			const rounds = typeof args.rounds === 'number' ? args.rounds : 8;
			const iterations = typeof args.iterations === 'number' ? args.iterations : 30000;

			// ── 读回当前页 ──
			const snap = await ctx.exec<{ error?: string; parts?: RawPart[]; sheet?: { w: number; h: number } }>(
				`
				${ENSURE_SCH}
				const all = await eda.sch_PrimitiveComponent.getAll();
				const parts = [];
				for (const c of all) {
					if (c.componentType !== 'part') continue;
					const b = await eda.sch_Primitive.getPrimitivesBBox([c.primitiveId]).catch(() => null);
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(() => []);
					parts.push({
						des: String(c.designator || ''),
						id: c.primitiveId,
						x: c.x, y: c.y,
						rot: Number(c.rotation) || 0,
						mirror: c.mirror === true,
						w: b ? Math.max(10, b.maxX - b.minX) : 40,
						h: b ? Math.max(10, b.maxY - b.minY) : 40,
						pins: (pins || []).map((p) => ({
							n: String(p.pinNumber != null ? p.pinNumber : p.number),
							x: p.x, y: p.y, dir: Number(p.rotation) || 0,
						})),
						// 位号与型号：位置按 EDA 默认（位号在上、型号在下）估
						labels: [
							{ text: String(c.designator || ''), dx: -10, dy: (b ? (b.maxY - b.minY) / 2 : 20) + 8 },
							{ text: String(c.name || '').slice(0, 16), dx: -10, dy: -((b ? (b.maxY - b.minY) / 2 : 20) + 8) },
						].filter((l) => l.text),
					});
				}
				const tb = _page.titleBlockData || {};
				return {
					parts,
					sheet: {
						w: tb.Width && tb.Width.value ? Number(tb.Width.value) : 1170,
						h: tb.Height && tb.Height.value ? Number(tb.Height.value) : 825,
					},
				};
			`,
				120_000,
			);
			if (snap.error) return { error: '当前编辑器里没有打开原理图页' };
			const raw = snap.parts ?? [];
			if (!raw.length) return { error: '当前页没有器件' };

			// ── 转成几何模型：引脚要从世界坐标反推回本地定义 ──
			const parts = new Map<string, Part>();
			const initial: Layout = new Map();
			const idOf = new Map<string, string>();
			for (const p of raw) {
				const pl: Placement = { x: p.x, y: p.y, rot: ((p.rot % 360) + 360) % 360 as Rotation, mirror: p.mirror };
				parts.set(p.des, {
					id: p.des,
					w: p.w,
					h: p.h,
					fixed: fixed.has(p.des.toUpperCase()),
					labels: p.labels,
					pins: p.pins.map((q) =>
						pinLocal(pl, { x: q.x, y: q.y, dir: (((q.dir % 360) + 360) % 360) as Rotation }, q.n),
					),
				});
				initial.set(p.des, pl);
				idOf.set(p.des, p.id);
			}

			const nets: Net[] = Object.entries(netsIn)
				.map(([id, refs]) => ({ id, pins: (Array.isArray(refs) ? refs : []).map(String) }))
				.filter((n) => n.pins.length >= 2);
			if (!nets.length) return { error: 'nets 里没有包含两个及以上引脚的网络' };

			const sheet = snap.sheet ?? { w: 1170, h: 825 };
			const margin = 120;
			const bounds = (args.bounds as { minX: number; minY: number; maxX: number; maxY: number } | undefined) ?? {
				minX: margin,
				minY: margin,
				maxX: sheet.w - margin,
				maxY: sheet.h - margin,
			};

			const t0 = Date.now();
			const r = optimize(parts, nets, initial, { rounds, iterations, bounds });
			const elapsed = Date.now() - t0;

			const moves = [...r.layout]
				.filter(([des]) => !fixed.has(des.toUpperCase()))
				.map(([des, pl]) => ({ id: idOf.get(des), des, x: pl.x, y: pl.y, rotation: pl.rot, mirror: pl.mirror }))
				.filter((m) => m.id);
			const wires = r.routed.nets.flatMap((n) =>
				n.paths.map((p) => ({ net: n.netId, points: p.flat() })),
			);

			const summary = {
				parts: parts.size,
				nets: nets.length,
				rounds: r.rounds,
				elapsed_ms: elapsed,
				wire_length: r.routed.totalLength,
				bends: r.routed.totalBends,
				unrouted: r.routed.failedCount,
				part_overlap: Math.round(r.cost.partOverlap),
				text_overlap: Math.round(r.cost.textOverlap),
				crossings: r.cost.crossing,
				rotated: [...r.layout.values()].filter((p) => p.rot === 90 || p.rot === 270).length,
				history: r.history,
			};
			if (dryRun) {
				return { ...summary, dry_run: true, note: '只算了没写。去掉 dry_run 才会真正落到图上。' };
			}

			// ── 写回：先清掉旧导线，再摆器件，最后按 A* 路径画线 ──
			const applied = await ctx.exec<Record<string, unknown>>(
				`
				${ENSURE_SCH}
				const MOVES = ${JSON.stringify(moves)};
				const WIRES = ${JSON.stringify(wires)};
				const olds = await eda.sch_PrimitiveWire.getAll();
				let removed = 0;
				for (const w of olds) { await eda.sch_PrimitiveWire.delete(w.primitiveId).catch(() => {}); removed += 1; }
				let moved = 0;
				for (const m of MOVES) {
					const r = await eda.sch_PrimitiveComponent.modify(m.id, {
						x: m.x, y: m.y, rotation: m.rotation, mirror: m.mirror,
					});
					if (r !== false) moved += 1;
				}
				let drawn = 0;
				for (const w of WIRES) {
					const ok = await eda.sch_PrimitiveWire.create(w.points, w.net);
					if (ok) drawn += 1;
				}
				return { wires_removed: removed, parts_moved: moved, wires_drawn: drawn };
			`,
				180_000,
			);

			return {
				...summary,
				...applied,
				note:
					r.routed.failedCount > 0
						? `有 ${r.routed.failedCount} 条连接没走通 —— 多半是器件挤得没通道了，加大 rounds 或放宽 bounds 再试。`
						: '摆放与走线都已更新。电源地符号需要另外用 eda_label_nets 补，它们不参与布局。',
			};
		},
	},
];
