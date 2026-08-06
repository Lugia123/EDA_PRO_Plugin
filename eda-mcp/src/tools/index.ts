/** 工具注册表 —— 新增一组工具只需在这里 import 并加进数组 */
import { connectionTools } from './connection.js';
import { datasheetTools } from './datasheet.js';
import { libraryTools } from './library.js';
import { projectTools } from './project.js';
import { schematicTools } from './schematic.js';
import type { ToolDef } from './types.js';

export const allTools: ToolDef[] = [
	...connectionTools,
	...projectTools,
	...schematicTools,
	...libraryTools,
	...datasheetTools,
];

export const toolMap = new Map<string, ToolDef>(allTools.map((t) => [t.name, t]));

export type { ToolDef, ToolContext } from './types.js';
