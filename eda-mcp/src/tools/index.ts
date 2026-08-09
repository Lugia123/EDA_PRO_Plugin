/** 工具注册表 —— 新增一组工具只需在这里 import 并加进数组 */
import { connectionTools } from './connection.js';
import { createTools } from './create.js';
import { datasheetTools } from './datasheet.js';
import { layoutTools } from './layout-tool.js';
import { libraryTools } from './library.js';
import { mapApplyTools } from './map-apply.js';
import { mapTools } from './map-tool.js';
import { netcheckTools } from './netcheck.js';
import { pcbTools } from './pcb.js';
import { projectTools } from './project.js';
import { schematicEditTools } from './schematic-edit.js';
import { schematicTools } from './schematic.js';
import type { ToolDef } from './types.js';
import { verifyTools } from './verify.js';

export const allTools: ToolDef[] = [
	...connectionTools,
	...verifyTools,
	...projectTools,
	...schematicTools,
	...schematicEditTools,
	...netcheckTools,
	...layoutTools,
	...mapTools,
	...mapApplyTools,
	...libraryTools,
	...datasheetTools,
	...createTools,
	...pcbTools,
];

// 重名会被 Map 静默覆盖 —— 真发生过：新加的 eda_current_context 撞上
// project.ts 里的同名工具，注册表里只剩一个，工具总数还是 48，调用时跑的是
// 另一份实现，排查了半天才发现。启动即崩总比跑错实现好。
const dupes = allTools.map((t) => t.name).filter((n, i, a) => a.indexOf(n) !== i);
if (dupes.length) {
	throw new Error(`工具名重复：${[...new Set(dupes)].join('、')} —— 同名工具会被静默覆盖，必须改名或合并实现`);
}

export const toolMap = new Map<string, ToolDef>(allTools.map((t) => [t.name, t]));

export type { ToolDef, ToolContext } from './types.js';
