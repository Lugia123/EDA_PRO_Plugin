---
name: eda-project
description: >-
  读取和切换立创EDA专业版的工程结构 —— 工程、板子（Board）、原理图、PCB 的层级关系与 uuid。
  任何 EDA 操作前先用它建立"地图"，把用户口中的「这个原理图」「那块板」解析成具体 uuid。
  触发词：EDA工程、工程结构、有哪些板子、当前工程、切换工程、打开工程、
  原理图列表、PCB列表、project overview、board。
---

# 立创EDA 工程结构

## 数据模型

层级是 **工程 → 板子(Board) → { 原理图(含多页) , PCB }**：

```
Project「SV30」
├── Board「V2.0_Encoder」
│   ├── Schematic ── Page「P1」, Page「P2」…
│   └── PCB
└── Board「V1.5_SV30主板」
    ├── Schematic ── Page「P1」
    └── PCB
```

关键点：**Board 是原理图和 PCB 的绑定单元**。一个工程有多块板，每块板配一套原理图和一个 PCB。
用户说「这个板子的 PCB」，指的是同一个 Board 下的 PCB。

原理图有**页**的概念，`Schematic` 是容器，实际内容在 `Page` 里。页的 uuid 同时也是编辑器标签页 id 的前半段
（tabId 形如 `<pageUuid>@<projectUuid>`，和浏览器地址栏 hash 里的 `tab=*` 参数一致）。

## 标准开场

```
eda_project_overview   → 工程全貌，拿到所有 board / schematic / page / pcb 的 uuid
eda_current_context    → 用户此刻正在看哪个（解析「这个」「当前」）
```

`eda_current_context` 的 `editor` 字段告诉你用户在哪个编辑器里：
- `schematic` → 正在编辑原理图，`pcb` 为 null
- `pcb` → 正在编辑 PCB，`schematic_page` 为 null
- `other` → 在开始页或其他界面，**没有工程上下文**

## 陷阱（都是实测踩出来的）

### openProject 对无效 uuid 会毁掉上下文

EDA 的 `openProject()` 遇到不存在的 uuid **不是干净返回 false**，而是把编辑器切到空白「开始页」，
清空当前工程。之后所有 `getCurrent*` 返回空，`getCurrentTeamInfo` 甚至会内部报错
`Cannot read properties of undefined (reading 'nickname')`。

`eda_open_project` 已内置前置校验拦截这种情况。但如果通过 `eda_execute` 手写 `openProject`，你要自己校验。

**万一真的切到开始页了**：改 URL hash 没用（SPA 不重新加载工程），必须让页面**硬刷新**
（网页版 `location.reload()`，客户端重启）。刷新后扩展会自动重连，等最多 45 秒。

### getAllProjectsUuid 的 teamUuid 必须传

文档标为可选参数，实测**不传返回空数组**。必须先 `getCurrentTeamInfo()` 或 `getAllTeamsInfo()` 拿到
teamUuid 再传。`eda_list_projects` 已处理。

### 一次调用就有完整树

`getAllBoardsInfo()` 返回的每个 board 已内嵌 `schematic`（含 `page` 数组）和 `pcb`，
**不需要**再调 `getAllSchematicsInfo` / `getAllPcbsInfo` 拼装。`eda_project_overview` 就是这么做的。

### 团队与工程的关系

用户可能同时属于个人空间和多个协作团队，同名工程可能存在于不同团队。
`eda_list_projects` 默认只列当前团队；要跨团队找工程才开 `include_all_teams`
（每个工程要单独查一次详情，约 250ms，工程多时明显变慢）。

## 新建板子

「新建一块板」在 EDA 里不是一步操作：底层要先建原理图、再建 PCB、最后 `createBoard(schUuid, pcbUuid)`
把两者绑定。单独调 `createSchematic()` 只会产生**游离文档**，不会出现在板子列表里；
`createBoard()` 不带参数则什么也不会创建。`eda_create_board` 已经封装好这三步。

```
eda_create_board(name:"PowerBoard")   → 一块板 + 一张原理图（含 1 页）+ 一个 PCB
eda_create_schematic_page(schematic_uuid:"...", name:"P2")  → 给原理图加页
```

新建的板**立即**出现在 `eda_project_overview` 里，不用刷新。

### 改名不可靠

`eda_rename_board` 和 `eda_create_board(name:...)` 的改名部分**时灵时不灵**：
EDA 的 `modifyBoardName` 有时返回 true 却没生效、有时直接返回 false，与名字长短、是否含中文、
是否刚刷新页面都没有稳定关系，原因未查明。

工具的处理是**改完重新查列表来判定**（判据是"新名出现且旧名消失"），失败时如实报 `renamed:false`。
所以：

- 建板时给 name 是"尽力而为"，失败也不影响板子本身建好，只是叫默认名
- 连续失败不要重试，直接让用户在 EDA 界面里手动改名

## 切换工程

```
eda_list_projects              → 找到目标 uuid
eda_open_project(uuid)         → 切换
eda_project_overview           → 确认切过去了
```

切换只改变界面显示，不修改任何工程数据。但会打断用户当前的编辑视图，**操作前最好说一声**。

**切到不同工程会重载 EDA 页面、断开连接约 10-30 秒。** `eda_open_project` 会立即返回
（带 `switching:true`），不等切换完成 —— 因为等的话连接已经断了，回包也拿不到。所以：

```
eda_open_project(uuid)      → 立即返回 switching:true
eda_status                  → 轮询到 connected_clients 非空，说明重连好了
eda_project_overview        → 这时才查得到新工程的数据
```

**切换后马上查数据会拿到空列表**（工程还没加载完），不要据此判断"工程是空的"。
目标就是当前工程时不会重载，工具会直接返回 `already_open:true`。
