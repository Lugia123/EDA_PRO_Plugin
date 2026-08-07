/**
 * 打包前把版本号的 patch 位刷成当前 commit 数。
 *
 *   0.1.<git rev-list --count HEAD>
 *
 * 由 package.json 的 prebuild 钩子自动执行，所以 `npm run build` 出来的 .eext
 * 版本号总能对应到一个具体 commit —— 用户报问题时报个版本号就能定位到代码。
 *
 * major/minor 仍由人手工在 extension.json 里定，脚本只动第三位。
 * 不在 git 仓库里（比如用户下载 zip 后构建）时保留原版本号，不报错。
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const manifestPath = join(root, 'extension.json');

let count;
try {
	count = execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: root, encoding: 'utf-8' }).trim();
} catch {
	console.log('[stamp-version] 不在 git 仓库里，保留 extension.json 现有版本号');
	process.exit(0);
}

const raw = readFileSync(manifestPath, 'utf-8');
const manifest = JSON.parse(raw);
const [major = '0', minor = '1'] = String(manifest.version ?? '0.1.0').split('.');
const next = `${major}.${minor}.${count}`;

if (manifest.version === next) {
	console.log(`[stamp-version] 版本号已是 ${next}，无需改动`);
	process.exit(0);
}

// 用正则替换而不是整份 JSON.stringify，避免打乱官方脚手架的字段顺序与缩进（tab）
const updated = raw.replace(/("version"\s*:\s*)"[^"]*"/, `$1"${next}"`);
if (updated === raw) {
	console.warn('[stamp-version] 没找到 version 字段，跳过');
	process.exit(0);
}
writeFileSync(manifestPath, updated);
console.log(`[stamp-version] ${manifest.version} → ${next}（commit 数 ${count}）`);
