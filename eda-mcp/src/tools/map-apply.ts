/**
 * 以地图为输入，跑完布局布线，把结果画到 EDA 上。
 *
 * 这是整条链路的收口：AI 定语义（地图）→ 算法定几何（分组退火 + A*）→ 渲染 → 结果写回地图。
 * 下次再 apply 就从上次的结果继续爬，不必从零开始。
 */
import { layoutByGroups } from '../layout/group.js';
import { FAN_BASE, FAN_STEP, FLAG_LONG, FLAG_WIDE, LABEL_SLOTS, dirVec, effectiveBox, pinWorld, type Layout, type Net, type Part, type Rotation } from '../layout/model.js';
import { MAP_MARK, defaultStyle, packMap, saveMapCode, unpackMap, type NetKind, type SchematicMap } from '../layout/map.js';
import { Trace, checkRouteEndpoints } from '../layout/trace.js';
import type { ToolDef } from './types.js';
import { census, diffCensus, verifyPlaced } from './verify.js';

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
				layer: {
					type: 'number',
					description:
						'只渲染第 N 层（逐层递进，见 design.md §4.11）。' +
						'**前面所有层已占的地盘会作为障碍**传给布局与布线 —— 这一层的器件被算法挡在外面，' +
						'不会压到已经画好的部分。器件的层号写在地图的 part.layer 上，不写就是第 1 层。' +
						'\n\n配合 incremental 使用：第 1 层全量渲染，之后每层都加 incremental 保住前面的成果。' +
						'不传 layer 就是老行为，一次画完所有器件。',
				},
				incremental: {
					type: 'boolean',
					description:
						'增量渲染：**不清场**，只把这一次算出来的东西画上去，保留图上已有的图元。' +
						'逐层递进时必须开（否则第二层会把第一层抹掉）；默认 false，即照旧清空重画。',
				},
				save_map: { type: 'boolean', description: '是否把优化结果写回地图，默认 true' },
			},
		},
		mutating: true,
		handler: async (args, ctx) => {
			const iterations = typeof args.iterations === 'number' ? args.iterations : 20000;
			const dryRun = args.dry_run === true;
			const trace = new Trace(args.trace !== false);
			const traceFull = args.trace_full === true;
			const incremental = args.incremental === true;
			const layer = typeof args.layer === 'number' ? args.layer : null;
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
				// 必须走 unpackMap：地图是分行存的（单行六七千字符会把画布包围盒
				// 撑到两万多宽，见 layout/map.ts），直接 JSON.parse 带换行的字符串
				// 会抛异常。存那边改了格式，读这边漏改了一处 —— T5 一直是传 map
				// 参数进来的，没走这条路，直到 T6 从图纸读才炸出来。
				map = unpackMap(loaded.raw);
			}

			// ── 分层：本层参与布局，前面层变成障碍 ──
			// AI 决定顺序（谁先谁后是设计判断），算法在「前面层已定」的前提下
			// 摆这一层。约束是递增的，不是一次性同时求解 —— 解空间小得多，
			// 也更容易收敛到人看得懂的结果。
			const layerOf = (p: SchematicMap['parts'][number]) => p.layer ?? 1;
			const thisLayer = layer == null ? map.parts : map.parts.filter((p) => layerOf(p) === layer);
			const priorLayers = layer == null ? [] : map.parts.filter((p) => layerOf(p) < layer);
			if (layer != null && !thisLayer.length) {
				return { error: `第 ${layer} 层没有任何器件。地图里的 part.layer 是多少？不写默认是 1。` };
			}

			// ── 地图 → 布局模型 ──
			const parts = new Map<string, Part>();
			const assign = new Map<string, string>();
			const titles = new Map<string, { title?: string; note?: string }>();
			const idToPrimitive = new Map<string, string>();
			for (const p of thisLayer) {
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

			// ── 前面层的地盘 → 障碍 ──
			// 用**有效包围盒**（本体 ＋ 引脚扇出区），不是本体：芯片的引脚展开区
			// 是它的一部分，这一层的器件该避开整块，而不是只避开芯片方框。
			// stubPins 要按同一套规则算出来，否则前面层的扇出区会被漏掉。
			const stubOf = (p: SchematicMap['parts'][number]): { pins: string[]; up: string[] } => {
				const pins: string[] = [];
				const up: string[] = [];
				for (const n of stubNets) {
					for (const ref of n.pins) {
						const dot = ref.lastIndexOf('.');
						if (dot <= 0 || ref.slice(0, dot) !== p.id) continue;
						const pid = ref.slice(dot + 1);
						pins.push(pid);
						if (n.kind === 'power') up.push(pid);
					}
				}
				return { pins, up };
			};
			const obstacles = priorLayers
				.filter((p) => p.id.trim())
				.map((p) => {
					const st = stubOf(p);
					const part: Part = {
						id: p.id,
						w: p.w,
						h: p.h,
						pins: p.pins.map((q) => ({ id: q.id, dx: q.dx, dy: q.dy, dir: q.dir })),
						stubPins: st.pins.length ? st.pins : undefined,
						stubUp: st.up.length ? st.up : undefined,
					};
					return effectiveBox(part, {
						x: p.place.x,
						y: p.place.y,
						rot: p.place.rot,
						mirror: p.place.mirror,
					});
				});
			if (obstacles.length) {
				trace.at('分层');
				trace.log(`第 ${layer} 层：本层 ${thisLayer.length} 个器件，前面层 ${obstacles.length} 块地盘作为障碍`, {});
			}

			const t0 = Date.now();
			const res = layoutByGroups(parts, layoutNets, assign, titles, {
				iterations,
				sheet: map.meta.sheet,
				anchors: anchors.size ? anchors : undefined,
				obstacles: obstacles.length ? obstacles : undefined,
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

			// ── 电源地符号与跨区端口：沿引脚方向阶梯式引出 ──
			//
			//     1 ──────── 电源
			//     2 ──────────────── 接地
			//     3 ──────────────────────── 输入输出
			//
			// 同一侧的引脚本来就差着 10，只要引出长度逐级拉开，几条线天然平行、
			// 末端的符号自然错成阶梯 —— 不用转向，也就不会有「引出线拐进器件
			// 内部把两极短接」那种事（上一版对称扇形就栽在这）。
			//
			// 之前误判过一次：见到一堆 stub 落在同一条 y 线上首尾相接，就以为
			// 直线引出行不通。其实那是**不同器件**碰巧排在同一水平线上，跟同
			// 一个芯片的多引脚扇出是两码事 —— 后者引脚 y 各不相同，压根不会
			// 碰。跨器件的冲突另外用占位表处理。
			// FAN_BASE / FAN_STEP / FLAG_LONG / FLAG_WIDE 都从 layout/model.ts 取 ——
			// 布局按这套参数给引脚展开区留地方（effectiveBox），渲染按同一套真的
			// 画出去。两边各写一份的话，留的和画的对不上：要么白留一大块，
			// 要么符号又挤到邻居身上。
			/**
			 * 落点一律对齐到 5 的倍数：**createNetFlag 会把坐标吸附到 5 的倍数，
			 * 而 sch_PrimitiveWire.create 不吸附** —— 线停在 917.5、符号被吸到
			 * 920，差 5 刚好连不上，引脚就成了孤儿。
			 */
			const q5 = (v: number) => Math.round(v / 5) * 5;

			/** 符号本体从落点往哪个方向伸。占地与朝向都以它为准。 */
			type BodyDir = 'up' | 'down' | 'left' | 'right';
			type StubPin = {
				what: 'flag' | 'port';
				kind: string;
				net: string;
				x: number;
				y: number;
				vx: number;
				vy: number;
				/** 所属器件的引脚总数 —— 决定符号朝向按哪套规则来 */
				pinCount: number;
			};
			// 按「器件 + 引出方向」归组。电源地符号和跨区端口**必须一起归组**：
			// 它们挂在同一排引脚上，各排各的必然撞。
			const clusters = new Map<string, StubPin[]>();
			for (const n of [...symbolNets, ...portNets]) {
				const isPort = (n.style ?? defaultStyle(n.kind)) === 'port';
				const kind = isPort ? 'BI' : FLAG_OF[n.kind];
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
					const key = `${des}|${vx},${vy}`;
					clusters.set(key, [
						...(clusters.get(key) ?? []),
						{ what: isPort ? 'port' : 'flag', kind, net: n.id, x: w.x, y: w.y, vx, vy, pinCount: part.pins.length },
					]);
				}
			}

			type Placed = { kind: string; net: string; x: number; y: number; ex: number; ey: number; rot: number };
			const flags: Placed[] = [];
			const ports: Array<Placed & { dir: string }> = [];

			// 跨器件的冲突：落点不能撞，引出线经过的格子也不能被别的网络占着。
			// 同网络共用没关系，本来就该连在一起。
			const takenSpots = new Set<string>();
			const spotKey = (x: number, y: number) => `${Math.round(x / 45)},${Math.round(y / 45)}`;
			/**
			 * 符号朝向 —— **由阶梯方向唯一确定，不看周围有没有空间**。
			 *
			 * ## 为什么全部朝同一侧
			 *
			 * 符号本体（约 45 长）从落点往某个方向伸。同侧相邻引脚只差 10，
			 * 本体一定会跨过邻居那根引出线所在的高度。撞不撞，只取决于邻居的
			 * 线**够不够长、能不能延伸到本体所在的 x**：
			 *
			 *   本体朝「阶梯变短」的那侧 → 那侧的线更短，左端还没够到本体，安全
			 *   本体朝「阶梯变长」的那侧 → 那侧的线更长，必然横跨本体，必撞
			 *
			 * 阶梯是「从上到下由长到短」，所以水平引出时**全部朝下**就无冲突，
			 * 而且是确定性的：不需要逐个探测空间，也不会因为长度微调而翻脸。
			 *
			 * 曾经按「符号语义」固定成 Power 朝上、Ground 朝下，结果同一侧一上
			 * 一下：朝下的那些安全，朝上的那些（U1 的 VDDA、VDD_1）本体必然穿过
			 * 上方那根更长的线。当时误以为这是「一上一下必有一个撞」的死结，
			 * 其实两侧并不对称 —— 全部朝下就同时避开了。
			 *
			 * 代价是电源符号会倒过来画（单横杠 ⊥）。它和地符号（三条递减横杠）
			 * 形状不同，旁边还有网络名，图上不会误读。
			 *
			 * ## rot 参数 → 本体朝向
			 *
			 * 没有通用映射，每种符号的原生朝向不同，且 createNetFlag 的入参与
			 * 读回的 component.rotation 在 90/270 上是反的（传 90 存成 270）。
			 * 下表由真机标定得出（摆一排 rot 0/90/180/270，人眼确认朝上朝下，
			 * 再用「符号自带引脚的 rotation 背离本体」这条客观指纹补齐左右）：
			 *
			 *   rot 参数  |  Ground 本体  |  Power 本体
			 *      0      |      下       |     上
			 *     90      |      左       |     右
			 *    180      |      上       |     下
			 *    270      |      右       |     左
			 *
			 * 即 Power 恒比 Ground 差 180°。要改任何符号的朝向，先在真机上摆一排
			 * 标定，别从别的符号推。
			 *
			 * 端口不一样：它的朝向表示信号进出的方向，跟着引出方向走。
			 * （端口这四个值尚未做过真机标定，沿用旧值。）
			 */
			const bodyDirOf = (g: StubPin, clusterSize: number): BodyDir => {
				// 端口的本体沿引出方向伸，表示信号进出。
				if (g.what === 'port') {
					if (g.vx < 0) return 'left';
					if (g.vx > 0) return 'right';
					if (g.vy > 0) return 'up';
					return 'down';
				}
				// ── 独苗：按语义朝向 ──
				// 簇里只有一个引脚（电容、电阻这类两脚器件的电源地脚就是这种），
				// 前方没有邻居的引出线，不存在撞不撞的问题，就该画成语义正确的
				// 姿势：Power 本体朝上、Ground 本体朝下。
				//
				// 这条必须留。阶梯规则会让本体朝**引出的反侧**伸 —— 电容竖放时
				// +3V3 符号落在 pin1 上方 40 处，本体再往下伸 45，正好压回电容
				// 身上。多引脚芯片的密集扇出和单个器件是两种场景，不能共用一套
				// 规则（§4.10）。
				if (clusterSize <= 1) return g.kind === 'Power' ? 'up' : 'down';
				// ── 密集扇出：本体伸向阶梯变短的那一侧 ──
				// 水平引出按 y 升序排（y 小 = 靠下 = 线更短）→ 朝下
				// 垂直引出按 x 升序排（x 小 = 靠左 = 线更短）→ 朝左
				return g.vx !== 0 ? 'down' : 'left';
			};
			// Ground（与端口）的原生朝向：本体方向 → rot 参数。Power 恒差 180°。
			const GROUND_ROT: Record<BodyDir, number> = { down: 0, left: 90, up: 180, right: 270 };
			const flagRotOf = (g: StubPin, clusterSize: number): number => {
				const base = GROUND_ROT[bodyDirOf(g, clusterSize)];
				return g.what !== 'port' && g.kind === 'Power' ? (base + 180) % 360 : base;
			};

			/**
			 * 符号连文字占的地盘。
			 *
			 * 光管朝向不够：符号体是有尺寸的（GND 本体 21×10，带上网络名文字
			 * 更宽），器件一大，**横向**也会压到邻居那根线上。所以把整个包围盒
			 * 都登记进占位表，而不是只占落点那一个格子。
			 */
			const occupiedCells = new Map<string, string>();
			// 格子键必须先量化再拼字符串。引脚世界坐标是浮点算出来的，带着
			// 169.9999999999999 这种尾巴 —— 直接拼进键里，"1140,270" 和
			// "1140,270.0000001" 就是两个不同的键，占位表整个形同虚设：
			// 实测 C1 的 GND 向下引、C2 的 +3V3 向上引，在 (1140,250) 正面撞上
			// 接成一条，两条网络短路，而避让逻辑一无所知。
			const cellsAlong = (x1: number, y1: number, x2: number, y2: number): string[] => {
				const out: string[] = [];
				const ax = q5(x1);
				const ay = q5(y1);
				const bx = q5(x2);
				const by = q5(y2);
				const steps = Math.max(Math.abs(bx - ax), Math.abs(by - ay)) / 5;
				const sx = Math.sign(bx - ax);
				const sy = Math.sign(by - ay);
				for (let i = 0; i <= steps; i += 1) out.push(`${ax + sx * i * 5},${ay + sy * i * 5}`);
				return out;
			};

			// 按**本体方向**算，不能按 rot 算 —— Power 和 Ground 的 rot 含义差
			// 180°（见 flagRotOf 的标定表），拿同一张 rot 表套两种符号，Power
			// 的占地会记到反方向去，避让就完全失灵。
			const flagCells = (x: number, y: number, body: BodyDir): string[] => {
				const half = FLAG_WIDE / 2;
				let x0 = x;
				let x1 = x;
				let y0 = y;
				let y1 = y;
				if (body === 'down') { x0 = x - half; x1 = x + half; y0 = y - FLAG_LONG; y1 = y; }
				else if (body === 'up') { x0 = x - half; x1 = x + half; y0 = y; y1 = y + FLAG_LONG; }
				else if (body === 'left') { x0 = x - FLAG_LONG; x1 = x; y0 = y - half; y1 = y + half; }
				else { x0 = x; x1 = x + FLAG_LONG; y0 = y - half; y1 = y + half; }
				const out: string[] = [];
				for (let px = q5(x0); px <= q5(x1); px += 5) {
					for (let py = q5(y0); py <= q5(y1); py += 5) out.push(`${px},${py}`);
				}
				return out;
			};

			for (const [clusterKey, group] of clusters.entries()) {
				// 沿垂直于引出方向排序，阶梯才是单调的、线不会交叉
				const horizontal = group[0]?.vx !== 0;
				group.sort((a, b) => (horizontal ? a.y - b.y : a.x - b.x));
				const mid = (group.length - 1) / 2;
				group.forEach((g, idx) => {
					const rot = flagRotOf(g, group.length);
					const body = bodyDirOf(g, group.length);
					// 让不开就**贴回引脚**，绝不无限往外拉。
					// 实测放任它让下去，一个 GND 符号被推到 y=-920，那条纵贯
					// 整张图的引出线一路碰到别的引脚，反而制造出新的短路 ——
					// 为了好看把电路搞坏，不划算。贴在引脚上虽然可能和邻居的
					// 符号视觉重叠，但电气上一定是对的。
					const maxLen = FAN_BASE + (idx + 3) * FAN_STEP;
					let len = FAN_BASE + idx * FAN_STEP;
					let ex = g.x;
					let ey = g.y;
					let cells: string[] = [];
					let placedOut = false;
					while (len <= maxLen) {
						const tx = q5(g.x + g.vx * len);
						const ty = q5(g.y + g.vy * len);
						// 引出线经过的格子 ＋ 符号自己占的地盘，都不能压到别的网络
						const path = [...cellsAlong(g.x, g.y, tx, ty), ...flagCells(tx, ty, body)];
						// 同一簇内不算冲突。
						//
						// 簇内的符号是靠**长度**错开的（40 / 90 / 140…），x 各不相同；
						// 但符号占位宽 FLAG_WIDE=40，而同侧相邻引脚只差 10，垂直方向
						// 必然「重叠」。按重叠判的话第二个开始就一路往外让，让到上限
						// 还撞，最后全走退化路径贴回引脚 —— 实测 U1 的 VSSA、VSS_1
						// 就是这么变成「符号直接压在引脚上、一根引出线都没有」的。
						const clash =
							takenSpots.has(spotKey(tx, ty)) ||
							path.some((c) => {
								const owner = occupiedCells.get(c);
								if (!owner) return false;
								const at = owner.lastIndexOf('@');
								const oNet = at < 0 ? owner : owner.slice(0, at);
								const oCluster = at < 0 ? '' : owner.slice(at + 1);
								return oCluster !== clusterKey && oNet !== g.net;
							});
						if (!clash) {
							ex = tx;
							ey = ty;
							cells = path;
							placedOut = true;
							break;
						}
						len += FAN_STEP;
					}
					if (!placedOut) {
						// 退化：符号直接落在引脚上，不画引出线
						ex = q5(g.x);
						ey = q5(g.y);
						cells = flagCells(ex, ey, body);
					}
					takenSpots.add(spotKey(ex, ey));
					for (const c of cells) occupiedCells.set(c, `${g.net}@${clusterKey}`);
					const placed = { kind: g.kind, net: g.net, x: g.x, y: g.y, ex, ey, rot };
					if (g.what === 'port') ports.push({ ...placed, dir: 'BI' });
					else flags.push(placed);
				});
			}

// 端口落点已在上面那套阶梯引出里一起算好（与电源地符号同组错开）。

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

			// 增量模式下**不清场**：图上已有的东西是前面层的成果，抹掉就白做了。
			// 分层流程里每层只渲染一次，不会产生重复图元；真要重来就全量跑一遍。
			if (incremental) {
				trace.at('清场');
				trace.log('增量模式，跳过清场', {});
			} else {
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
			}

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
			// ── 摆完必须回读 ──
			// modify 的返回值只说明「调用没报错」。后面每一步（走线、符号、端口）
			// 都建立在「器件真的在算法以为的位置上」这个假设上 —— 假设一旦不成立，
			// 导线全部对不上引脚，而各步自报的数字仍然全是绿的。
			// eda_arrange_block 早就补了这道确认，这条渲染路径一直漏着。
			trace.at('摆器件回读');
			const wantPlaced = [...res.layout.entries()]
				.filter(([des]) => idToPrimitive.has(des))
				.map(([des, pl]) => ({ designator: des, x: pl.x, y: pl.y, rotation: pl.rot }));
			const placedCheck = await verifyPlaced(ctx, wantPlaced).catch((e) => {
				trace.error('回读器件位置失败', { error: e instanceof Error ? e.message : String(e) });
				return null;
			});
			if (placedCheck) {
				if (placedCheck.allOk) {
					trace.log(`${wantPlaced.length} 个器件的位置与角度已回读确认`, {});
				} else {
					trace.error('器件没摆到算法要求的位置 —— 后面的走线会成片对不上引脚', {
						概况: placedCheck.summary,
						明细: placedCheck.checks.filter((c) => !c.ok).slice(0, 8),
					});
				}
			}

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
					// 引出线不带网络名 —— 带了会让导线的 NET 标签和符号名把同一个
					// 网络名画两遍。沿引脚方向一条直线，不转向。
					// 退化成贴引脚时 ex/ey 就是引脚本身，不必画零长度的线
					if (f.ex !== f.x || f.ey !== f.y) {
						await eda.sch_PrimitiveWire.create([f.x, f.y, f.ex, f.ey]).catch(() => {});
					}
					if (await eda.sch_PrimitiveComponent.createNetFlag(f.kind, f.net, f.ex, f.ey, f.rot)) n += 1;
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
					if (p.ex !== p.x || p.ey !== p.y) {
						await eda.sch_PrimitiveWire.create([p.x, p.y, p.ex, p.ey]).catch(() => {});
					}
					if (await eda.sch_PrimitiveComponent.createNetPort(p.dir, p.net, p.ex, p.ey, p.rot)) n += 1;
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
					`${ENSURE_SCH}${saveMapCode(packMap(map), -400, -400)}`,
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
				parts_placed_verified: placedCheck ? placedCheck.allOk : null,
				map_saved: mapSaved,
				census_diff: diff ? { delta: diff.delta, changed: diff.changed, summary: diff.summary } : undefined,
				note: notes.join(' '),
			};
		},
	},
];
