# EDA_PRO_Plugin

用 AI 操作**立创EDA专业版**（EasyEDA Pro）—— 一个 Claude Code plugin，把 EDA 的原理图 / PCB / 器件库能力接进 AI 的工具箱。

> 状态：读能力、工程/文档创建、原理图写入已可用并经真机验证；PCB 写入尚未实现。

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

## 安装使用

### 1. 装 plugin

```bash
# 在 Claude Code 里
/plugin marketplace add /Users/lugia/hardware/EDA_PRO_Plugin/plugin
/plugin install eda-pro@eda-pro-plugins
```

装完**需要重启 Claude Code 会话**才会加载 MCP。

### 2. 装 EDA 扩展

扩展包在 `plugin/plugins/eda-pro/extension/eda-bridge_v*.eext`。

1. 立创EDA专业版 →「高级 → 扩展管理器 → 已安装 → 导入」→ 选那个 `.eext`
2. 在扩展管理器里勾选 **允许外部交互**（必须）和 **显示在顶部菜单**
3. 刷新网页版页面 / 重启客户端，顶部会出现「EDA Bridge」菜单

### 3. 配对一次

对 Claude 说「连接 EDA」，它会：调 `eda_pair_start` 拿 6 位配对码 → 你在
「EDA Bridge → 配对(P)...」输入 → 完成。之后重连自动认证，不用再输。

### 已有的能力

| 工具 | 作用 |
|---|---|
| `eda_status` / `eda_pair_start` / `eda_unpair` | 连接与配对 |
| `eda_project_overview` / `eda_current_context` | 工程结构、当前编辑对象 |
| `eda_list_projects` / `eda_open_project` | 列出、切换工程 |
| `eda_schematic_components` / `eda_component_detail` | 器件清单、单器件参数与引脚 |
| `eda_schematic_nets` | 网络连接关系 |
| `eda_schematic_drc` | 原理图 DRC（仅分类计数，见 skill 说明） |
| `eda_library_search` / `eda_library_device` | 器件库检索、选型 |
| `eda_download_datasheet` | 数据手册 PDF 下载到本地 |
| `eda_create_project` / `eda_create_board` / `eda_create_schematic_page` / `eda_rename_board` | 新建工程、板子、原理图页（写操作） |
| `eda_open_document` | 同工程内切换编辑器标签（PCB / 原理图页） |
| `eda_pcb_overview` / `eda_pcb_nets` / `eda_pcb_drc` | PCB 层数、走线长度、DRC（带明细） |
| `eda_place_component` / `eda_draw_wire` / `eda_add_net_identifier` / `eda_add_schematic_text` | 原理图写入：放器件、画导线、网络标识、文字 |
| `eda_schematic_primitives` / `eda_delete_primitives` | 画布图元的定位与删除 |
| `eda_execute` | 兜底：在 EDA 里执行任意 API 代码 |

配套 6 个 skill：`eda-connect`、`eda-project`、`eda-schematic`、`eda-library`、`eda-pcb`、`eda-api`
（后者含 71 个 API 类 / 569 个方法的索引）。

### 还没做的

- PCB 写入（走线、铺铜）—— PCB 侧的 create 类接口很完整（`PCB_PrimitiveLine.create` 等），
  只是还没做成工具
- 板子改名：EDA 侧接口不稳定，工具会如实报失败，请在界面手动改

### 更新扩展的注意事项

重新导入 `.eext` 会**清空扩展的 SYS_Storage**，也就是配对凭证会丢失，需要重新配对一次
（`eda_pair_start` 取码 → 在 EDA 里输入）。扩展权限（允许外部交互）则会保留。

扩展版本号的 patch 位由 `npm run build` 自动刷成当前 git commit 数
（`0.1.<count>`），所以报问题时带上版本号就能定位到具体代码。

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
