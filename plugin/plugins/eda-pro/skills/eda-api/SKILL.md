---
name: eda-api
description: >-
  立创EDA专业版原生 API 的查找与调用 —— 当语义化工具（eda_project_*/eda_schematic_*/
  eda_pcb_* 等）覆盖不到需求时，用 eda_execute 直接调 eda.* 接口。含 71 个类、
  569 个方法的完整索引。
  触发词：eda_execute、EDA API、原生接口、eda.sys_、eda.pcb_、eda.sch_、
  没有对应工具、直接调用 API、扩展开发。
---

# 直接调用 EDA API

**先确认真的需要**：常见需求已有语义化工具（更稳、参数有校验、返回值已裁剪）。
只有它们覆盖不到时才用 `eda_execute`。

## 调用约定

```js
// eda_execute 的 code 参数，运行在 AsyncFunction 里
return await eda.dmt_Project.getCurrentProjectInfo();
```

- 可以直接 `await`，全局对象 `eda` 已注入
- **必须 `return`**，否则拿到 `null`
- 返回值要能 JSON 序列化；类实例先取字段再返回
- 实例名 = 类名前缀整体小写：`DMT_Project` → `eda.dmt_Project`，`PCB_Net` → `eda.pcb_Net`

## 查方法

索引在 [reference/index.md](./reference/index.md)，按命名空间分文件：

| 命名空间 | 覆盖 | 文件 |
|---|---|---|
| `SYS_*` | 对话框、文件、存储、消息、窗口、WebSocket | [sys.md](./reference/sys.md) |
| `DMT_*` | 工程、板子、原理图、PCB、团队、编辑器控制 | [dmt.md](./reference/dmt.md) |
| `SCH_*` | 原理图图元、DRC、生产数据、仿真 | [sch.md](./reference/sch.md) |
| `PCB_*` | PCB 图元、网络、层、DRC、生产数据 | [pcb.md](./reference/pcb.md) |
| `LIB_*` | 器件、符号、封装、3D 模型、分类 | [lib.md](./reference/lib.md) |

**不要凭记忆写 API 名**，先在对应文件里搜。索引由脚本从官方类型包生成，
方法签名和文档注释都是准的。

## 三个绕不开的坑

### 1. 很多接口绑定「活动画布」

`sch_Document.*` 和 `pcb_*` 只对**当前编辑器里打开的那个文档**生效。
开着原理图去调 `pcb_Layer.getTheNumberOfCopperLayers()`，会抛
「指定的主题消息在对应的画布内没有相关订阅」。

先用 `eda_open_document(uuid)` 把目标文档切到前台。

### 2. `sch_Document.getPrimitivesInRegion` 恒返回空

在扩展执行环境里怎么调都是空数组（坐标量级、参数顺序、`activateDocument` 全试过）。
要读原理图图形数据用：

```js
return await eda.sys_FileManager.getDocumentSource();   // V3 行式源码，一页约 400 KB
```

格式：每行两个 JSON 拼接，首行 `DOCHEAD` 标明 docType；坐标单位 `0.01 inch`；
旋转角逆时针为正；布尔用 1/0。**别把整份源码返回给对话**，在代码里先过滤统计。

### 3. 返回值可能不可信

实测遇到过 `modifyBoardName` 返回 `true` 却没生效。**写操作后重新查询确认**，
不要只看返回值就向用户报告成功。

## 单位

| 场景 | 单位 |
|---|---|
| 文档源码里的坐标、长度 | `0.01 inch`（官方 V3 格式规范） |
| `pcb_Net.getNetLength` | 官方未说明，实测 mil 量级 —— 相对比较可靠，绝对值要核对 |

## 写操作的纪律

- 动手前确认目标文档是用户想改的那个（`eda_current_context`）
- 用户没明确要求就不要写
- 改完让用户自己看一眼，别只报告"已完成"
