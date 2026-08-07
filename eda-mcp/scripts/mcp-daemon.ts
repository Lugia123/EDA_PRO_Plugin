/**
 * 常驻 MCP 客户端 —— 让开发期能像在 Claude Code 里那样「一条一条」调工具。
 *
 *   npm run mcp:daemon            # 后台跑着
 *   ./scripts/mcp eda_status
 *   ./scripts/mcp eda_place_component '{"lcsc_id":"C347222","x":200,"y":150}'
 *
 * 为什么需要它：MCP 是 stdio 协议，每次调用都重新 spawn 一个 server 进程要等
 * 扩展重新连入，几十秒起步。写成大脚本能避开这个开销，但那样所有决策都被
 * 提前编码进去了 —— 看不出哪些是模型在按结果做判断。
 * daemon 保持一条连接，命令行每次只发一个工具调用，跟真实使用的粒度一致。
 *
 * 只监听 127.0.0.1，仅用于开发；正式使用是 Claude Code 直接连 MCP，不经过它。
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { createServer } from 'node:http';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = join(here, '..', 'dist', 'index.js');
const PORT = 49655;

const transport = new StdioClientTransport({ command: 'node', args: [serverEntry] });
const client = new Client({ name: 'eda-mcp-daemon', version: '1.0.0' }, { capabilities: {} });
await client.connect(transport);
process.stderr.write('[daemon] 已连接 MCP\n');

createServer((req, res) => {
	if (req.method !== 'POST') {
		res.writeHead(405).end('POST only');
		return;
	}
	let body = '';
	req.on('data', (c) => (body += c));
	req.on('end', () => {
		void (async () => {
			try {
				const { tool, args } = JSON.parse(body) as { tool: string; args?: Record<string, unknown> };
				const r = await client.callTool({ name: tool, arguments: args ?? {} });
				const text = ((r as { content?: Array<{ text?: string }> }).content ?? []).map((c) => c.text ?? '').join('\n');
				res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
				res.end(text || '{}');
			} catch (e) {
				res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
				res.end(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }));
			}
		})();
	});
}).listen(PORT, '127.0.0.1', () => process.stderr.write(`[daemon] 监听 127.0.0.1:${PORT}\n`));
