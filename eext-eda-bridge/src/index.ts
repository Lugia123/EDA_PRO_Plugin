/**
 * EDA Bridge —— 立创EDA专业版扩展端
 *
 * 连上本机 eda-mcp 的 bridge，把 AI 发来的代码在 EDA 环境里执行后回传结果。
 *
 * ── 两个由平台 API 决定的设计约束 ──────────────────────────────────
 * 1. `eda.sys_WebSocket` 只有客户端能力（register / send / close），扩展无法监听端口，
 *    所以连接方向固定是「扩展 → bridge」，端口扫描和重连都得扩展这边自己做。
 * 2. `register()` 只给 receiveMessageCallFn 和 connectedCallFn，**没有 onClose / onError**。
 *    连不上表现为「回调一直不来」，断线表现为「消息不再来」——两者都只能靠超时判定，
 *    这就是下面 HELLO_TIMEOUT_MS 和心跳存在的原因。
 *
 * 另注：register/send/close 都要求用户在扩展管理器里勾选「允许外部交互」，
 * 否则一律 throw Error。所有调用点都包了 try/catch 并给出可操作提示。
 */
import type { ClientInfo, ServerMessage } from '../../shared/protocol.js';
import { PORT_END, PORT_START, PROTOCOL_VERSION, SERVICE_ID } from '../../shared/protocol.js';
import extensionConfig from '../extension.json' with { type: 'json' };

/**
 * WebSocket 连接 ID。
 *
 * **每次连接都必须换一个新 ID**，不能固定复用。官方文档明确写着：
 * 「如果存在指定 ID 且处于活跃状态中的 WebSocket 连接，那么其余参数的变更将不会被应用」。
 *
 * 实测后果：bridge 重启后，扩展这边残留着一个指向死连接的活跃 ID，
 * 之后所有 register() 都被静默忽略 —— 扫描永远收不到 hello，
 * 表现为「服务明明在跑，扩展却怎么都连不上，只有刷新页面才恢复」。
 * close() 对一个对端已消失的连接并不总能让平台把状态清干净，换 ID 才可靠。
 */
const WS_ID_PREFIX = 'eda-mcp-bridge';
let wsIdSeq = 0;
let wsId = `${WS_ID_PREFIX}-0`;
/**
 * 用过的所有 ID。
 *
 * 换 ID 是必须的（同一个 ID 只要平台还当它活着，register 的新端口就不生效），
 * 但只关当前这个 ID 会漏掉全部历史连接 —— 每重连一次就在 bridge 那边留一条
 * 活着的 WebSocket，实测点几次「重新连接」后 connected_clients 涨到 20 个，
 * 而且它们心跳都正常响应，不会被判死清掉。僵尸连接会让服务端的
 * 「最后一个认证成功的」选到早就不用的那条，表现为调用发出去没反应。
 */
const usedWsIds = new Set<string>([wsId]);

function nextWsId(): string {
	wsIdSeq += 1;
	const id = `${WS_ID_PREFIX}-${wsIdSeq}`;
	usedWsIds.add(id);
	return id;
}

/** 单个端口等 hello 的时间 */
const HELLO_TIMEOUT_MS = 1500;
/** 一轮全端口都没连上后，隔多久重试 */
const RETRY_DELAY_MS = 5000;
/** 心跳发送间隔 */
const PING_INTERVAL_MS = 15_000;
/** 超过这个时间没收到任何消息，判定连接已死 */
const DEAD_AFTER_MS = 45_000;

const STORAGE_KEY_TOKEN = 'bridgeToken';

type Phase = 'idle' | 'scanning' | 'awaiting-pair' | 'authing' | 'ready';

let phase: Phase = 'idle';
let currentPort = 0;
let lastMessageAt = 0;
let autoConnect = true;
let permissionDenied = false;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

/** 当前端口的 hello 等待器；收到 hello 或超时后置空 */
let helloWaiter: ((ok: boolean) => void) | null = null;

