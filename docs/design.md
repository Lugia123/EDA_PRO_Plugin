# EDA_PRO_Plugin 设计文档

> 动手前先读本文。§0 的铁律是从实测踩坑得出的，违反任意一条基本等于设计错了。

## §0 铁律

1. **协议只有一份真相源**：`shared/protocol.ts`。两端都 import 它，任何一端另抄一份类型定义都是错的——两端语言相同就是为了吃这个红利。
2. **未认证连接不得触达 EDA**：bridge 在认证前只接受 `pair` / `auth` / `ping`，其余一律丢弃。任何"先执行再校验"的写法都不许出现。
3. **stdout 属于 MCP**：stdio 传输下 stdout 是 JSON-RPC 通道，日志一律 stderr（见 `logger.ts`）。禁止裸 `console.log`。
4. **能力探测优先于文档**：立创的 API 文档与实际行为存在出入，任何新 API 在写进工具前，先用 `./scripts/eda` 在真机上验证返回结构。
5. **默认只读**：涉及写入用户工程的工具必须显式标注，且在测试阶段只对自建测试工程操作。

## §1 目标

让 AI 通过 Claude Code 操作立创EDA专业版（EasyEDA Pro）：

| 能力 | 优先级 | 主要 API |
|---|---|---|
| 读工程结构（工程/板子/原理图/PCB 列表） | P0 | `DMT_Project` `DMT_Board` |
| 读原理图（器件、网络、属性） | P0 | `SCH_Document` `SCH_Primitive` |
| 原理图校验（DRC） | P0 | `SCH_Drc` |
| 查询元器件库、读器件参数 | P0 | `LIB_Device` `LIB_LibrariesList` |
| 新建工程 / 板子 / 原理图 / PCB | P1 | `DMT_*` |
| 写原理图（放置器件、连线） | P1 | `SCH_Primitive` |
| 读写 PCB（图元、网络、层） | P1 | `PCB_Primitive` `PCB_Net` `PCB_Layer` |
| PCB DRC / 生产资料 | P2 | `PCB_Drc` `PCB_ManufactureData` |
| 下载元器件数据手册 | P2 | **不走 EDA API**，MCP 进程直接 HTTP 下载 |

最后一项是本地 MCP 相对纯扩展方案的独有价值：浏览器沙箱里下不了文件到磁盘，Node 进程可以。

## §2 架构

```
┌──────────────┐  stdio/JSON-RPC  ┌─────────────────────┐  ws://127.0.0.1:4963x  ┌──────────────┐
│ Claude Code  │ ───────────────► │  eda-mcp (Node)     │ ◄───────────────────── │ eda-bridge   │
│              │ ◄─────────────── │  MCP server         │ ──────────────────────►│ (.eext)      │
└──────────────┘                  │  + bridge(WS server)│                        │  在 EDA 内   │
                                  └─────────────────────┘                        └──────┬───────┘
                                                                                        │ eda.* API
                                                                                 ┌──────▼───────┐
                                                                                 │ 立创EDA专业版 │
                                                                                 └──────────────┘
```

### 为什么必须是两半

EDA 不允许外部进程直接操作，但开放官方扩展 API。扩展跑在 EDA 进程内（Electron 渲染进程或浏览器沙箱），是唯一能碰到 `eda.*` 的地方。

已排除的替代方案：

| 方案 | 为何不行 |
|---|---|
| Chrome DevTools 注入 JS 调 `eda.*` | **实测** `window.eda === undefined`，扩展在隔离沙箱，主 realm 拿不到 |
| 直接解析 `.epro` 工程文件 | 格式非公开，且改完 EDA 不感知，双写冲突 |
| 用官方 `run-api-gateway` 扩展 | 可行，但我们要自己的协议和鉴权；且不想依赖第三方发布节奏 |

### 为什么服务端在 MCP 侧

`eda.sys_WebSocket` 只有 `register` / `send` / `close`——纯客户端 API，扩展无法监听端口。所以连接方向固定为「扩展 → bridge」，端口扫描与重连的责任全在扩展端。

### 由平台 API 缺陷导出的设计

`register()` 只提供 `receiveMessageCallFn` 和 `connectedCallFn`，**没有 onClose / onError**：

- "连不上" 表现为回调一直不来 → 扩展端按 `HELLO_TIMEOUT_MS`(1.5s) 判定并换下一个端口
- "断线" 表现为消息不再来 → 扩展端 `DEAD_AFTER_MS`(45s) 无消息即判死重连
- bridge 侧独立做心跳（20s ping，3 次未响应即 terminate）

## §3 安全模型

### 威胁

**实测事实**：从 `https://pro.lceda.cn` 页面执行 `new WebSocket('ws://127.0.0.1:49620')` 可以连通，无 CSP 拦截、无混合内容拦截（Chrome 视 loopback 为 potentially trustworthy）。HTTP `fetch` 同样通。

推论：**任意网站都能连上本机 bridge**。而 `execute` 是「在 EDA 里跑任意 JS」，一旦被连上，攻击者可读取/篡改用户的全部工程。

