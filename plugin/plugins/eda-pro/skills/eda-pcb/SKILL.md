---
name: eda-pcb
description: >-
  读取立创EDA专业版的 PCB：层数、网络与走线长度、未布线网络、PCB DRC（带明细）。
  用于「这块板几层」「哪些网络还没布线」「跑一下 PCB DRC」「这条线多长」这类问题。
  触发词：PCB、布线、走线、层数、铜层、网络长度、飞线、未布线、PCB DRC、
  阻抗、等长、layout。
---

# 读 PCB

## 先决条件：PCB 必须是当前活动画布

`pcb_*` 这组接口**绑定活动画布**。编辑器里开着原理图时调用会抛
「指定的主题消息在对应的画布内没有相关订阅」这种内部错误。

工具已经处理了：检测到不是 PCB 编辑器时，返回可用 PCB 列表和打开方法，而不是把内部错误丢出来。

```
eda_project_overview                          → 拿到 boards[].pcb.uuid
eda_open_document(document_uuid: <pcb uuid>)  → 切到 PCB 画布
eda_pcb_overview / eda_pcb_nets / eda_pcb_drc
```

`eda_open_document` 是**同工程内切标签页**，不重载页面、不断连接 ——
和 `eda_open_project`（切工程会重载断连）完全不同，不要混淆。

看完 PCB 想切回原理图，同样用 `eda_open_document` 传原理图页的 uuid。

## PCB DRC 比原理图 DRC 有用得多

| | 返回内容 |
|---|---|
| `eda_schematic_drc` | 只有分类计数（官方接口限制） |
| `eda_pcb_drc` | **分类 + 每条问题的具体描述** |

所以 PCB 侧可以直接告诉用户问题是什么，例如：

- `Connection Error` → `"{obj1} is disconnected from other objects of the same network"`
  ——某网络还没连通，通常是漏布线
- `Netlist Error` → `"PCB and schematic netlist does not match"`
  ——PCB 与原理图不同步，**需要用户在 EDA 里执行「导入变更」**，这个 AI 代替不了

条目多时每类默认只返回 20 条，`max_items_per_category` 可调。

## 走线长度

`eda_pcb_nets` 给每个网络的长度和是否已布线（`length: 0` = 只有飞线没走线）。

**单位官方文档没说明**。实测数值在 mil 量级（一条约 2339 的走线）。
用来做**相对比较**（等长匹配、找最长走线）是可靠的；要报绝对值给用户之前，
先在 EDA 界面里量一条已知走线核对换算关系，别直接当 mm 或 mil 说出去。

`unrouted` 字段直接给出未布线网络数 —— 这是判断"这块板布完了没"最快的方式。

## 还没有的能力

**PCB 写入（画走线、放器件、铺铜）目前没有做**。需要时用 `eda_execute` 直接调
`pcb_Primitive` / `pcb_Net` 的创建类接口，但注意：

- 坐标单位是 `0.01 inch`（官方 V3 格式规范），旋转角逆时针为正
- 写之前务必确认当前 PCB 是用户想改的那块，改完让用户自己看一眼
- 不要在用户没明确要求时动布线
