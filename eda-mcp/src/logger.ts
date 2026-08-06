/**
 * 日志 —— 一律走 stderr。
 *
 * stdio 传输下 stdout 是 MCP 的 JSON-RPC 通道，往里写一个字节都会破坏协议。
 * 这是 stdio MCP 最常见的翻车点，所以本项目禁止直接 console.log。
 */

const PREFIX = '[eda-mcp]';

export function log(msg: string): void {
	process.stderr.write(`${PREFIX} ${msg}\n`);
}

export function logError(msg: string, err?: unknown): void {
	const detail = err instanceof Error ? `${err.message}\n${err.stack ?? ''}` : err !== undefined ? String(err) : '';
	process.stderr.write(`${PREFIX} [ERROR] ${msg}${detail ? ` — ${detail}` : ''}\n`);
}

export function logDebug(msg: string): void {
	if (process.env.EDA_MCP_DEBUG) process.stderr.write(`${PREFIX} [debug] ${msg}\n`);
}