因此「握手时自报 `service: "easyeda-bridge"`」不构成鉴权——那是身份声明，谁都能声明。

### 机制

一次性配对码换长期 token：

```
eda_pair_start ──► 6 位码（内存态，5min TTL，≤5 次尝试，成功即废）
                        │  用户手输进 EDA 扩展面板
                        ▼
                   bridge 校验（常数时间比较）
                        │
                        ▼
                   签发 32 字节 token ──► 落盘 ~/.eda-mcp/pairing.json (0600)
                                     └──► 扩展存 SYS_Storage
                        │
                   之后重连发 auth，免输码
```

配套约束：

- 未认证连接 60s 内不认证即断开
- bridge 只绑 `127.0.0.1`
- 伪造 token 直接拒绝（已测）
- `origin` 仅记录进日志，**不作为鉴权依据**（非浏览器客户端可任意伪造）

### 不使用 OAuth 的理由

全链路在 loopback，没有远程 server、没有账号体系、没有多租户。OAuth 解决的是"跨信任域证明身份"，这里不存在那个问题。参照 Tinia_Local_MCP 的 OAuth 是因为对面是远程多租户服务，场景不同。

### 开发通道的例外

`scripts/dev-bridge.ts` 额外开 `127.0.0.1:49650/exec`，要求 `X-Dev-Token`（每次启动随机、写入 `/tmp/eda-dev-token`、0600）。**仅存在于开发脚本，正式 MCP 进程不提供此端点。**

## §4 协议

定义见 `shared/protocol.ts`。要点：

| 方向 | 消息 | 说明 |
|---|---|---|
| bridge→ext | `hello` | 连接即发，含 `service` / `protocol` / `pairingOpen` |
| ext→bridge | `pair` | 提交配对码 |
| bridge→ext | `paired` / `pair_error` | 签发 token 或报错（含剩余次数）|
| ext→bridge | `auth` | 提交已有 token |
| bridge→ext | `auth_ok` / `auth_error` | — |
| bridge→ext | `execute` | `{id, code}`，仅认证后下发 |
| ext→bridge | `result` / `error` | 按 `id` 配对，`error` 带 stack |
| 双向 | `ping` / `pong` | 心跳 |

协议版本不匹配即断开（`PROTOCOL_VERSION`）。端口段 `49630-49639`，避开官方 `run-api-gateway` 的 `49620-49629` 以便共存。

### 执行语义

扩展侧用 `AsyncFunction('eda', code)` 执行，即：

- 代码体可直接 `await`
- `eda` 作为参数注入
- **必须 `return`**，否则拿到 `null`
- 返回值经 `sanitize()` 处理循环引用、类实例、函数、BigInt——EDA API 常返回不可直接 `JSON.stringify` 的对象，不处理会让"序列化失败"伪装成"执行失败"

## §4.5 读取文档内容的正确路径（实测结论）

**`sch_Document` 的区域查询在扩展执行环境里拿不到东西。** 实测：

```
getPrimitivesInRegion(±1e3 … ±1e8)  → 一律返回 0 个
navigateToRegion(...)               → 返回 false
getPrimitiveAtPoint 网格扫描        → 全部 undefined
```

排除过的因素：坐标量级、参数顺序、页面可见性、`DMT_EditorControl.activateDocument()`
（返回 true 但无改善）。推测这组 API 绑定编辑器画布上下文，而扩展的 WebSocket 回调不在该上下文。
**没有继续深挖，因为找到了更好的路径。**

**正路是 `SYS_FileManager.getDocumentSource()`** —— 返回当前文档的完整源码：

```
{"type":"DOCHEAD"}||{"docType":"SCH_PAGE","uuid":"...","client":"..."}|
{"type":"COMPONENT","ticket":2,"id":"e1"}||{"partId":"pid8a0e77...","x":0,"y":0,"rotation":0,...}|
{"type":"ATTR","ticket":3,"id":"e1155"}||{"key":"Description","value":"...","parentId":"e1",...}|
```

实测 SV30 的 V2.0_Encoder 原理图页：1473 行 / 408 KB，含 COMPONENT 140、ATTR 999、
WIRE 99、LINE 224、TEXT 9。

格式要点（官方 V3 格式规范，见 https://prodocs.easyeda.com/cn/format/）：

- 每行 = 两个 JSON 拼接，前者供一致性框架用，后者是**原子结构对象**
- 首行必须是 `DOCHEAD`，`docType` 区分 `PROJECT_CONFIG` / `BOARD` / `SCH` / `SCH_PAGE` / `PCB`
- **坐标与长度单位统一是 `0.01 inch`**（即 10 mil），旋转角逆时针为正、角度制
- 布尔用 `1`/`0`，颜色 `"#RRGGBB"`，无色为 `""`
- 器件属性不在 COMPONENT 里，而是独立的 ATTR 行，用 `parentId` 挂到器件

### 解析放在 MCP 侧，不放扩展里

408 KB 源码经 WebSocket 传回 MCP 完全无压力（不进 AI context），在 Node 里解析成结构化摘要再返回。
这样解析逻辑是可测试、可维护的 TypeScript，而不是塞在字符串里的一次性代码。
**这正是"本地 MCP"相对纯扩展方案的价值所在。**

