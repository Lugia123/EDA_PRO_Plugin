# eda-bridge

立创EDA专业版扩展。连上本机 `eda-mcp` 的 bridge，把 AI 发来的代码在 EDA 环境里执行后回传结果。

只与 `127.0.0.1:49630-49639` 通信，不连接任何外部服务器。未配对的连接除握手外什么都做不了。

## 构建

```bash
npm install
npm run build      # → build/dist/eda-bridge_v<版本>.eext
```

`prebuild` 钩子会把 `extension.json` 的 patch 位刷成当前 git commit 数。

## 安装到 EDA

1. 高级 → 扩展管理器 → 已安装 → 导入 → 选 `.eext`
2. 勾选 **允许外部交互**（必须，否则 `SYS_WebSocket` 直接抛错）和 **显示在顶部菜单**
3. 刷新网页版页面 / 重启客户端

重新导入会清空扩展的 `SYS_Storage`，配对凭证丢失需重新配对；扩展权限会保留。

## 目录来源与许可

本目录派生自官方脚手架 [easyeda/pro-api-sdk](https://github.com/easyeda/pro-api-sdk)（Apache-2.0）。

- `build/`、`config/`、`iframe/`、`.sdk-manifest.json` 等构建设施来自官方，沿用 Apache-2.0，见 [LICENSE](./LICENSE)
- `src/` 与 `scripts/` 是本项目代码，以 MIT 提供（见仓库根 LICENSE）

## 更多

架构、协议与配对机制见仓库根的 [docs/design.md](../docs/design.md)。