/** 下一次 auth_ok 是否要提示用户 —— 只有手动「重新连接」才置真，自动重连保持安静 */
let announceNextReady = false;

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// ─── 入口 ─────────────────────────────────────────────────────────────

export function activate(status?: 'onStartupFinished', _arg?: string): void {
	if (status === 'onStartupFinished' && autoConnect) {
		void connect();
	}
}

// ─── 菜单命令（与 extension.json 的 registerFn 对应）─────────────────

export function pair(): void {
	if (phase !== 'awaiting-pair' && phase !== 'ready' && phase !== 'authing') {
		// 还没连上 bridge 就配对没有意义，先连
		toast('尚未连接到 bridge，正在重新扫描…', 'warn');
		void connect().then(() => promptPairCode());
		return;
	}
	promptPairCode();
}

export function reconnect(): void {
	autoConnect = true;
	permissionDenied = false;
	announceNextReady = true;
	void connect();
}

export function disconnect(): void {
	autoConnect = false;
	stopHeartbeat();
	clearRetry();
	safeClose(1000, 'user disconnect');
	phase = 'idle';
	toast('已断开与 bridge 的连接（自动重连已关闭）', 'info');
}

export function status(): void {
	const lines = [
		`状态：${phaseText(phase)}`,
		`端口：${currentPort || '未连接'}`,
		`自动重连：${autoConnect ? '开' : '关'}`,
		`已保存配对凭证：${getToken() ? '是' : '否'}`,
		`外部交互权限：${permissionDenied ? '未开启（需在扩展管理器勾选）' : '正常'}`,
		`宿主：${hostKind()} / EDA ${editorVersion()}`,
	];
	eda.sys_Dialog.showInformationMessage(lines.join('\n'), 'EDA Bridge 状态');
}

export function unpairLocal(): void {
	eda.sys_Dialog.showConfirmationMessage(
		'将清除本机保存的配对凭证，下次连接需要重新输入配对码。确定吗？',
		'解除配对',
		'确定',
		'取消',
		(confirmed) => {
			if (!confirmed) return;
			void setToken('').then(() => {
				toast('已清除本地配对凭证', 'info');
				safeClose(1000, 'unpaired');
				phase = 'idle';
				if (autoConnect) void connect();
			});
		},
	);
}

export function about(): void {
	eda.sys_Dialog.showInformationMessage(
		`EDA Bridge v${extensionConfig.version}\n\n把立创EDA专业版接入 AI（Claude Code 等）。\n` +
			`本扩展只与本机 127.0.0.1:${PORT_START}-${PORT_END} 上的 eda-mcp 通信，不会连接任何外部服务器。\n\n` +
			`协议版本 v${PROTOCOL_VERSION}`,
		'关于 EDA Bridge',
	);
}

// ─── 连接 ─────────────────────────────────────────────────────────────

/** 逐个端口尝试，直到某个端口回了正确的 hello */
async function connect(): Promise<void> {
	clearRetry();
	if (phase === 'scanning') return;
	phase = 'scanning';
	// 关掉所有历史连接，不只是当前这条 —— 否则每重连一次就漏一条活连接
	closeAllSockets(1000, 'rescan');
	// close 之后必须让平台把这个 ID 的旧连接状态清理干净再 register。
	// 官方文档明确警告过「不要尝试相同 ID 不同参数的连接」——
	// 不等的话新连接会建起来又被旧的关闭事件带走（日志表现为刚认证通过就 code=1000 关闭）。
	await sleep(250);

	for (let port = PORT_START; port <= PORT_END; port++) {
		if (permissionDenied) break;
		const ok = await tryPort(port);
		if (ok) {
			currentPort = port;
			startHeartbeat();
			return;
		}
	}

	phase = 'idle';
	currentPort = 0;
	if (permissionDenied) {
		eda.sys_Dialog.showInformationMessage(
			'EDA Bridge 无法建立连接：本扩展的「允许外部交互」权限未开启。\n\n' +
				'请到「高级 → 扩展管理器 → 已安装」中找到 EDA Bridge，勾选「允许外部交互」，然后点菜单「EDA Bridge → 重新连接」。',
			'需要开启权限',
		);
		return;
	}
	if (autoConnect) {
		retryTimer = setTimeout(() => void connect(), RETRY_DELAY_MS);
	}
}

