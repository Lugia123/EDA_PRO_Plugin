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

## 作用范围是"当前打开的那块板"

网表导出的是**当前编辑器里打开的原理图**。多板工程（一个工程好几块板）操作前先确认：

```
eda_current_context     → 看 board 是不是用户想要的那块
```

如果不是，要么让用户在 EDA 里切过去，要么用 `eda_open_project` 切工程。
工具返回「EDA 没有返回网表」时，通常是当前打开的是 PCB 或开始页，不是原理图。

## 已知不可用的路径

不要用 `eda.sch_Document.getPrimitivesInRegion()` 去枚举图元 —— 实测在扩展执行环境里
**恒返回空数组**（坐标量级、参数顺序、页面可见性、`activateDocument` 都试过，无效）。
同样 `navigateToRegion()` 返回 false。

需要原理图的原始图形数据时，用 `eda_execute` 调
`eda.sys_FileManager.getDocumentSource()` 拿完整源码（V3 行式格式，每行两个 JSON 拼接，
坐标单位 0.01 inch）。但注意一页就有 400 KB 左右，**不要整个塞进对话**，
要在代码里先过滤统计再返回。
