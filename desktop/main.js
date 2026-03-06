/* eslint-disable */
// @ts-nocheck
const { app, BrowserWindow, Tray, Menu, shell, dialog } = require("electron");
const { fork, execFile } = require("child_process");
const path = require("path");
const http = require("http");
const fs = require("fs");

// ── Config ──────────────────────────────────────
const GATEWAY_PORT = 18789;
const GATEWAY_URL = `http://127.0.0.1:${GATEWAY_PORT}`;
const POLL_INTERVAL = 500;
const MAX_WAIT = 30000;

let mainWindow = null;
let tray = null;
let gatewayProcess = null;
let isQuitting = false;
let externalGateway = false;

// ── Resolve bundled gateway path ────────────────

function getGatewayPath() {
  // In packaged app: resources/gateway/
  // In dev: ./gateway/
  const candidates = [
    path.join(process.resourcesPath || "", "gateway"),
    path.join(__dirname, "gateway"),
  ];
  for (const dir of candidates) {
    const entry = path.join(dir, "openclaw.mjs");
    if (fs.existsSync(entry)) {
      return { dir, entry };
    }
  }
  return null;
}

// ── Check if gateway is already running ─────────

function isGatewayRunning() {
  return new Promise((resolve) => {
    const req = http.get(GATEWAY_URL, (res) => {
      res.resume();
      resolve(true);
    });
    req.on("error", () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

// ── Gateway lifecycle ───────────────────────────

function startGateway() {
  const bundled = getGatewayPath();

  if (bundled) {
    // ── Standalone mode: use Electron's Node to run bundled gateway ──
    console.log("[desktop] Starting bundled gateway from:", bundled.dir);

    // Use process.execPath (Electron binary, which includes Node.js)
    // with --require to ensure ESM compatibility
    gatewayProcess = execFile(process.execPath, ["--no-warnings", bundled.entry, "gateway"], {
      cwd: bundled.dir,
      env: Object.assign({}, process.env, {
        ELECTRON_RUN_AS_NODE: "1",
        NODE_PATH: path.join(bundled.dir, "node_modules"),
      }),
    });
  } else {
    // ── Fallback: use system openclaw command ──
    console.log("[desktop] No bundled gateway found, using system openclaw");
    const { spawn } = require("child_process");
    gatewayProcess = spawn("openclaw", ["gateway"], {
      stdio: ["ignore", "pipe", "pipe"],
      env: Object.assign({}, process.env),
      detached: false,
    });
  }

  if (gatewayProcess.stdout) {
    gatewayProcess.stdout.on("data", (data) => {
      process.stdout.write("[gateway] " + data);
    });
  }
  if (gatewayProcess.stderr) {
    gatewayProcess.stderr.on("data", (data) => {
      process.stderr.write("[gateway] " + data);
    });
  }

  gatewayProcess.on("error", (err) => {
    console.error("[desktop] Failed to start gateway:", err.message);
    dialog.showErrorBox(
      "OpenClaw 启动失败",
      "无法启动网关：" + err.message + "\n\n请检查应用是否完整。",
    );
  });

  gatewayProcess.on("exit", (code) => {
    console.log("[desktop] Gateway exited with code " + code);
    gatewayProcess = null;
    if (!isQuitting) {
      dialog.showErrorBox(
        "OpenClaw 网关已退出",
        "网关进程意外退出 (code: " + code + ")。\n应用将关闭。",
      );
      app.quit();
    }
  });
}

function stopGateway() {
  if (gatewayProcess) {
    console.log("[desktop] Stopping gateway...");
    gatewayProcess.kill("SIGTERM");
    gatewayProcess = null;
  }
}

// ── Wait for gateway to be ready ────────────────

function waitForGateway() {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    function poll() {
      const req = http.get(GATEWAY_URL, (res) => {
        res.resume();
        resolve();
      });
      req.on("error", () => {
        if (Date.now() - start > MAX_WAIT) {
          reject(new Error("Gateway did not start within 30s"));
        } else {
          setTimeout(poll, POLL_INTERVAL);
        }
      });
    }

    poll();
  });
}

// ── Window ──────────────────────────────────────

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 800,
    minHeight: 600,
    title: "OpenClaw",
    titleBarStyle: "hiddenInset",
    trafficLightPosition: { x: 16, y: 16 },
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    show: false,
    backgroundColor: "#0f1117",
  });

  mainWindow.loadURL(GATEWAY_URL);

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  mainWindow.on("close", (e) => {
    if (!isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

// ── Tray ────────────────────────────────────────

function createTray() {
  const iconPath = path.join(__dirname, "icon.png");
  try {
    tray = new Tray(iconPath);
  } catch (e) {
    return;
  }

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "显示 OpenClaw",
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          mainWindow.focus();
        }
      },
    },
    { type: "separator" },
    {
      label: "在浏览器中打开",
      click: () => shell.openExternal(GATEWAY_URL),
    },
    { type: "separator" },
    {
      label: "退出",
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip("OpenClaw 中文版");
  tray.setContextMenu(contextMenu);

  tray.on("click", () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });
}

// ── launchctl (macOS auto-start) ────────────────

function installLaunchAgent() {
  if (process.platform !== "darwin") return;

  const plistName = "com.openclaw.gateway";
  const plistDir = path.join(app.getPath("home"), "Library", "LaunchAgents");
  const plistPath = path.join(plistDir, plistName + ".plist");
  const appPath = app.getPath("exe");

  // Only install if not already present
  if (fs.existsSync(plistPath)) return;

  const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${plistName}</string>
    <key>ProgramArguments</key>
    <array>
        <string>${appPath}</string>
        <string>--hidden</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <dict>
        <key>SuccessfulExit</key>
        <false/>
    </dict>
    <key>StandardOutPath</key>
    <string>/tmp/openclaw-gateway.log</string>
    <key>StandardErrorPath</key>
    <string>/tmp/openclaw-gateway.err</string>
</dict>
</plist>`;

  try {
    if (!fs.existsSync(plistDir)) {
      fs.mkdirSync(plistDir, { recursive: true });
    }
    fs.writeFileSync(plistPath, plist);
    console.log("[desktop] Installed LaunchAgent:", plistPath);
  } catch (err) {
    console.error("[desktop] Failed to install LaunchAgent:", err.message);
  }
}

// ── App lifecycle ───────────────────────────────

const startHidden = process.argv.includes("--hidden");

app
  .whenReady()
  .then(async () => {
    // Check if gateway is already running
    const alreadyRunning = await isGatewayRunning();

    if (alreadyRunning) {
      console.log("[desktop] Gateway already running on port " + GATEWAY_PORT);
      externalGateway = true;
    } else {
      startGateway();
      try {
        await waitForGateway();
      } catch (err) {
        dialog.showErrorBox("OpenClaw 启动超时", "网关未能在 30 秒内启动。\n请检查应用是否完整。");
        app.quit();
        return;
      }
    }

    createWindow();
    createTray();
    installLaunchAgent();

    // If started with --hidden (e.g. from launchctl), don't show window
    if (startHidden && mainWindow) {
      mainWindow.hide();
    }

    app.on("activate", () => {
      if (mainWindow) {
        mainWindow.show();
      }
    });
  })
  .catch((err) => {
    console.error("[desktop] Fatal error:", err);
    app.quit();
  });

app.on("before-quit", () => {
  isQuitting = true;
  if (!externalGateway) {
    stopGateway();
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    isQuitting = true;
    if (!externalGateway) {
      stopGateway();
    }
    app.quit();
  }
});