function tryPort(port: number): Promise<boolean> {
	return new Promise<boolean>((resolve) => {
		let settled = false;
		const finish = (ok: boolean) => {
			if (settled) return;
			settled = true;
			helloWaiter = null;
			if (!ok) safeClose(1000, 'wrong port');
			resolve(ok);
		};

		// 每次尝试都用新 ID：同一个 ID 只要还被平台视为「活跃」，
		// 后续 register 的参数（这里是端口）就不会生效，扫描会一直连在旧地址上。
		wsId = nextWsId();

		helloWaiter = finish;
		try {
			eda.sys_WebSocket.register(wsId, `ws://127.0.0.1:${port}`, onRawMessage, () => {
				// 连接已建立，但还要等 hello 验明身份才算数
			});
		} catch (e) {
			// 绝大多数情况是「允许外部交互」没勾
			permissionDenied = true;
			finish(false);
			return;
		}

		setTimeout(() => finish(false), HELLO_TIMEOUT_MS);
	});
}

function onRawMessage(event: MessageEvent<unknown>): void {
	lastMessageAt = Date.now();
	let msg: ServerMessage;
	try {
		msg = JSON.parse(String(event.data)) as ServerMessage;
	} catch {
		return;
	}

	switch (msg.type) {
		case 'hello': {
			// 只有 service 对上才认这个端口；注意这只是「找对了服务」，
			// 真正的信任建立在配对 token 上。
			const ok = msg.service === SERVICE_ID && msg.protocol === PROTOCOL_VERSION;
			helloWaiter?.(ok);
			if (!ok) return;
			const token = getToken();
			if (token) {
				phase = 'authing';
				send({ type: 'auth', protocol: PROTOCOL_VERSION, token, client: clientInfo() });
			} else {
				// 端口扫描可能反复触发，同一次「待配对」状态只提醒一次，别刷屏
				const firstTime = phase !== 'awaiting-pair';
				phase = 'awaiting-pair';
				if (firstTime) toast('已找到 AI 桥接服务，请点菜单「EDA Bridge → 配对」输入配对码', 'question', 8);
			}
			break;
		}

		case 'auth_ok':
			phase = 'ready';
			// 自动重连是后台行为，不打扰用户；只有用户手动点了「重新连接」才回一句
			if (announceNextReady) {
				announceNextReady = false;
				toast('已连接到 AI（EDA Bridge 就绪）', 'success', 3);
			}
			break;

		case 'auth_error':
			if (msg.error === 'invalid_token') {
				// token 失效（对面 unpair 过 / 换了机器）→ 清掉，回到待配对
				void setToken('');
				phase = 'awaiting-pair';
				toast('保存的配对凭证已失效，请重新配对', 'warn', 8);
			} else {
				toast('协议版本不一致，请更新扩展或 eda-mcp', 'error', 8);
				phase = 'idle';
			}
			break;

		case 'paired':
			void setToken(msg.token).then(() => {
				phase = 'ready';
				announceNextReady = false;
				toast('配对成功，EDA Bridge 就绪', 'success', 3);
			});
			break;

		case 'pair_error':
			toast(pairErrorText(msg.error, msg.attemptsLeft), 'error', 8);
			break;

		case 'execute':
			void runCode(msg.id, msg.code);
			break;

		case 'ping':
			send({ type: 'pong', id: msg.id });
			break;

		case 'pong':
			break;
	}
}

// ─── 代码执行 ─────────────────────────────────────────────────────────

