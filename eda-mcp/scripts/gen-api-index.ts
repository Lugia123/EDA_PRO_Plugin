/**
 * 从官方类型包生成 API 索引，供 eda-api skill 检索。
 *
 *   npx tsx scripts/gen-api-index.ts
 *
 * 为什么要生成而不是手写：立创有 120+ 个 API 类、上千个方法，手写既写不全也会过期。
 * 从 @jlceda/pro-api-types 的 d.ts 提取，随类型包升级重新生成即可。
 *
 * 输出到 plugin/plugins/eda-pro/skills/eda-api/reference/ ——
 * skill 正文只讲怎么用，方法清单放 reference 里按需查阅，避免撑爆上下文。
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const TYPES = join(here, '..', '..', 'eext-eda-bridge', 'node_modules', '@jlceda', 'pro-api-types', 'index.d.ts');
const OUT_DIR = join(here, '..', '..', 'plugin', 'plugins', 'eda-pro', 'skills', 'eda-api', 'reference');

interface ApiClass {
	name: string;
	group: string;
	methods: Array<{ signature: string; doc?: string }>;
}

const GROUPS: Record<string, string> = {
	SYS: '系统（对话框、文件、存储、WebSocket、消息、窗口）',
	DMT: '文档树（工程、板子、原理图、PCB、团队、编辑器控制）',
	SCH: '原理图（图元、DRC、事件、生产数据、仿真）',
	PCB: 'PCB（图元、网络、层、DRC、生产数据、多边形运算）',
	LIB: '库（器件、符号、封装、3D 模型、分类、复用模块）',
	PNL: '拼板',
};

const src = await readFile(TYPES, 'utf-8');
const lines = src.split('\n');

const classes: ApiClass[] = [];
let cur: ApiClass | null = null;
let pendingDoc = '';

for (const raw of lines) {
	const line = raw.replace(/\t/g, '    ');

	const classMatch = /^\s{0,4}class ([A-Z][A-Za-z0-9_]*) \{/.exec(line);
	if (classMatch) {
		const name = classMatch[1]!;
		const prefix = name.split('_')[0]!;
		cur = { name, group: GROUPS[prefix] ? prefix : 'OTHER', methods: [] };
		classes.push(cur);
		pendingDoc = '';
		continue;
	}
	if (cur && /^\s{0,4}\}/.test(line)) {
		cur = null;
		continue;
	}
	if (!cur) continue;

	// 收集紧邻方法上方的一行中文说明
	const docMatch = /^\s*\*\s+([^@\s].*)$/.exec(line);
	if (docMatch && !/^\s*\*\s*(@|例|```)/.test(line)) {
		const t = docMatch[1]!.trim();
		if (t && !t.startsWith('*') && t.length < 60) pendingDoc = t;
		continue;
	}

	const m = /^\s+(?:async )?([a-zA-Z_][A-Za-z0-9_]*)\((.*)$/.exec(line);
	if (m && !line.includes('constructor')) {
		const sig = `${m[1]}(${m[2]}`.replace(/\s+/g, ' ').slice(0, 200);
		cur.methods.push({ signature: sig, doc: pendingDoc || undefined });
		pendingDoc = '';
	}
}

const withMethods = classes.filter((c) => c.methods.length > 0);
await mkdir(OUT_DIR, { recursive: true });

// 每个命名空间一个文件，避免单文件过大
const byGroup = new Map<string, ApiClass[]>();
for (const c of withMethods) {
	const g = c.group;
	if (!byGroup.has(g)) byGroup.set(g, []);
	byGroup.get(g)!.push(c);
}

const indexLines: string[] = [
	'# 立创EDA专业版 API 索引',
	'',
	'由 `eda-mcp/scripts/gen-api-index.ts` 从 `@jlceda/pro-api-types` 自动生成，请勿手工编辑。',
	'',
	'调用方式：类名的前缀整体小写就是实例名 —— `DMT_Project` → `eda.dmt_Project`，`PCB_Net` → `eda.pcb_Net`。',
	'',
	'| 命名空间 | 说明 | 类数 | 方法数 | 清单 |',
	'|---|---|---|---|---|',
];

for (const [g, cs] of [...byGroup.entries()].sort()) {
	const methodCount = cs.reduce((s, c) => s + c.methods.length, 0);
	const file = `${g.toLowerCase()}.md`;
	indexLines.push(`| \`${g}_*\` | ${GROUPS[g] ?? '其他'} | ${cs.length} | ${methodCount} | [${file}](./${file}) |`);

	const body: string[] = [`# ${g}_* — ${GROUPS[g] ?? '其他'}`, ''];
	for (const c of cs.sort((a, b) => a.name.localeCompare(b.name))) {
		// 实例名是「前缀整体小写 + 下划线后原样」：PCB_Net → pcb_Net，DMT_Project → dmt_Project
		const instance = c.name.replace(/^([A-Z]+)_/, (_all, prefix: string) => `${prefix.toLowerCase()}_`);
		body.push(`## ${c.name}`, '', `调用：\`eda.${instance}.xxx()\``, '');
		for (const m of c.methods) {
			body.push(`- \`${m.signature}\`${m.doc ? ` — ${m.doc}` : ''}`);
		}
		body.push('');
	}
	await writeFile(join(OUT_DIR, file), body.join('\n'));
}

indexLines.push(
	'',
	`合计 ${withMethods.length} 个类、${withMethods.reduce((s, c) => s + c.methods.length, 0)} 个方法。`,
	'',
	'类型包版本以 `eext-eda-bridge/node_modules/@jlceda/pro-api-types/package.json` 为准。',
);
await writeFile(join(OUT_DIR, 'index.md'), indexLines.join('\n'));

console.log(`[gen-api-index] ${withMethods.length} 个类 / ${withMethods.reduce((s, c) => s + c.methods.length, 0)} 个方法 → ${OUT_DIR}`);
for (const [g, cs] of [...byGroup.entries()].sort()) {
	console.log(`  ${g}: ${cs.length} 类, ${cs.reduce((s, c) => s + c.methods.length, 0)} 方法`);
}
