/**
 * 回读确认层 —— 写操作的返回值只作参考，真相靠回读。
 *
 * 这一层存在的理由，都是踩出来的：
 *
 *   · setDocumentSource 返回 true，文档已被写坏（丢了一行、字段错位）
 *   · modifyBoardName 返回 true，名字没变
 *   · eda_auto_route 报 148 根连线全成功，实际只有 60 根还连在引脚上
 *   · eda_set_page_size 写进去了，但写的是 EDA 不认的字段名
 *   · getAllBoardsInfo 有缓存，刚建的板子查不到；按名字兜底又撞上同名旧板
 *
 * 共同点是：**返回值和事实无关**。所以凡是写操作，一律「写完回读，拿实际
 * 状态说话」；凡是读操作，一律「读到的数据要能自证没被污染」。
 *
 * 关于污染校验的取舍：单纯加一次 md5 只能证明「这份数据从 EDA 传到这里
 * 没变形」，证明不了「EDA 给出的这份数据本身是对的」。所以这里用两道：
 *
 *   1. 传输校验 —— EDA 侧对要返回的 JSON 文本算哈希，随文本一起回来，
 *      本侧重算比对。管的是桥接层（WebSocket + JSON 序列化）的损坏。
 *   2. 稳定性校验 —— 同一次读取连做两遍，两遍哈希一致才采信。管的是
 *      EDA 侧的缓存与不稳定返回（读到半旧半新、字段忽然变成中文句子）。
 *
 * 两道都过不了就重试，重试到上限就如实报错 —— 绝不把「可能是脏的」数据
 * 当成结果往上传。宁可慢、宁可失败，不可以给出看起来对的假数据。
 */
import type { ToolContext, ToolDef } from './types.js';

/** EDA 的 getAll / getDocumentSource 都有缓存，写完立刻读会读到旧值 */
export const READBACK_DELAY_MS = 1200;

/** 坐标核对容差：半个网格。EDA 会把坐标吸附到网格上，差这点不算写失败 */
export const COORD_TOLERANCE = 10;

/** 默认重试次数。宁可慢 —— 拿到确定信息比快返回重要得多 */
export const DEFAULT_ATTEMPTS = 6;

/**
 * 注入到 EDA 侧的哈希函数。
 *
 * 优先用 crypto.subtle 的 SHA-256；它要 secure context，EDA 是 https 下
 * 跑的所以通常有，但不做假设 —— 按铁律「能力探测优先于文档」，探测不到
 * 就退回纯 JS 的 FNV-1a。FNV-1a 不抗碰撞，但这里要防的是传输损坏而不是
 * 恶意伪造，够用。
 */
export const HASH_FN = `
	const __hash = async function (text) {
		const s = String(text);
		if (typeof crypto !== 'undefined' && crypto.subtle && crypto.subtle.digest) {
			try {
				const buf = new TextEncoder().encode(s);
				const out = await crypto.subtle.digest('SHA-256', buf);
				const bytes = Array.from(new Uint8Array(out));
				return 'sha256:' + bytes.map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
			} catch (e) { /* 落到下面的 FNV-1a */ }
		}
		let h = 2166136261;
		for (let i = 0; i < s.length; i += 1) {
			h = h ^ s.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		return 'fnv1a:' + (h >>> 0).toString(16) + ':' + s.length;
	};
`;