async function runCode(id: string, code: string): Promise<void> {
	try {
		// AsyncFunction，使代码体内可直接 await；`eda` 作为参数注入而非依赖全局，
		// 这样即便宿主把 eda 挂在别处也能工作。
		const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
			arg: string,
			body: string,
		) => (eda: unknown) => Promise<unknown>;
		const fn = new AsyncFunction('eda', code);
		const result = await fn(eda);
		send({ type: 'result', id, result: result === undefined ? null : sanitize(result) });
	} catch (e) {
		send({
			type: 'error',
			id,
			error: e instanceof Error ? e.message : String(e),
			stack: e instanceof Error ? e.stack : undefined,
		});
	}
}

/**
 * 结果要能过 JSON.stringify 才能回传。
 * EDA API 常返回类实例 / 含循环引用的对象，直接 stringify 会抛异常，
 * 那样错误会以「执行失败」的形式回去，误导 AI 以为是代码写错了。
 */
function sanitize(v: unknown): unknown {
	const seen = new WeakSet<object>();
	const walk = (x: unknown, depth: number): unknown => {
		if (x === null || typeof x !== 'object') {
			return typeof x === 'bigint' ? String(x) : typeof x === 'function' ? '[Function]' : x;
		}
		if (depth > 12) return '[MaxDepth]';
		if (seen.has(x)) return '[Circular]';
		seen.add(x);
		if (Array.isArray(x)) return x.map((i) => walk(i, depth + 1));
		const out: Record<string, unknown> = {};
		for (const k of Object.keys(x as Record<string, unknown>)) {
			try {
				out[k] = walk((x as Record<string, unknown>)[k], depth + 1);
			} catch {
				out[k] = '[Unreadable]';
			}
		}
		return out;
	};
	return walk(v, 0);
}

// ─── 配对 ─────────────────────────────────────────────────────────────

function promptPairCode(): void {
	eda.sys_Dialog.showInputDialog(
		'请输入 AI 侧显示的 6 位配对码：',
		'配对码 5 分钟内有效，最多尝试 5 次。',
		'EDA Bridge 配对',
		'text',
		'',
		{ maxlength: 6, minlength: 6, placeholder: '例如 048213' },
		(value: unknown) => {
			const code = String(value ?? '').trim();
			if (!/^\d{6}$/.test(code)) {
				if (code) toast('配对码应为 6 位数字', 'warn');
				return;
			}
			send({ type: 'pair', protocol: PROTOCOL_VERSION, code, client: clientInfo() });
		},
	);
}

function pairErrorText(error: string, attemptsLeft?: number): string {
	switch (error) {
		case 'no_pairing_session':
			return 'AI 侧还没有开启配对，请先让 AI 调用 eda_pair_start 取码';
		case 'invalid_code':
			return `配对码不正确${attemptsLeft !== undefined ? `，还可尝试 ${attemptsLeft} 次` : ''}`;
		case 'expired':
			return '配对码已过期，请让 AI 重新取一个';
		case 'too_many_attempts':
			return '尝试次数过多，本次配对已作废，请让 AI 重新取码';
		default:
			return `配对失败：${error}`;
	}
}

// ─── 心跳 ─────────────────────────────────────────────────────────────

function startHeartbeat(): void {
	stopHeartbeat();
	lastMessageAt = Date.now();
	heartbeatTimer = setInterval(() => {
		if (Date.now() - lastMessageAt > DEAD_AFTER_MS) {
			// 平台不给 onClose，只能这样发现连接已死
			stopHeartbeat();
			phase = 'idle';
			currentPort = 0;
			if (autoConnect) void connect();
			return;
		}
		send({ type: 'ping', id: `hb-${Date.now()}` });
	}, PING_INTERVAL_MS);
}

function stopHeartbeat(): void {
	if (heartbeatTimer) clearInterval(heartbeatTimer);
	heartbeatTimer = null;
}

function clearRetry(): void {
	if (retryTimer) clearTimeout(retryTimer);
	retryTimer = null;
}

// ─── 工具 ─────────────────────────────────────────────────────────────

/** 扩展环境里 console 可用；只在异常路径打，正常不刷屏 */
function logWarn(msg: string): void {
	try { console.warn('[eda-bridge]', msg); } catch { /* ignore */ }
}

