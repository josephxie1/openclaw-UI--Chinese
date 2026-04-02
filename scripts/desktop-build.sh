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

# Sincronizar extensiones al desktop/gateway
# Las extensiones resuelven sus dependencias desde el node_modules del gateway raíz,
# NO deben tener su propio node_modules (causa duplicados como matrix-js-sdk)
sync_extensions() {
  echo "    同步 extensions → desktop/gateway/extensions"
  rsync -a --delete \
    --exclude='node_modules' \
    extensions/ desktop/gateway/extensions/

  # Copiar plugins npm al directorio de extensiones (no symlink, para DMG)
  if [ -d "desktop/gateway/node_modules/@tencent-weixin/openclaw-weixin" ]; then
    rm -rf desktop/gateway/extensions/openclaw-weixin
    cp -rL "desktop/gateway/node_modules/@tencent-weixin/openclaw-weixin" \
      desktop/gateway/extensions/openclaw-weixin
    echo "    📦 拷贝 openclaw-weixin 插件"
  fi
}

# Sincronizar package.json (versión + exports) del root al desktop gateway
sync_package_json() {
  echo "    同步 package.json 版本和 exports"
  python3 -c "
import json

root = json.load(open('package.json'))
desk_path = 'desktop/gateway/package.json'
desk = json.load(open(desk_path))

# Sincronizar versión
desk['version'] = root['version']

# Sincronizar exports completos
desk['exports'] = root['exports']

with open(desk_path, 'w') as f:
    json.dump(desk, f, indent=2, ensure_ascii=False)
    f.write('\n')

print(f'    ✅ 版本: {root[\"version\"]}, exports: {len(root[\"exports\"])} 条')
"
}

# Sincronizar node_modules de dependencias clave al desktop gateway
sync_node_modules() {
  echo "    同步 node_modules 关键依赖"

  # Primero instalar dependencias base
  echo "    刷新 desktop/gateway node_modules..."
  (cd desktop/gateway && npm install --omit=dev 2>/dev/null) || true

  # Después sobrescribir paquetes que necesitan la versión del root
  # (por ejemplo @mariozechner/pi-ai necesita ./oauth que solo el root tiene)
  for pkg in "@mariozechner"; do
    if [ -d "node_modules/$pkg" ]; then
      rm -rf "desktop/gateway/node_modules/$pkg"
      cp -r "node_modules/$pkg" "desktop/gateway/node_modules/$pkg"
    fi
  done

  # Patch matrix-js-sdk singleton guard:
  # Desktop gateway sits inside the monorepo, so matrix-js-sdk gets loaded
  # via both ESM (gateway startup) and CJS (jiti plugin transpile) — two
  # separate module instances sharing globalThis. The guard throws on the
  # second load, crashing ALL plugins. Convert throw → warn for desktop.
  MATRIX_INDEX="node_modules/matrix-js-sdk/lib/index.js"
  if [ -f "$MATRIX_INDEX" ]; then
    if grep -q 'throw new Error("Multiple matrix-js-sdk entrypoints detected!")' "$MATRIX_INDEX"; then
      echo "    🔧 Patch matrix-js-sdk 双重加载 guard"
      sed -i '' 's/throw new Error("Multiple matrix-js-sdk entrypoints detected!")/console.warn("matrix-js-sdk: duplicate entrypoint (desktop dev, safe to ignore)")/' "$MATRIX_INDEX"
    fi
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
    echo "==> 1/5 构建后端..."
    pnpm build

    echo "==> 2/5 构建前端..."
    build_ui

    echo "==> 3/5 同步到 desktop/gateway..."
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

    echo "==> 4/5 同步 extensions + package.json + node_modules..."
    sync_extensions
    sync_package_json
    sync_node_modules
    echo "    ✅ 插件 + 依赖 已同步"

    echo "==> 5/5 启动 Desktop Dev..."
    cd desktop
    OPENCLAW_DEV=1 npm start
    ;;
  2)
    choose_ui
    echo ""
    echo "==> 1/5 构建后端..."
    pnpm build

    echo "==> 2/5 构建前端..."
    build_ui

    echo "==> 3/5 同步到 desktop/gateway..."
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

    echo "==> 4/5 同步 extensions + package.json + node_modules..."
    sync_extensions
    sync_package_json
    sync_node_modules
    echo "    ✅ 插件 + 依赖 已同步"

    echo "==> 5/5 构建 DMG..."
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
