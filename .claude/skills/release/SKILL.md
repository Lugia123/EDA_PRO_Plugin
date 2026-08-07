---
name: release
description: >-
  本项目的发版流程 —— 出 .eext 扩展包、更新 MCP bundle、同步 plugin 版本。
  改完代码要出包给用户时用。涵盖版本号规则（跟随 commit 数）、CHANGELOG 的
  写入时机、以及什么改动需要用户重新导入扩展、什么不需要。
  触发词：发版、出包、打包扩展、构建 .eext、更新版本、release、deploy、
  给用户新版本。
---

# 发版流程

## 版本号规则

全项目统一为 `0.1.<git commit 数>`，由 `scripts/stamp-version.mjs` 刷五处：

```
eext-eda-bridge/extension.json          扩展清单
eext-eda-bridge/package.json
eda-mcp/package.json                    （bundle 里的 EDA_MCP_VERSION 由此而来）
plugin/plugins/eda-pro/.claude-plugin/plugin.json
plugin/.claude-plugin/marketplace.json  （在 metadata.version 里）
```

脚本挂在扩展的 `prebuild` 和 eda-mcp 的 `predeploy` 上，所以只要走 `npm run build`
或 `npm run deploy` 就会自动刷，**不要手工改这五个文件的版本号**。

### ⚠️ 写 CHANGELOG 时版本号要 +1

版本号取自 commit 数，而写 CHANGELOG 这件事本身也要产生一个 commit。所以：

```bash
git rev-list --count HEAD        # 假设输出 20
# → 本次发版的版本号是 0.1.21，不是 0.1.20
```

**先按 `count + 1` 写好 CHANGELOG，再提交，再构建。** 顺序反了会导致
CHANGELOG 里的版本号比实际包号小 1。

版本号不必连续 —— 中间的 commit 没出包就没有对应版本，这是正常的。
CHANGELOG 只记录**实际出过包的版本**。

## 标准步骤

```bash
# 1. 确认当前 commit 数，算出本次版本号
git rev-list --count HEAD

# 2. 写 CHANGELOG（用 count+1），扩展改动写 eext-eda-bridge/CHANGELOG.md
#    —— 按「修正 / 变更 / 新功能」分类，写清楚现象和根因，不要只写"修了个 bug"

# 3. 提交（代码 + CHANGELOG 一起）
git add -A && git commit

# 4. 构建扩展（prebuild 自动刷版本号）
cd eext-eda-bridge && npm run build     # → build/dist/eda-bridge_v0.1.<n>.eext

# 5. 部署（刷版本 + 复制 bundle 与 .eext 进 plugin/）
cd ../eda-mcp && npm run deploy

# 6. 校验
claude plugin validate ../plugin --strict

# 7. 版本号被步骤 4/5 改动了，补一个提交
git add -A && git commit -m "chore: 版本号刷至 0.1.<n>"
```

步骤 7 容易忘 —— 构建会修改那五个 json，不提交的话工作区是脏的，
下次 `git rev-list --count` 又会偏。

## 什么改动需要用户重新导入扩展

这是最容易搞错、也最影响用户体验的一点：

| 改了什么 | 用户要做什么 |
|---|---|
| `eext-eda-bridge/src/**` | **重新导入 .eext + 刷新页面 + 重新配对** |
| `shared/protocol.ts` | 同上（两端都要更新，扩展侧变了） |
| `eda-mcp/src/**` | 只需重启 Claude Code 会话，**扩展不用动** |
| plugin.json / skill / 文档 | 重启会话即可 |
| 只改了 CHANGELOG / README / 版本号 | 什么都不用做 |

**重新导入扩展会清空 `SYS_Storage`，配对凭证丢失，必须重新配对一次。**
所以只改了 MCP 侧就别让用户导扩展 —— 白白多一次配对。

告知用户时要说清楚：包在哪、要不要重新配对、这次修了什么。

## 重新配对的操作

导入后凭证没了，走一次配对：

```bash
rm -f ~/.eda-mcp/pairing.json          # MCP 侧也清掉，否则 bridge 不会开配对会话
cd eda-mcp && npx tsx scripts/dev-bridge.ts   # 后台跑，日志里有 6 位配对码
```

然后在 EDA 里「EDA Bridge → 配对(P)...」输入。

### 配对前先确认端口干净

```bash
lsof -nP -iTCP:49630 -sTCP:LISTEN
```

有残留进程占着 49630 的话，新 bridge 只能退到 49631，而**扩展扫端口时会先连上
49630 的那个旧进程**，配对码就发给了错误的对象，表现为「配对怎么都不成功」。
先 kill 掉再配对。

## 发版后验证

```bash
cd eda-mcp && npm run test:mcp
```

跑在沙箱工程（名字含「测试/test」）里才会覆盖写入类工具；在真实工程里
那些用例会自动跳过，这是有意为之。
