#!/usr/bin/env node
/**
 * 立创EDA专业版 本地 MCP Server
 *
 * 进程内跑一个 bridge（WebSocket 服务端），EDA 扩展 eda-bridge 连过来；
 * MCP 工具把请求转成「在 EDA 里执行 JS」，拿回结果。
 *
 * 链路：Claude Code ──stdio/JSON-RPC──> 本进程 ──ws://127.0.0.1:4963x──> EDA 扩展 ──> eda.* API
 *
 * 首次使用要走一次配对（见 pairing.ts 里的威胁模型说明）。
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ErrorCode, ListToolsRequestSchema, McpError } from '@modelcontextprotocol/sdk/types.js';
import { PAIR_CODE_TTL_MS, PORT_END, PORT_START } from '../../shared/protocol.js';
import { Bridge } from './bridge.js';
import { loadPairing, pairingFilePath, revokePairing, startPairing } from './pairing.js';
import { log, logError } from './logger.js';

const VERSION = process.env.EDA_MCP_VERSION ?? '0.1.0';
const bridge = new Bridge();

const server = new Server({ name: 'eda-mcp', version: VERSION }, { capabilities: { tools: {} } });

/** 未连接时给 AI 的统一指引 —— 让它能直接告诉用户下一步做什么，而不是干报错 */
function notConnectedHint(): string {
	const paired = pairedSync;
	const steps = [
		`1. 在立创EDA专业版里安装扩展 eda-bridge（高级 → 扩展管理器 → 导入 → 选 .eext 文件）`,
		`2. 在扩展管理器里勾选该扩展的「允许外部交互」——不勾的话 SYS_WebSocket 会直接 throw，这是立创的硬性要求`,
		paired
			? `3. 本机已有配对记录，扩展启动后会自动重连；若一直连不上，用 eda_unpair 解除后重新配对`
			: `3. 用 eda_pair_start 取一个 6 位配对码，在 EDA 的「EDA Bridge」菜单里输入`,
	];
	return `当前没有已连接的 EDA。\n${steps.join('\n')}\n\nbridge 监听端口：${bridge.listeningPort || `${PORT_START}-${PORT_END}`}`;
}

let pairedSync = false;

