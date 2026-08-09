/**
 * 以地图为输入，跑完布局布线，把结果画到 EDA 上。
 *
 * 这是整条链路的收口：AI 定语义（地图）→ 算法定几何（分组退火 + A*）→ 渲染 → 结果写回地图。
 * 下次再 apply 就从上次的结果继续爬，不必从零开始。
 */
import { layoutByGroups } from '../layout/group.js';
import { LABEL_SLOTS, type Layout, type Net, type Part, type Rotation, dirVec, pinWorld } from '../layout/model.js';
import { MAP_MARK, type NetKind, type SchematicMap, defaultStyle, packMap } from '../layout/map.js';
import { Trace, checkRouteEndpoints } from '../layout/trace.js';
import type { ToolDef } from './types.js';
import { census, diffCensus } from './verify.js';

const ENSURE_SCH = `
	const _page = await eda.dmt_Schematic.getCurrentSchematicPageInfo().catch(() => null);
	if (!_page) return { error: 'NOT_SCH_EDITOR' };
`;
/** 标记前缀与打包方式统一放在 layout/map.ts —— 存与读必须用同一份 */
const MARK = MAP_MARK;

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
				trace: {
					type: 'boolean',
					description:
						'过程日志，**默认开**。返回里的 trace.issues 会直接指出是哪一步出的问题' +
						'（引脚端点没对上、网络被跳过、某步写失败），不用回头翻代码猜。' +
						'trace_full=true 时连正常流水一起返回。',
				},
				trace_full: { type: 'boolean', description: '返回完整流水而不只是问题行，默认 false' },
				save_map: { type: 'boolean', description: '是否把优化结果写回地图，默认 true' },
			},
		},
		mutating: true,
		handler: async (args, ctx) => {
			const iterations = typeof args.iterations === 'number' ? args.iterations : 20000;
			const dryRun = args.dry_run === true;
			const trace = new Trace(args.trace !== false);
			const traceFull = args.trace_full === true;
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

			// 布局与渲染看的是两件事，不能用同一份网络列表：
			//
			//   布局要看**所有电气连接** —— 谁跟谁有关系就该摆在一起。
			//   渲染只画**声明了 wire 画法**的那些，port 走端口、电源地走符号。
			//
			// 混为一谈两头都出错：只按 kind 筛，port 网络会被多画一遍导线；
			// 只按 style 筛，布局就看不见 port 网络的亲和关系 —— IO_KEY 连着
			// 同一个区里的 R4 和 SW2，布局不知道，于是把 io 区的六个器件排成
			// 一列 220×1040 的长条，直接顶出图纸。
			const layoutNets: Net[] = map.nets
				.filter((n) => n.kind === 'signal' && n.pins.length >= 2)
				.map((n) => ({ id: n.id, pins: n.pins }));

			// ── 画法必须互斥：一条网络只画一种图形 ──
			// 这里原来是 symbolNets 按 kind 筛（power/ground → 画电源地符号）、
			// ports 按 style 筛（style=port → 画端口），两个集合会**重叠**：
			// 一条 kind=power、style=port 的网络两边都命中，于是同一个引脚旁边
			// 既放了电源符号又放了端口，看起来就像"引脚出来接了个输入，旁边又
			// 挂了个电源"。§4.7 说连接语义决定图形，那就只能有一个决定者 ——
			// 一律以 style 为准，kind 只用来选符号种类（Power / Ground / …）。
			const styleOf = (n: SchematicMap['nets'][number]) => n.style ?? defaultStyle(n.kind);
			const wireNetIds = new Set(map.nets.filter((n) => styleOf(n) === 'wire').map((n) => n.id));
			const wireNets = layoutNets.filter((n) => wireNetIds.has(n.id));
			const symbolNets = map.nets.filter((n) => styleOf(n) === 'symbol');
			const portNets = map.nets.filter((n) => styleOf(n) === 'port');
			// 需要预留引出空间的是「要挂东西」的引脚，符号和端口都算
			const stubNets = [...symbolNets, ...portNets];

			// 挂符号／端口的引脚都要预留位置，否则布局收紧后会压在邻居身上
			for (const n of stubNets) {
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
			const res = layoutByGroups(parts, layoutNets, assign, titles, {
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
			// 只画声明了 wire 的；port/symbol 的路径算了但不落笔
			const wires = res.routed.nets
				.filter((n) => wireNetIds.has(n.netId))
				.flatMap((n) => n.paths.map((p) => ({ net: n.netId, points: p.flat() })));

			// ── 过程日志 ──
			// 记的都是能判对错的数字：谁被跳过了、每个区多大、引脚端点差多少。
			trace.at('地图');
			trace.log(`器件 ${parts.size}，网络 ${map.nets.length}`, {
				画线: wireNets.length,
				符号: symbolNets.length,
				跨区端口: res.crossGroupNets.length,
			});
			for (const n of map.nets) {
				const style = n.style ?? defaultStyle(n.kind);
				if (style !== 'wire' && n.kind === 'signal') {
					trace.log(`网络 ${n.id} 不画导线（style=${style}）`, { 引脚: n.pins });
				}
				if (n.pins.length < 2) trace.warn(`网络 ${n.id} 只有 ${n.pins.length} 个引脚，连不成`, {});
			}
			trace.at('分组布局');
			for (const g of res.groups) {
				trace.log(`区 ${g.id}`, {
					尺寸: `${g.maxX - g.minX}×${g.maxY - g.minY}`,
					框: [g.minX, g.minY, g.maxX, g.maxY],
				});
			}
			for (const a of res.groups) {
				for (const b of res.groups) {
					if (a.id >= b.id) continue;
					const hit = a.minX < b.maxX && b.minX < a.maxX && a.minY < b.maxY && b.minY < a.maxY;
					if (hit) trace.error(`分区框 ${a.id} 与 ${b.id} 重叠`, { a: [a.minX, a.minY, a.maxX, a.maxY], b: [b.minX, b.minY, b.maxX, b.maxY] });
				}
			}
			for (const w of res.warnings) trace.warn(w, {});

			// 引脚的精确世界坐标 —— 判定「线到底有没有接到引脚上」的唯一依据
			const pinXY = new Map<string, { x: number; y: number }>();
			for (const [des, pl] of res.layout) {
				const part = parts.get(des);
				if (!part) continue;
				for (const pin of part.pins) {
					const w = pinWorld(part, pl, pin);
					pinXY.set(`${des}.${pin.id}`, { x: w.x, y: w.y });
				}
			}
			const endpointBad = checkRouteEndpoints(
				trace,
				res.routed.nets
					.filter((n) => wireNetIds.has(n.netId))
					.map((n) => ({
						id: n.netId,
						pins: wireNets.find((w) => w.id === n.netId)?.pins ?? [],
						paths: n.paths,
					})),
				pinXY,
			);

			// ── 电源地符号：直接放在引脚上，不画引出线 ──
			//
			// 试过两版引出线，都会造成**真短路**：
			//   沿引脚方向直着拉 → 一排水平引脚的 stub 落在同一条 y 线上首尾相接
			//   改成 L 形转向   → 转向后在垂直方向又互相撞上，反而并了五条网络
			// 根子在于 stub 不参与 A* 避让，在密集区怎么走都会碰到别人；这些线
			// 又刻意不带网络名，碰上就是一条连通导线 —— DRC 不报，肉眼只看到
			// "几个符号排成一列"。
			//
			// 所以不画线，符号直接落在引脚上：EDA 里 netflag 放在引脚位置就表示
			// 该引脚接入该网络，手工画图也是这么做的。代价是相邻引脚的符号可能
			// 视觉重叠（芯片引脚间距只有 10），但那是可读性问题，比电气短路轻。
			// 真要把符号分开，正解是让 stub 也走 A* 避让 —— 那是后话。
			const flags: Array<{ kind: string; net: string; x: number; y: number }> = [];
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
					flags.push({ kind, net: n.id, x: w.x, y: w.y });
				}
			}

			// 跨区网络用端口。它们不参与布线，靠同名端口相连。
			// 判据是**地图声明的 style**，不是 res.crossGroupNets ——
			// 后者由 layoutByGroups 从它收到的网络里算，而 port 网络压根没传给它，
			// 于是那个列表恒为空、端口一个也画不出来。AI 说了用端口就画端口。
			const ports: Array<{ dir: string; net: string; x: number; y: number; ex: number; ey: number }> = [];
			for (const n of portNets) {
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
			const traceOut = () => ({
				trace: trace.enabled
					? { ...trace.summary(), ...(traceFull ? { full: trace.format() } : {}) }
					: undefined,
			});
			if (dryRun) {
				return {
					...summary,
					...traceOut(),
					endpoint_mismatches: endpointBad,
					dry_run: true,
					note:
						endpointBad > 0
							? `只算了没画。**但有 ${endpointBad} 个引脚端点没落在自己的线上** —— 看 trace.lines，画上去也是断的。`
							: '只算了没画。去掉 dry_run 才会落到图上。',
				};
			}

			// ── 渲染：分步执行 ──
			// 不能塞进一次 exec：删图元会让扩展重连（sch_PrimitiveComponent.delete
			// 实测如此），而清场动辄要删几十个，一次干完必然断在中途 ——
			// 之前就是这么超时的，图渲染了一半。拆开之后每步单独一次调用，
			// 断了也只影响那一步，而且能报出是哪步没做完。
			const steps: Record<string, unknown> = {};
			const runStep = async (name: string, code: string, timeout = 120_000): Promise<void> => {
				trace.at(`渲染:${name}`);
				try {
					const r = await ctx.exec<Record<string, unknown>>(`${ENSURE_SCH}${code}`, timeout);
					steps[name] = r;
					if (r && typeof r === 'object' && 'error' in r) trace.error(`这一步返回了错误`, r as Record<string, unknown>);
					else trace.log('完成', r as Record<string, unknown>);
				} catch (e) {
					const msg = e instanceof Error ? e.message : String(e);
					steps[name] = { failed: msg };
					trace.error(`这一步抛错，后面的步骤会在残图上继续`, { error: msg });
				}
			};

			// 渲染前后各普查一次。每一步自己报的 drawn 数只代表「调用没报错」，
			// 而这条链上有十几次写操作、中间还可能断连重连；只有前后一比才知道
			// 图纸整体到底变成了什么样 —— 尤其能抓住「一步都没生效」这种情形。
			const before = await census(ctx).catch(() => null);

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
					// 不画引出线 —— 那是短路的来源，见 map-apply.ts 里的说明
					if (await eda.sch_PrimitiveComponent.createNetFlag(f.kind, f.net, f.x, f.y, 0)) n += 1;
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
				const payload = packMap(map);
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

			// 回读确认整张图确实变了，并跟「本该画多少」对一对
			// 刻意不声明 expect：清场删了多少、器件数怎么变，算起来绕且容易算错，
			// 而一个算错的预期会变成假阳性告警 —— 那比不检查更坏。这里只报实际
			// 变化量，「一步都没生效」这类硬失败靠 changed 就足以抓住。
			const after = before ? await census(ctx).catch(() => null) : null;
			const diff = before && after ? diffCensus(before, after) : null;

			const notes: string[] = [];
			if (res.routed.failedCount > 0) {
				notes.push(
					`${res.routed.failedCount} 条连接没走通，多半是分区之间没留够通道 —— 加大 iterations，或给分区换个 anchor。`,
				);
			} else {
				notes.push('布局、走线、符号、分区框都已重画，结果已写回地图。文字位置算过但落不到图上（EDA 不开放属性文字的位置修改）。');
			}
			if (diff && !diff.changed) {
				notes.push('**图纸内容摘要前后没变 —— 这一趟很可能一步都没生效**，逐条看 steps 里有没有 failed。');
			}

			if (endpointBad > 0) {
				notes.push(`**${endpointBad} 个引脚端点没落在自己的线上**，图上看着连了实际是断的 —— 看 trace.lines。`);
			}
			return {
				...summary,
				...applied,
				...traceOut(),
				endpoint_mismatches: endpointBad,
				map_saved: mapSaved,
				census_diff: diff ? { delta: diff.delta, changed: diff.changed, summary: diff.summary } : undefined,
				note: notes.join(' '),
			};
		},
	},
];
