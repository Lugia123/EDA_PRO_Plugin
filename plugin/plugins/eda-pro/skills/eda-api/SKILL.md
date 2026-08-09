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

### 官方还有一份更全的资料

立创自己开源了一个同类项目 `easyeda/easyeda-api-skill`，里面有本地索引
没有的东西 —— 逐类的 Markdown 参考（`references/classes/`）、枚举
（`references/enums/`）、**V3 文档源码格式规范**（`format/`）、
以及官方踩坑清单。查不到或者拿不准的时候去那里翻：

```bash
git clone --depth 1 https://github.com/easyeda/easyeda-api-skill.git
```

官方明确写下来的几条（和本文其余部分一致，可互相印证）：

- 原理图 `0.01 inch`、PCB `1 mil` —— 用错就是 10 倍偏差
- 几乎所有方法返回 `Promise`，**漏 await 拿到的是 Promise 对象**
- `create()` 和 `modify()` 的参数顺序／类型经常不一样，逐个查签名
- 枚举值不要写裸数字，去 `references/enums/` 查
- 操作前先确认文档状态：工程开了没、当前文档类型对不对
- 出不去的死局：`?safetyMode=true` 全局停用扩展，`?cll=debug` 开调试控制台

**官方没写、本项目实测出来的**，见下面「三个绕不开的坑」和写操作纪律。

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

**已知会谎报成功的**：

| 调用 | 返回 | 事实 |
|---|---|---|
| `modifyBoardName` 对刚建的板 | `true` | 名字没变，等多久重试多少次都没用 |
| `setDocumentSource` | `true` | 文档被写坏（丢行、字段错位） |
| `sch_PrimitiveComponent.create` 后读 `c.x` | 请求值 | 那是 create 时刻的快照，`modify` 过就失真 |

**刚创建的文档没落盘之前，属性写不进去。** 对新建的板改名必须先
`openDocument(图页) → activateDocument → sch_Document.save()`，之后改名
一次就成。同一状态下 `modifySchematicName` 老老实实返回 `false`，
只有 `modifyBoardName` 谎报 —— 别拿它的返回值当证据。

### 4. 属性名和直觉不一样，猜必错

导线的坐标属性叫 **`line`**（"多段线坐标组"），不是 `points`：

```js
const ws = await eda.sch_PrimitiveWire.getAll();
ws[0].line;     // ✓ Array<number> 或 Array<Array<number>>
ws[0].points;   // ✗ undefined —— 会让你以为"所有导线都是空的"
```

这个坑造成过一次完整的误判：读不到坐标 → 以为线没画出来 → 去查渲染，
实际线好好地画着。**读任何图元属性前，先在类型定义里确认字段名。**

### 5. 多开标签页时调用目标会漂移

每个浏览器标签页是一个独立的扩展实例。bridge 默认发给「最后一个认证成功的」，
于是新开页面、或某页刷新重连，后续调用就落到**另一个文档**上 ——
表现为「工程怎么自己变了」「读到的是别的板子」。官方 bridge 同样有这个问题，
它的解法是 `/eda-windows/select`；本项目对应的是 `eda_use_tab`。

排查诡异数据前先看 `eda_current_context` 的 `open_tabs` / `answered_by_tab`。

## 单位

| 场景 | 单位 |
|---|---|
| 文档源码里的坐标、长度 | `0.01 inch`（官方 V3 格式规范） |
| `pcb_Net.getNetLength` | 官方未说明，实测 mil 量级 —— 相对比较可靠，绝对值要核对 |

## 写操作的纪律

- 动手前确认目标文档是用户想改的那个（`eda_current_context`）
- 用户没明确要求就不要写
- 改完让用户自己看一眼，别只报告"已完成"
