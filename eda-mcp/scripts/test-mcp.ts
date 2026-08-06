/**
 * MCP 工具层端到端自测 —— 用官方 SDK 的 Client 以 stdio 直连本 server。
 *
 *   npm run test:mcp
 *
 * 走的是真实 MCP 协议（initialize / tools/list / tools/call），
 * 因此覆盖到「工具在 Claude Code 里会怎么表现」，而不只是内部函数调用。
 * 好处是不必先把 plugin 装进 Claude Code（装了也要重启会话才生效）。
 *
 * 前置：EDA 里的 eda-bridge 扩展已配对。本脚本会 spawn 自己的 MCP 进程，
 * 它自带 bridge；若此时 dev-bridge 还占着 49630，MCP 会退到 49631，
 * 而扩展连的是 49630 —— 所以跑本测试前应先停掉 dev-bridge，
 * 等扩展重连到 MCP 自己的 bridge（脚本会等）。
 */
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const serverEntry = join(here, '..', 'dist', 'index.js');

let pass = 0;
let fail = 0;
const check = (name: string, ok: boolean, detail?: unknown) => {
	if (ok) {
		pass++;
		console.log(`  ✅ ${name}`);
	} else {
		fail++;
		console.log(`  ❌ ${name}${detail !== undefined ? ` → ${JSON.stringify(detail).slice(0, 300)}` : ''}`);
	}
};

/** 工具返回的是 content[].text，统一解析成对象 */
function parse(res: unknown): Record<string, unknown> {
	const content = (res as { content?: Array<{ type: string; text?: string }> }).content ?? [];
	const text = content.map((c) => c.text ?? '').join('\n');
	try {
		return JSON.parse(text) as Record<string, unknown>;
	} catch {
		return { _raw: text };
	}
}

const transport = new StdioClientTransport({ command: 'node', args: [serverEntry] });
const client = new Client({ name: 'eda-mcp-selftest', version: '1.0.0' }, { capabilities: {} });

console.log('\n═══ MCP 工具层自测 ═══\n');
await client.connect(transport);
console.log('▶ 已连接 MCP server（stdio）\n');

// 1. tools/list
console.log('[1] tools/list');
const { tools } = await client.listTools();
const names = tools.map((t) => t.name).sort();
check('返回 4 个工具', tools.length === 4, names);
check('工具名符合预期', JSON.stringify(names) === JSON.stringify(['eda_execute', 'eda_pair_start', 'eda_status', 'eda_unpair']), names);
check('每个工具都有描述', tools.every((t) => (t.description ?? '').length > 20));
check('eda_execute 声明了必填 code', JSON.stringify((tools.find((t) => t.name === 'eda_execute')?.inputSchema as { required?: string[] })?.required) === '["code"]');

// 2. eda_status
console.log('\n[2] eda_status');
const st = parse(await client.callTool({ name: 'eda_status', arguments: {} }));
check('bridge 已监听端口', typeof st.bridge_port === 'number' && (st.bridge_port as number) > 0, st.bridge_port);
check('已配对（此前真机配对过）', st.paired === true, st);
check('返回配对文件路径', typeof st.pairing_file === 'string');
console.log(`     bridge_port=${String(st.bridge_port)} clients=${JSON.stringify(st.connected_clients)}`);

// 3. 等扩展连到本进程的 bridge
console.log('\n[3] 等待 EDA 扩展连入本进程的 bridge（最多 120s）');
let connected = false;
for (let i = 0; i < 60; i++) {
	const s = parse(await client.callTool({ name: 'eda_status', arguments: {} }));
	const clients = (s.connected_clients ?? []) as unknown[];
	if (clients.length > 0) {
		connected = true;
		console.log(`     已连接：${JSON.stringify(clients[0])}`);
		break;
	}
	await new Promise((r) => setTimeout(r, 2000));
}
check('EDA 扩展已连入', connected);

// 4. eda_execute
if (connected) {
	console.log('\n[4] eda_execute');
	const r1 = parse(await client.callTool({ name: 'eda_execute', arguments: { code: 'return 6*7;' } }));
	check('执行算术返回 42', r1.result === 42, r1);

	const r2 = parse(
		await client.callTool({ name: 'eda_execute', arguments: { code: 'return eda.sys_Environment.getEditorCurrentVersion();' } }),
	);
	check('取回 EDA 版本号', typeof r2.result === 'string' && /^\d+\.\d+/.test(r2.result as string), r2);

	const r3 = parse(await client.callTool({ name: 'eda_execute', arguments: { code: 'throw new Error("故意失败");' } }));
	check('代码抛错时如实回报', JSON.stringify(r3).includes('故意失败'), r3);

	const r4 = parse(await client.callTool({ name: 'eda_execute', arguments: { code: 'return await eda.dmt_Project.getCurrentProjectInfo();' } }));
	const proj = (r4.result ?? {}) as Record<string, unknown>;
	check('取回真实工程信息', typeof proj === 'object' && Object.keys(proj).length > 0, Object.keys(proj));
} else {
	console.log('\n[4] eda_execute —— 跳过（扩展未连入）');
}

// 5. 参数校验
console.log('\n[5] 参数校验');
const bad = parse(await client.callTool({ name: 'eda_execute', arguments: { code: '' } }));
check('空 code 被拒绝', JSON.stringify(bad).includes('必填'), bad);

await client.close();
console.log(`\n═══ 结果：${pass} 通过 / ${fail} 失败 ═══\n`);
process.exit(fail === 0 ? 0 : 1);
