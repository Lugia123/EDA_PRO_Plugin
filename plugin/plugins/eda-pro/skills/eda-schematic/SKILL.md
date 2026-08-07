---
name: eda-schematic
description: >-
  读取立创EDA专业版的原理图内容 —— 器件清单（BOM）、单个器件的参数与引脚、
  网络连接关系。用于回答「这块板用了哪些芯片」「U1 是什么」「GND 接了哪些引脚」
  「这个电阻多大」这类问题，以及导出物料清单前的核对。
  触发词：原理图、器件清单、BOM、物料、有哪些元件、网络、网表、netlist、
  引脚、pin、连到哪、位号、schematic、component。
---

# 读原理图

## 数据从哪来

所有工具的底层数据是 **EDA 导出的网表**，不是解析原理图图形。这个选择很关键：

- 网表里的引脚 → 网络映射是 EDA 自己算的，准确；从图形反推连线归属既复杂又容易错
- 器件的型号、封装、立创编号、**Datasheet 链接**、电气参数都在网表里，不用再查库

## 器件数量对不上是正常的

网表只含**真实器件**（`Convert to PCB = yes`）。实测同一页原理图：

| 口径 | 数量 |
|---|---|
| 原理图源码里的 COMPONENT 图元 | 140 |
| 网表里的器件 | **56** |

差额是电源符号、网络标志（NetFlag）、图框文字等不上 PCB 的图元。
**做 BOM、算物料、数芯片时，56 才是对的数字。** 用户如果说"我这图上明明有一百多个"，
解释这个口径差异。

## 典型流程

```
eda_schematic_components                      → 看清单（56 个）
eda_schematic_components(designator_filter:"U") → 只看芯片
eda_component_detail(designator:"U1")          → 看 U1 的参数、引脚、datasheet
eda_schematic_nets                             → 看网络概览
eda_schematic_nets(net_name:"VCC_3V3")         → 看这个电源接了谁
```

### 位号筛选的匹配规则

`designator_filter` 给字母前缀时**只匹配同类**：给 `R` 命中 `R1` `R12`，但**不**命中 `RJ1`
（`RJ1` 的字母部分是 `RJ`）。给完整位号 `U1` 则精确匹配。想模糊搜型号用 `keyword`。

### 网络名里的 `$1N9877`

这类是 EDA 自动命名的匿名网络，多为两点之间的普通连线，对人没有含义。
`eda_schematic_nets` 默认**折叠**它们，只列设计者命名过的网络。要看全部才加
`include_auto_named=true`。

判断一块板的电源架构时，直接看网络概览的前几名 —— 按连接数降序，地和电源天然排在最前
（实测某板：PGND 37 脚、AGND 24 脚、DGND 20 脚，一眼能看出模拟地/数字地/功率地是分开的）。

## DRC：只有汇总，没有明细

`eda_schematic_drc` 返回的是**分类计数**（error 几条、warn 几条），拿不到每条问题的描述和位置。
这是立创接口本身的限制（`sch_Drc.check` 标记 @beta），试过所有参数组合都一样，不是工具没取到。

所以正确的用法是：

```
改完原理图 → eda_schematic_drc → 看 errors 有没有增加
errors > 0 → eda_schematic_drc(show_ui:true) → 让用户在 EDA 底部面板看明细
```

**不要向用户宣称能列出具体是哪些 DRC 问题。** 要明细就引导用户看面板，或让 TA 把面板内容贴过来。
`passed` 字段只看 error 不看 warn —— 大多数板子都带若干 warn，这是正常的。

## 作用范围是"当前打开的那块板"

网表导出的是**当前编辑器里打开的原理图**。多板工程（一个工程好几块板）操作前先确认：

```
eda_current_context     → 看 board 是不是用户想要的那块
```

如果不是，要么让用户在 EDA 里切过去，要么用 `eda_open_project` 切工程。
工具返回「EDA 没有返回网表」时，通常是当前打开的是 PCB 或开始页，不是原理图。

## 写原理图

写入工具都作用于**当前打开的原理图页**，先用 `eda_current_context` 确认位置对。

```
eda_place_component(lcsc_id:"C347222", x:300, y:300)   → 放器件，自动分配位号
eda_component_pins(designator:"U1")                    → 看引脚号/名/坐标/朝向
eda_connect_pins(from:"U1.3", to:"C1.1", net:"VIN")    → 按引脚连线（主力工具）
eda_draw_wire(points:[400,300,500,300], net:"VCC_3V3") → 手工画线（连不到引脚时才用）
eda_add_net_identifier(kind:"ground", net:"GND", x:500, y:450)
eda_add_schematic_text(content:"电源部分", x:300, y:200)
eda_schematic_primitives                                → 列画布图元拿 primitive_id
eda_delete_primitives(primitive_ids:[...], kind:"component")
```

