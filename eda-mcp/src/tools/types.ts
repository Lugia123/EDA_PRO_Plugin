/**
 * 工具定义的统一形态。
 *
 * 每个工具自带 schema 与 handler，由 tools/index.ts 汇总成注册表，
 * src/index.ts 只负责把 MCP 请求分发过去 —— 加工具不用动分发逻辑。
 */
import type { Bridge } from '../bridge.js';

export interface ToolContext {
	bridge: Bridge;
	/** 在 EDA 里执行代码；失败时抛错，NO_CLIENT 由上层统一转成连接指引 */
	exec: <T = unknown>(code: string, timeoutMs?: number) => Promise<T>;
}

export interface ToolDef {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	/** 返回任意可 JSON 序列化的值；上层负责包装成 MCP content */
	handler: (args: Record<string, unknown>, ctx: ToolContext) => Promise<unknown>;
	/** 标注会修改用户工程的工具，便于在描述与文档里统一提示 */
	mutating?: boolean;
}

/** 取必填字符串参数 */
export function requireString(args: Record<string, unknown>, key: string): string {
	const v = args[key];
	if (typeof v !== 'string' || !v.trim()) throw new Error(`${key} 必填（string）`);
	return v;
}

/** 取可选字符串参数 */
export function optionalString(args: Record<string, unknown>, key: string): string | undefined {
	const v = args[key];
	return typeof v === 'string' && v.trim() ? v : undefined;
}

export function optionalBool(args: Record<string, unknown>, key: string, dflt = false): boolean {
	const v = args[key];
	return typeof v === 'boolean' ? v : dflt;
}
