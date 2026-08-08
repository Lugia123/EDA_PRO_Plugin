/**
 * 铁律 7 的自动护栏：传给 EDA 的代码里不许出现反斜杠转义。
 *
 * 为什么需要机器来查：这坑踩过三次（`/\?|^$/`、`/\+?\d+V/`、`split('\n')`），
 * 每次都是运行时才炸，而且症状是「非法正则」或「Invalid or unexpected token」，
 * 看起来像 EDA 的 API 有问题，实际是模板字符串先求值了一遍。人眼查不住。
 *
 * 原理：这些代码是写在 TS 模板字符串里、经 ctx.exec / runStep 发过去的。
 * 模板字符串会先求值，于是
 *   - `\d` `\?` `\+` 这类无效转义 → 反斜杠被吃掉 → 到 EDA 那边成了非法正则
 *   - `'\n'` 是有效转义 → 变成真实换行 → 字符串字面量断成两行，语法错误
 * 两种都要拦。description 里的 `\n` 不算 —— 那是给 MCP 客户端看的文本，
 * 不发给 EDA，所以只扫模板字符串。
 *
 *   node scripts/check-eda-code.mjs        # 有问题时退出码非 0
 */
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('../src', import.meta.url).pathname;

function walk(dir) {
	const out = [];
	for (const name of readdirSync(dir)) {
		const p = join(dir, name);
		if (statSync(p).isDirectory()) out.push(...walk(p));
		else if (name.endsWith('.ts')) out.push(p);
	}
	return out;
}

/**
 * 抠出所有模板字符串（反引号包裹）及其起始行。
 * 不做完整 TS 解析 —— 只要能定位反引号区间就够，代价是普通字符串里
 * 出现的反引号可能造成误配对；实测本项目里没有，真出现了会体现为
 * 报告位置偏移，不会漏报。
 */
function templates(src) {
	const found = [];
	let i = 0;
	let line = 1;
	while (i < src.length) {
		const ch = src[i];
		if (ch === '\n') {
			line += 1;
			i += 1;
			continue;
		}
		// 跳过行注释与块注释，避免注释里举例的反斜杠被当成真代码
		if (ch === '/' && src[i + 1] === '/') {
			while (i < src.length && src[i] !== '\n') i += 1;
			continue;
		}
		if (ch === '/' && src[i + 1] === '*') {
			i += 2;
			while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) {
				if (src[i] === '\n') line += 1;
				i += 1;
			}
			i += 2;
			continue;
		}
		// 普通字符串：整段跳过（description 里的 \n 就在这里被忽略）
		if (ch === '"' || ch === "'") {
			const q = ch;
			i += 1;
			while (i < src.length && src[i] !== q) {
				if (src[i] === '\\') i += 1;
				i += 1;
			}
			i += 1;
			continue;
		}
		if (ch === '`') {
			const startLine = line;
			const start = i + 1;
			i += 1;
			let depth = 0;
			while (i < src.length) {
				if (src[i] === '\n') line += 1;
				if (src[i] === '\\') {
					i += 2;
					continue;
				}
				if (src[i] === '$' && src[i + 1] === '{') {
					depth += 1;
					i += 2;
					continue;
				}
				if (depth > 0 && src[i] === '}') {
					depth -= 1;
					i += 1;
					continue;
				}
				if (depth === 0 && src[i] === '`') break;
				i += 1;
			}
			found.push({ text: src.slice(start, i), startLine });
			i += 1;
			continue;
		}
		i += 1;
	}
	return found;
}

const problems = [];
for (const file of walk(ROOT)) {
	const src = readFileSync(file, 'utf8');
	// 只关心真的发给 EDA 的文件：含 ctx.exec 或 runStep 的
	if (!src.includes('ctx.exec') && !src.includes('runStep')) continue;

	for (const t of templates(src)) {
		// 模板串里若无 eda. 调用，就不是发给 EDA 的代码（比如拼提示文本）
		if (!t.text.includes('eda.')) continue;
		const lines = t.text.split('\n');
		lines.forEach((l, k) => {
			const m = l.match(/\\[\s\S]/g);
			if (!m) return;
			for (const esc of m) {
				// 这几种是**刻意为之的正确写法**，不能报：
				//   \\  求值后得到一个反斜杠 —— 想让 EDA 侧收到 \d 就得在这边写 \\d
				//   \`  转义反引号，模板串里必须这么写
				//   \${ 转义插值，同理
				const second = esc.charCodeAt(1);
				if (second === 92 /* \ */ || second === 96 /* ` */) continue;
				if (esc === '\\$') continue; // \${ 的前半截

				problems.push({
					file: file.replace(ROOT, 'src'),
					line: t.startLine + k,
					esc: JSON.stringify(esc),
					snippet: l.trim().slice(0, 100),
				});
			}
		});
	}
}

if (!problems.length) {
	console.log('铁律 7 检查通过：发给 EDA 的模板串里没有反斜杠转义。');
	process.exit(0);
}

console.error(`铁律 7 违规 ${problems.length} 处 —— 这些反斜杠会被模板字符串先吃掉一层：\n`);
for (const p of problems) {
	console.error(`  ${p.file}:${p.line}  ${p.esc}`);
	console.error(`      ${p.snippet}`);
}
console.error('\n替代写法：正则改 indexOf / startsWith / 字符码比较；换行用 String.fromCharCode(10)。');
process.exit(1);
