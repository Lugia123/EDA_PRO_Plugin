/**
 * 把全项目的版本号统一刷成 `<major>.<minor>.<git commit 数>`。
 *
 *   node scripts/stamp-version.mjs
 *
 * 由扩展的 prebuild 钩子和 eda-mcp 的 deploy 调用，所以每次出包时
 * 扩展、MCP、plugin、marketplace 的版本号必定一致，且能对应到一个具体 commit
 * —— 用户报问题时报个版本号就能定位代码。
 *
 * major/minor 由人手工定（改下面的 BASE），脚本只动第三位。
 * 不在 git 仓库里（比如下载 zip 后构建）时保持原样，不报错。
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const BASE = '0.1';

/** 每项：文件路径 + 版本字段在 JSON 里的位置（用于定位替换） */
const TARGETS = [
	{ file: 'eext-eda-bridge/extension.json', path: ['version'] },
	{ file: 'eext-eda-bridge/package.json', path: ['version'] },
	{ file: 'eda-mcp/package.json', path: ['version'] },
	{ file: 'plugin/plugins/eda-pro/.claude-plugin/plugin.json', path: ['version'] },
	{ file: 'plugin/.claude-plugin/marketplace.json', path: ['metadata', 'version'] },
];

let count;
try {
	count = execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: ROOT, encoding: 'utf-8' }).trim();
} catch {
	console.log('[stamp-version] 不在 git 仓库里，保持现有版本号');
	process.exit(0);
}

const next = `${BASE}.${count}`;
const changed = [];

for (const { file, path } of TARGETS) {
	const abs = join(ROOT, file);
	let raw;
	try {
		raw = readFileSync(abs, 'utf-8');
	} catch {
		console.warn(`[stamp-version] 找不到 ${file}，跳过`);
		continue;
	}

	const json = JSON.parse(raw);
	const current = path.reduce((o, k) => o?.[k], json);
	if (current === next) continue;

	// 只替换目标字段那一处，保留原有缩进风格（官方脚手架用 tab，我们的用空格）。
	// marketplace.json 的版本嵌在 metadata 里，所以先按父级块缩小范围再替换。
	let updated;
	if (path.length === 1) {
		updated = raw.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${next}"`);
	} else {
		const [parent] = path;
		const re = new RegExp(`("${parent}"\\s*:\\s*\\{[\\s\\S]*?"version"\\s*:\\s*)"[^"]*"`);
		updated = raw.replace(re, `$1"${next}"`);
	}
	if (updated === raw) {
		console.warn(`[stamp-version] ${file} 里没找到可替换的 version 字段，跳过`);
		continue;
	}
	writeFileSync(abs, updated);
	changed.push(`${relative(ROOT, abs)}: ${String(current)} → ${next}`);
}

if (changed.length) {
	console.log(`[stamp-version] 统一为 ${next}（commit 数 ${count}）`);
	for (const c of changed) console.log(`  ${c}`);
} else {
	console.log(`[stamp-version] 全部已是 ${next}，无需改动`);
}
