/**
 * 连接与配对相关工具。
 *
 * 这组工具不需要 EDA 已连接就能调用 —— 它们本身就是用来建立/诊断连接的。
 */
import { PAIR_CODE_TTL_MS, PORT_END, PORT_START } from '../../../shared/protocol.js';
import { loadPairing, pairingFilePath, revokePairing, startPairing } from '../pairing.js';
import type { ToolDef } from './types.js';

/** 未连接时给 AI 的统一指引，让它能直接告诉用户下一步做什么 */
export async function notConnectedHint(bridgePort: number): Promise<string> {
	const paired = (await loadPairing()) !== null;
	return [
		'当前没有已连接的 EDA。按顺序排查：',
		'1. 立创EDA专业版里是否安装了 eda-bridge 扩展（高级 → 扩展管理器 → 已安装 → 导入 .eext）',
		'2. 扩展管理器里是否勾选了「允许外部交互」—— 不勾则 SYS_WebSocket 直接抛错，这是立创的硬性要求',
		paired
			? '3. 本机已有配对记录，扩展启动后会自动重连；若长时间连不上，让用户点「EDA Bridge → 重新连接」，仍不行则用 eda_unpair 后重新配对'
			: '3. 尚未配对：调用 eda_pair_start 取 6 位码，让用户在「EDA Bridge → 配对」里输入',
		'4. 若刚装好扩展，需要刷新网页版页面（或重启客户端）让扩展加载',
		`\nbridge 监听端口：${bridgePort || `${PORT_START}-${PORT_END}`}`,
	].join('\n');
}

export const connectionTools: ToolDef[] = [
	{
		name: 'eda_status',
		description:
			'查看 EDA 连接状态：bridge 端口、已连接的 EDA 实例（桌面客户端 / 网页版）、配对状态。' +
			'\n\n任何 EDA 操作失败或不确定是否连着时先调这个，它会给出下一步的明确指引。',
		inputSchema: { type: 'object', properties: {} },
		handler: async (_args, ctx) => {
			const rec = await loadPairing();
			const clients = ctx.bridge.authedClients().map((c) => ({
				id: c.id.slice(0, 8),
				host: c.info?.host ?? 'unknown',
				eda_version: c.info?.edaVersion,
				ext_version: c.info?.extVersion,
				active: c.id === ctx.bridge.activeClient()?.id,
				connected_seconds: Math.round((Date.now() - c.connectedAt) / 1000),
			}));
			return {
				bridge_port: ctx.bridge.listeningPort,
				paired: rec !== null,
				paired_at: rec ? new Date(rec.pairedAt).toISOString() : null,
				pairing_file: pairingFilePath(),
				connected_clients: clients,
				hint: clients.length === 0 ? await notConnectedHint(ctx.bridge.listeningPort) : '连接正常，可以操作 EDA。',
			};
		},
	},
	{
		name: 'eda_pair_start',
		description:
			'开启一次配对，返回 6 位配对码。把码原样告诉用户，让 TA 在 EDA 的「EDA Bridge → 配对」里输入。' +
			`\n\n配对码 ${PAIR_CODE_TTL_MS / 60000} 分钟内有效、最多 5 次尝试、成功即废。之后 bridge 给扩展签发长期 token，重启 EDA 也不用再输。` +
			'\n\n为什么要配对：任意网页都能连本机 ws://127.0.0.1（Chrome 不拦 loopback），而本 MCP 能在 EDA 里执行任意代码，故必须一次人工确认。',
		inputSchema: { type: 'object', properties: {} },
		handler: async (_args, ctx) => {
			const s = startPairing();
			return {
				pairing_code: s.code,
				expires_in_seconds: Math.round((s.expiresAt - Date.now()) / 1000),
				bridge_port: ctx.bridge.listeningPort,
				next_step:
					`请把配对码 ${s.code} 告诉用户，让 TA 在 EDA 里操作：顶部菜单「EDA Bridge」→「配对(P)...」→ 输入这 6 位数字。` +
					'\n若没有该菜单，说明扩展没装或没启用；若提示 WebSocket 报错，说明「允许外部交互」没勾。',
			};
		},
	},
	{
		name: 'eda_unpair',
		description: '解除配对：删除本地 token 并断开所有已连接的 EDA。适用于换机器、疑似 token 泄露、或配对状态错乱需要重来。',
		inputSchema: { type: 'object', properties: {} },
		handler: async (_args, ctx) => {
			await revokePairing();
			ctx.bridge.disconnectAll('unpaired');
			return { ok: true, message: '已解除配对并断开所有 EDA 连接。重新使用需再走一次 eda_pair_start。' };
		},
	},
	{
		name: 'eda_execute',
		description:
			'在已连接的 EDA 里执行一段 JavaScript，返回结果。**优先使用语义化工具**（eda_project_* 等），' +
			'本工具是它们覆盖不到时的兜底。' +
			'\n\n代码体运行在 AsyncFunction 里，可直接 await，全局对象 eda 已注入，**必须 return** 否则拿到 null。' +
			'\n例：`return await eda.dmt_Project.getCurrentProjectInfo();`' +
			'\n\nAPI 命名空间：sys_*（对话框/文件/存储）、dmt_*（工程/板子/原理图/PCB 管理）、sch_*（原理图图元/DRC）、' +
			'pcb_*（PCB 图元/网络/层/生产资料）、lib_*（器件/符号/封装）。返回值须能 JSON 序列化，类实例请先取字段。',
		inputSchema: {
			type: 'object',
			properties: {
				code: { type: 'string', description: 'JS 代码体（不含函数包裹）。用 return 返回结果，可用 await。' },
				timeout_ms: { type: 'integer', description: '可选，超时毫秒数，默认 30000。DRC、生产资料导出等耗时操作可调大。' },
			},
			required: ['code'],
		},
		handler: async (args, ctx) => {
			const code = args.code;
			if (typeof code !== 'string' || !code.trim()) throw new Error('code 必填（string，JS 代码体）');
			const t = args.timeout_ms;
			return { result: await ctx.exec(code, typeof t === 'number' && t > 0 ? t : undefined) };
		},
	},
];