server.setRequestHandler(ListToolsRequestSchema, async () => ({
	tools: [
		{
			name: 'eda_status',
			description:
				'查看 EDA 连接状态：bridge 监听端口、已连接的 EDA 实例（桌面客户端 / 网页版）、配对状态。' +
				'\n\n任何 EDA 操作失败或不确定是否连着时，先调这个。它会给出下一步该做什么的明确指引。',
			inputSchema: { type: 'object', properties: {} },
		},
		{
			name: 'eda_pair_start',
			description:
				'开启一次配对，返回 6 位配对码。把这个码原样告诉用户，让 TA 在 EDA 的「EDA Bridge → 配对」里输入。' +
				`\n\n配对码 ${PAIR_CODE_TTL_MS / 60000} 分钟内有效、最多试 5 次、成功即作废。` +
				'配对成功后 bridge 会给扩展签发长期 token，之后重启 EDA 或重连都不用再输。' +
				'\n\n为什么需要配对：任意网页都能连本机 ws://127.0.0.1（实测 Chrome 不拦 loopback），' +
				'而本 MCP 能在 EDA 里执行任意代码，所以必须有一次人工确认。',
			inputSchema: { type: 'object', properties: {} },
		},
		{
			name: 'eda_unpair',
			description:
				'解除配对：删除本地 token 并断开所有已连接的 EDA。' +
				'\n\n适用：换机器、怀疑 token 泄露、或配对状态错乱需要重来。解除后需重新走 eda_pair_start。',
			inputSchema: { type: 'object', properties: {} },
		},
		{
			name: 'eda_execute',
			description:
				'在已连接的 EDA 里执行一段 JavaScript，返回其结果。代码体运行在 AsyncFunction 里，' +
				'可以直接 `await`，全局对象 `eda` 已注入，**必须 `return` 你要的结果**（不 return 拿到 null）。' +
				'\n\n例：`return await eda.dmt_Project.getCurrentProjectInfo();`' +
				'\n\nAPI 命名空间：sys_*（对话框/文件/存储/WebSocket）、dmt_*（工程/文档树/原理图/PCB 管理）、' +
				'sch_*（原理图图元/DRC/仿真）、pcb_*（PCB 图元/网络/层/DRC/生产资料）、lib_*（器件/符号/封装/3D）。' +
				'\n\n注意：返回值必须能 JSON 序列化；EDA 里的类实例通常要先取字段再返回。',
			inputSchema: {
				type: 'object',
				properties: {
					code: {
						type: 'string',
						description: 'JS 代码体（不含函数包裹）。用 return 返回结果，可用 await。',
					},
					timeout_ms: {
						type: 'integer',
						description: '可选，执行超时毫秒数，默认 30000。DRC、生产资料导出等耗时操作可调大。',
					},
				},
				required: ['code'],
			},
		},
	],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
	const { name, arguments: args } = request.params;
	try {
		switch (name) {
			case 'eda_status': {
				const rec = await loadPairing();
				pairedSync = rec !== null;
				const clients = bridge.authedClients().map((c) => ({
					id: c.id.slice(0, 8),
					host: c.info?.host ?? 'unknown',
					eda_version: c.info?.edaVersion,
					ext_version: c.info?.extVersion,
					origin: c.origin,
					active: c.id === bridge.activeClient()?.id,
					connected_seconds: Math.round((Date.now() - c.connectedAt) / 1000),
				}));
				return json({
					bridge_port: bridge.listeningPort,
					paired: pairedSync,
					paired_at: rec ? new Date(rec.pairedAt).toISOString() : null,
					pairing_file: pairingFilePath(),
					connected_clients: clients,
					hint: clients.length === 0 ? notConnectedHint() : '连接正常，可以用 eda_execute 操作 EDA。',
				});
			}

			case 'eda_pair_start': {
				const s = startPairing();
				return json({
					pairing_code: s.code,
					expires_in_seconds: Math.round((s.expiresAt - Date.now()) / 1000),
					bridge_port: bridge.listeningPort,
					next_step:
						`请把配对码 ${s.code} 告诉用户，让 TA 在 EDA 里操作：顶部菜单「EDA Bridge」→「配对(P)...」→ 输入这 6 位数字。` +
						`\n若菜单不存在，说明扩展没装或没启用；若提示 WebSocket 报错，说明「允许外部交互」没勾。`,
				});
			}

			case 'eda_unpair': {
				await revokePairing();
				pairedSync = false;
				bridge.disconnectAll('unpaired');
				return json({ ok: true, message: '已解除配对并断开所有 EDA 连接。重新使用需再走一次 eda_pair_start。' });
			}

			case 'eda_execute': {
				const code = (args as { code?: unknown } | undefined)?.code;
				if (typeof code !== 'string' || !code.trim()) {
					throw new McpError(ErrorCode.InvalidParams, 'code 必填（string，JS 代码体）');
				}
				const timeout = (args as { timeout_ms?: unknown }).timeout_ms;
				const timeoutMs = typeof timeout === 'number' && timeout > 0 ? timeout : undefined;
				try {
					const result = await bridge.execute(code, timeoutMs);
					return json({ result });
				} catch (e) {
					if (e instanceof Error && e.message === 'NO_CLIENT') {
						return { content: [{ type: 'text', text: notConnectedHint() }], isError: true };
					}
					throw e;
				}
			}

			default:
				throw new McpError(ErrorCode.MethodNotFound, `未知工具: ${name}`);
		}
	} catch (err) {
		logError(`工具 ${name} 执行失败`, err);
		const msg = err instanceof Error ? err.message : String(err);
		return { content: [{ type: 'text', text: `错误: ${msg}` }], isError: true };
	}
});

function json(v: unknown): { content: Array<{ type: 'text'; text: string }> } {
	return { content: [{ type: 'text', text: JSON.stringify(v, null, 2) }] };
}

async function main(): Promise<void> {
	pairedSync = (await loadPairing()) !== null;
	await bridge.start();
	const transport = new StdioServerTransport();
	await server.connect(transport);
	log(`EDA MCP v${VERSION} 已启动（stdio），配对状态：${pairedSync ? '已配对' : '未配对'}`);
}

process.on('SIGINT', () => void bridge.stop().then(() => process.exit(0)));
process.on('SIGTERM', () => void bridge.stop().then(() => process.exit(0)));

main().catch((err) => {
	logError('启动失败', err);
	process.exit(1);
});
