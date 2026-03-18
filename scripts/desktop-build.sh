#!/bin/bash
# Build OpenClaw Desktop
# Usage: ./scripts/desktop-build.sh
set -e

cd "$(dirname "$0")/.."
ROOT=$(pwd)

echo ""
echo "  OpenClaw Desktop 构建工具"
echo "  ─────────────────────────"
echo "  0) 直接启动 Desktop Dev（不构建）"
echo "  1) 构建最新 Desktop Dev（构建后端 + UI + 同步 + 启动 dev）"
echo "  2) 完整构建 DMG（构建后端 + UI + DMG 打包）"
echo ""
read -p "  请选择 [0/1/2]: " choice

# Función para elegir qué UI construir
choose_ui() {
  echo ""
  echo "  选择前端 UI:"
  echo "  a) Lit UI (ui/)   — 原版"
  echo "  b) React UI (ui-react/) — 新版"
  echo ""
  read -p "  请选择 [a/b]: " ui_choice
  case "$ui_choice" in
    b|B)
      UI_MODE="react"
      echo "  → 使用 React UI"
      ;;
    *)
      UI_MODE="lit"
      echo "  → 使用 Lit UI"
      ;;
  esac
}

# Construir la UI seleccionada
build_ui() {
  if [ "$UI_MODE" = "react" ]; then
    echo "==> 构建前端 UI (React)..."
    cd "$ROOT/ui-react"
    npm run build
    cd "$ROOT"
  else
    echo "==> 构建前端 UI (Lit)..."
    pnpm ui:build
  fi
}

# Sincronizar la UI construida al desktop/gateway
sync_ui() {
  if [ "$UI_MODE" = "react" ]; then
    echo "    同步 React UI → desktop/gateway/dist/control-ui"
    rm -rf desktop/gateway/dist/control-ui
    cp -r dist/control-ui-react desktop/gateway/dist/control-ui
  else
    echo "    同步 Lit UI → desktop/gateway/dist/control-ui"
    rm -rf desktop/gateway/dist/control-ui
    cp -r dist/control-ui desktop/gateway/dist/control-ui
  fi
}

case "$choice" in
  0)
    echo ""
    echo "==> 启动 Desktop Dev..."
    cd desktop
    OPENCLAW_DEV=1 npm start
    ;;
  1)
    choose_ui
    echo ""
    echo "==> 1/4 构建后端..."
    pnpm build

    echo "==> 2/4 构建前端..."
    build_ui

    echo "==> 3/4 同步到 desktop/gateway..."
    rsync -a --delete --exclude='control-ui' dist/ desktop/gateway/dist/
    sync_ui
    rsync -a --delete docs/ desktop/gateway/docs/
    rsync -a --delete skills/ desktop/gateway/skills/
    # Sync npm/npx into node-bin so skill installs work
    NODE_DIR=$(dirname "$(which node)")
    cp "$NODE_DIR/npm" desktop/node-bin/npm 2>/dev/null || true
    cp "$NODE_DIR/npx" desktop/node-bin/npx 2>/dev/null || true
    mkdir -p desktop/node-bin/lib/node_modules
    rsync -a "$NODE_DIR/../lib/node_modules/npm/" desktop/node-bin/lib/node_modules/npm/
    echo "    ✅ 后端 + UI + 文档 + Skills + npm 已同步"

    echo "==> 4/4 启动 Desktop Dev..."
    cd desktop
    OPENCLAW_DEV=1 npm start
    ;;
  2)
    choose_ui
    echo ""
    echo "==> 1/4 构建后端..."
    pnpm build

    echo "==> 2/4 构建前端..."
    build_ui

    echo "==> 3/4 同步到 desktop/gateway..."
    rsync -a --delete --exclude='control-ui' dist/ desktop/gateway/dist/
    sync_ui
    rsync -a --delete docs/ desktop/gateway/docs/
    rsync -a --delete skills/ desktop/gateway/skills/
    # Sync npm/npx into node-bin so skill installs work
    NODE_DIR=$(dirname "$(which node)")
    cp "$NODE_DIR/npm" desktop/node-bin/npm 2>/dev/null || true
    cp "$NODE_DIR/npx" desktop/node-bin/npx 2>/dev/null || true
    mkdir -p desktop/node-bin/lib/node_modules
    rsync -a "$NODE_DIR/../lib/node_modules/npm/" desktop/node-bin/lib/node_modules/npm/
    echo "    ✅ 后端 + UI + 文档 + Skills + npm 已同步"

    echo "==> 4/4 构建 DMG..."
    cd desktop
    npm install
    npm run build:mac

    echo ""
    echo "✅ DMG 构建完成！"
    ls -lh release/*.dmg
    ;;
  *)
    echo "❌ 无效选项，请输入 0、1 或 2"
    exit 1
    ;;
esac
