# EDA_PRO_Plugin 设计文档

> 动手前先读本文。§0 的铁律是从实测踩坑得出的，违反任意一条基本等于设计错了。

## §0 铁律

1. **协议只有一份真相源**：`shared/protocol.ts`。两端都 import 它，任何一端另抄一份类型定义都是错的——两端语言相同就是为了吃这个红利。
2. **未认证连接不得触达 EDA**：bridge 在认证前只接受 `pair` / `auth` / `ping`，其余一律丢弃。任何"先执行再校验"的写法都不许出现。
3. **stdout 属于 MCP**：stdio 传输下 stdout 是 JSON-RPC 通道，日志一律 stderr（见 `logger.ts`）。禁止裸 `console.log`。
4. **能力探测优先于文档**：立创的 API 文档与实际行为存在出入，任何新 API 在写进工具前，先用 `./scripts/eda` 在真机上验证返回结构。
5. **默认只读**：涉及写入用户工程的工具必须显式标注，且在测试阶段只对自建测试工程操作。
6. **API 签名一律先实测再用**。名字看着直观的接口，参数顺序常常反直觉：
   `sch_PrimitiveText.create(x, y, text)` 坐标在前，按 `(text, x, y)` 调不会报错 ——
   文字被当成 x 坐标，图元飞到天边，表现为「图上什么都没有」，白查半天渲染问题。
   `sch_PrimitiveRectangle.create(topLeftX, topLeftY, width, height)` 同理，
   不是两点式。写一句 create 再读回来比对，比读文档快。
7. **传给 EDA 的代码里不许出现任何反斜杠转义**。那段代码是放在 TS 模板字符串里发过去的，
   模板字符串会**先求值一遍**，于是：
   - `\d` `\+` `\?` 这类无效转义，反斜杠被吃掉 → 到 EDA 那边成了非法正则，工具直接挂
   - `'\n'` 是**有效**转义，会被求值成真实换行符 → 生成的代码里字符串字面量断成两行，
     报 `Invalid or unexpected token`

   替代写法：正则用 `indexOf` / `startsWith` / 字符码比较；换行符用 `String.fromCharCode(10)`。
   **此坑已踩三次**（`/\?|^$/`、`/^(VCC|VDD|VBAT|\+?\d+V|V\+)/`、`split('\n')`），
   写死在这里 —— 下次动这类代码前先搜一遍有没有反斜杠。
8. **写操作必须回读确认，返回值只作参考**。这条是被反复打脸打出来的：

   | 调用 | 返回 | 事实 |
   |---|---|---|
   | `setDocumentSource` | `true` | 文档被写坏，丢了一行、字段错位 |
   | `modifyBoardName` | `true` | 名字没变 |
   | `eda_auto_route` | 148 根连线全成功 | 只有 60 根还连在引脚上 |
   | `eda_set_page_size` | 写入成功 | 写的是 EDA 不认的字段名，尺寸没动 |
   | `sch_PrimitiveComponent.create` | 坐标 = 请求值 | 那是 create 时刻的对象快照，之后 `modify` 过就不再是实际值 |

   所以：**凡写操作，写完按 id 回读实际状态，返回 `requested` 与 `actual` 两组值**，
   不符就报 warning。不许把请求值回显成结果 —— 那等于向调用方撒谎，
   而且会让真正的失败沉默地留在图纸上（叠件、断连都是数量对、DRC 也不报的）。

9. **查对象不许按名字查，要按自己刚创建的 uuid 查**。
   `IDMT_BoardItem` **没有 uuid 字段**，板名就是唯一标识，而 `createBoard` 返回的是
   EDA 默认命名（`Board1`…），工程里可能已有同名旧板 —— 按名字 `find` 会撞上旧板，
   于是返回**别人的** page uuid（连建两块板、两块都报告了第三块板的图页 uuid，真踩过）。
   正解：用 `createSchematic()` 返回的 uuid 去 `find(b => b.schematic.uuid === schUuid)`，
   那是自己刚造的、全局唯一的锚点。列表有缓存，轮询等它出现，宁可多等。

