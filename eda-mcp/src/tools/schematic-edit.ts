/**
 * 原理图写入工具。
 *
 * 真机已验证：放器件、画导线、放地符号。
 * 由 test-mcp.ts 第 [12] 段在沙箱工程（名字含「测试/test」）里覆盖。
 *
 * ── 一个 EDA 行为决定了这里的设计 ──────────────────────────────────
 * `sch_PrimitiveComponent.create()` 放出来的器件，位号是库里的**占位符**（如 `U?`），
 * 不会自动编号。多放几个就全叫 `U?`，既无法引用也无法连线（连自己身上去了）。
 * 所以 eda_place_component 放完会扫全图已用位号，补一个可用编号上去。
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
		name: 'eda_set_page_size',
		description:
			'【写操作】设置当前原理图页的图纸尺寸。默认新建的页是 A4（11.7 × 8.25 inch），' +
			'器件坐标超出这个范围就会掉到图框外面。' +
			'\n\n画大图前先设好尺寸：A4 约 1170×825、A3 约 1650×1170（单位 0.01 inch）。' +
			'不确定要多大时，先看蓝本/目标器件的坐标范围再选。' +
			'\n\n也可以用 width/height 直接给自定义尺寸（单位 inch）。',
		inputSchema: {
			type: 'object',
			properties: {
				size: { type: 'string', description: '图纸规格，如 A4 / A3 / A2 / A1 / A0' },
				width: { type: 'number', description: '自定义宽度（inch），与 size 二选一' },
				height: { type: 'number', description: '自定义高度（inch），与 size 二选一' },
			},
		},
		mutating: true,
		handler: async (args, ctx) => {
			const size = optionalString(args, 'size');
			const w = typeof args.width === 'number' ? args.width : null;
			const h = typeof args.height === 'number' ? args.height : null;
			// 实测：只写 Size / Page Size 不生效（返回 ok，图纸仍是 A4）。
			// 从界面改图纸规格时真正变的是「图纸宽度 / 图纸高度」（单位 inch），
			// 所以把规格换算成尺寸一并写下去，并按写回后的实际值判定成败。
			// 单位是 **0.01 inch**，和图元坐标一致 —— 不是 inch。
			// 实测：写 11.7 进去图纸会缩成 0.117 inch；界面上显示的 "11.7inch" 是换算后的展示值。
			const SHEETS: Record<string, [number, number]> = {
				A5: [827, 583], A4: [1170, 825], A3: [1655, 1170],
				A2: [2340, 1655], A1: [3310, 2340], A0: [4680, 3310],
			};
			const key = size ? size.toUpperCase() : '';
			if (size && !SHEETS[key] && !(w && h)) {
				throw new Error(`不认识的图纸规格 ${size}，可选 ${Object.keys(SHEETS).join(' / ')}，或直接给 width/height（inch）`);
			}
			// width/height 参数按 inch 收（对用户更自然），内部换算成 0.01 inch
			const [sw, sh] = SHEETS[key] ?? [Math.round((w ?? 0) * 100), Math.round((h ?? 0) * 100)];
			if (!size && !(w && h)) throw new Error('请给出 size（如 A3），或同时给出 width 与 height（inch）');
			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				// modifySchematicPageTitleBlock 只给部分字段会抛
				// 「Cannot set properties of undefined」—— 它内部按完整结构遍历，
				// 所以必须把现有 titleBlockData 整份读回来、改完再写回去。
				const before = _page.titleBlockData || {};
				const data = JSON.parse(JSON.stringify(before));
				const put = (k, v) => { data[k] = Object.assign({}, data[k] || {}, { value: String(v) }); };
				${size ? `put('Size', ${JSON.stringify(size)}); put('Page Size', ${JSON.stringify(size)});` : ''}
				put('Width', ${sw});
				put('Height', ${sh});
				const ok = await eda.dmt_Schematic.modifySchematicPageTitleBlock(undefined, data);
				// getCurrentSchematicPageInfo 读的是缓存，写完立刻读会拿到**上一次**的值
				// （实测写 1655 读回 16.55 —— 正是前一次写进去的数），等一下再读才是新值。
				await new Promise((r) => setTimeout(r, 400));
				const after = (await eda.dmt_Schematic.getCurrentSchematicPageInfo())?.titleBlockData || {};
				const read = (k) => after[k] && after[k].value !== undefined ? String(after[k].value) : undefined;
				return {
					ok: ok === true && Math.abs(Number(read('Width')) - ${sw}) < 0.05 && Math.abs(Number(read('Height')) - ${sh}) < 0.05,
					page: _page.name,
					size: read('Size'), page_size: read('Page Size'),
					canvas: { width: Number(read('Width')), height: Number(read('Height')) },
					inch: { width: Number(read('Width')) / 100, height: Number(read('Height')) / 100 },
					before: { size: before.Size && before.Size.value, width: before.Width && before.Width.value, height: before.Height && before.Height.value },
				};
			`,
					EDIT_TIMEOUT_MS,
				),
			);
		},
	},
	{
		name: 'eda_label_pin_net',
		description:
			'【写操作】给一个引脚引出一小段导线并标上网络名 —— **批量连接的首选方式**。' +
			'\n\n为什么不用长距离连线：原理图里交叉重合的导线会被 EDA 判定为电气相连。' +
			'自动生成的 L 型长路径在密集图里必然大量交叉，会把本不相干的网络连成一片' +
			'（实测一次复刻中 81 个引脚被误并进同一个网络）。' +
			'\n\n同名网络本来就电气相连，所以只要给每个引脚引出一小段带网络名的线，' +
			'不需要物理连通，也就不会误连。密集图、总线、电源地网络都该用这个。' +
			'\n\n两个引脚之间确实要画看得见的连线时，才用 eda_connect_pins。',
		inputSchema: {
			type: 'object',
			properties: {
				designator: { type: 'string', description: '器件位号，如 U1' },
				pin: { type: 'string', description: '引脚号或引脚名，如 3 或 VIN' },
				net: { type: 'string', description: '网络名，如 VCC_3V3' },
				length: { type: 'number', description: '引出线长度（0.01 inch），默认 20' },
			},
			required: ['designator', 'pin', 'net'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const des = requireString(args, 'designator');
			const pin = requireString(args, 'pin');
			const net = requireString(args, 'net');
			const len = typeof args.length === 'number' && args.length > 0 ? args.length : 20;
			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				const des = ${JSON.stringify(des)}.toUpperCase();
				const key = ${JSON.stringify(pin)}.toUpperCase();
				const all = await eda.sch_PrimitiveComponent.getAll();
				const c = all.find(x => String(x.designator || '').toUpperCase() === des);
				if (!c) return { ok: false, error: '找不到位号 ' + des };
				const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId);
				const p = (pins || []).find(x => String(x.pinNumber || '').toUpperCase() === key)
					|| (pins || []).find(x => String(x.pinName || '').toUpperCase() === key);
				if (!p) return { ok: false, error: des + ' 上找不到引脚 ' + key,
					pins: (pins||[]).map(x => x.pinNumber + ':' + x.pinName) };

				// 顺着引脚朝向引出，避免线压在符号上
				const L = ${len};
				const r = ((Number(p.rotation) % 360) + 360) % 360;
				const d = r === 0 ? [L, 0] : r === 90 ? [0, -L] : r === 180 ? [-L, 0] : r === 270 ? [0, L] : [L, 0];
				const line = [p.x, p.y, p.x + d[0], p.y + d[1]];
				const w = await eda.sch_PrimitiveWire.create(line, ${JSON.stringify(net)});
				if (!w) return { ok: false, error: '引出线创建失败（该引脚可能已属于别的已命名网络）', attempted: line };
				return { ok: true, pin: des + '.' + p.pinNumber, net: ${JSON.stringify(net)}, path: line, wire_id: w.primitiveId };
			`,
					EDIT_TIMEOUT_MS,
				),
			);
		},
	},
	{
		name: 'eda_label_nets',
		description:
			'【写操作】按一份网络声明批量标注引脚 —— eda_label_pin_net 的批量版，' +
			'吃的是和 eda_arrange_block 完全相同的 nets 参数：' +
			'{ "+24V": ["U1.3","C11.1"], "GND": ["U1.1","C11.2"] }。' +
			'\n\n**同一份声明先排布、再标注**，写一次用两处，也保证了摆位依据和电气连接是同一套东西。' +
			'一个功能块动辄十几二十个引脚，逐个调用要几分钟，这里一次搞定。' +
			'\n\n顺序很重要：**先把块排布定稿再标注**。标注会在引脚旁画出短导线，' +
			'之后再移动器件，导线会留在原地，连接就断了。',
		inputSchema: {
			type: 'object',
			properties: {
				nets: {
					type: 'object',
					description: '{ 网络名: ["位号.引脚号", …] }，与 eda_arrange_block 的 nets 同格式',
					additionalProperties: { type: 'array', items: { type: 'string' } },
				},
				length: { type: 'number', description: '每个引脚引出线的长度（0.01 inch），默认 20' },
			},
			required: ['nets'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const nets = (args.nets && typeof args.nets === 'object' ? args.nets : {}) as Record<string, string[]>;
			const len = typeof args.length === 'number' && args.length > 0 ? args.length : 20;
			const jobs: Array<{ des: string; pin: string; net: string }> = [];
			for (const [net, refs] of Object.entries(nets)) {
				for (const ref of Array.isArray(refs) ? refs : []) {
					const dot = String(ref).lastIndexOf('.');
					if (dot <= 0) continue;
					jobs.push({ des: String(ref).slice(0, dot).toUpperCase(), pin: String(ref).slice(dot + 1), net });
				}
			}
			if (!jobs.length) throw new Error('nets 里没有可解析的 "位号.引脚号" 条目');

			const r = await ctx.exec<Record<string, unknown>>(
				`
				${ENSURE_SCH}
				const JOBS = ${JSON.stringify(jobs)};
				const L = ${len};
				const all = await eda.sch_PrimitiveComponent.getAll();
				const byDes = {};
				for (const c of all) if (c.designator) byDes[String(c.designator).toUpperCase()] = c;

				const pinCache = {};
				const getPins = async (des) => {
					if (!pinCache[des]) {
						const c = byDes[des];
						pinCache[des] = c ? (await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId) || []) : [];
					}
					return pinCache[des];
				};

				const done = [], failed = [];
				for (const j of JOBS) {
					if (!byDes[j.des]) { failed.push({ ref: j.des + '.' + j.pin, why: '图上没有这个位号' }); continue; }
					const pins = await getPins(j.des);
					const key = String(j.pin).toUpperCase();
					let p = null;
					for (const x of pins) if (String(x.pinNumber || '').toUpperCase() === key) { p = x; break; }
					if (!p) for (const x of pins) if (String(x.pinName || '').toUpperCase() === key) { p = x; break; }
					if (!p) {
						const avail = pins.map((x) => x.pinNumber + ':' + x.pinName).join(' ');
						failed.push({ ref: j.des + '.' + j.pin, why: '找不到该引脚', pins: avail });
						continue;
					}
					// 顺着引脚朝向往外引，从符号内侧接入的话 EDA 不认这个连接
					const rot = ((Number(p.rotation) % 360) + 360) % 360;
					const d = rot === 0 ? [L, 0] : rot === 90 ? [0, -L] : rot === 180 ? [-L, 0] : rot === 270 ? [0, L] : [L, 0];
					const w = await eda.sch_PrimitiveWire.create([p.x, p.y, p.x + d[0], p.y + d[1]], j.net);
					if (w) done.push(j.des + '.' + p.pinNumber + '=' + j.net);
					else failed.push({ ref: j.des + '.' + j.pin, why: '引出线创建失败（该引脚可能已属于别的网络）' });
				}
				return { ok: failed.length === 0, labeled: done.length, total: JOBS.length, done, failed };
			`,
				180_000,
			);
			return schHint(r);
		},
	},
	{
		name: 'eda_arrange_block',
		description:
			'【写操作】把一个功能块排布好：核心芯片居中，外围器件按**它接在芯片哪一侧的引脚**放到对应方位。' +
			'\n\n这一步是纯几何计算，交给工具做；**哪些器件属于同一个功能块是你的判断**，' +
			'要先读 eda-schematic-layout skill 想清楚再调。' +
			'\n\n工具会读取每个器件符号的实际尺寸（bbox）来决定间距，避免互相压住 —— ' +
			'固定间距在大芯片（十几个引脚）上必然重叠。' +
			'\n\n外围器件与核心共享哪条网络、那条网络接在核心的哪个引脚上，决定它被放到左/右/上/下。' +
			'接电源网络的（去耦电容）放上方，接地的放下方，其余按引脚方位。' +
			'\n\n排完整块再调 eda_auto_route。',
		inputSchema: {
			type: 'object',
			properties: {
				core: { type: 'string', description: '核心器件位号，通常是芯片，如 U5' },
				members: { type: 'array', items: { type: 'string' }, description: '块内其余器件位号，如 ["R15","R16","C19"]' },
				center_x: { type: 'number', description: '块中心 X（0.01 inch）' },
				center_y: { type: 'number', description: '块中心 Y（0.01 inch）' },
				gap: { type: 'number', description: '器件之间的净间隙，默认 60（0.01 inch）' },
				nets: {
					type: 'object',
					description:
						'本块的连接声明，**强烈建议传**：{ "+24V": ["U1.3","C11.1"], "GND": ["U1.1","C11.2"] }，' +
						'键是网络名、值是 "位号.引脚号" 列表。器件刚放下时图上还没有任何网络，' +
						'不传这个参数工具就无从判断谁该放左、谁该放右，只能全堆到右边一列。' +
						'同一份声明可以原样喂给 eda_label_pin_net 做标注 —— 写一次，用两处。',
					additionalProperties: { type: 'array', items: { type: 'string' } },
				},
				max_per_lane: {
					type: 'number',
					description: '同一侧排满几个就换下一列/行，默认 3。防止外围器件排成长条顶出图框。',
				},
			},
			required: ['core', 'members', 'center_x', 'center_y'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const core = requireString(args, 'core').toUpperCase();
			const members = (Array.isArray(args.members) ? (args.members as string[]) : []).map((m) => String(m).toUpperCase());
			const cx = num(args, 'center_x');
			const cy = num(args, 'center_y');
			const gap = typeof args.gap === 'number' ? args.gap : 60;
			const nets = (args.nets && typeof args.nets === 'object' ? args.nets : {}) as Record<string, string[]>;
			// 一侧最多排几个才换列。默认 3：再多就顶出图框，也超出了「一眼看清一组」的范围
			const MAX_PER_LANE = typeof args.max_per_lane === 'number' && args.max_per_lane > 0 ? args.max_per_lane : 3;

			// 位号.引脚号 -> 网络名。AI 声明的连接关系是排布的唯一依据 ——
			// 器件刚放下时图上还没有网络，靠读 p.net 什么都判断不出来。
			const declared = new Map<string, string>();
			const netsOfDes = new Map<string, Set<string>>();
			for (const [net, refs] of Object.entries(nets)) {
				for (const ref of Array.isArray(refs) ? refs : []) {
					const dot = String(ref).lastIndexOf('.');
					if (dot <= 0) continue;
					const des = String(ref).slice(0, dot).toUpperCase();
					declared.set(`${des}.${String(ref).slice(dot + 1)}`, net);
					if (!netsOfDes.has(des)) netsOfDes.set(des, new Set());
					netsOfDes.get(des)?.add(net);
				}
			}

			// ── 第一趟：只取数据，不做判断 ──
			type Info = { des: string; id: string; w: number; h: number; pins: Array<{ n: string; x: number; y: number }> };
			const snap = await ctx.exec<{ items?: Info[] }>(
				`
				${ENSURE_SCH}
				const WANT = ${JSON.stringify([core, ...members])};
				const all = await eda.sch_PrimitiveComponent.getAll();
				const byDes = {};
				for (const c of all) if (c.designator) byDes[String(c.designator).toUpperCase()] = c;
				const items = [];
				for (const des of WANT) {
					const c = byDes[des];
					if (!c) continue;
					const b = await eda.sch_Primitive.getPrimitivesBBox([c.primitiveId]).catch(() => undefined);
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId).catch(() => []);
					items.push({
						des: des,
						id: c.primitiveId,
						w: b ? Math.max(20, b.maxX - b.minX) : 60,
						h: b ? Math.max(20, b.maxY - b.minY) : 60,
						pins: (pins || []).map((p) => ({
							n: String(p.pinNumber != null ? p.pinNumber : (p.number != null ? p.number : '')),
							x: p.x, y: p.y,
						})),
					});
				}
				return { ok: true, items };
			`,
				120_000,
			);
			const items = new Map((snap.items ?? []).map((i) => [i.des, i]));
			const coreInfo = items.get(core);
			if (!coreInfo) return { ok: false, error: `找不到核心器件 ${core}` };

			// ── 几何计算全在 Node 侧：可打印、可回归，不用为了看一个中间值重启整条链路 ──
			const GND = ['GND', 'AGND', 'DGND', 'PGND', 'SGND', 'VSS', 'VEE'];
			const isGnd = (n: string) => GND.includes(n.toUpperCase());
			const isSupply = (n: string) => {
				const u = n.toUpperCase();
				if (u.startsWith('VCC') || u.startsWith('VDD') || u.startsWith('VBAT') || u === 'V+') return true;
				return /^[+0-9]/.test(u) && u.includes('V');
			};

			// 核心的每条网络挂在哪一侧 —— 拿核心自己的引脚坐标跟引脚重心比
			const gx = coreInfo.pins.reduce((a, q) => a + q.x, 0) / Math.max(1, coreInfo.pins.length);
			const gy = coreInfo.pins.reduce((a, q) => a + q.y, 0) / Math.max(1, coreInfo.pins.length);
			const netSide = new Map<string, 'L' | 'R' | 'T' | 'B'>();
			for (const p of coreInfo.pins) {
				const net = declared.get(`${core}.${p.n}`);
				if (!net) continue;
				const dx = p.x - gx, dy = p.y - gy;
				// EDA 原理图 y 轴**向上为正**（实测：y=1010 的器件显示在 y=220 的上方）。
				// dy > 0 才是「在核心上方」，别照搬屏幕坐标的直觉写反。
				const side = Math.abs(dx) >= Math.abs(dy) ? (dx < 0 ? 'L' : 'R') : dy > 0 ? 'T' : 'B';
				if (!netSide.has(net)) netSide.set(net, side);
			}

			const buckets: Record<'L' | 'R' | 'T' | 'B', string[]> = { L: [], R: [], T: [], B: [] };
			const unresolved: string[] = [];
			const anchorOf = new Map<string, { x: number; y: number } | null>();
			for (const des of members) {
				if (!items.has(des)) {
					unresolved.push(`${des}(图上没有)`);
					continue;
				}
				const mine = [...(netsOfDes.get(des) ?? [])];
				// 优先跟着核心的引脚方位走；只接电源/地的（去耦电容）按惯例上电源下地
				let side = mine.map((n) => netSide.get(n)).find(Boolean) as 'L' | 'R' | 'T' | 'B' | undefined;
				if (!side && mine.some(isSupply)) side = 'T';
				if (!side && mine.some(isGnd)) side = 'B';
				if (!side) {
					side = 'R';
					unresolved.push(des);
				}
				// 记下它挂在核心的哪个引脚上 —— 同侧多个器件要按这个坐标排序，
				// 否则接 VIN 的和接 VOUT 的混着放，线必然交叉。
				const anchorPin = coreInfo.pins.find((cp) => {
					const n = declared.get(`${core}.${cp.n}`);
					return n != null && mine.includes(n);
				});
				anchorOf.set(des, anchorPin ? { x: anchorPin.x, y: anchorPin.y } : null);
				buckets[side].push(des);
			}

			const moves: Array<{ des: string; id: string; x: number; y: number; side: string }> = [
				{ des: core, id: coreInfo.id, x: Math.round(cx), y: Math.round(cy), side: 'core' },
			];
			const halfW = coreInfo.w / 2;
			const halfH = coreInfo.h / 2;
			for (const side of ['L', 'R', 'T', 'B'] as const) {
				const list = buckets[side];
				if (!list.length) continue;
				// 按所连核心引脚的坐标排序，让连线顺着引脚顺序走，不交叉
				const key = (d: string) => {
					const a = anchorOf.get(d);
					if (!a) return Number.MAX_SAFE_INTEGER;
					return side === 'L' || side === 'R' ? a.y : a.x;
				};
				list.sort((a, b) => key(a) - key(b));
				const sizes = list.map((d) => items.get(d) as Info);
				// 同一侧器件多了要分多列/多行排，不能一条线排下去 ——
				// AMS1117 这类「信号脚全在同一侧」的符号，外围器件会全归到一边，
				// 排成一列的话七八个器件就顶出图框了（实测 y 跑到 -25）。
				const lanes = Math.ceil(list.length / MAX_PER_LANE);
				const perLane = Math.ceil(list.length / lanes);
				const maxW = Math.max(...sizes.map((s) => s.w));
				const maxH = Math.max(...sizes.map((s) => s.h));
				if (side === 'L' || side === 'R') {
					const pitch = maxH + gap;
					const dir = side === 'L' ? -1 : 1;
					list.forEach((des, i) => {
						const lane = Math.floor(i / perLane);
						const inLane = i % perLane;
						const n = Math.min(perLane, list.length - lane * perLane);
						moves.push({
							des,
							id: (items.get(des) as Info).id,
							side,
							x: Math.round(cx + dir * (halfW + gap + maxW / 2 + lane * (maxW + gap))),
							y: Math.round(cy - ((n - 1) * pitch) / 2 + inLane * pitch),
						});
					});
				} else {
					const pitch = maxW + gap;
					const dir = side === 'T' ? 1 : -1; // T = 图纸上方 = y 更大
					list.forEach((des, i) => {
						const lane = Math.floor(i / perLane);
						const inLane = i % perLane;
						const n = Math.min(perLane, list.length - lane * perLane);
						moves.push({
							des,
							id: (items.get(des) as Info).id,
							side,
							x: Math.round(cx - ((n - 1) * pitch) / 2 + inLane * pitch),
							y: Math.round(cy + dir * (halfH + gap + maxH / 2 + lane * (maxH + gap))),
						});
					});
				}
			}

			// ── 第二趟：批量写回 ──
			const w = await ctx.exec<{ moved?: number }>(
				`
				${ENSURE_SCH}
				const MOVES = ${JSON.stringify(moves.map((m) => ({ id: m.id, x: m.x, y: m.y })))};
				let moved = 0;
				for (const m of MOVES) {
					const r = await eda.sch_PrimitiveComponent.modify(m.id, { x: m.x, y: m.y });
					if (r !== false) moved += 1;
				}
				return { ok: true, moved };
			`,
				180_000,
			);

			const minY = Math.min(...moves.map((m) => m.y));
			const minX = Math.min(...moves.map((m) => m.x));
			const outOfFrame = minX < 40 ? `x=${minX}` : minY < 40 ? `y=${minY}` : null;
			return schHint({
				ok: true,
				core,
				core_size: { w: coreInfo.w, h: coreInfo.h },
				declared_pins: declared.size,
				moved: w.moved,
				placed: moves.map((m) => ({ des: m.des, side: m.side, x: m.x, y: m.y })),
				unresolved: unresolved.length ? unresolved : undefined,
				warning:
					declared.size === 0
						? '没传 nets 声明，无从判断方位，器件全堆到了右边一列 —— 补上 nets 再排一次'
						: minY < 40
							? `最上面的器件 y=${minY} 已贴近图框上沿，把 center_y 调大些`
							: undefined,
				note: '块内已按声明的连接关系排布。整张图排完后跑 eda_auto_route。',
			});
		},
	},

	{
		name: 'eda_arrange_components',
		description:
			'【写操作】批量移动 / 旋转器件 —— 功能分区布局的执行手段。' +
			'\n\n一次传多个 {designator, x, y, rotation?, mirror?}，比逐个调用快得多。' +
			'坐标单位 0.01 inch，rotation 逆时针为正。' +
			'\n\n**典型用法是按功能分区**：先想清楚这张图分几个功能块（电源、时钟、MCU、' +
			'模拟前端、ADC/DAC、接口…），给每块划一片图纸区域，再把各块的器件摆进去。' +
			'摆完跑 eda_auto_route，连线自然就短而清晰。' +
			'\n\n只想让算法排、不在意分区时，用 eda_auto_layout 更省事。',
		inputSchema: {
			type: 'object',
			properties: {
				placements: {
					type: 'array',
					description: '每项 {designator, x, y, rotation?, mirror?}',
					items: {
						type: 'object',
						properties: {
							designator: { type: 'string' },
							x: { type: 'number' },
							y: { type: 'number' },
							rotation: { type: 'number' },
							mirror: { type: 'boolean' },
						},
						required: ['designator', 'x', 'y'],
					},
				},
			},
			required: ['placements'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const list = args.placements;
			if (!Array.isArray(list) || !list.length) throw new Error('placements 必须是非空数组');
			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				const want = ${JSON.stringify(list)};
				const all = await eda.sch_PrimitiveComponent.getAll();
				const byDes = {};
				for (const c of all) if (c.designator) byDes[String(c.designator).toUpperCase()] = c;
				const okList = [], failList = [];
				for (const w of want) {
					const c = byDes[String(w.designator).toUpperCase()];
					if (!c) { failList.push({ designator: w.designator, error: '找不到该位号' }); continue; }
					const prop = { x: w.x, y: w.y };
					if (w.rotation !== undefined) prop.rotation = w.rotation;
					if (w.mirror !== undefined) prop.mirror = w.mirror;
					const m = await eda.sch_PrimitiveComponent.modify(c.primitiveId, prop);
					if (m) okList.push(w.designator); else failList.push({ designator: w.designator, error: 'modify 返回失败' });
				}
				return { ok: failList.length === 0, moved: okList.length, failed: failList.length,
					failures: failList.slice(0, 10), page: _page.name,
					note: '位置变了，记得跑 eda_auto_route 重新整理连线。' };
			`,
					180_000,
				),
			);
		},
	},
	{
		name: 'eda_auto_route',
		description:
			'【写操作】让 EDA 自动整理当前原理图页的连线，把散落的短引出线整理成正规走线。' +
			'\n\n**必须传 nets**（和 eda_arrange_block / eda_label_nets 同一份声明）。' +
			'实测 EDA 的布线算法在重组连线时会把导线从引脚上扯掉 —— ' +
			'一次全图布线后 148 个引脚只剩 60 个还连着，而 DRC 照样报 0 错误、' +
			'器件和网络名也都还在，光看 DRC 根本发现不了。' +
			'\n\n传了 nets，工具会在布线后逐个引脚核对，把被扯掉的重新接回去，并报告修复数量。' +
			'不传就只布线不校验，**断了也不会有人告诉你**。' +
			'\n\n工作流：eda_place_component → eda_arrange_block(nets) → ' +
			'eda_label_nets(nets) → **eda_auto_route(nets)**。',
		inputSchema: {
			type: 'object',
			properties: {
				component_uuids: {
					type: 'array',
					items: { type: 'string' },
					description: '可选，只处理这些器件（图元 id）；不给则处理全图所有未布线网络',
				},
				nets: {
					type: 'object',
					description:
						'**强烈建议传**，格式与 eda_arrange_block / eda_label_nets 完全相同：' +
						'{ "+24V": ["U1.3","C11.1"], … }。布线算法会扯断引脚连接，' +
						'有了这份声明工具才能核对并自动接回。',
					additionalProperties: { type: 'array', items: { type: 'string' } },
				},
			},
		},
		mutating: true,
		handler: async (args, ctx) => {
			const uuids = Array.isArray(args.component_uuids) ? (args.component_uuids as string[]) : null;
			const nets = (args.nets && typeof args.nets === 'object' ? args.nets : {}) as Record<string, string[]>;
			const jobs: Array<{ des: string; pin: string; net: string }> = [];
			for (const [net, refs] of Object.entries(nets)) {
				for (const ref of Array.isArray(refs) ? refs : []) {
					const dot = String(ref).lastIndexOf('.');
					if (dot <= 0) continue;
					jobs.push({ des: String(ref).slice(0, dot).toUpperCase(), pin: String(ref).slice(dot + 1), net });
				}
			}
			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				const stat = async () => {
					const src = await eda.sys_FileManager.getDocumentSource();
					const n = (t) => (src.match(new RegExp('"type":"' + t + '"', 'g')) || []).length;
					return { wires: n('WIRE'), lines: n('LINE') };
				};
				const before = await stat();
				const t0 = Date.now();
				const props = ${uuids ? `{ uuids: ${JSON.stringify(uuids)} }` : 'undefined'};
				await eda.sch_Document.autoRouting(props);
				const after = await stat();

				// ── 布线后自检：EDA 的算法会把导线从引脚上扯掉 ──
				// getDocumentSource 有缓存，布线刚结束就读会拿到旧内容，看起来一切正常。
				// 必须等一下再读，否则这段校验形同虚设。
				const JOBS = ${JSON.stringify(jobs)};
				let repaired = 0, stillOff = [];
				if (JOBS.length) {
					await new Promise((r) => setTimeout(r, 1500));
					const endpoints = () => {
						const out = [];
						for (const ln of String(srcCache).split('\n')) {
							if (ln.indexOf('"type":"LINE"') < 0) continue;
							const q = ln.indexOf('||');
							if (q < 0) continue;
							let body = ln.slice(q + 2);
							const last = body.lastIndexOf('|');
							if (last >= 0) body = body.slice(0, last);
							let o = null;
							try { o = JSON.parse(body); } catch (e) { continue; }
							if (o.startX == null) continue;
							out.push([o.startX, -o.startY]);
							out.push([o.endX, -o.endY]);
						}
						return out;
					};
					var srcCache = await eda.sys_FileManager.getDocumentSource();
					let pts = endpoints();

					const all = await eda.sch_PrimitiveComponent.getAll();
					const byDes = {};
					for (const c of all) if (c.designator) byDes[String(c.designator).toUpperCase()] = c;
					const pinCache = {};
					const getPins = async (des) => {
						if (!pinCache[des]) {
							const c = byDes[des];
							pinCache[des] = c ? (await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId) || []) : [];
						}
						return pinCache[des];
					};

					for (const j of JOBS) {
						const pins = await getPins(j.des);
						const key = String(j.pin).toUpperCase();
						let p = null;
						for (const x of pins) if (String(x.pinNumber || '').toUpperCase() === key) { p = x; break; }
						if (!p) for (const x of pins) if (String(x.pinName || '').toUpperCase() === key) { p = x; break; }
						if (!p) continue;
						let ok = false;
						for (const pt of pts) {
							if (Math.abs(pt[0] - p.x) + Math.abs(pt[1] - p.y) < 2) { ok = true; break; }
						}
						if (ok) continue;
						// 接回去。长度取 30 而不是 20 ——
						// 实测 stub 端点落在别的线端点旁边 1-2 个单位时，create 会静默失败
						// （返回对象但线不落在引脚上），拉长一点就能避开。
						const rot = ((Number(p.rotation) % 360) + 360) % 360;
						const L = 30;
						const d = rot === 0 ? [L, 0] : rot === 90 ? [0, -L] : rot === 180 ? [-L, 0] : rot === 270 ? [0, L] : [L, 0];
						const w = await eda.sch_PrimitiveWire.create([p.x, p.y, p.x + d[0], p.y + d[1]], j.net);
						if (w) repaired += 1;
						else stillOff.push(j.des + '.' + j.pin);
					}
				}

				return {
					ok: true, page: _page.name, elapsed_ms: Date.now() - t0,
					before, after,
					checked_pins: JOBS.length,
					repaired_after_routing: repaired,
					still_disconnected: stillOff.length ? stillOff : undefined,
					note: JOBS.length
						? (repaired
							? '布线算法扯断了 ' + repaired + ' 个引脚连接，已按 nets 声明接回。'
							: '布线完成，所有声明的引脚连接都还在。')
						: '**没传 nets，没做连接校验** —— 布线算法可能已经扯断引脚连接，DRC 查不出来。建议传 nets 重跑。',
				};
			`,
					180_000,
				),
			);
		},
	},
	{
		name: 'eda_auto_layout',
		description:
			'【写操作】让 EDA 自动布局当前原理图页的器件位置。' +
			'\n\n适用于从零画图、还没想好器件怎么摆的时候：先随便放下去，再让算法排。' +
			'如果器件位置是照着参考图摆的（比如复刻），**不要用**，会打乱原有布局。' +
			'\n\ndevice_types 把位号映射到器件类别（resistor / capacitor / inductive / diode /' +
			' triode / oscillator / chip / otherDevice），算法会据此优化摆放 —— 给了会明显更整齐。' +
			'\n\n布局改变后应重新跑 eda_auto_route。',
		inputSchema: {
			type: 'object',
			properties: {
				component_uuids: { type: 'array', items: { type: 'string' }, description: '可选，只布局这些器件' },
				device_types: {
					type: 'object',
					description: '可选，位号 → 类别，如 {"R1":"resistor","C1":"capacitor","U1":"chip"}',
					additionalProperties: { type: 'string' },
				},
			},
		},
		mutating: true,
		handler: async (args, ctx) => {
			const uuids = Array.isArray(args.component_uuids) ? (args.component_uuids as string[]) : null;
			const types = args.device_types && typeof args.device_types === 'object' ? args.device_types : null;
			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				const props = {};
				${uuids ? `props.uuids = ${JSON.stringify(uuids)};` : ''}
				${types ? `props.designatorDeviceTypeMap = ${JSON.stringify(types)};` : ''}
				const t0 = Date.now();
				await eda.sch_Document.autoLayout(Object.keys(props).length ? props : undefined);
				const comps = await eda.sch_PrimitiveComponent.getAll();
				return {
					ok: true, page: _page.name, elapsed_ms: Date.now() - t0,
					component_count: comps.length,
					note: '布局已重排。位置变了，接着跑 eda_auto_route 重新整理连线。',
				};
			`,
					180_000,
				),
			);
		},
	},
	{
		name: 'eda_place_component',
		description:
			'【写操作】在当前原理图页放置一个元器件。' +
			'\n\n用立创商城编号（lcsc_id）最方便，也可以直接给 device_uuid + library_uuid（从 eda_library_search 拿）。' +
			'\n\n**放器件前先规划功能分区** —— 见 eda-schematic-layout skill。' +
			'按清单顺序随手摆会让连线横穿整张图、无法阅读；分区是设计判断，工具只负责执行。' +
			'\n\n**坐标单位是 0.01 inch**（A4 图纸约 1170 × 830），rotation 逆时针为正。' +
			'\n\n**位号会自动分配**（U1、U2、R1…）：EDA 的 create 接口放出来的器件位号是库里的占位符（如 `U?`），' +
			'多个器件会重名、没法引用，所以本工具放置后会扫描全图已用位号并补上下一个可用编号。' +
			'也可以用 designator 参数指定，重复时会报错。' +
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
				designator: { type: 'string', description: '可选，指定位号如 U5；不给则自动分配下一个可用编号' },
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
			const wantDes = optionalString(args, 'designator');

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
				// 位号在整份原理图（所有页）内唯一，算下一个编号要看全部页
				const usedAll = await eda.sch_PrimitiveComponent.getAll(undefined, true);
				const used = new Set(usedAll.map(x => String(x.designator || '').toUpperCase()));
				const before = (await eda.sch_PrimitiveComponent.getAll()).length;

				const c = await eda.sch_PrimitiveComponent.create(
					{ libraryUuid: libUuid, uuid }, ${x}, ${y}, undefined, ${rotation}, ${mirror}
				);
				const after = await eda.sch_PrimitiveComponent.getAll();
				if (!c && after.length === before) return { ok: false, error: '放置失败，EDA 未返回图元且器件数没有增加' };

				// EDA 放出来的位号是库里的占位符（U?），不编号的话多个器件会重名、无法引用
				const raw = String(c.designator || '');
				const want = ${JSON.stringify(wantDes ?? null)};
				let finalDes = raw;
				let assigned = false;
				let assignError;

				if (want) {
					if (used.has(want.toUpperCase())) {
						assignError = '位号 ' + want + ' 已被占用，已保留自动分配的编号';
					} else {
						const m = await eda.sch_PrimitiveComponent.modify(c.primitiveId, { designator: want });
						const fresh = await eda.sch_PrimitiveComponent.getAll(undefined, true);
						const dup = fresh.filter(x => String(x.designator || '').toUpperCase() === want.toUpperCase()).length;
						if (m && dup === 1) { finalDes = want; assigned = true; }
						else assignError = dup > 1 ? '位号 ' + want + ' 出现重复，已放弃指定' : '设置指定位号失败';
					}
				}
				if (!assigned && (raw === '' || raw.indexOf('?') >= 0)) {
					// 前缀取自库里的占位符：U? → U；没有就退回 U
					// 注意这里刻意不写含反斜杠的正则 —— 这段代码是放在 TS 模板字符串里传给 EDA 执行的，
					// 模板字符串会把 \? \d 这类无效转义的反斜杠吃掉，到了 EDA 那边就成了非法正则。
					const prefix = (raw.replace(/[?0-9]+$/, '') || 'U').toUpperCase();
					// 改完必须重新查全图确认唯一 —— getAll 相对写入有延迟，只凭放置前那一次快照算编号，
					// 连续放置时会算出同一个号，两个器件同位号。位号重复会让整张图**导不出网表**
					// （DRC 报致命错误），代价远大于多查几次。
					let n = 1;
					for (let attempt = 0; attempt < 40 && !assigned; attempt++) {
						while (used.has(prefix + n)) n++;
						const auto = prefix + n;
						const m = await eda.sch_PrimitiveComponent.modify(c.primitiveId, { designator: auto });
						if (!m) { assignError = '自动编号失败，位号仍是占位符 ' + raw; break; }
						const fresh = await eda.sch_PrimitiveComponent.getAll(undefined, true);
						const dup = fresh.filter(x => String(x.designator || '').toUpperCase() === auto).length;
						if (dup === 1) { finalDes = auto; assigned = true; }
						else { fresh.forEach(x => used.add(String(x.designator || '').toUpperCase())); n++; }
					}
					if (!assigned && !assignError) assignError = '连续 40 次都撞上重名，未能分配唯一位号';
				}

				return {
					ok: true,
					placed: { primitive_id: c.primitiveId, designator: finalDes, x: c.x, y: c.y },
					designator_assigned: assigned,
					designator_note: assignError,
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
		name: 'eda_component_pins',
		description:
			'列出某个器件在画布上的所有引脚：引脚号、引脚名、**绝对坐标**、朝向、电气类型。' +
			'\n\n这是自动连线的前提 —— 坐标已经算好了器件的位置与旋转，直接就是可以落线的点。' +
			'\n\nrotation 表示引脚朝外的方向：0 朝右、90 朝上、180 朝左、270 朝下。' +
			'连线时第一段应顺着这个方向引出，否则线会压在器件符号上。',
		inputSchema: {
			type: 'object',
			properties: { designator: { type: 'string', description: '器件位号，如 U1' } },
			required: ['designator'],
		},
		handler: async (args, ctx) => {
			const des = requireString(args, 'designator');
			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				const want = ${JSON.stringify(des)}.toUpperCase();
				const all = await eda.sch_PrimitiveComponent.getAll();
				const c = all.find(x => String(x.designator || '').toUpperCase() === want);
				if (!c) return { error: '当前原理图页里没有位号 ' + want, available: all.map(x => x.designator).filter(Boolean).slice(0, 40) };
				const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId);
				// 符号实际占多大是布局的必要输入 —— 不知道尺寸就只能猜间距，器件会互相压住
				const bbox = await eda.sch_Primitive.getPrimitivesBBox([c.primitiveId]).catch(() => undefined);
				return {
					designator: c.designator,
					component: { primitive_id: c.primitiveId, x: c.x, y: c.y, rotation: c.rotation },
					bbox: bbox ? { ...bbox, width: bbox.maxX - bbox.minX, height: bbox.maxY - bbox.minY } : undefined,
					pin_count: (pins || []).length,
					pins: (pins || []).map(p => ({
						number: p.pinNumber, name: p.pinName,
						x: p.x, y: p.y, rotation: p.rotation,
						type: p.pinType, no_connect: p.noConnected,
					})),
				};
			`,
					EDIT_TIMEOUT_MS,
				),
			);
		},
	},
	{
		name: 'eda_connect_pins',
		description:
			'【写操作】把两个器件引脚用导线连起来 —— 自动查引脚坐标并生成折线路径。' +
			'\n\n引脚用「位号.引脚号」或「位号.引脚名」指定，如 `U1.3`、`U1.VIN`、`R1.2`。' +
			'\n\n这是自动画原理图的主力工具，比手工算坐标调 eda_draw_wire 可靠得多。' +
			'\n\n路径默认按起点引脚的朝向选择先横后竖还是先竖后横（顺着引脚引出，避免压在符号上）；' +
			'两脚同一水平线或垂直线上则直连。' +
			'\n\n**网络冲突会失败**：如果两端引脚已分别属于不同的已命名网络，EDA 会拒绝创建，' +
			'这时要先用网络标签统一命名，而不是反复重试。',
		inputSchema: {
			type: 'object',
			properties: {
				from: { type: 'string', description: '起点引脚，如 U1.3 或 U1.VIN' },
				to: { type: 'string', description: '终点引脚，如 C1.1' },
				net: { type: 'string', description: '可选，指定网络名' },
				route: {
					type: 'string',
					enum: ['auto', 'hv', 'vh', 'direct'],
					description: 'auto=按起点引脚朝向决定（默认）；hv=先水平后垂直；vh=先垂直后水平；direct=两点直连',
				},
			},
			required: ['from', 'to'],
		},
		mutating: true,
		handler: async (args, ctx) => {
			const from = requireString(args, 'from');
			const to = requireString(args, 'to');
			const net = optionalString(args, 'net');
			const route = optionalString(args, 'route') ?? 'auto';
			return schHint(
				await ctx.exec<Record<string, unknown>>(
					`
				${ENSURE_SCH}
				const all = await eda.sch_PrimitiveComponent.getAll();

				// "U1.3" / "U1.VIN" → 找到那根引脚
				const locate = async (spec) => {
					const dot = spec.lastIndexOf('.');
					if (dot <= 0) return { err: spec + ' 格式应为「位号.引脚号」，如 U1.3' };
					const des = spec.slice(0, dot).toUpperCase();
					const key = spec.slice(dot + 1).toUpperCase();
					const c = all.find(x => String(x.designator || '').toUpperCase() === des);
					if (!c) return { err: '找不到位号 ' + des };
					const pins = await eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId(c.primitiveId);
					const p = (pins || []).find(x => String(x.pinNumber || '').toUpperCase() === key)
						|| (pins || []).find(x => String(x.pinName || '').toUpperCase() === key);
					if (!p) return { err: des + ' 上找不到引脚 ' + key, pins: (pins||[]).map(x => x.pinNumber + ':' + x.pinName) };
					return { pin: p, designator: c.designator };
				};

				const a = await locate(${JSON.stringify(from)});
				if (a.err) return { ok: false, error: a.err, pins: a.pins };
				const b = await locate(${JSON.stringify(to)});
				if (b.err) return { ok: false, error: b.err, pins: b.pins };

				const p1 = a.pin, p2 = b.pin;

				// 关键：导线必须从引脚端点**朝外**接入。实测若从端点往符号本体方向画，
				// 线会压在引脚上，EDA 不认这个连接 —— 表现为网络只挂上了另一端那个引脚。
				// 所以两端各先沿自身朝向引出一小段（stub），再在两个 stub 端点之间走折线。
				// 坐标系 y 向下为正；rotation 逆时针为正，0=朝右 90=朝上 180=朝左 270=朝下。
				const STUB = 10; // 0.1 inch，一个栅格
				const outward = (rot) => {
					const r = ((Number(rot) % 360) + 360) % 360;
					if (r === 0) return [STUB, 0];
					if (r === 90) return [0, -STUB];
					if (r === 180) return [-STUB, 0];
					if (r === 270) return [0, STUB];
					return [0, 0]; // 非正交朝向：不加 stub，直接连
				};
				const [dx1, dy1] = outward(p1.rotation);
				const [dx2, dy2] = outward(p2.rotation);
				const a1 = [p1.x + dx1, p1.y + dy1];
				const b1 = [p2.x + dx2, p2.y + dy2];

				let mode = ${JSON.stringify(route)};
				if (mode === 'auto') {
					if (a1[0] === b1[0] || a1[1] === b1[1]) mode = 'direct';
					// 起点 stub 是水平引出的话，接着走水平段更顺；反之先走垂直
					else mode = dx1 !== 0 ? 'hv' : 'vh';
				}

				let mid;
				if (mode === 'direct' || a1[0] === b1[0] || a1[1] === b1[1]) mid = [];
				else if (mode === 'vh') mid = [a1[0], b1[1]];
				else mid = [b1[0], a1[1]];

				const line = [p1.x, p1.y, a1[0], a1[1], ...mid, b1[0], b1[1], p2.x, p2.y]
					// 去掉连续重复点，避免零长度线段
					.reduce((acc, v, i, arr) => {
						if (i % 2 === 1) {
							const px = arr[i - 1], py = v;
							const n = acc.length;
							if (n >= 2 && acc[n - 2] === px && acc[n - 1] === py) return acc;
							acc.push(px, py);
						}
						return acc;
					}, []);

				const w = await eda.sch_PrimitiveWire.create(line, ${JSON.stringify(net ?? undefined)});
				if (!w) {
					return { ok: false, error: '导线创建失败。最常见原因是两端引脚已分属不同的已命名网络 —— '
						+ 'EDA 不允许这样合并，请先用网络标签把它们统一命名。',
						attempted_path: line };
				}
				return {
					ok: true,
					from: a.designator + '.' + p1.pinNumber + '(' + p1.pinName + ')',
					to: b.designator + '.' + p2.pinNumber + '(' + p2.pinName + ')',
					route: mode,
					path: line,
					net: w.net ?? ${JSON.stringify(net ?? null)},
					wire_id: w.primitiveId,
				};
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
			'\n\n- kind=label：普通网络标签，**坐标必须落在一条已有导线上**。' +
			'放在空白处时 EDA 会进入等待鼠标点击的交互模式，接口一直不返回（表现为执行超时）——' +
			'所以要先画线再贴标签，坐标取线上的点。' +
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
