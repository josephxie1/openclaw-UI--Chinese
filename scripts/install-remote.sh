#!/usr/bin/env bash
# OpenClaw 中文版一键安装脚本 (macOS / Linux)
# 自动检测 Node.js，从 GitHub Releases 下载最新 tgz 并全局安装

set -euo pipefail

REPO="josephxie1/openclaw-UI--Chinese"
NODE_MIN=22
TMP_DIR=$(mktemp -d)

cleanup() { rm -rf "$TMP_DIR"; }
trap cleanup EXIT

echo "🦞 OpenClaw 中文版 — 一键安装"
echo "================================"
echo ""

# ── 检测 Node.js ──────────────────────────────
check_node() {
  if ! command -v node &>/dev/null; then
    return 1
  fi
  local ver
  ver=$(node --version 2>/dev/null | sed 's/^v//' | cut -d. -f1)
  [ "$ver" -ge "$NODE_MIN" ] 2>/dev/null
}

install_node() {
  echo "⚠️  未检测到 Node.js $NODE_MIN+ ，正在安装..."
  echo ""

  # 优先使用 nvm
  if command -v nvm &>/dev/null; then
    echo "📦 使用 nvm 安装 Node $NODE_MIN..."
    nvm install "$NODE_MIN"
    nvm use "$NODE_MIN"
    return
  fi

  # macOS: Homebrew
  if [[ "$(uname)" == "Darwin" ]] && command -v brew &>/dev/null; then
    echo "📦 使用 Homebrew 安装 Node $NODE_MIN..."
    brew install "node@$NODE_MIN"
    brew link --overwrite "node@$NODE_MIN"
    return
  fi

  # Linux: NodeSource 官方脚本
  if [[ "$(uname)" == "Linux" ]]; then
    echo "📦 使用 NodeSource 安装 Node $NODE_MIN..."
    curl -fsSL "https://deb.nodesource.com/setup_${NODE_MIN}.x" | sudo -E bash -
    sudo apt-get install -y nodejs
    return
  fi

  echo "❌ 无法自动安装 Node.js，请手动安装 Node $NODE_MIN+："
  echo "   https://nodejs.org/"
  exit 1
}

if check_node; then
  echo "✅ Node.js $(node --version) 已就绪"
else
  install_node
  if ! check_node; then
    echo "❌ Node.js 安装失败，请手动安装 Node $NODE_MIN+："
    echo "   https://nodejs.org/"
    exit 1
  fi
  echo "✅ Node.js $(node --version) 安装成功"
fi
echo ""

# ── 下载并安装 OpenClaw ───────────────────────
echo "📦 正在获取最新版本..."
ASSET_URL=$(curl -fsSL "https://api.github.com/repos/$REPO/releases/latest" \
  | grep -o '"browser_download_url":\s*"[^"]*\.tgz"' \
  | head -1 \
  | sed 's/"browser_download_url":\s*"//;s/"$//')

if [ -z "$ASSET_URL" ]; then
  echo "❌ 未找到 .tgz 发布包，请检查 https://github.com/$REPO/releases"
  exit 1
fi

FILENAME=$(basename "$ASSET_URL")
echo "📥 正在下载 $FILENAME ..."
curl -fSL -o "$TMP_DIR/$FILENAME" "$ASSET_URL"

echo "🔧 正在安装..."
npm install -g "$TMP_DIR/$FILENAME"

echo ""
echo "✅ 安装完成！"
echo ""
echo "   版本: $(openclaw --version 2>/dev/null || echo '(请重新打开终端)')"
echo ""
echo "   启动网关:  openclaw gateway"
echo "   控制面板:  http://127.0.0.1:18789"
echo ""
echo "   恢复官方版: npm install -g openclaw"
