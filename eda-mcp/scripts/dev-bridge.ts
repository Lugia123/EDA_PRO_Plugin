/**
 * 联调入口 —— 不经 Claude Code 直接跑 bridge，用来开发/验证扩展端。
 *
 *   npm run dev:bridge
 *
 * 行为：
 *   1. 启动 bridge，未配对则立刻开一次配对并把 6 位码打在终端
 *   2. 打印连接状态变化
 *   3. 扩展就绪后自动跑一段探针代码，验证 eda.* 真的能调
 *   4. 之后从 stdin 逐行读 JS 代码，在 EDA 里执行并打印结果（相当于一个远程 REPL）
 *
 * 配对结果落在与正式运行相同的 ~/.eda-mcp/pairing.json，
 * 所以这里配对过一次，之后走 MCP 也是连着的。
 */
import { createInterface } from 'node:readline';
import { createServer } from 'node:http';
import { randomBytes } from 'node:crypto';
import { writeFileSync } from 'node:fs';
import { Bridge } from '../src/bridge.js';
import { loadPairing, startPairing } from '../src/pairing.js';

const out = (s: string) => process.stdout.write(`${s}\n`);

const PROBE = `
return {
  project: await eda.dmt_Project.getCurrentProjectInfo().catch(e => 'ERR: ' + e.message),
  host: eda.sys_Environment.isClient() ? 'desktop' : eda.sys_Environment.isWeb() ? 'web' : 'unknown',
  edaVersion: eda.sys_Environment.getEditorCurrentVersion(),
  online: eda.sys_Environment.isOnlineMode(),
};
`;

const bridge = new Bridge();
const port = await bridge.start();
out(`\n▶ bridge 已监听 127.0.0.1:${port}`);

const rec = await loadPairing();
if (rec) {
	out(`▶ 已有配对记录（${new Date(rec.pairedAt).toLocaleString('zh-CN')}），等待扩展自动重连…`);
} else {
	const s = startPairing();
	out(`\n┌──────────────────────────────────┐`);
	out(`│  配对码：  ${s.code}                │`);
	out(`└──────────────────────────────────┘`);
	out(`在 EDA 里点「EDA Bridge → 配对(P)...」输入上面 6 位数字（5 分钟内有效）\n`);
}

// 监视连接状态变化
let lastCount = -1;
let probed = false;
setInterval(() => {
	const clients = bridge.authedClients();
	if (clients.length !== lastCount) {
		lastCount = clients.length;
		if (clients.length === 0) {
			out('▶ 当前没有已认证的 EDA 连接');
		} else {
			for (const c of clients) {
				out(`▶ 已连接：${c.info?.host ?? '?'} / EDA ${c.info?.edaVersion ?? '?'} / ext ${c.info?.extVersion ?? '?'} (origin=${c.origin ?? '-'})`);
			}
		}
	}
	if (clients.length > 0 && !probed) {
		probed = true;
		out('\n▶ 自动探针：验证 eda.* 是否可调…');
		bridge
			.execute(PROBE)
			.then((r) => out(`✅ 探针结果：\n${JSON.stringify(r, null, 2)}\n\n直接输入 JS 代码回车即可在 EDA 中执行（记得 return）：`))
			.catch((e: Error) => out(`❌ 探针失败：${e.message}`));
	}
}, 1000);

/**
 * 开发用执行端点 —— 让终端能直接把代码丢进 EDA，省去每次绕浏览器注入。
 *
 * 安全：只绑 127.0.0.1，且必须带 X-Dev-Token（每次启动随机生成，写到 /tmp）。
 * 恶意网页猜不到 token 也读不到本地文件。**这个端点只在本脚本里有，
 * 正式的 MCP 进程不会开**，那边所有执行都必须经过 MCP 工具调用。
 */
const DEV_TOKEN = randomBytes(16).toString('hex');
const DEV_TOKEN_FILE = '/tmp/eda-dev-token';
const DEV_PORT = 49650;
writeFileSync(DEV_TOKEN_FILE, DEV_TOKEN, { mode: 0o600 });

createServer((req, res) => {
	const reply = (status: number, body: unknown) => {
		res.writeHead(status, { 'Content-Type': 'application/json' });
		res.end(JSON.stringify(body));
	};
	if (req.headers['x-dev-token'] !== DEV_TOKEN) return reply(403, { error: 'bad dev token' });
	if (req.method !== 'POST' || req.url !== '/exec') return reply(404, { error: 'POST /exec only' });

	let body = '';
	req.on('data', (c) => (body += c));
	req.on('end', () => {
		let code: string;
		let timeout: number | undefined;
		try {
			const parsed = JSON.parse(body) as { code?: string; timeout_ms?: number };
			if (typeof parsed.code !== 'string') throw new Error('code 必须是 string');
			code = parsed.code;
			timeout = parsed.timeout_ms;
		} catch (e) {
			return reply(400, { error: (e as Error).message });
		}
		bridge
			.execute(code, timeout)
			.then((result) => reply(200, { ok: true, result }))
			.catch((e: Error) => reply(200, { ok: false, error: e.message }));
	});
}).listen(DEV_PORT, '127.0.0.1', () => {
	out(`▶ 开发执行端点：POST http://127.0.0.1:${DEV_PORT}/exec（token 见 ${DEV_TOKEN_FILE}）`);
});

// stdin REPL
const rl = createInterface({ input: process.stdin });
rl.on('line', (line) => {
	const code = line.trim();
	if (!code) return;
	if (code === '.exit') {
		void bridge.stop().then(() => process.exit(0));
		return;
	}
	bridge
		.execute(code)
		.then((r) => out(JSON.stringify(r, null, 2)))
		.catch((e: Error) => out(`❌ ${e.message}`));
});
