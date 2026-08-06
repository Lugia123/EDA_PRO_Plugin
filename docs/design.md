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

每个步骤都必须走完五个环节，不得跳步：

| 环节 | 产出 | 备注 |
|---|---|---|
| **调研** | 确认 API 真实签名与返回结构 | 用 `./scripts/eda` 在真机跑，**不信文档信实测** |
| **设计** | 更新本文档相应章节 | 决策要写"为什么"，不只写"是什么" |
| **开发** | 代码 | 遵守 §0 铁律 |
| **测试** | 真机验证 + 必要的 mock 测试 | 只读工具在 SV30 工程上验；写入工具只在自建测试工程上验 |
| **提交** | 一个自洽的 commit | 说明动机与验证结果，不只列改了什么 |

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