function send(msg: Record<string, unknown>): void {
	try {
		eda.sys_WebSocket.send(wsId, JSON.stringify(msg));
	} catch {
		// 两件**不能**做的事：
		// 1. 不能置 permissionDenied —— 连接断掉后 send 必然抛错，据此判定"无权限"
		//    会让 connect() 跳过所有端口，扩展再也连不回来（只能靠刷新页面）。
		//    权限问题只以 register() 抛错为准。
		// 2. 不能把 lastMessageAt 清零来"催促"心跳判死 —— 那会让下一次心跳
		//    立即认定连接已死并重连，把正在进行的请求打断。写入操作期间
		//    send 偶尔抖一下就会自杀，表现为「刚执行完一步就断连」。
		// 正确做法：什么都不做。真断了的话自然收不到消息，心跳会在
		// DEAD_AFTER_MS 后正常判死。
		logWarn('send 失败（连接可能已断），交给心跳按正常节奏判定');
	}
}

/** 关掉当前连接 */
function safeClose(code?: number, reason?: string): void {
	try {
		eda.sys_WebSocket.close(wsId, code, reason);
	} catch {
		/* 未连接或无权限，忽略 */
	}
}

/**
 * 关掉**所有用过的 ID**，重连前调用。
 *
 * 只关当前 ID 会把历史连接留在服务端。留下的还都是活的（心跳照回），
 * 所以服务端也清不掉，只能从源头关干净。
 */
function closeAllSockets(code: number, reason: string): void {
	for (const id of usedWsIds) {
		try {
			eda.sys_WebSocket.close(id, code, reason);
		} catch {
			/* 已经不存在或无权限，忽略 */
		}
	}
	usedWsIds.clear();
	usedWsIds.add(wsId);
}

function getToken(): string {
	try {
		const cfg = eda.sys_Storage.getExtensionAllUserConfigs();
		const t = cfg?.[STORAGE_KEY_TOKEN];
		return typeof t === 'string' ? t : '';
	} catch {
		return '';
	}
}

async function setToken(token: string): Promise<void> {
	try {
		const cfg = eda.sys_Storage.getExtensionAllUserConfigs() ?? {};
		await eda.sys_Storage.setExtensionAllUserConfigs({ ...cfg, [STORAGE_KEY_TOKEN]: token });
	} catch {
		toast('无法保存配对凭证，下次启动需重新配对', 'warn');
	}
}

function clientInfo(): ClientInfo {
	return { host: hostKind(), extVersion: extensionConfig.version, edaVersion: editorVersion() };
}

function hostKind(): ClientInfo['host'] {
	try {
		if (eda.sys_Environment.isClient()) return 'desktop';
		if (eda.sys_Environment.isWeb()) return 'web';
	} catch {
		/* ignore */
	}
	return 'unknown';
}

function editorVersion(): string {
	try {
		return eda.sys_Environment.getEditorCurrentVersion();
	} catch {
		return '?';
	}
}

function phaseText(p: Phase): string {
	return {
		idle: '未连接',
		scanning: '正在扫描端口',
		'awaiting-pair': '已连接，等待配对',
		authing: '正在认证',
		ready: '就绪',
	}[p];
}

/**
 * 弹一条吐司消息。
 *
 * ⚠️ `timer` 的单位是**秒**，不是毫秒（官方注释：「自动关闭倒计时秒数，0 为不自动关闭」）。
 * 早期版本这里按毫秒传了 4000/8000，等于让提示挂 66 分钟到 2 小时不消失，
 * 反复重连时还会堆叠成一片，把画布挡住。
 *
 * 另一条原则：**只在需要用户知道或采取行动时才弹**。
 * 自动重连成功属于后台行为，用户不需要每次都被打断 —— 状态可以从
 * 「EDA Bridge → 连接状态」随时查看。
 */
function toast(message: string, type: 'info' | 'warn' | 'error' | 'success' | 'question' = 'info', seconds = 4): void {
	try {
		eda.sys_Message.showToastMessage(message, type as never, seconds);
	} catch {
		/* ignore */
	}
}
