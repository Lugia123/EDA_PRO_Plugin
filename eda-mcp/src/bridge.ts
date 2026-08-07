/**
 * bridge —— 跑在 MCP 进程里的 WebSocket 服务端，EDA 扩展主动连过来。
 *
 * 为什么服务端在这侧：EDA 扩展只能用 SYS_WebSocket.register(id, serviceUri, ...)，
 * 那是**客户端** API，扩展没法监听端口。所以连接方向固定是「EDA → 我们」，
 * 也因此扩展侧必须自己做端口扫描 + 断线重连。
 *
 * 连接状态机：
 *   connected ──hello──> 等待 pair 或 auth ──成功──> ready（可 execute）
 *                            └── AUTH_TIMEOUT_MS 内没认证 → 断开
 *
 * 同时允许多个已认证连接（用户常常桌面端和网页版都开着），
 * execute 默认发给最后一个认证成功的，可用 setActiveClient 切换。
 */
import { createServer, type Server as HttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { WebSocketServer, type WebSocket } from 'ws';
import type { ClientInfo, ClientMessage, ServerMessage } from '../../shared/protocol.js';
import { PORT_END, PORT_START, PROTOCOL_VERSION, SERVICE_ID } from '../../shared/protocol.js';
import { getPairingSession, loadPairing, verifyCode, verifyToken } from './pairing.js';
import { log, logDebug, logError } from './logger.js';

/** 未认证连接的存活上限 */
const AUTH_TIMEOUT_MS = 60_000;
/** execute 默认超时；DRC / 生产资料导出可能较慢，工具层可覆盖 */
const DEFAULT_EXEC_TIMEOUT_MS = 30_000;
/** 心跳间隔 */
const HEARTBEAT_MS = 20_000;
/**
 * 执行期间断连后，等扩展重连的最长时间。
 *
 * 给到 2 分钟是因为：EDA 页面在后台标签时，Chrome 会把 setInterval 节流到 1 分钟以上，
 * 扩展的断线检测与重连随之变慢。30 秒的窗口在后台场景下几乎必然超时，
 * 会把一个本可自愈的抖动变成整批操作失败。
 */
const RECONNECT_WAIT_MS = 120_000;

const VERSION = process.env.EDA_MCP_VERSION ?? '0.1.0';

export interface BridgeClient {
	id: string;
	ws: WebSocket;
	authed: boolean;
	info?: ClientInfo;
	origin?: string;
	connectedAt: number;
	lastSeen: number;
}

interface Pending {
	resolve: (v: unknown) => void;
	reject: (e: Error) => void;
	timer: NodeJS.Timeout;
}

export class Bridge {
	private http: HttpServer | null = null;
	private wss: WebSocketServer | null = null;
	private port = 0;
	private clients = new Map<string, BridgeClient>();
	private activeId: string | null = null;
	private pending = new Map<string, Pending>();
	private heartbeat: NodeJS.Timeout | null = null;

	get listeningPort(): number {
		return this.port;
	}

	/** 已认证的连接 */
	authedClients(): BridgeClient[] {
		return [...this.clients.values()].filter((c) => c.authed);
	}

	activeClient(): BridgeClient | null {
		if (this.activeId) {
			const c = this.clients.get(this.activeId);
			if (c?.authed) return c;
		}
		return this.authedClients().at(-1) ?? null;
	}

	setActiveClient(id: string): boolean {
		const c = this.clients.get(id);
		if (!c?.authed) return false;
		this.activeId = id;
		return true;
	}

	/** 在 PORT_START..PORT_END 里找一个能监听的端口 */
	async start(): Promise<number> {
		await loadPairing();
		for (let p = PORT_START; p <= PORT_END; p++) {
			try {
				await this.listenOn(p);
				this.port = p;
				log(`bridge 监听 127.0.0.1:${p}（协议 v${PROTOCOL_VERSION}）`);
				this.startHeartbeat();
				return p;
			} catch (e) {
				if ((e as NodeJS.ErrnoException).code === 'EADDRINUSE') continue;
				throw e;
			}
		}
		throw new Error(`端口段 ${PORT_START}-${PORT_END} 全被占用，bridge 无法启动`);
	}

	private listenOn(port: number): Promise<void> {
		return new Promise((resolve, reject) => {
			const http = createServer((req, res) => {
				// 扩展扫端口用：只回服务标识，不含任何敏感信息。
				// 注意 service 字段只用于「找对端口」，不是身份凭证 —— 真正的门是配对 token。
				const origin = req.headers.origin;
				if (origin) res.setHeader('Access-Control-Allow-Origin', origin);
				res.setHeader('Access-Control-Allow-Headers', 'content-type');
				res.setHeader('Vary', 'Origin');
				if (req.method === 'OPTIONS') {
					res.writeHead(204).end();
					return;
				}
				if (req.url === '/health') {
					res.writeHead(200, { 'Content-Type': 'application/json' });
					res.end(
						JSON.stringify({
							service: SERVICE_ID,
							protocol: PROTOCOL_VERSION,
							version: VERSION,
							pairingOpen: getPairingSession() !== null,
							clients: this.authedClients().length,
						}),
					);
					return;
				}
				res.writeHead(404).end();
			});

			const onError = (e: Error) => {
				http.removeListener('listening', onListening);
				reject(e);
			};
			const onListening = () => {
				http.removeListener('error', onError);
				this.http = http;
				this.wss = new WebSocketServer({ server: http });
				this.wss.on('connection', (ws, req) => this.onConnection(ws, req.headers.origin));
				resolve();
			};
			http.once('error', onError);
			http.once('listening', onListening);
			http.listen(port, '127.0.0.1');
		});
	}

	private onConnection(ws: WebSocket, origin?: string): void {
		const client: BridgeClient = {
			id: randomUUID(),
			ws,
			authed: false,
			origin,
			connectedAt: Date.now(),
			lastSeen: Date.now(),
		};
		this.clients.set(client.id, client);
		log(`新连接 ${client.id.slice(0, 8)} origin=${origin ?? '-'}（等待认证）`);

		// 未认证连接不能长期占着，超时即断
		const authTimer = setTimeout(() => {
			if (!client.authed) {
				log(`连接 ${client.id.slice(0, 8)} 超时未认证，断开`);
				ws.close(4001, 'auth timeout');
			}
		}, AUTH_TIMEOUT_MS);

		this.send(ws, {
			type: 'hello',
			service: SERVICE_ID,
			protocol: PROTOCOL_VERSION,
			pairingOpen: getPairingSession() !== null,
			serverVersion: VERSION,
		});

		ws.on('message', (raw) => {
			client.lastSeen = Date.now();
			void this.onMessage(client, raw.toString(), authTimer);
		});
		ws.on('close', (code) => {
			clearTimeout(authTimer);
			this.clients.delete(client.id);
			if (this.activeId === client.id) this.activeId = null;
			log(`连接 ${client.id.slice(0, 8)} 关闭 code=${code}`);
			// 连接没了，挂在上面的请求永远等不到回包 —— 立刻以可识别的错误结束，
			// 让 execute 能等重连后重试，而不是干等到 30/60 秒超时。
			// （实测某些 EDA 操作如 createNetFlag 会让扩展重连一次。）
			if (this.pending.size) {
				log(`连接关闭时有 ${this.pending.size} 个请求在等待，标记为断连`);
				for (const [id, p] of this.pending) {
					clearTimeout(p.timer);
					this.pending.delete(id);
					p.reject(new Error('DISCONNECTED'));
				}
			}
		});
		ws.on('error', (e) => logError(`连接 ${client.id.slice(0, 8)} 出错`, e));
		ws.on('pong', () => {
			client.lastSeen = Date.now();
		});
	}

	private async onMessage(client: BridgeClient, raw: string, authTimer: NodeJS.Timeout): Promise<void> {
		let msg: ClientMessage;
		try {
			msg = JSON.parse(raw) as ClientMessage;
		} catch {
			logDebug(`连接 ${client.id.slice(0, 8)} 发来非 JSON，忽略`);
			return;
		}

		// ── 未认证阶段：只认 pair / auth / ping，其余一律丢弃 ──
		if (!client.authed) {
			if (msg.type === 'ping') {
				this.send(client.ws, { type: 'pong', id: msg.id });
				return;
			}
			if (msg.type === 'pair') {
				if (msg.protocol !== PROTOCOL_VERSION) {
					this.send(client.ws, { type: 'auth_error', error: 'protocol_mismatch' });
					client.ws.close(4002, 'protocol mismatch');
					return;
				}
				const r = await verifyCode(String(msg.code ?? ''), msg.client);
				if (r.ok) {
					client.authed = true;
					client.info = msg.client;
					this.activeId = client.id;
					clearTimeout(authTimer);
					this.send(client.ws, { type: 'paired', token: r.token });
					log(`连接 ${client.id.slice(0, 8)} 配对成功（${msg.client?.host ?? 'unknown'}）`);
				} else {
					this.send(client.ws, { type: 'pair_error', error: r.error, attemptsLeft: r.attemptsLeft });
					log(`连接 ${client.id.slice(0, 8)} 配对失败：${r.error}`);
				}
				return;
			}
			if (msg.type === 'auth') {
				if (msg.protocol !== PROTOCOL_VERSION) {
					this.send(client.ws, { type: 'auth_error', error: 'protocol_mismatch' });
					client.ws.close(4002, 'protocol mismatch');
					return;
				}
				if (await verifyToken(String(msg.token ?? ''))) {
					client.authed = true;
					client.info = msg.client;
					this.activeId = client.id;
					clearTimeout(authTimer);
					this.send(client.ws, { type: 'auth_ok', sessionId: client.id });
					log(`连接 ${client.id.slice(0, 8)} 认证通过（${msg.client?.host ?? 'unknown'} / EDA ${msg.client?.edaVersion ?? '?'}）`);
				} else {
					this.send(client.ws, { type: 'auth_error', error: 'invalid_token' });
					log(`连接 ${client.id.slice(0, 8)} token 无效`);
				}
				return;
			}
			logDebug(`连接 ${client.id.slice(0, 8)} 未认证却发来 ${msg.type}，忽略`);
			return;
		}

		// ── 已认证 ──
		switch (msg.type) {
			case 'ping':
				this.send(client.ws, { type: 'pong', id: msg.id });
				break;
			case 'pong':
				break;
			case 'result': {
				const p = this.pending.get(msg.id);
				if (!p) return;
				clearTimeout(p.timer);
				this.pending.delete(msg.id);
				p.resolve(msg.result);
				break;
			}
			case 'error': {
				const p = this.pending.get(msg.id);
				if (!p) return;
				clearTimeout(p.timer);
				this.pending.delete(msg.id);
				p.reject(new Error(msg.stack ? `${msg.error}\n${msg.stack}` : msg.error));
				break;
			}
			default:
				logDebug(`收到未知消息类型 ${(msg as { type: string }).type}`);
		}
	}

	/**
	 * 在 EDA 里执行一段 JS（AsyncFunction，可 await，`eda` 已注入）。
	 *
	 * 断连会自动重试一次：部分 EDA 操作（实测 createNetFlag）会让扩展重连，
	 * 此时请求已经发出但回包永远不会来。扩展几秒内就会自己连回来，重试即可成功 ——
	 * 比把一个本可恢复的抖动报成失败要好。
	 */
	async execute(code: string, timeoutMs = DEFAULT_EXEC_TIMEOUT_MS): Promise<unknown> {
		try {
			return await this.executeOnce(code, timeoutMs);
		} catch (e) {
			if (!(e instanceof Error) || e.message !== 'DISCONNECTED') throw e;
			log('执行期间连接断开，等待扩展重连后重试一次');
			const back = await this.waitForClient(RECONNECT_WAIT_MS);
			if (!back) {
				throw new Error(
					'执行期间连接断开，且扩展未在 30 秒内重连。' +
						'**这段代码可能已经在 EDA 里执行过了** —— 断的是回包，不是执行本身，' +
						'重试写操作前请先核实当前状态。可让用户在 EDA 里点「EDA Bridge → 重新连接」。',
				);
			}
			try {
				return await this.executeOnce(code, timeoutMs);
			} catch (e2) {
				if (!(e2 instanceof Error) || e2.message !== 'DISCONNECTED') throw e2;
				// 连着两次都在同一处断开，说明这个 EDA 操作本身会让扩展重连（实测 createNetLabel 会）。
				// 关键是：断的是回包，动作很可能已经生效 —— 报成"失败"会诱导上层重复执行。
				throw new Error(
					'该操作每次执行都会让 EDA 扩展重连，拿不到返回值。' +
						'**动作很可能已经生效**（断开的是回包，不是执行）—— ' +
						'请先用只读工具核实结果（如 eda_schematic_nets / eda_schematic_primitives），确认后再决定是否重做，不要直接重试。',
				);
			}
		}
	}

	private executeOnce(code: string, timeoutMs: number): Promise<unknown> {
		const client = this.activeClient();
		if (!client) return Promise.reject(new Error('NO_CLIENT'));
		const id = randomUUID();
		return new Promise((resolve, reject) => {
			const timer = setTimeout(() => {
				this.pending.delete(id);
				reject(new Error(`执行超时（${timeoutMs}ms）—— EDA 可能正忙，或代码里有未 resolve 的 Promise`));
			}, timeoutMs);
			this.pending.set(id, { resolve, reject, timer });
			this.send(client.ws, { type: 'execute', id, code });
		});
	}

	/** 等待有已认证连接；已有则立即返回 */
	private waitForClient(maxMs: number): Promise<boolean> {
		if (this.activeClient()) return Promise.resolve(true);
		return new Promise((resolve) => {
			const started = Date.now();
			const tick = setInterval(() => {
				if (this.activeClient()) {
					clearInterval(tick);
					resolve(true);
				} else if (Date.now() - started > maxMs) {
					clearInterval(tick);
					resolve(false);
				}
			}, 300);
		});
	}

	private send(ws: WebSocket, msg: ServerMessage): void {
		if (ws.readyState === ws.OPEN) ws.send(JSON.stringify(msg));
	}

	/** 主动踢掉所有已认证连接（解除配对后调用） */
	disconnectAll(reason: string): void {
		for (const c of this.clients.values()) c.ws.close(4003, reason);
	}

	private startHeartbeat(): void {
		this.heartbeat = setInterval(() => {
			for (const c of this.clients.values()) {
				if (Date.now() - c.lastSeen > HEARTBEAT_MS * 3) {
					log(`连接 ${c.id.slice(0, 8)} 心跳超时，断开`);
					c.ws.terminate();
					continue;
				}
				if (c.ws.readyState === c.ws.OPEN) c.ws.ping();
			}
		}, HEARTBEAT_MS);
		this.heartbeat.unref?.();
	}

	async stop(): Promise<void> {
		if (this.heartbeat) clearInterval(this.heartbeat);
		for (const p of this.pending.values()) {
			clearTimeout(p.timer);
			p.reject(new Error('bridge 已停止'));
		}
		this.pending.clear();
		this.wss?.close();
		await new Promise<void>((r) => (this.http ? this.http.close(() => r()) : r()));
	}
}