## §5 目录

```
EDA_PRO_Plugin/
├── docs/design.md          本文
├── shared/protocol.ts      协议唯一真相源
├── eda-mcp/                本地 MCP（Node，esbuild → 单文件）
│   ├── src/{index,bridge,pairing,logger}.ts
│   └── scripts/{dev-bridge,mock-eda,eda}
├── eext-eda-bridge/        EDA 扩展（派生自 easyeda/pro-api-sdk，Apache-2.0）
│   └── src/index.ts
└── plugin/                 Claude Code plugin / marketplace
```

### 为什么 MCP 端用 Node 而非 Go

调研了 Anthropic 官方市场全部 15 个 external plugin：**预编译二进制入库的为 0**。分布是 remote-http 5 / bun 4 / npx 3 / uvx 1 / docker 1 / php 1。运行时依赖是这个生态的通行做法。

而 Go 的具体代价是：`plugin.json` 的 `mcpServers` 是静态 JSON，**没有按 OS 分支的能力**，四平台二进制需要 launcher，launcher 本身又难跨平台（Windows 上 `.sh` 不行）。加上扩展端锁死 TS，用 Go 会让协议定义维护两份。

结论：esbuild bundle 单文件 + `command: "node"`，用户装完 plugin 无需任何 `npm install`（Node 没有 bun 那种 auto-install，所以必须 bundle）。协议稳定后若确需零依赖，换 Go 是局部工作。

## §6 开发流程

每个功能块都必须走完六个环节，不得跳步：

| 环节 | 产出 | 备注 |
|---|---|---|
| **调研** | 确认 API 真实签名与返回结构 | 用 `./scripts/eda` 在真机跑，**不信文档信实测** |
| **设计** | 更新本文档相应章节 | 决策要写"为什么"，不只写"是什么" |
| **开发** | MCP 工具代码 | 遵守 §0 铁律 |
| **测试** | 真机验证 + mock 回归 | 只读工具在 SV30 工程上验；写入工具只在自建测试工程上验 |
| **配套 skill** | `SKILL.md` + 复核修正 | 见下节，**这是交付的一部分，不是可选项** |
| **提交** | 一个自洽的 commit | 说明动机与验证结果，不只列改了什么 |

### MCP 与 skill 的分工

两者解决不同的问题，缺一个都不好用：

| | MCP 工具 | skill |
|---|---|---|
| 提供什么 | **能力**：结构化调用、参数校验、错误处理 | **知识**：何时用哪个工具、领域约定、组合套路、常见坑 |
| 形态 | 函数签名 + 简短描述 | Markdown，按需加载进上下文 |
| 约束 | 描述要短（每次都进上下文） | 可以很长（只在相关时加载） |

典型例子：`eda_place_component` 是能力；"放器件前要先确认单位是 mil 还是 mm、位号命名规范、放完要跑一次 DRC" 是知识。知识塞进工具描述会让每轮对话都背着它，塞进 skill 才是对的位置。

### skill 的测试

skill 不像代码有编译器兜底，必须实测：

1. **触发测试**：给出典型用户说法，确认 skill 被正确加载（描述里的触发词要覆盖中英文说法）
2. **可执行性测试**：照着 skill 写的步骤真跑一遍，凡是跑不通的都是 skill 的 bug
3. **复核修正**：把实跑中踩到的坑回写进 skill —— 每次真机调试发现的 API 怪癖，都应该沉淀成 skill 的一条

### 规划中的 skill 清单

| skill | 覆盖 | 对应功能块 |
|---|---|---|
| `eda-connect` | 连接、配对、排障（权限没勾/端口冲突/重连） | M0 |
| `eda-project` | 工程结构、创建工程与文档 | M1-1 / M3-1 |
| `eda-schematic` | 读写原理图、器件放置、连线、DRC | M1-2 / M1-4 / M3-2 |
| `eda-library` | 器件检索、参数、封装、数据手册 | M1-3 / M4 |
| `eda-pcb` | PCB 读写、层、网络、绘制、生产资料 | M3-3 |
| `eda-api` | 120 个 API 类的检索（供 `eda_execute` 兜底用） | M2 |

### 测试资产

- 真机只读验证工程：SV30 / `V2.0_Encoder`（用户的现有工程，**不得写入**）
- 写入类验证：由 AI 自建独立测试工程，用完保留以便复现
- 无 EDA 时的回归：`scripts/mock-eda.ts` 覆盖 bridge 侧全部分支

## §7 路线图

- **M0 骨架与授权** ✅ 已完成：协议、bridge、配对、扩展端、真机打通
- **M1 只读能力**：工程结构、原理图读取、器件查询、DRC —— 覆盖 P0
- **M2 API 检索 skill**：120 个类塞不进工具描述，需结构化文档 + 检索
- **M3 写入能力**：新建工程/板子、放置器件、连线、PCB 绘制
- **M4 数据手册**：MCP 侧 HTTP 下载 + 本地落盘
- **M5 分发**：plugin / marketplace 结构，`/plugin` 可装