/** 本侧的同款哈希 —— 必须和 EDA 侧算出一样的值，否则校验无意义 */
async function hashLocal(text: string, algo: string): Promise<string> {
	if (algo.startsWith('sha256')) {
		const { createHash } = await import('node:crypto');
		return 'sha256:' + createHash('sha256').update(text, 'utf8').digest('hex');
	}
	let h = 2166136261;
	for (let i = 0; i < text.length; i += 1) {
		h = h ^ text.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return 'fnv1a:' + (h >>> 0).toString(16) + ':' + text.length;
}

export interface StableReadResult<T> {
	value: T;
	/** 实际用了几次 EDA 调用 —— 大于 2 说明中途有过不一致，值得记进返回里 */
	reads: number;
	hash: string;
	/** 哪一道校验救过场，便于事后判断是桥接层还是 EDA 侧的问题 */
	notes: string[];
}

/**
 * 稳定读取：把一段「返回 JSON 可序列化对象」的 EDA 代码执行到结果可信为止。
 *
 * 传进来的 code 要以 return 交出一个对象，和平时写 ctx.exec 一样；哈希与
 * 文本化由本函数包在外面，调用方不用关心。
 */
export async function stableRead<T = unknown>(
	ctx: ToolContext,
	code: string,
	opts: { attempts?: number; timeoutMs?: number; settleMs?: number } = {},
): Promise<StableReadResult<T>> {
	const attempts = opts.attempts ?? DEFAULT_ATTEMPTS;
	const timeoutMs = opts.timeoutMs ?? 120_000;
	const settleMs = opts.settleMs ?? 0;
	const notes: string[] = [];

	const wrapped = `
		${HASH_FN}
		const __run = async function () { ${code}
		};
		const __value = await __run();
		const __text = JSON.stringify(__value === undefined ? null : __value);
		return { __text: __text, __hash: await __hash(__text) };
	`;

	let prev: { text: string; hash: string } | null = null;
	let reads = 0;
	let lastErr = '';

	for (let i = 0; i < attempts; i += 1) {
		if (settleMs > 0 || i > 0) {
			await sleep(i === 0 ? settleMs : settleMs + 300 * i);
		}
		let got: { __text?: unknown; __hash?: unknown };
		try {
			got = await ctx.exec<{ __text?: unknown; __hash?: unknown }>(wrapped, timeoutMs);
			reads += 1;
		} catch (e) {
			lastErr = e instanceof Error ? e.message : String(e);
			notes.push(`第 ${i + 1} 次读取抛错：${lastErr}`);
			prev = null; // 抛错后不能拿它跟上一次比，重新攒
			continue;
		}

		// 第一道：结构。污染过的返回见过「字段变成一句中文」，先把这类挡掉
		if (typeof got?.__text !== 'string' || typeof got?.__hash !== 'string') {
			notes.push(`第 ${i + 1} 次返回结构不对（__text/__hash 不是字符串），丢弃`);
			prev = null;
			continue;
		}
		const text = got.__text;
		const hash = got.__hash;

		// 第二道：传输。EDA 侧算的哈希和本侧重算的对不上，就是路上坏了
		const mine = await hashLocal(text, hash);
		if (mine !== hash) {
			notes.push(`第 ${i + 1} 次传输校验不符（EDA=${hash.slice(0, 24)} 本侧=${mine.slice(0, 24)}），丢弃`);
			prev = null;
			continue;
		}

		// 第三道：稳定。连续两次一模一样才采信
		if (prev && prev.hash === hash) {
			try {
				return { value: JSON.parse(text) as T, reads, hash, notes };
			} catch (e) {
				notes.push(`两次一致但 JSON 解析失败：${e instanceof Error ? e.message : String(e)}`);
				prev = null;
				continue;
			}
		}
		if (prev && prev.hash !== hash) {
			notes.push(`第 ${i + 1} 次与上一次不一致（缓存或状态未稳），继续读`);
		}
		prev = { text, hash };
	}

	throw new Error(
		`读了 ${reads} 次仍拿不到可信数据（要求连续两次一致且传输校验通过）。` +
			(lastErr ? `最后一次错误：${lastErr}。` : '') +
			`过程：${notes.join('；') || '无'}`,
	);
}

export function sleep(ms: number): Promise<void> {
	return new Promise((r) => setTimeout(r, ms));
}

/**
 * 当前所在的板与页 —— 写原理图之前必须先确认自己站在哪。
 *
 * 注意板子**没有 uuid**：IDMT_BoardItem 只有 name / schematic / pcb /
 * parentProjectUuid，板名就是它在工程内的唯一标识。原先代码里那个
 * `board.uuid` 从来都是 undefined。
 */
export interface PageIdentity {
	boardName?: string;
	pageUuid?: string;
	pageName?: string;
	schematicUuid?: string;
	schematicName?: string;
	projectUuid?: string;
	projectName?: string;
	/** 三个来源互相印证的结果；不一致时这里会说明哪里对不上 */
	consistent: boolean;
	inconsistency?: string;
}

/**
 * 确认当前页身份。拿不到就是拿不到，不猜。
 *
 * 为什么必须有这个：写原理图的工具都作用在「当前页」上，而当前页是隐式的。
 * 一旦 EDA 焦点不在预期的页上，工具会一声不响地把图画到别的板子里。
 *
 * 三个查询分别问板、原理图、图页，然后互相印证：图页声明的所属原理图必须
 * 就是当前原理图，当前原理图必须挂在当前板下。任何一条对不上，说明查到的
 * 是几份不同时刻的缓存拼起来的，不能用。
 */
export async function currentPage(ctx: ToolContext, attempts = DEFAULT_ATTEMPTS): Promise<PageIdentity> {
	const { value } = await stableRead<PageIdentity>(
		ctx,
		`
		const proj = await eda.dmt_Project.getCurrentProjectInfo();
		const board = await eda.dmt_Board.getCurrentBoardInfo();
		const sch = await eda.dmt_Schematic.getCurrentSchematicInfo();
		const page = await eda.dmt_Schematic.getCurrentSchematicPageInfo();

		const problems = [];
		if (!page) problems.push('查不到当前原理图图页（焦点可能不在原理图上）');
		if (!sch) problems.push('查不到当前原理图');
		if (page && sch && page.parentSchematicUuid !== sch.uuid) {
			problems.push('图页声明的所属原理图(' + page.parentSchematicUuid +
				') 与当前原理图(' + sch.uuid + ') 不一致');
		}
		if (board && sch && board.schematic && board.schematic.uuid !== sch.uuid) {
			problems.push('当前板下的原理图(' + board.schematic.uuid +
				') 与当前原理图(' + sch.uuid + ') 不一致');
		}
		if (sch && sch.page && page && !sch.page.some(function (p) { return p.uuid === page.uuid; })) {
			problems.push('当前图页不在当前原理图的图页列表里');
		}

		return {
			boardName: board ? board.name : undefined,
			pageUuid: page ? page.uuid : undefined,
			pageName: page ? page.name : undefined,
			schematicUuid: sch ? sch.uuid : undefined,
			schematicName: sch ? sch.name : undefined,
			projectUuid: proj ? proj.uuid : undefined,
			projectName: proj ? (proj.friendlyName || proj.name) : undefined,
			consistent: problems.length === 0,
			inconsistency: problems.length ? problems.join('；') : undefined,
		};
	`,
		{ attempts },
	);
	return value;
}

/**
 * 要求当前页身份明确，否则抛错。
 *
 * 给写操作用：宁可拒绝动手，也不能在不知道自己在哪的情况下往图纸上写东西。
 */
export async function requirePage(ctx: ToolContext, attempts = DEFAULT_ATTEMPTS): Promise<PageIdentity> {
	const id = await currentPage(ctx, attempts);
	if (!id.pageUuid) {
		throw new Error(
			'拿不到当前原理图图页的身份，拒绝写入。' +
				(id.inconsistency ? `原因：${id.inconsistency}` : '请在 EDA 里打开目标原理图页后重试。'),
		);
	}
	if (!id.consistent) {
		throw new Error(`当前页身份自相矛盾，拒绝写入：${id.inconsistency}`);
	}
	return id;
}

/** 图元普查：按类型计数，外加一份内容摘要，用来判断「写进去的东西是否真的变了」 */
export interface Census {
	counts: Record<string, number>;
	/** 全页内容的摘要哈希 —— 两次普查哈希一样，说明图纸压根没动 */
	digest: string;
	total: number;
}

const CENSUS_CODE = `
	const kinds = {
		component: eda.sch_PrimitiveComponent,
		wire: eda.sch_PrimitiveWire,
		text: eda.sch_PrimitiveText,
		rectangle: eda.sch_PrimitiveRectangle,
	};
	const counts = {};
	const parts = [];
	for (const name of Object.keys(kinds)) {
		const api = kinds[name];
		if (!api || !api.getAll) { counts[name] = -1; continue; }
		const list = (await api.getAll()) || [];
		counts[name] = list.length;
		// 摘要只取位置与身份，不取样式 —— 样式变动不该被当成图纸变了
		for (const it of list) {
			parts.push(name + ':' + (it.designator || it.net || it.content || '') +
				'@' + Math.round(it.x || 0) + ',' + Math.round(it.y || 0));
		}
	}
	parts.sort();
	let total = 0;
	for (const k of Object.keys(counts)) { if (counts[k] > 0) total += counts[k]; }
	return { counts: counts, total: total, digest: await __hash(parts.join('|')) };
`;

export async function census(ctx: ToolContext, opts: { attempts?: number; settleMs?: number } = {}): Promise<Census> {
	const { value } = await stableRead<Census>(ctx, CENSUS_CODE, {
		attempts: opts.attempts ?? DEFAULT_ATTEMPTS,
		settleMs: opts.settleMs ?? 0,
	});
	return value;
}

export interface CensusDiff {
	/** 各类型的增减 */
	delta: Record<string, number>;
	/** 图纸内容是否确实发生了变化 */
	changed: boolean;
	/** 与调用方声明的预期是否一致；预期没给时为 undefined */
	matchesExpectation?: boolean;
	summary: string;
}

/**
 * 比对前后普查。expect 是调用方声明的「我打算让某类图元增加几个」。
 *
 * 声明预期这件事本身有价值：它把「我以为我做了什么」变成可被否证的断言。
 * 摆了 3 个器件而 component 只 +2，工具就该报出来，而不是回一句 ok。
 */
export function diffCensus(before: Census, after: Census, expect?: Record<string, number>): CensusDiff {
	const delta: Record<string, number> = {};
	const keys = new Set([...Object.keys(before.counts), ...Object.keys(after.counts)]);
	for (const k of keys) {
		const d = (after.counts[k] ?? 0) - (before.counts[k] ?? 0);
		if (d !== 0) delta[k] = d;
	}
	const changed = before.digest !== after.digest;

	let matchesExpectation: boolean | undefined;
	const bad: string[] = [];
	if (expect) {
		matchesExpectation = true;
		for (const [k, want] of Object.entries(expect)) {
			const got = delta[k] ?? 0;
			if (got !== want) {
				matchesExpectation = false;
				bad.push(`${k} 预期 ${want >= 0 ? '+' : ''}${want}、实际 ${got >= 0 ? '+' : ''}${got}`);
			}
		}
	}

	const parts: string[] = [];
	parts.push(
		Object.keys(delta).length
			? '变化：' + Object.entries(delta).map(([k, v]) => `${k} ${v >= 0 ? '+' : ''}${v}`).join('，')
			: '各类图元数量没变',
	);
	if (!changed) parts.push('内容摘要也没变 —— 这一步很可能压根没生效');
	if (bad.length) parts.push('与预期不符：' + bad.join('；'));

	return { delta, changed, matchesExpectation, summary: parts.join('。') };
}

export interface PlacedWant {
	designator: string;
	x: number;
	y: number;
	rotation?: number;
}

export interface PlacedCheck extends PlacedWant {
	found: boolean;
	actualX?: number;
	actualY?: number;
	actualRotation?: number;
	/** 落在容差内 */
	ok: boolean;
	note?: string;
}

/**
 * 核对器件是否真的落在要求的位置。
 *
 * 这是为「摆件返回的坐标是请求值的回显、实际却叠在上一个器件身上」写的 ——
 * 那次三次调用全报成功，回读才发现最后一个没动。
 */
export async function verifyPlaced(
	ctx: ToolContext,
	want: PlacedWant[],
	opts: { attempts?: number; settleMs?: number } = {},
): Promise<{ checks: PlacedCheck[]; allOk: boolean; summary: string }> {
	const { value } = await stableRead<Array<{ designator: string; x: number; y: number; rotation: number }>>(
		ctx,
		`
		const out = [];
		for (const c of (await eda.sch_PrimitiveComponent.getAll()) || []) {
			if (c.componentType !== 'part') continue;
			out.push({ designator: String(c.designator || ''), x: c.x, y: c.y, rotation: c.rotation || 0 });
		}
		return out;
	`,
		{ attempts: opts.attempts ?? DEFAULT_ATTEMPTS, settleMs: opts.settleMs ?? READBACK_DELAY_MS },
	);

	const byDes = new Map(value.map((c) => [c.designator.toUpperCase(), c]));
	const checks: PlacedCheck[] = want.map((w) => {
		const got = byDes.get(w.designator.toUpperCase());
		if (!got) return { ...w, found: false, ok: false, note: '回读时找不到这个位号' };
		const dx = Math.abs(got.x - w.x);
		const dy = Math.abs(got.y - w.y);
		const posOk = dx <= COORD_TOLERANCE && dy <= COORD_TOLERANCE;
		const rotOk = w.rotation == null || ((got.rotation - w.rotation) % 360 + 360) % 360 === 0;
		const notes: string[] = [];
		if (!posOk) notes.push(`位置偏了 (${dx.toFixed(0)}, ${dy.toFixed(0)})`);
		if (!rotOk) notes.push(`角度是 ${got.rotation}、要求 ${w.rotation}`);
		return {
			...w,
			found: true,
			actualX: got.x,
			actualY: got.y,
			actualRotation: got.rotation,
			ok: posOk && rotOk,
			note: notes.join('；') || undefined,
		};
	});

	const bad = checks.filter((c) => !c.ok);
	return {
		checks,
		allOk: bad.length === 0,
		summary: bad.length
			? `${bad.length}/${checks.length} 个器件没到位：` +
				bad.map((b) => `${b.designator}(${b.note})`).join('，')
			: `${checks.length} 个器件位置角度都已回读确认`,
	};
}

/**
 * 把这一层直接暴露成工具 —— 动手写图纸之前，先问清楚「我在哪、图上有什么」。
 *
 * 之所以值得单独给一个工具：写原理图的工具全都作用在隐式的「当前页」上。
 * 之前出过一整轮问题，都是因为不知道自己站在哪就开始画（图画进了别的板子、
 * 位号跟另一块板撞号、体检报告说通过但看的是别处的图）。
 */
export const verifyTools: ToolDef[] = [
	{
		name: 'eda_current_context',
		description:
			'【只读】确认当前所在的工程／板／原理图／图页，并普查图上有多少图元。' +
			'\n\n**写图纸之前先调它**：所有原理图工具都作用在隐式的「当前页」上，' +
			'焦点不对就会把图画进别的板子。' +
			'\n\n数据经过三道校验才返回：结构检查、传输哈希比对、同一读取连做两遍取一致值。' +
			'查到的板／原理图／图页还会互相印证（图页声明的父原理图必须就是当前原理图）。' +
			'任何一道过不了就如实报错，**不会返回可能是脏的数据** —— 慢一点没关系，' +
			'拿到的信息必须是确定的。',
		inputSchema: {
			type: 'object',
			properties: {
				census: {
					type: 'boolean',
					description: '是否同时普查图元数量与内容摘要，默认 true',
				},
			},
		},
		handler: async (args, ctx) => {
			const wantCensus = args.census !== false;
			const id = await currentPage(ctx);
			const out: Record<string, unknown> = {
				context: id,
				verified: id.consistent && !!id.pageUuid,
			};
			if (!id.pageUuid) {
				out.note =
					'当前编辑器里没有打开原理图图页（或查不到它的身份）。' +
					'原理图类工具此时不该调用 —— 请先在 EDA 里打开目标图页。';
				return out;
			}
			if (!id.consistent) {
				out.note = `身份自相矛盾，不要在这个状态下写图纸：${id.inconsistency}`;
				return out;
			}
			if (wantCensus) {
				const c = await census(ctx);
				out.census = { counts: c.counts, total: c.total, digest: c.digest };
			}
			out.note = '身份已确认，可以安全地在这一页上操作。';
			return out;
		},
	},
];
