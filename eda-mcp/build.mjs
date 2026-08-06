// esbuild 把 src/ + shared/ 打成单个 dist/index.js，含所有 npm 依赖（MCP SDK / ws）。
// 产物可独立运行（node dist/index.js），用户装完 plugin 无需任何 npm install
// —— 这是选 bundle 而非「带源码 + 运行时 auto-install」的原因（node 没有 bun 那种 auto-install）。
//
// 部署：dist/index.js → plugin/plugins/eda-pro/local-mcp/eda-mcp/index.js
import { build } from 'esbuild';
import { readFileSync } from 'node:fs';

const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

await build({
	entryPoints: ['src/index.ts'],
	bundle: true,
	platform: 'node',
	target: 'node18',
	format: 'esm',
	outfile: 'dist/index.js',
	// src/index.ts 首行已有 shebang，esbuild 会保留 —— banner 不能再加 shebang。
	// ESM 下 createRequire 让依赖内部偶发的 require 可用。
	banner: {
		js: 'import { createRequire } from \'module\';const require = createRequire(import.meta.url);',
	},
	minify: false, // 保留可读性，用户出问题时能直接看 bundle
	sourcemap: false,
	define: {
		'process.env.EDA_MCP_VERSION': JSON.stringify(pkg.version),
	},
});

console.log(`[build] dist/index.js (v${pkg.version}) 已生成`);
