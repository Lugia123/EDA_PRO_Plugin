/**
 * bridge ↔ EDA 扩展 的线上协议 —— 两端唯一真相源
 *
 * eda-mcp（Node，bridge 侧）和 eext-eda-bridge（EDA 扩展侧）都 import 本文件。
 * 改协议只改这里，两端编译期即可发现不一致；**不要在任何一端另抄一份**。
 *
 * ── 为什么要配对鉴权 ────────────────────────────────────────────────
 * 实测结论：任意 HTTPS 网页都能连本机 ws://127.0.0.1（Chrome 视 loopback 为
 * 可信来源，无混合内容拦截）。而本协议的 execute 是「在 EDA 里跑任意 JS」。
 * 所以只靠「握手时自报 service 名」等于没有鉴权 —— 恶意网页照样能自报。
 * 必须有一次人工参与的配对（用户把 bridge 显示的 6 位码输进 EDA 扩展面板），
 * 之后用长期 token 免输。未配对连接除 hello/pair/auth 外一律拒绝。
 */

/** 协议版本；两端不一致时 bridge 拒绝连接 */
export const PROTOCOL_VERSION = 1;

/** bridge 监听端口段（避开官方 run-api-gateway 的 49620-49629，可共存） */
export const PORT_START = 49630;
export const PORT_END = 49639;

/** 服务标识，仅用于「找对了端口」，**不是**身份凭证 */
export const SERVICE_ID = 'eda-mcp-bridge';

/** 配对码有效期与尝试上限 */
export const PAIR_CODE_TTL_MS = 5 * 60 * 1000;
export const PAIR_MAX_ATTEMPTS = 5;

// ─── bridge → client ──────────────────────────────────────────────────

/** 连接建立后 bridge 立即下发，告知是否需要配对 */
export interface HelloMsg {
	type: 'hello';
	service: typeof SERVICE_ID;
	protocol: number;
	/** true = 尚无有效 token，client 需走 pair；false = 可直接 auth */
	pairingOpen: boolean;
	serverVersion: string;
}

export interface PairedMsg {
	type: 'paired';
	/** 长期 token，client 自行持久化（扩展侧存 SYS_Storage） */
	token: string;
}

export interface PairErrorMsg {
	type: 'pair_error';
	error: 'no_pairing_session' | 'invalid_code' | 'expired' | 'too_many_attempts';
	/** 还剩几次尝试机会 */
	attemptsLeft?: number;
}

export interface AuthOkMsg {
	type: 'auth_ok';
	sessionId: string;
}

export interface AuthErrorMsg {
	type: 'auth_error';
	error: 'invalid_token' | 'protocol_mismatch';
}

/** bridge 请求扩展执行代码（仅认证后下发） */
export interface ExecuteMsg {
	type: 'execute';
	id: string;
	code: string;
}

export type ServerMessage =
	| HelloMsg
	| PairedMsg
	| PairErrorMsg
	| AuthOkMsg
	| AuthErrorMsg
	| ExecuteMsg
	| { type: 'ping'; id: string }
	| { type: 'pong'; id: string };

// ─── client → bridge ──────────────────────────────────────────────────

/** 扩展自述信息，仅作日志/展示，**不作为鉴权依据** */
export interface ClientInfo {
	/** 运行宿主：EDA 桌面客户端 还是 浏览器网页版 */
	host: 'desktop' | 'web' | 'unknown';
	/** 扩展自身版本 */
	extVersion: string;
	/** EDA 版本，如 3.2.175 */
	edaVersion?: string;
}

export interface PairMsg {
	type: 'pair';
	protocol: number;
	code: string;
	client: ClientInfo;
}

export interface AuthMsg {
	type: 'auth';
	protocol: number;
	token: string;
	client: ClientInfo;
}

export interface ResultMsg {
	type: 'result';
	id: string;
	result: unknown;
}

export interface ErrorMsg {
	type: 'error';
	id: string;
	error: string;
	/** 扩展侧捕获的堆栈，便于 AI 定位是 API 用错还是 EDA 内部报错 */
	stack?: string;
}

export type ClientMessage =
	| PairMsg
	| AuthMsg
	| ResultMsg
	| ErrorMsg
	| { type: 'ping'; id: string }
	| { type: 'pong'; id: string };

// ─── 工具函数 ─────────────────────────────────────────────────────────

export function isServerMessage(v: unknown): v is ServerMessage {
	return typeof v === 'object' && v !== null && typeof (v as { type?: unknown }).type === 'string';
}

export function isClientMessage(v: unknown): v is ClientMessage {
	return typeof v === 'object' && v !== null && typeof (v as { type?: unknown }).type === 'string';
}
