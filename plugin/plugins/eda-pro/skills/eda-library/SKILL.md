---
name: eda-library
description: >-
  在立创EDA的元器件库里选型、查器件参数、下载数据手册 PDF。用于「找一个 3.3V LDO」
  「C347222 是什么」「这颗芯片的引脚定义」「把 U1 的规格书下下来」这类需求。
  触发词：选型、元器件、器件库、找芯片、立创编号、C开头编号、LCSC、
  数据手册、规格书、datasheet、PDF、器件参数、封装。
---

# 元器件库与数据手册

## 先分清两类问题

| 用户在问 | 用哪组工具 | 数据来源 |
|---|---|---|
| 「**这块板**上用了什么」 | `eda_schematic_*` | 当前原理图的网表 |
| 「**库里**有什么能用」 | `eda_library_*` | 器件库（含立创商城百万级器件） |

问「U1 是什么」时注意区分：如果 U1 是板上位号，用 `eda_component_detail`；
如果用户在说一个型号，用 `eda_library_search`。

## 选型流程

```
eda_library_search(keyword:"AMS1117")     → 看有哪些可选，拿立创编号
eda_library_device(lcsc_id:"C347222")     → 看完整参数、封装、datasheet 链接
eda_download_datasheet(lcsc_id:"C347222") → 需要看手册细节时下载
```

`eda_library_device` 返回的 `designator_prefix`（如 `U?`）是该器件的默认位号前缀，
放置到原理图时会按它自动编号。

搜索词可以是型号（`AMS1117`）、参数组合（`0.1uF 0402`）、中文品类（`贴片电阻`）。
每页默认 10 条，结果数等于 limit 时说明可能还有，翻页继续。

## 数据手册：三类链接，只有两类能下

实测某板 54 个带 Datasheet 的器件，链接分布：

| 形态 | 数量 | 能否下载 |
|---|---|---|
| `atta.szlcsc.com/...pdf` | 21 | ✅ 直链 PDF |
| 原厂链接（如 `ti.com/cn/lit/gpn/...`） | 4 | ✅ 会 302 到 PDF |
| `item.szlcsc.com/datasheet/....html` | 29 | ❌ 是**网页**，且服务端访问被对方 WAF 拦 |

第三类占比不小，遇到时 `eda_download_datasheet` 会明确返回「该链接返回的不是 PDF」。
**这时不要重试、不要找别的方式绕**，直接告诉用户"这是立创商城的器件页面，请在浏览器里打开"，
并把链接给 TA。

下载成功后返回 `saved_path`，默认落在 `~/Downloads/eda-datasheets/`。
拿到路径后可以用读 PDF 的工具继续提取引脚定义、极限参数等内容——
这是本地 MCP 才有的能力，浏览器里的扩展做不到。

### 按位号下载最省事

```
eda_download_datasheet(designator:"RF1")
```

直接从当前原理图的网表取链接，不用先查编号。位号不在当前原理图时会明确报错。

## 安全边界

下载工具只放行公网 http/https，会拒绝 `localhost`、`127.*`、`10.*`、`192.168.*`、
`172.16-31.*`、`169.254.*` 等内网地址，也拒绝 `file://`。单文件上限 50 MB。

这不是多余的：datasheet 链接来自工程数据，一个被人做过手脚的工程文件可以把链接指向内网地址。
