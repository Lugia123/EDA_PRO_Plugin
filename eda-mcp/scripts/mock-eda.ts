/**
 * 模拟 EDA 扩展 —— 用来在没有真 EDA 的情况下端到端验证 bridge / 配对 / execute。
 *
 *   npx tsx scripts/mock-eda.ts <配对码|auto>
 *
 * 它复刻扩展端的行为：扫端口 → 等 hello → pair 或 auth → 响应 execute。
 * 区别只在于「执行代码」用的是一个假的 eda 对象，而不是真 EDA。
 *
 * 用途：改协议或配对逻辑后先用它跑一遍，能在不惊动真 EDA 的前提下
 * 覆盖 bridge 这半边的全部分支（含拒绝路径）。
 */
import { WebSocket } from 'ws';
import { PORT_END, PORT_START, PROTOCOL_VERSION, SERVICE_ID } from '../../shared/protocol.js';
import type { ClientInfo, ServerMessage } from '../../shared/protocol.js';

const codeArg = process.argv[2] ?? '';
const out = (s: string) => process.stdout.write(`[mock-eda] ${s}\n`);

const CLIENT: ClientInfo = { host: 'web', extVersion: '0.1.0-mock', edaVersion: '3.2.175' };

/** 假 eda 对象：只实现探针会用到的几个方法 */
const fakeEda = {
	sys_Environment: {
		isClient: () => false,
		isWeb: () => true,
		getEditorCurrentVersion: () => '3.2.175',
		isOnlineMode: () => true,
	},
	dmt_Project: {
		getCurrentProjectInfo: async () => ({ uuid: 'mock-project', name: 'MockProject', friendlyName: '模拟工程' }),
	},
	sys_Storage: { getExtensionAllUserConfigs: () => ({}) },
};

/** 用 MOCK_TOKEN 传入已有 token 可测重连时的 auth 路径（真扩展从 SYS_Storage 取） */
let token = process.env.MOCK_TOKEN ?? '';

async function findBridge(): Promise<WebSocket> {
	for (let port = PORT_START; port <= PORT_END; port++) {
		const ws = await tryPort(port);
		if (ws) {
			out(`已连上 127.0.0.1:${port}`);
			return ws;
		}
	}
	throw new Error(`端口段 ${PORT_START}-${PORT_END} 内没找到 bridge`);
}

function tryPort(port: number): Promise<WebSocket | null> {
	return new Promise((resolve) => {
		const ws = new WebSocket(`ws://127.0.0.1:${port}`);
		const timer = setTimeout(() => {
			ws.terminate();
			resolve(null);
		}, 1500);
		ws.once('message', (raw) => {
			clearTimeout(timer);
			try {
				const msg = JSON.parse(raw.toString()) as ServerMessage;
				if (msg.type === 'hello' && msg.service === SERVICE_ID && msg.protocol === PROTOCOL_VERSION) {
					out(`收到 hello：pairingOpen=${msg.pairingOpen} serverVersion=${msg.serverVersion}`);
					resolve(ws);
					return;
				}
			} catch {
				/* ignore */
			}
			ws.terminate();
			resolve(null);
		});
		ws.once('error', () => {
			clearTimeout(timer);
			resolve(null);
		});
	});
}

const ws = await findBridge();
const send = (m: unknown) => ws.send(JSON.stringify(m));

if (token) {
	send({ type: 'auth', protocol: PROTOCOL_VERSION, token, client: CLIENT });
} else if (codeArg && codeArg !== 'auto') {
	out(`用配对码 ${codeArg} 配对…`);
	send({ type: 'pair', protocol: PROTOCOL_VERSION, code: codeArg, client: CLIENT });
} else {
	out('未提供配对码：将只连接不认证，用于验证 bridge 是否正确拒绝未认证连接');
}

ws.on('message', (raw) => {
	const msg = JSON.parse(raw.toString()) as ServerMessage;
	switch (msg.type) {
		case 'paired':
			token = msg.token;
			out(`✅ 配对成功，token=${token.slice(0, 12)}…（真扩展会存进 SYS_Storage）`);
			break;
		case 'pair_error':
			out(`❌ 配对失败：${msg.error}${msg.attemptsLeft !== undefined ? ` 剩余 ${msg.attemptsLeft} 次` : ''}`);
			break;
		case 'auth_ok':
			out(`✅ 认证通过 session=${msg.sessionId.slice(0, 8)}`);
			break;
		case 'auth_error':
			out(`❌ 认证失败：${msg.error}`);
			break;
		case 'execute': {
			const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor as new (
				a: string,
				b: string,
			) => (eda: unknown) => Promise<unknown>;
			void (async () => {
				try {
					const fn = new AsyncFunction('eda', msg.code);
					const result = await fn(fakeEda);
					out(`执行 ${msg.id.slice(0, 8)} → 成功`);
					send({ type: 'result', id: msg.id, result: result ?? null });
				} catch (e) {
					out(`执行 ${msg.id.slice(0, 8)} → 失败：${(e as Error).message}`);
					send({ type: 'error', id: msg.id, error: (e as Error).message, stack: (e as Error).stack });
				}
			})();
			break;
		}
		case 'ping':
			send({ type: 'pong', id: msg.id });
			break;
		default:
			out(`收到 ${msg.type}`);
	}
});

ws.on('close', (code, reason) => {
	out(`连接关闭 code=${code} reason=${reason.toString() || '-'}`);
	process.exit(0);
});
