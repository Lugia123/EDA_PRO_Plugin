# EDA_PRO_Plugin

用 AI 操作**立创EDA专业版**（EasyEDA Pro）—— 一个 Claude Code plugin，把 EDA 的原理图 / PCB / 器件库能力接进 AI 的工具箱。

> 状态：早期开发中。MCP 端与配对鉴权已可运行，EDA 扩展端开发中。

## 它由两半组成

EDA 不开放外部进程直接操作，但**开放官方扩展 API**。所以链路必须从扩展点进去：

```
Claude Code ──stdio/JSON-RPC──> eda-mcp ──ws://127.0.0.1:4963x──> eda-bridge 扩展 ──> eda.* API
                                (本地 MCP)                          (.eext，跑在 EDA 内)
```

| 目录 | 是什么 | 语言 |
|---|---|---|
| `eda-mcp/` | 本地 MCP Server，进程内自带 bridge（WebSocket 服务端） | TypeScript → esbuild 单文件 |
| `eext-eda-bridge/` | EDA 扩展，连 bridge 并在 EDA 内执行代码 | TypeScript → `.eext` |
| `shared/protocol.ts` | 两端共享的线上协议，**唯一真相源** | TypeScript |
| `plugin/` | Claude Code plugin / marketplace 结构 | JSON |

连接方向是固定的：扩展只有 `SYS_WebSocket.register()` 这个**客户端** API，没法监听端口，所以服务端必须在 MCP 这侧，由扩展主动扫端口连上来。

## 配对鉴权（为什么必须有）

实测结论：从 `https://pro.lceda.cn` 页面里 `new WebSocket('ws://127.0.0.1:...')` 能连通——Chrome 视 loopback 为可信来源，既不触发 CSP 也不触发混合内容拦截。**任意网站都能连上本机 bridge。**

而本项目的 `eda_execute` 是「在 EDA 里跑任意 JS」。所以「握手时自报服务名」不构成鉴权（谁都能自报），必须有一次人工参与：

```
eda_pair_start → 6 位配对码 → 用户在 EDA 扩展面板输入 → 换长期 token（~/.eda-mcp/pairing.json, 0600）
                                                        └─ 之后重连自动带 token，不用再输
```

配对码 5 分钟 TTL、最多 5 次尝试、成功即废；未认证连接除 `hello`/`pair`/`auth` 外一律拒绝，60 秒内不认证就断开。

不用 OAuth：全链路在 loopback，没有远程 server、没有账号体系，OAuth 在这里只是自我加戏。

## 依赖前提

- Node.js ≥ 18（MCP 运行时）／≥ 20.5 （构建扩展）
- 立创EDA专业版 ≥ 3.2（桌面客户端或网页版均可）
- 在 EDA 扩展管理器里勾选本扩展的**「允许外部交互」**——不勾则 `SYS_WebSocket` 直接 throw，这是立创的硬性要求

## 开发

```bash
# MCP 端
cd eda-mcp && npm install && npm run build     # → dist/index.js
npm run typecheck

# 扩展端
cd eext-eda-bridge && npm install && npm run build   # → build/dist/*.eext
# 在 EDA 里：高级 → 扩展管理器 → 已安装 → 导入 → 选 .eext
```

网页版和桌面客户端都支持导入本地 `.eext`（`accept=".eext, .zip"`），开发期推荐用网页版——Chrome DevTools 调试更方便。

## 许可

MIT，见 [LICENSE](./LICENSE)。

例外：`eext-eda-bridge/` 派生自官方脚手架 [easyeda/pro-api-sdk](https://github.com/easyeda/pro-api-sdk)（Apache-2.0），该部分沿用其原始许可。

## 参考

- 官方扩展开发文档：https://prodocs.easyeda.com/cn/api/guide/
- 官方 API 参考（120+ 类）：https://prodocs.easyeda.com/cn/api/reference/pro-api.html
- 官方类型包：`@jlceda/pro-api-types`