10. **拿不到确定信息就拒绝动手，不要退化成猜**。
    读到的数据要能自证没被污染（见 `tools/verify.ts`）：EDA 侧对返回文本算哈希、
    本侧重算比对（挡桥接层损坏），同一读取连做两遍、两遍一致才采信（挡缓存与
    不稳定返回）。三道校验都过不了就如实报错。
    宁可慢、宁可失败，**不可以给出看起来对的假数据** —— 假阳性的体检比不体检更坏。

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

## §4.6 「连上了」必须验证，DRC 说了不算

**实测**：一次全图 `autoRouting()` 之后，148 个引脚只剩 60 个还落在导线上，
而 `eda_schematic_drc` 依旧报 **errors: 0**，器件、网络名、连线在图上一样不少。
布线算法重组走线时会把导线从引脚端点扯开，从此那些引脚不属于任何网络 ——
DRC 查的是「已有网络之间有没有冲突」，查不出「引脚压根没进网络」。

所以判定连接只有一个可信办法：**把引脚坐标和导线端点逐个比对**。

```
引脚坐标  eda.sch_PrimitiveComponent.getAllPinsByPrimitiveId() → p.x, p.y
导线端点  getDocumentSource() 里 type=LINE 的 startX/startY/endX/endY
坐标关系  源码 y = -API y（EDA 内部 y 轴向上），x 相同；容差 2
```

不要用 `sch_Net.getAllNets()` / `getAllNetsName()` —— 和 §4.5 的区域查询一样，
在扩展的 WebSocket 回调上下文里一律返回空，既证明不了连上、也证明不了没连上。

### 两个会让验证失效的陷阱

1. **`getDocumentSource()` 有缓存**。布线刚结束就读会拿到布线前的内容，
   校验通过纯属假象。实测正是这样漏判了一整轮：读到 135 个引脚连着，
   等缓存刷新后真实数字是 60。**读之前先等 1.5 秒。**
   （`getCurrentSchematicPageInfo()` 同样有缓存，见 `eda_set_page_size`。）

2. **`sch_PrimitiveWire.create()` 会静默失败**。当引出线端点落在另一条线的端点
   附近 1–2 个单位时，它照样返回图元对象，但线不会真的落在引脚上。
   实测 stub 长度 20 时端点在 x=300、邻线端点在 x=299，连接建立失败且无任何报错；
   长度改成 30 避开就正常。**创建后必须回读比对，不能信返回值。**

因此 `eda_auto_route` 要求传 `nets` 声明：布线后逐个引脚核对，被扯断的自动接回。

## §4.7 原理图表达分层：连接语义决定图形

一张图能不能看，取决于**每种连接用对了图形**。把所有连接都塞成「每个引脚贴一个
文字标签」，电气上成立，视觉上是灾难 —— 芯片相邻引脚间距只有 10（0.1 inch），
而一个网络名的文字宽度动辄 50 以上，密集芯片周围必然糊成一团。

| 连接语义 | 图形 | 实现 |
|---|---|---|
| 电源 / 地 | 电源符号、地符号 | 引脚引出短线 → `createNetFlag('Power'/'Ground'/'AnalogGround')` |
| 块内器件互连 | **真实导线** | `sch_PrimitiveWire.create` 两引脚间连线 |
| 跨区信号 | 输入/输出端口 | 引脚引出短线 → `createNetPort('IN'/'OUT'/'BI')` |
| 同区多点同网 | 网络标签（错开摆） | 短线 + `createNetLabel` |
| 未用引脚 | NC 标志 | 见下 |
| 功能分区 | 矩形框 + 标题 | `sch_PrimitiveRectangle.create` + `sch_PrimitiveText.create` |

判断顺序：先看是不是电源地（用符号），再看两端是否同区（同区画线、跨区用端口），
最后才轮到文字标签。**文字标签是兜底，不是默认。**

### componentType 区分图元身份

`sch_PrimitiveComponent.getAll()` 返回的不只是器件，用 `componentType` 分辨：

| 值 | 是什么 |
|---|---|
| `part` | 真实器件，**统计器件数只能数这个** |
| `sheet` | 图框/标题栏，位号为空、坐标 (0,0) |
| `netflag` | 电源、地符号 |
| `netport` | 网络端口 |

不过滤会踩两个坑：器件计数虚高；把图框误判成「属性残缺的幽灵器件」删掉 ——
实测就删过一次，EDA 日志里那句「器件属性有误，请删除该元件」说的正是图框。

