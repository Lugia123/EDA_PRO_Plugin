#!/usr/bin/env node
/**
 * 立创EDA专业版 本地 MCP Server
 *
 * 进程内跑一个 bridge（WebSocket 服务端），EDA 扩展 eda-bridge 连过来；
 * MCP 工具把请求转成「在 EDA 里执行 JS」，拿回结果。
 *
 * 链路：Claude Code ──stdio/JSON-RPC──> 本进程 ──ws://127.0.0.1:4963x──> EDA 扩展 ──> eda.* API
 *
 * 首次使用要走一次配对（威胁模型见 pairing.ts / docs/design.md §3）。
 * 工具定义在 src/tools/，本文件只负责启动与分发。
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { Bridge } from './bridge.js';
import { loadPairing } from './pairing.js';
import { log, logError } from './logger.js';
import { allTools, toolMap } from './tools/index.js';
import { notConnectedHint } from './tools/connection.js';
import type { ToolContext } from './tools/types.js';

const VERSION = process.env.EDA_MCP_VERSION ?? '0.1.0';
const bridge = new Bridge();

const server = new Server({ name: 'eda-mcp', version: VERSION }, { capabilities: { tools: {} } });

const ctx: ToolContext = {
	bridge,
	exec: async <T>(code: string, timeoutMs?: number): Promise<T> => (await bridge.execute(code, timeoutMs)) as T,
};

server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: allTools.map((t) => ({ name: t.name, description: t.description, inputSchema: t.inputSchema })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;
	const tool = toolMap.get(name);
	if (!tool) throw new McpError(ErrorCode.MethodNotFound, `未知工具: ${name}`);

	try {
		const result = await tool.handler((args ?? {}) as Record<string, unknown>, ctx);
		return { content: [{ type: 'text' as const, text: JSON.stringify(result, null, 2) }] };
	} catch (err) {
		// NO_CLIENT 不是"出错"，是"还没连上" —— 给可操作指引而非裸错误
		if (err instanceof Error && err.message === 'NO_CLIENT') {
			return { content: [{ type: 'text' as const, text: await notConnectedHint(bridge.listeningPort) }], isError: true };
		}
		logError(`工具 ${name} 执行失败`, err);
		const msg = err instanceof Error ? err.message : String(err);
		return { content: [{ type: 'text' as const, text: `错误: ${msg}` }], isError: true };
	}
});

async function main(): Promise<void> {
	const paired = (await loadPairing()) !== null;
	await bridge.start();
	const transport = new StdioServerTransport();
	await server.connect(transport);
	log(`EDA MCP v${VERSION} 已启动（stdio），${allTools.length} 个工具，配对状态：${paired ? '已配对' : '未配对'}`);
}

process.on('SIGINT', () => void bridge.stop().then(() => process.exit(0)));
process.on('SIGTERM', () => void bridge.stop().then(() => process.exit(0)));

main().catch((err) => {
	logError('启动失败', err);
	process.exit(1);
});
