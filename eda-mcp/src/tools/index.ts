/** 工具注册表 —— 新增一组工具只需在这里 import 并加进数组 */
import { connectionTools } from './connection.js';
import { createTools } from './create.js';
import { datasheetTools } from './datasheet.js';
import { layoutTools } from './layout-tool.js';
import { libraryTools } from './library.js';
import { mapApplyTools } from './map-apply.js';
import { mapTools } from './map-tool.js';
import { pcbTools } from './pcb.js';
import { projectTools } from './project.js';
import { schematicEditTools } from './schematic-edit.js';
import { schematicTools } from './schematic.js';
import type { ToolDef } from './types.js';

export const allTools: ToolDef[] = [
	...connectionTools,
	...projectTools,
	...schematicTools,
	...schematicEditTools,
	...layoutTools,
	...mapTools,
	...mapApplyTools,
	...libraryTools,
	...datasheetTools,
	...createTools,
	...pcbTools,
];

export const toolMap = new Map<string, ToolDef>(allTools.map((t) => [t.name, t]));

export type { ToolDef, ToolContext } from './types.js';
