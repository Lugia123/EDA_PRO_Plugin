# 立创EDA专业版 API 索引

由 `eda-mcp/scripts/gen-api-index.ts` 从 `@jlceda/pro-api-types` 自动生成，请勿手工编辑。

调用方式：类名的前缀整体小写就是实例名 —— `DMT_Project` → `eda.dmt_Project`，`PCB_Net` → `eda.pcb_Net`。

| 命名空间 | 说明 | 类数 | 方法数 | 清单 |
|---|---|---|---|---|
| `DMT_*` | 文档树（工程、板子、原理图、PCB、团队、编辑器控制） | 11 | 87 | [dmt.md](./dmt.md) |
| `LIB_*` | 库（器件、符号、封装、3D 模型、分类、复用模块） | 10 | 70 | [lib.md](./lib.md) |
| `OTHER_*` | 其他 | 2 | 8 | [other.md](./other.md) |
| `PCB_*` | PCB（图元、网络、层、DRC、生产数据、多边形运算） | 10 | 175 | [pcb.md](./pcb.md) |
| `PNL_*` | 拼板 | 1 | 1 | [pnl.md](./pnl.md) |
| `SCH_*` | 原理图（图元、DRC、事件、生产数据、仿真） | 10 | 47 | [sch.md](./sch.md) |
| `SYS_*` | 系统（对话框、文件、存储、WebSocket、消息、窗口） | 27 | 181 | [sys.md](./sys.md) |

合计 71 个类、569 个方法。

类型包版本以 `eext-eda-bridge/node_modules/@jlceda/pro-api-types/package.json` 为准。