`netflag` / `netport` 各自带一个引脚，坐标等于放置坐标，所以放在器件引脚外侧、
中间连一小段导线，就是标准画法。

## §4.8 原理图地图：AI 与算法的契约

原来的分工是：几何信息临时从 EDA 读、连接关系每次由 AI 重说一遍。两头都不牢靠。

**EDA 侧读不全**：`sch_Net.getAllNets()` 在扩展上下文里返回空（同 §4.5 的区域查询）；
文字的真实位置读不到，只能按「位号在上、型号在下」猜偏移；`getPrimitivesBBox`
给的是符号包围盒，不含超长引脚名撑出来的视觉宽度（ATTINY85 符号宽 541 就是被
引脚名撑的）。**AI 侧不留痕**：图上不记得上次声明过什么，每次优化都要从头交代一遍。

所以引入**地图**（`src/layout/map.ts`）：一份 JSON，跟原理图存在一起。

```
AI 负责语义 —— 用什么器件、分几个区、谁连谁、哪条网络是电源哪条是信号
算法负责几何 —— 位置微调、旋转角度、走线路径、文字往哪摆
地图是契约  —— 两边都读它、都写它，谁也不用猜对方
```

EDA 由此从「真相源」降级成「渲染目标」：**地图能完整重建一张图，反之不行**。

### 三个关键约定

**网络性质由 AI 判定，不靠名字猜。** `NetKind` 是地图里的显式字段。
纯规则一定会失效 —— `AVDD_1V8` / `VBAT_SW` / `VREF_2V5` 既像电源又像信号，
而 `PWR_EN` 听着像电源其实是普通 IO。`guessNetKind()` 只在 AI 没指明时给个建议，
绝不覆盖 AI 的判断。性质决定画法：电源地放符号，信号画导线，跨区走端口。

**文字是可优化的变量，不是器件的附属装饰。** 位号、型号、阻值往哪摆不影响电气，
只影响能不能看清，所以 `MapLabel.dx/dy` 由算法在器件四周挑一个不压别人的位置，
而不是固定死。

**地图与图纸同生共死。** 存在原理图内部而非本地文件 —— 换台机器、别人打开工程，
地图都还在，才谈得上「下次接着优化」。载体是 `sch_PrimitiveText`：实测单个文字
图元存 60000 字符仍然无损（含中文与引号），而一张大图的地图 JSON 不过 10–50 KB。

### 分组是分治的单位，不是画在图上的框

功能区先是一种**布局手段**，其次才是图上那个框。做法分两层：

```
组内 —— 每组在自己的局部坐标系（一片空地）里独立优化，
        只看本组器件和组内连线。十几个器件的全局问题
        就此降成四五个器件的小问题，退火收敛质量高一个量级。
        优化完量出实际包围盒，这就是该组的尺寸。

组间 —— 把每组当成一个大矩形来摆：不重叠、留出走线通道、
        跨组连接多的靠得近。定好位置后，把组内布局整体平移过去。
```

**框是布局的产物，不是布局的前提。** 预先划一块地再往里塞器件，塞不下要返工、
塞不满则留白难看；而按优化结果量出来的框，永远刚好。标题写在框内 ——
框常常紧贴图纸边缘，往外挪一点标题就掉出图纸了。

跨组连接优先用 IN/OUT 端口而非拉线：长线穿越图纸是可读性的头号杀手，
而端口天然把「这个信号出了本区」这件事说清楚了。

### 权责边界：几何以 EDA 为准，语义以地图为准

地图里同时躺着两类信息，它们的权威来源**不是同一个**：

| 信息 | 谁说了算 | 理由 |
|---|---|---|
| 符号尺寸、引脚数量、引脚号与坐标 | **EDA** | 这是库里的客观事实，AI 凭记忆填必然出错 |
| 谁连谁、分区归属、网络是电源还是信号 | **地图（AI）** | 这是设计意图，EDA 里根本不存在 |

所以 AI 手写地图后必须先跑 `eda_map_verify`：拿地图里的几何跟真实符号比对，
对不上的以 EDA 为准修掉。跳过这一步，错的引脚号会一路带到渲染，
表现为「线连到了不存在的脚上」，届时很难追回是哪一步编错的。

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
