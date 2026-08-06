/**
 * 配对与凭证 —— 本项目唯一的鉴权机制。
 *
 * 威胁模型（实测得出，不是假想）：
 *   从 https://pro.lceda.cn 页面里 `new WebSocket('ws://127.0.0.1:49620')` 能连通，
 *   Chrome 视 loopback 为可信来源，既不触发 CSP 也不触发混合内容拦截。
 *   → 任意网站都能连上本机 bridge。而 execute 是「在 EDA 里跑任意 JS」，
 *     等于把用户的工程和 EDA 全部能力交给对方。
 *   → 因此「握手时自报 service 名」不构成鉴权（谁都能自报），必须有一次人工参与。
 *
 * 机制：一次性 6 位配对码（用户从 AI 侧读到，手输进 EDA 扩展面板）换长期 token。
 *   - 配对码：内存态、5 分钟 TTL、最多 5 次尝试、成功即废
 *   - token ：32 字节随机 hex，落盘 ~/.eda-mcp/pairing.json (0600)
 *   - 比较  ：常数时间，避免时序侧信道
 *
 * 为什么不让扩展直接读 token 文件（那样能免去手输）：
 *   主攻目标是网页版，浏览器沙箱里 SYS_FileSystem 读不到 ~/.eda-mcp/。
 *   配对码对桌面端和网页版都通用。
 */
import { randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { chmod, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import type { ClientInfo } from '../../shared/protocol.js';
import { PAIR_CODE_TTL_MS, PAIR_MAX_ATTEMPTS } from '../../shared/protocol.js';
import { log, logError } from './logger.js';

const CONFIG_DIR = process.env.EDA_MCP_HOME ?? join(homedir(), '.eda-mcp');
const PAIRING_FILE = join(CONFIG_DIR, 'pairing.json');

export interface PairingRecord {
	token: string;
	pairedAt: number;
	client?: ClientInfo;
}

export interface PairingSession {
	code: string;
	expiresAt: number;
	attempts: number;
}

export type VerifyResult =
	| { ok: true; token: string }
	| { ok: false; error: 'no_pairing_session' | 'invalid_code' | 'expired' | 'too_many_attempts'; attemptsLeft?: number };

/** 已落盘的配对记录（进程内缓存，null = 未配对） */
let record: PairingRecord | null = null;
let recordLoaded = false;

/** 进行中的配对会话，仅存内存 —— 进程退出即失效，这是特意的 */
let session: PairingSession | null = null;

export async function loadPairing(): Promise<PairingRecord | null> {
	if (recordLoaded) return record;
	recordLoaded = true;
	try {
		const raw = await readFile(PAIRING_FILE, 'utf-8');
		const parsed = JSON.parse(raw) as Partial<PairingRecord>;
		if (typeof parsed.token === 'string' && parsed.token.length >= 32) {
			record = { token: parsed.token, pairedAt: parsed.pairedAt ?? 0, client: parsed.client };
			log(`已加载配对记录（${record.client?.host ?? 'unknown'}，${new Date(record.pairedAt).toLocaleString('zh-CN')}）`);
		} else {
			log('配对文件格式不正确，按未配对处理');
		}
	} catch (e) {
		if ((e as NodeJS.ErrnoException).code !== 'ENOENT') logError('读取配对文件失败', e);
	}
	return record;
}

async function persist(rec: PairingRecord): Promise<void> {
	await mkdir(dirname(PAIRING_FILE), { recursive: true, mode: 0o700 });
	await writeFile(PAIRING_FILE, JSON.stringify(rec, null, 2), { mode: 0o600 });
	// mkdir/writeFile 的 mode 受 umask 影响，显式收紧一次
	await chmod(PAIRING_FILE, 0o600);
}

/** 开一次配对：生成 6 位码，5 分钟内有效 */
export function startPairing(): PairingSession {
	const code = String(randomInt(0, 1_000_000)).padStart(6, '0');
	session = { code, expiresAt: Date.now() + PAIR_CODE_TTL_MS, attempts: 0 };
	log(`已开启配对会话，配对码 ${code}，${PAIR_CODE_TTL_MS / 1000}s 内有效`);
	return session;
}

export function getPairingSession(): PairingSession | null {
	if (session && Date.now() > session.expiresAt) session = null;
	return session;
}

export function cancelPairing(): void {
	session = null;
}

/** 校验扩展提交的配对码；通过则签发并落盘长期 token */
export async function verifyCode(code: string, client?: ClientInfo): Promise<VerifyResult> {
	const s = session;
	if (!s) return { ok: false, error: 'no_pairing_session' };
	if (Date.now() > s.expiresAt) {
		session = null;
		return { ok: false, error: 'expired' };
	}
	if (s.attempts >= PAIR_MAX_ATTEMPTS) {
		session = null;
		return { ok: false, error: 'too_many_attempts' };
	}
	s.attempts += 1;

	if (!constantTimeEqual(code, s.code)) {
		const attemptsLeft = PAIR_MAX_ATTEMPTS - s.attempts;
		if (attemptsLeft <= 0) {
			session = null;
			return { ok: false, error: 'too_many_attempts', attemptsLeft: 0 };
		}
		return { ok: false, error: 'invalid_code', attemptsLeft };
	}

	// 配对成功：码作废，签发 token
	session = null;
	const rec: PairingRecord = { token: randomBytes(32).toString('hex'), pairedAt: Date.now(), client };
	await persist(rec);
	record = rec;
	recordLoaded = true;
	log(`配对成功（${client?.host ?? 'unknown'} / EDA ${client?.edaVersion ?? '?'}），已签发 token`);
	return { ok: true, token: rec.token };
}

/** 校验扩展带来的长期 token */
export async function verifyToken(token: string): Promise<boolean> {
	const rec = await loadPairing();
	if (!rec) return false;
	return constantTimeEqual(token, rec.token);
}

/** 解除配对：删除 token，已连接的会话由 bridge 负责断开 */
export async function revokePairing(): Promise<void> {
	record = null;
	recordLoaded = true;
	session = null;
	try {
		await rm(PAIRING_FILE, { force: true });
		log('已解除配对并删除本地 token');
	} catch (e) {
		logError('删除配对文件失败', e);
	}
}

export function pairingFilePath(): string {
	return PAIRING_FILE;
}

/** 常数时间比较；长度不等直接返回 false（长度本身不算敏感信息） */
function constantTimeEqual(a: string, b: string): boolean {
	const ba = Buffer.from(a, 'utf-8');
	const bb = Buffer.from(b, 'utf-8');
	if (ba.length !== bb.length) return false;
	return timingSafeEqual(ba, bb);
}
