/**
 * 以地图为输入，跑完布局布线，把结果画到 EDA 上。
 *
 * 这是整条链路的收口：AI 定语义（地图）→ 算法定几何（分组退火 + A*）→ 渲染 → 结果写回地图。
 * 下次再 apply 就从上次的结果继续爬，不必从零开始。
 */
import { layoutByGroups } from '../layout/group.js';
import { LABEL_SLOTS, type Layout, type Net, type Part, type Rotation, dirVec, pinWorld } from '../layout/model.js';
import type { NetKind, SchematicMap } from '../layout/map.js';
import type { ToolDef } from './types.js';

const ENSURE_SCH = `
	const _page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
	if (!_page) return { error: 'NOT_SCH_EDITOR' };
`;
const MARK = 'EDAMCP_MAP_V1:';

/** 网络性质 → EDA 的符号种类 */
const FLAG_OF: Record<NetKind, string | null> = {
	signal: null,
	power: 'Power',
	ground: 'Ground',
	analog_ground: 'AnalogGround',
	protect_ground: 'ProtectGround',
};

export const mapApplyTools: ToolDef[] = [
	{
		name: 'eda_map_apply',
		description:
			'【写操作】按地图重新布局并重画整张原理图。' +
			'\n\n流程：分组布局（每组先在一片空地上独立优化，再作为整体拼接）→ A\\* 正交布线 → ' +
			'渲染器件、导线、电源地符号、跨区端口、分区框与标题 → 把结果写回地图。' +
			'\n\n**AI 只需要把语义写对**：谁连谁、谁属于哪个区、每条网络是信号还是电源地。' +
			'位置、角度、走线、文字摆放都由算法决定。' +
			'\n\n想按阅读习惯干预分区位置（信号从左往右、电源在左上、接口贴边缘），' +
			'在地图的 group 上给 anchor —— 给了 anchor 的区会被锁死，没给的算法自己安排。' +
			'组内布局不接受干预，那是纯几何，算法比手算准。' +
			'\n\n会清掉当前页的导线与电源地符号重画。先用 dry_run 看指标再决定是否落地。',
		inputSchema: {
			type: 'object',
			properties: {
				map: { type: 'object', description: '地图；不传则读图纸里存的那份' },
				iterations: { type: 'number', description: '每组退火迭代次数，默认 20000' },
				dry_run: { type: 'boolean', description: '只算不画，先看能优化到什么程度' },
				save_map: { type: 'boolean', description: '是否把优化结果写回地图，默认 true' },
			},
		},
		mutating: true,
		handler: async (args, ctx) => {
			const iterations = typeof args.iterations === 'number' ? args.iterations : 20000;
			const dryRun = args.dry_run === true;
			const saveMap = args.save_map !== false;

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
				if (loaded.error) return { error: '当前编辑器里没有打开原理图页' };
				if (!loaded.raw) return { error: '没传 map，图纸里也没有地图。先跑 eda_map_import 生成一份。' };
				map = JSON.parse(loaded.raw) as SchematicMap;
			}

			// ── 地图 → 布局模型 ──
			const parts = new Map<string, Part>();
			const assign = new Map<string, string>();
			const titles = new Map<string, { title?: string; note?: string }>();
			const idToPrimitive = new Map<string, string>();
			for (const p of map.parts) {
				if (!p.id.trim()) continue; // 位号为空的跳过：图上偶有这种残留，参与优化只会添乱
				parts.set(p.id, {
					id: p.id,
					w: p.w,
					h: p.h,
					fixed: p.fixed === true,
					pins: p.pins.map((q) => ({ id: q.id, dx: q.dx, dy: q.dy, dir: q.dir })),
					labels: (p.labels ?? []).filter((l) => l.text).map((l) => ({ text: l.text, dx: l.dx, dy: l.dy })),
				});
				if (p.group) assign.set(p.id, p.group);
				if (p.primitiveId) idToPrimitive.set(p.id, p.primitiveId);
			}
			for (const g of map.groups) titles.set(g.id, { title: g.title, note: g.note });
			const anchors = new Map<string, { x: number; y: number }>();
			for (const g of map.groups) if (g.anchor) anchors.set(g.id, g.anchor);

			// 要画线的只有 signal；电源地走符号，跨区走端口
			const wireNets: Net[] = map.nets
				.filter((n) => n.kind === 'signal' && n.pins.length >= 2)
				.map((n) => ({ id: n.id, pins: n.pins }));
			const symbolNets = map.nets.filter((n) => n.kind !== 'signal');

			// 挂符号的引脚要预留位置，否则布局收紧后符号会压在邻居身上
			for (const n of symbolNets) {
				const up = n.kind === 'power';
				for (const ref of n.pins) {
					const dot = ref.lastIndexOf('.');
					if (dot <= 0) continue;
					const part = parts.get(ref.slice(0, dot));
					if (!part) continue;
					const pinId = ref.slice(dot + 1);
					part.stubPins = [...(part.stubPins ?? []), pinId];
					if (up) part.stubUp = [...(part.stubUp ?? []), pinId];
				}
			}

			const t0 = Date.now();
			const res = layoutByGroups(parts, wireNets, assign, titles, {
				iterations,
				sheet: map.meta.sheet,
				anchors: anchors.size ? anchors : undefined,
			});
			const elapsed = Date.now() - t0;

			// ── 算出要写回 EDA 的东西 ──
			const moves: Array<{ id: string; x: number; y: number; rotation: number; mirror: boolean }> = [];
			for (const [des, pl] of res.layout) {
				const pid = idToPrimitive.get(des);
				if (pid) moves.push({ id: pid, x: pl.x, y: pl.y, rotation: pl.rot, mirror: pl.mirror });
			}
			const wires = res.routed.nets.flatMap((n) => n.paths.map((p) => ({ net: n.netId, points: p.flat() })));

			// 电源地符号：引一小段线，末端放符号。朝向固定 —— 地朝下、电源朝上
			const flags: Array<{ kind: string; net: string; x: number; y: number; ex: number; ey: number }> = [];
			// 同一器件上挂几个符号时，引出长度要**逐个错开**。
			// 芯片相邻引脚间距只有 10，而符号本身连文字有几十宽 ——
			// 都引出 40 就必然撞在一起（实测 U1 的 +3V3 与 +5V 符号重叠）。
			const stubSeq = new Map<string, number>();
			for (const n of symbolNets) {
				const kind = FLAG_OF[n.kind];
				if (!kind) continue;
				for (const ref of n.pins) {
					const dot = ref.lastIndexOf('.');
					if (dot <= 0) continue;
					const des = ref.slice(0, dot);
					const part = parts.get(des);
					const pl = res.layout.get(des);
					if (!part || !pl) continue;
					const pin = part.pins.find((q) => q.id === ref.slice(dot + 1));
					if (!pin) continue;
					const w = pinWorld(part, pl, pin);
					const [vx, vy] = dirVec(w.dir);
					const seq = stubSeq.get(des) ?? 0;
					stubSeq.set(des, seq + 1);
					const L = 40 + seq * 30;
					flags.push({ kind, net: n.id, x: w.x, y: w.y, ex: w.x + vx * L, ey: w.y + vy * L });
				}
			}

			// 跨区网络用端口。它们不参与布线，靠同名端口相连
			const ports: Array<{ dir: string; net: string; x: number; y: number; ex: number; ey: number }> = [];
			for (const netId of res.crossGroupNets) {
				const n = map.nets.find((x) => x.id === netId);
				if (!n || n.kind !== 'signal') continue;
				for (const ref of n.pins) {
					const dot = ref.lastIndexOf('.');
					if (dot <= 0) continue;
					const des = ref.slice(0, dot);
					const part = parts.get(des);
					const pl = res.layout.get(des);
					if (!part || !pl) continue;
					const pin = part.pins.find((q) => q.id === ref.slice(dot + 1));
					if (!pin) continue;
					const w = pinWorld(part, pl, pin);
					const [vx, vy] = dirVec(w.dir);
					const L = 50;
					ports.push({ dir: 'BI', net: n.id, x: w.x, y: w.y, ex: w.x + vx * L, ey: w.y + vy * L });
				}
			}

			const summary = {
				parts: parts.size,
				wire_nets: wireNets.length,
				symbol_nets: symbolNets.length,
				cross_group_nets: res.crossGroupNets,
				groups: res.groups.map((g) => ({
					id: g.id,
					title: g.title,
					box: [g.minX, g.minY, g.maxX, g.maxY],
					size: `${g.maxX - g.minX}×${g.maxY - g.minY}`,
				})),
				per_group: res.perGroup,
				wire_length: res.routed.totalLength,
				bends: res.routed.totalBends,
				unrouted: res.routed.failedCount,
				elapsed_ms: elapsed,
				rotated: [...res.layout.values()].filter((p) => p.rot === 90 || p.rot === 270).length,
				warnings: res.warnings,
			};
			if (dryRun) return { ...summary, dry_run: true, note: '只算了没画。去掉 dry_run 才会落到图上。' };

			// ── 渲染：分步执行 ──
			// 不能塞进一次 exec：删图元会让扩展重连（sch_PrimitiveComponent.delete
			// 实测如此），而清场动辄要删几十个，一次干完必然断在中途 ——
			// 之前就是这么超时的，图渲染了一半。拆开之后每步单独一次调用，
			// 断了也只影响那一步，而且能报出是哪步没做完。
			const steps: Record<string, unknown> = {};
			const runStep = async (name: string, code: string, timeout = 120_000): Promise<void> => {
				try {
					steps[name] = await ctx.exec<Record<string, unknown>>(`${ENSURE_SCH}${code}`, timeout);
				} catch (e) {
					steps[name] = { failed: e instanceof Error ? e.message : String(e) };
				}
			};

			await runStep(
				'清导线',
				`
				const ids = (await eda.sch_PrimitiveWire.getAll()).map(function (w) { return w.primitiveId; });
				if (ids.length) await eda.sch_PrimitiveWire.delete(ids);
				return { removed: ids.length };
			`,
			);
			await runStep(
				'清符号与端口',
				`
				const ids = (await eda.sch_PrimitiveComponent.getAll())
					.filter(function (c) { return c.componentType === 'netflag' || c.componentType === 'netport'; })
					.map(function (c) { return c.primitiveId; });
				if (ids.length) await eda.sch_PrimitiveComponent.delete(ids);
				return { removed: ids.length };
			`,
			);
			await runStep(
				'清旧区框与文字',
				`
				const MARKTXT = ${JSON.stringify(MARK)};
				const rects = (await eda.sch_PrimitiveRectangle.getAll()).map(function (x) { return x.primitiveId; });
				if (rects.length) await eda.sch_PrimitiveRectangle.delete(rects);
				// 地图那条文字要留着，靠标记认出来
				const texts = (await eda.sch_PrimitiveText.getAll())
					.filter(function (x) { return String(x.content || '').indexOf(MARKTXT) !== 0; })
					.map(function (x) { return x.primitiveId; });
				if (texts.length) await eda.sch_PrimitiveText.delete(texts);
				return { rects: rects.length, texts: texts.length };
			`,
			);
			await runStep(
				'摆器件',
				`
				const MOVES = ${JSON.stringify(moves)};
				let n = 0;
				for (const m of MOVES) {
					const r = await eda.sch_PrimitiveComponent.modify(m.id, {
						x: m.x, y: m.y, rotation: m.rotation, mirror: m.mirror,
					});
					if (r !== false) n += 1;
				}
				return { moved: n, total: MOVES.length };
			`,
				180_000,
			);
			await runStep(
				'画导线',
				`
				const WIRES = ${JSON.stringify(wires)};
				let n = 0;
				for (const w of WIRES) {
					if (await eda.sch_PrimitiveWire.create(w.points, w.net)) n += 1;
				}
				return { drawn: n, total: WIRES.length };
			`,
				180_000,
			);
			await runStep(
				'放电源地符号',
				`
				const FLAGS = ${JSON.stringify(flags)};
				let n = 0;
				for (const f of FLAGS) {
					// 引出线**不带网络名**：带了会让导线的 NET 标签和符号名把同一个
					// 网络名画两遍，挤在一小段线的两端
					await eda.sch_PrimitiveWire.create([f.x, f.y, f.ex, f.ey]).catch(() => {});
					if (await eda.sch_PrimitiveComponent.createNetFlag(f.kind, f.net, f.ex, f.ey, 0)) n += 1;
				}
				return { drawn: n, total: FLAGS.length };
			`,
				180_000,
			);
			await runStep(
				'放跨区端口',
				`
				const PORTS = ${JSON.stringify(ports)};
				let n = 0;
				for (const p of PORTS) {
					await eda.sch_PrimitiveWire.create([p.x, p.y, p.ex, p.ey]).catch(() => {});
					if (await eda.sch_PrimitiveComponent.createNetPort(p.dir, p.net, p.ex, p.ey, 0)) n += 1;
				}
				return { drawn: n, total: PORTS.length };
			`,
				180_000,
			);
			await runStep(
				'画区框与标题',
				`
				const GROUPS = ${JSON.stringify(res.groups)};
				let n = 0;
				for (const g of GROUPS) {
					// create(topLeftX, topLeftY, width, height)，y 轴向上所以 topLeft 取较大的 y
					const rc = await eda.sch_PrimitiveRectangle.create(g.minX, g.maxY, g.maxX - g.minX, g.maxY - g.minY);
					if (rc) {
						await eda.sch_PrimitiveRectangle.modify(rc.primitiveId, { color: '#5B7FA6', lineWidth: 2, lineType: 1 }).catch(() => {});
						n += 1;
					}
					// create(x, y, text)，坐标在前。标题写框内，写框外会掉出图纸
					if (g.title) await eda.sch_PrimitiveText.create(g.minX + 15, g.maxY - 25, g.title).catch(() => {});
					if (g.note) await eda.sch_PrimitiveText.create(g.minX + 15, g.maxY - 45, g.note).catch(() => {});
				}
				return { drawn: n };
			`,
				180_000,
			);
			const applied = { steps };

			// ── 结果写回地图，下次 apply 从这里继续 ──
			let mapSaved: unknown = null;
			if (saveMap) {
				for (const p of map.parts) {
					const pl = res.layout.get(p.id);
					if (pl) {
						p.place = { x: pl.x, y: pl.y, rot: pl.rot as Rotation, mirror: pl.mirror };
						// 文字位置：算法挑的候选位换算成偏移存下来。
						// 注意 EDA 侧改不了属性文字的位置（sch_PrimitiveAttribute 在扩展
						// 上下文里读不到），所以这只是记录，图上不会跟着动。
						if (pl.labelSlots && p.labels) {
							const swap = pl.rot === 90 || pl.rot === 270;
							const halfW = (swap ? p.h : p.w) / 2;
							const halfH = (swap ? p.w : p.h) / 2;
							p.labels.forEach((l, i) => {
								const s = LABEL_SLOTS[(pl.labelSlots?.[i] ?? 0) % LABEL_SLOTS.length];
								if (s) {
									l.dx = s.fx * (halfW + 12);
									l.dy = s.fy * (halfH + 12);
								}
							});
						}
					}
				}
				for (const g of map.groups) {
					const box = res.groups.find((x) => x.id === g.id);
					if (box) g.box = { minX: box.minX, minY: box.minY, maxX: box.maxX, maxY: box.maxY };
				}
				for (const n of map.nets) {
					const r = res.routed.nets.find((x) => x.netId === n.id);
					if (r) n.routes = r.paths;
				}
				map.meta.updatedAt = new Date().toISOString();
				const payload = MARK + JSON.stringify(map);
				mapSaved = await ctx.exec<Record<string, unknown>>(
					`
					${ENSURE_SCH}
					const PAYLOAD = ${JSON.stringify(payload)};
					const MARK = ${JSON.stringify(MARK)};
					const stale = (await eda.sch_PrimitiveText.getAll())
						.filter(function (t) { return String(t.content || '').indexOf(MARK) === 0; })
						.map(function (t) { return t.primitiveId; });
					if (stale.length) await eda.sch_PrimitiveText.delete(stale);
					const t = await eda.sch_PrimitiveText.create(-400, -400, PAYLOAD);
					return { ok: !!t, bytes: PAYLOAD.length };
				`,
					120_000,
				);
			}

			return {
				...summary,
				...applied,
				map_saved: mapSaved,
				note:
					res.routed.failedCount > 0
						? `${res.routed.failedCount} 条连接没走通，多半是分区之间没留够通道 —— 加大 iterations，或给分区换个 anchor。`
						: '布局、走线、符号、分区框都已重画，结果已写回地图。文字位置算过但落不到图上（EDA 不开放属性文字的位置修改）。',
			};
		},
	},
];
