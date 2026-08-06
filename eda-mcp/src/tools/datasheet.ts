/**
 * 数据手册下载 —— 由 MCP 进程直接走 HTTP，不经 EDA。
 *
 * 这是本地 MCP 相对纯扩展方案的独有能力：浏览器沙箱里的扩展没法把文件落到磁盘，
 * Node 进程可以，而且能把落地路径交给 AI 继续处理（比如喂给 pdf 工具读参数）。
 *
 * 实测 SV30 工程 54 个带 Datasheet 的器件，链接分三类：
 *   - atta.szlcsc.com/...pdf     直链 PDF，可下载（21 个）
 *   - www.ti.com/cn/lit/gpn/xxx  302 到 PDF，可下载（4 个）
 *   - item.szlcsc.com/...html    立创商城页面，服务端请求被阿里云 WAF 拦（29 个）
 * 最后一类不做绕过，如实告诉用户去浏览器打开。
 */
import { createWriteStream } from 'node:fs';
import { mkdir, stat, unlink } from 'node:fs/promises';
import { homedir } from 'node:os';
import { basename, join, resolve } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { Readable } from 'node:stream';
import { FETCH_NETLIST_CODE, designatorOf, parseNetlist } from '../eda/netlist.js';
import type { ToolDef } from './types.js';
import { optionalString } from './types.js';

const MAX_BYTES = 50 * 1024 * 1024;
const DEFAULT_DIR = join(homedir(), 'Downloads', 'eda-datasheets');

/**
 * URL 来自工程数据，不能当成可信输入 —— 一个被构造过的工程可以把链接指向内网。
 * 只放行公网 http(s)，挡掉 loopback / 私有网段 / 链路本地。
 */
function assertSafeUrl(raw: string): URL {
	let u: URL;
	try {
		u = new URL(raw);
	} catch {
		throw new Error(`不是合法 URL：${raw}`);
	}
	if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error(`只支持 http/https，收到 ${u.protocol}`);
	const h = u.hostname.toLowerCase();
	const blocked =
		h === 'localhost' ||
		h.endsWith('.localhost') ||
		h === '0.0.0.0' ||
		/^127\./.test(h) ||
		/^10\./.test(h) ||
		/^192\.168\./.test(h) ||
		/^172\.(1[6-9]|2\d|3[01])\./.test(h) ||
		/^169\.254\./.test(h) ||
		h === '[::1]' ||
		h.startsWith('[fd') ||
		h.startsWith('[fe80');
	if (blocked) throw new Error(`拒绝下载内网地址：${h}`);
	return u;
}

/** 文件名清洗：防路径穿越，同时保持可读 */
function safeFileName(url: URL, disposition: string | null): string {
	let name = '';
	const m = disposition?.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
	if (m?.[1]) name = decodeURIComponent(m[1]);
	if (!name) name = basename(url.pathname);
	name = name.replace(/[/\\]/g, '_').replace(/^\.+/, '').trim();
	if (!name) name = 'datasheet';
	if (!/\.pdf$/i.test(name)) name += '.pdf';
	return name.slice(0, 120);
}

