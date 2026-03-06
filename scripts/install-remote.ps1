# OpenClaw 中文版一键安装脚本 (Windows PowerShell)
# 自动检测 Node.js，从 GitHub Releases 下载最新 tgz 并全局安装
# 用法: iwr -useb https://raw.githubusercontent.com/josephxie1/openclaw-UI--Chinese/main/scripts/install-remote.ps1 | iex

$ErrorActionPreference = "Stop"
$REPO = "josephxie1/openclaw-UI--Chinese"
$NODE_MIN = 22

Write-Host ""
Write-Host "  OpenClaw  - Yi Jian An Zhuang" -ForegroundColor Cyan
Write-Host "  ================================" -ForegroundColor Cyan
Write-Host ""

# ── 检测 Node.js ──────────────────────────────
function Test-NodeVersion {
    try {
        $ver = (node --version 2>$null) -replace '^v','' -split '\.' | Select-Object -First 1
        return [int]$ver -ge $NODE_MIN
    } catch {
        return $false
    }
}

function Install-NodeJS {
    Write-Host "[!] Node.js $NODE_MIN+ Not found, installing..." -ForegroundColor Yellow
    Write-Host ""

    # 优先 winget
    if (Get-Command winget -ErrorAction SilentlyContinue) {
        Write-Host "[i] Using winget to install Node.js..." -ForegroundColor Cyan
        winget install OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
        # 刷新 PATH
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        return
    }

    # 其次 choco
    if (Get-Command choco -ErrorAction SilentlyContinue) {
        Write-Host "[i] Using Chocolatey to install Node.js..." -ForegroundColor Cyan
        choco install nodejs-lts -y
        $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
        return
    }

    # 手动下载安装
    Write-Host "[i] Downloading Node.js installer..." -ForegroundColor Cyan
    $nodeUrl = "https://nodejs.org/dist/latest-v${NODE_MIN}.x/"
    $page = Invoke-WebRequest -Uri $nodeUrl -UseBasicParsing
    $msi = ($page.Links | Where-Object { $_.href -match "x64\.msi$" } | Select-Object -First 1).href
    if (-not $msi) {
        Write-Host "[X] Cannot find Node.js installer, please install manually:" -ForegroundColor Red
        Write-Host "    https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    $msiUrl = "$nodeUrl$msi"
    $msiPath = Join-Path $env:TEMP $msi
    Write-Host "    Downloading $msi ..."
    Invoke-WebRequest -Uri $msiUrl -OutFile $msiPath -UseBasicParsing
    Write-Host "    Installing (may need admin)..."
    Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /qn" -Wait -Verb RunAs
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path", "User")
    Remove-Item $msiPath -ErrorAction SilentlyContinue
}

if (Test-NodeVersion) {
    $nodeVer = node --version
    Write-Host "[OK] Node.js $nodeVer ready" -ForegroundColor Green
} else {
    Install-NodeJS
    if (-not (Test-NodeVersion)) {
        Write-Host "[X] Node.js install failed, please install manually:" -ForegroundColor Red
        Write-Host "    https://nodejs.org/" -ForegroundColor Yellow
        exit 1
    }
    $nodeVer = node --version
    Write-Host "[OK] Node.js $nodeVer installed" -ForegroundColor Green
}
Write-Host ""

# ── 下载并安装 OpenClaw ───────────────────────
Write-Host "[i] Fetching latest release..." -ForegroundColor Cyan
$release = Invoke-RestMethod -Uri "https://api.github.com/repos/$REPO/releases/latest" -UseBasicParsing
$asset = $release.assets | Where-Object { $_.name -match '\.tgz$' } | Select-Object -First 1

if (-not $asset) {
    Write-Host "[X] No .tgz found in release, check https://github.com/$REPO/releases" -ForegroundColor Red
    exit 1
}

$filename = $asset.name
$downloadUrl = $asset.browser_download_url
$tgzPath = Join-Path $env:TEMP $filename

Write-Host "[i] Downloading $filename ..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $downloadUrl -OutFile $tgzPath -UseBasicParsing

Write-Host "[i] Installing..." -ForegroundColor Cyan
npm install -g $tgzPath

Remove-Item $tgzPath -ErrorAction SilentlyContinue

Write-Host ""
Write-Host "[OK] Installation complete!" -ForegroundColor Green
Write-Host ""
try {
    $ver = openclaw --version 2>$null
    Write-Host "    Version:  $ver"
} catch {
    Write-Host "    (please restart terminal to use openclaw)"
}
Write-Host ""
Write-Host "    Start gateway:  openclaw gateway" -ForegroundColor White
Write-Host "    Control panel:  http://127.0.0.1:18789" -ForegroundColor White
Write-Host ""
Write-Host "    Restore official: npm install -g openclaw" -ForegroundColor DarkGray
