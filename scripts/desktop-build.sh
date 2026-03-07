#!/bin/bash
# Build OpenClaw Desktop DMG
# Builds backend + frontend, copies into desktop/gateway, builds DMG
# Usage: ./scripts/desktop-build.sh
set -e

cd "$(dirname "$0")/.."
ROOT=$(pwd)

echo "==> 1/4 Building backend..."
pnpm build

echo "==> 2/4 Building frontend UI..."
pnpm ui:build

echo "==> 3/4 Syncing backend + UI into desktop/gateway..."
rsync -a --delete --exclude='control-ui' dist/ desktop/gateway/dist/
rm -rf desktop/gateway/dist/control-ui
cp -r dist/control-ui desktop/gateway/dist/control-ui
echo "    Backend + UI synced."

echo "==> 4/4 Building DMG..."
cd desktop
npm install
npm run build:mac

echo ""
echo "✅ DMG 构建完成！"
ls -lh release/*.dmg