export const datasheetTools: ToolDef[] = [
	{
		name: 'eda_download_datasheet',
		description:
			'把元器件数据手册 PDF 下载到本机磁盘，返回落地路径（之后可用读 PDF 的工具提取参数）。' +
			'\n\n三种指定方式，任选其一：' +
			'\n- designator：当前原理图上的位号（如 U1），自动从网表取链接 —— 最常用' +
			'\n- lcsc_id：立创商城编号（如 C347222），从器件库取链接' +
			'\n- url：直接给链接' +
			'\n\n**注意**：立创商城的 `item.szlcsc.com/datasheet/...html` 是网页不是 PDF，' +
			'且服务端请求会被对方 WAF 拦截。遇到这类链接工具会如实报告，请让用户在浏览器里打开。' +
			'`atta.szlcsc.com` 的直链和多数原厂链接（如 ti.com）可以正常下载。',
		inputSchema: {
			type: 'object',
			properties: {
				designator: { type: 'string', description: '当前原理图上的位号，如 U1' },
				lcsc_id: { type: 'string', description: '立创商城编号，如 C347222' },
				url: { type: 'string', description: '数据手册直链' },
				save_dir: { type: 'string', description: `保存目录，默认 ${DEFAULT_DIR}` },
			},
		},
		handler: async (args, ctx) => {
			const des = optionalString(args, 'designator');
			const lcsc = optionalString(args, 'lcsc_id');
			let url = optionalString(args, 'url');
			let source = url ? 'url' : '';

			if (!url && des) {
				const text = await ctx.exec<string | null>(FETCH_NETLIST_CODE, 90_000);
				if (!text) throw new Error('取不到网表 —— 请确认当前打开的是原理图');
				const hit = parseNetlist(text).components.find((c) => designatorOf(c).toUpperCase() === des.toUpperCase());
				if (!hit) return { error: `当前原理图里没有位号 ${des}` };
				url = hit.props.Datasheet;
				source = `位号 ${designatorOf(hit)}（${hit.props['Manufacturer Part'] ?? ''}）`;
				if (!url) return { error: `器件 ${des} 在网表里没有 Datasheet 字段`, part: hit.props['Manufacturer Part'] };
			}

			if (!url && lcsc) {
				const d = await ctx.exec<{ props?: Record<string, string> } | null>(
					`
					const hit = await eda.lib_Device.getByLcscIds([${JSON.stringify(lcsc)}]);
					if (!hit || !hit.length) return null;
					const d = await eda.lib_Device.get(hit[0].uuid, hit[0].libraryUuid);
					return d ? { props: d.property?.otherProperty ?? {} } : null;
				`,
					60_000,
				);
				url = d?.props?.Datasheet;
				source = `立创编号 ${lcsc}`;
				if (!url) return { error: `器件库里 ${lcsc} 没有 Datasheet 字段` };
			}

			if (!url) throw new Error('请给出 designator、lcsc_id 或 url 三者之一');

			const u = assertSafeUrl(url);
			const dir = optionalString(args, 'save_dir') ?? DEFAULT_DIR;
			await mkdir(dir, { recursive: true });

			const res = await fetch(u, {
				redirect: 'follow',
				headers: { 'User-Agent': 'Mozilla/5.0 (compatible; eda-mcp/0.1)', Accept: 'application/pdf,*/*' },
				signal: AbortSignal.timeout(120_000),
			});
			const ctype = res.headers.get('content-type') ?? '';

			if (!res.ok) return { error: `下载失败 HTTP ${res.status}`, url: u.href, source };

			if (!/pdf/i.test(ctype)) {
				// 立创商城页面就是这条路径 —— 不去绕 WAF，如实告诉用户
				const isLcscPage = u.hostname.includes('item.szlcsc.com');
				return {
					error: '该链接返回的不是 PDF',
					content_type: ctype,
					url: u.href,
					source,
					hint: isLcscPage
						? '这是立创商城的器件网页，不是数据手册文件本身，而且服务端访问会被对方 WAF 拦截。请让用户在浏览器里打开这个链接查看/下载。'
						: '请让用户在浏览器打开该链接确认，或提供 PDF 直链。',
				};
			}

			const declared = Number(res.headers.get('content-length') ?? 0);
			if (declared > MAX_BYTES) {
				return { error: `文件过大（${(declared / 1048576).toFixed(1)} MB，上限 50 MB）`, url: u.href };
			}

			const name = safeFileName(u, res.headers.get('content-disposition'));
			const path = resolve(dir, name);
			if (!res.body) return { error: '响应没有内容', url: u.href };

			await pipeline(Readable.fromWeb(res.body as Parameters<typeof Readable.fromWeb>[0]), createWriteStream(path));
			const st = await stat(path);
			if (st.size > MAX_BYTES) {
				await unlink(path);
				return { error: `文件超过 50 MB 上限，已删除`, url: u.href };
			}

			return {
				ok: true,
				saved_path: path,
				size_kb: Math.round(st.size / 1024),
				source,
				url: u.href,
				next: '可用读 PDF 的工具从 saved_path 提取引脚定义、电气参数等内容。',
			};
		},
	},
];