### 批量连接用 eda_label_pin_net，不要拉长线

**这是自动画原理图最重要的一条。** 原理图里交叉重合的导线会被 EDA 判定为电气相连，
而自动生成的 L 型长路径在密集图里必然大量交叉 —— 实测复刻一张 56 器件的图时，
用链式长连线导致 **81 个引脚被误并进同一个网络**，另有 73 个引脚失去归属。

正确做法是给每个引脚引出一小段带网络名的线（`eda_label_pin_net`）：同名网络本来就
电气相连，不需要物理连通，也就不存在交叉误连。同一张图改用这个策略后，
56 器件 / 180 个引脚标注全部成功，DRC 零错误。

```
eda_label_pin_net(designator:"U1", pin:"3", net:"VCC_3V3")
```

只有确实要画出可见连线的少数位置（比如两个相邻器件之间），才用 `eda_connect_pins`。

### 画大图前先设图纸

新建的原理图页默认 A4（约 1170×825，单位 0.01 inch），器件坐标超出就掉到图框外。
先按目标坐标范围调用 `eda_set_page_size(size:"A3")`。

### 少量连线用 eda_connect_pins

它会自己查引脚坐标、按引脚朝向选走线方向（顺着引脚引出，不会把线压在符号上）。
手工算坐标调 `eda_draw_wire` 容易差之毫厘连不上。

引脚用「位号.引脚号」或「位号.引脚名」指定：`U1.3`、`U1.VIN` 都行。

### 位号是自动分配的

EDA 的放置接口给出来的位号是库里的**占位符**（`U?`），不编号的话多个器件全叫 `U?`，
没法引用也没法连线。`eda_place_component` 会扫全图已用位号补上下一个编号（U1、U2…），
返回值里的 `designator` 就是最终位号 —— **后续连线要用它**，不要自己猜。

### 坐标系

**单位是 0.01 inch**，A4 图纸约 1170 × 830。旋转角逆时针为正、角度制。
放置前先用 `eda_schematic_primitives` 看现有器件的坐标分布，别把新器件叠在旧的上面。

### 导线的网络归属有规则

不指定 `net` 时：端点不碰任何图元 → 空网络；碰到一个网络的图元 → 跟随它；
碰到**多个不同网络** → 创建失败。

指定 `net` 时：相接的、未显式命名过网络的图元会跟随你指定的网络；
若对方已经显式命名（有网络标签或端口）→ 创建失败。

所以连两个已命名网络的引脚时，不要指望画根线就能合并它们——那会失败。

### 两类"器件列表"别混用

| 工具 | 数据源 | 给你什么 | 用途 |
|---|---|---|---|
| `eda_schematic_components` | 网表 | 型号、封装、立创编号、参数 | 看 BOM、查规格 |
| `eda_schematic_primitives` | 画布图元 | **primitive_id**、坐标、位号 | 定位、修改、删除 |

要改动或删除，必须用后者拿 `primitive_id`。

### 删除很危险

`eda_delete_primitives` 不可撤销，工具本身不做二次确认。**删之前先列出来给用户看**，
确认清楚再动手。不确定就别删。

### 网络标签必须贴在导线上

`eda_add_net_identifier(kind:"label")` 的坐标要落在**一条已有导线**上。放在空白处时
EDA 会进入等待鼠标点击的交互模式，接口一直不返回。所以顺序是：先画线 → 再取线上一点贴标签。

另外实测这个操作每次都会让扩展重连一次，回包必丢。工具不会报成普通失败，而是明确告诉你
**动作很可能已经生效** —— 这时**不要直接重试**（会放两个标签），先用 `eda_schematic_nets`
核实网络在不在，再决定。

### 写完记得验

放完器件、连完线，跑一次 `eda_schematic_drc` 看 error 有没有增加。
写入操作偶尔会让扩展短暂重连，bridge 会自动等待并重试一次，所以偶发的一次卡顿不必惊慌；
连续失败才说明真有问题。

## 已知不可用的路径

不要用 `eda.sch_Document.getPrimitivesInRegion()` 去枚举图元 —— 实测在扩展执行环境里
**恒返回空数组**（坐标量级、参数顺序、页面可见性、`activateDocument` 都试过，无效）。
同样 `navigateToRegion()` 返回 false。

需要原理图的原始图形数据时，用 `eda_execute` 调
`eda.sys_FileManager.getDocumentSource()` 拿完整源码（V3 行式格式，每行两个 JSON 拼接，
坐标单位 0.01 inch）。但注意一页就有 400 KB 左右，**不要整个塞进对话**，
要在代码里先过滤统计再返回。
