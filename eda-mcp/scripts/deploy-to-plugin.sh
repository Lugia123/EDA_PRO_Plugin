#!/usr/bin/env bash
# 把 bundle 后的 MCP 与构建好的扩展包放进 plugin/ 目录，供 Claude Code 安装。
#
#   npm run deploy      # = npm run build && bash scripts/deploy-to-plugin.sh
#
# 产物不入库（.gitignore 已忽略 dist/ 与 *.eext），每次发布前重新构建，
# 避免出现「源码改了但分发的 bundle 是旧的」这种状态错位。
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"   # eda-mcp/
ROOT="$(cd "$HERE/.." && pwd)"                             # 项目根
DEST="$ROOT/plugin/plugins/eda-pro/local-mcp/eda-mcp"
EXT_DEST="$ROOT/plugin/plugins/eda-pro/extension"

[[ -f "$HERE/dist/index.js" ]] || { echo "找不到 $HERE/dist/index.js —— 先跑 npm run build" >&2; exit 1; }

mkdir -p "$DEST" "$EXT_DEST"
cp "$HERE/dist/index.js" "$DEST/index.js"

cat > "$DEST/README.md" <<'EOF'
本目录的 index.js 是构建产物，**不要直接编辑**。

源码在仓库的 `eda-mcp/`，改完在那边跑 `npm run deploy` 会重新 bundle 并覆盖这里。
EOF

# 扩展包（.eext）：用户需要手动导入 EDA，放进 plugin 里方便找到
EEXT=$(ls -t "$ROOT/eext-eda-bridge/build/dist/"*.eext 2>/dev/null | head -1 || true)
if [[ -n "$EEXT" ]]; then
    cp "$EEXT" "$EXT_DEST/"
    echo "[deploy] 扩展包 $(basename "$EEXT") → plugin/plugins/eda-pro/extension/"
else
    echo "[deploy] 警告：没找到 .eext，跳过。先在 eext-eda-bridge/ 跑 npm run build" >&2
fi

cat > "$EXT_DEST/README.md" <<'EOF'
# eda-bridge 扩展

这个 `.eext` 需要**手动装进立创EDA专业版**（桌面客户端或网页版都可以）：

1. 高级 → 扩展管理器 → 已安装 → 导入 → 选择本目录下的 .eext
2. 在扩展管理器里勾选 **允许外部交互**（必须，否则扩展连不上）和 **显示在顶部菜单**
3. 刷新网页版页面 / 重启客户端
4. 回到 Claude Code，让它调 `eda_pair_start` 取配对码，在 EDA 的「EDA Bridge → 配对」里输入

源码在仓库的 `eext-eda-bridge/`。
EOF

echo "[deploy] MCP bundle → $DEST/index.js ($(du -h "$DEST/index.js" | cut -f1))"
echo "[deploy] 完成。可用 /plugin marketplace add $ROOT/plugin 安装"
