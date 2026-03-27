<p align="center">
  <strong>🌐 Language / 语言</strong><br>
  <strong>中文</strong> | <a href="README_EN.md">English</a>
</p>

# OpenClaw 增强版 🚀

[OpenClaw](https://github.com/openclaw/openclaw) 增强版 — 跨平台桌面客户端 + 完整中文化 + React 前端重构 + 3D 牧场场景 + 30+ 项 UI/性能增强。开箱即用，无需命令行。

## ✨ 特性

### 🎮 React 前端重构 (v2026.3.15)

- **全新 React 前端** — 基于 React + Zustand + Framer Motion 重构整个 UI，组件化架构
- **18 个完整视图** — Overview、Chat、Agents、Channels、Config、Models、Sessions、Cron、Usage 等
- **响应式布局** — 手机 / 平板 / 桌面全设备自适应（clamp + 断点 + 弹性网格）
- **Apple 签名 + 公证** — DMG 通过 Apple Notarization，无 Gatekeeper 警告

### 🌾 3D 像素牧场场景 (v2026.3.15)

- **Three.js 3D 牧场** — Agent 以像素角色在 3D 等距草地上活动
- **2D 像素牧场** — 备选 Canvas 2D 渲染模式
- **动态工作区域** — Agent 根据状态在不同区域移动（处理中/等待中/空闲）
- **活动标签** — 实时显示 Agent 当前任务描述
- **Gacha 风格头像** — 3:4 竖版 Agent 肖像卡片

### 🧠 AI 聊天增强元素 (v2026.3.15)

- **🔍 搜索源引用** — 聊天中展示 Web 搜索来源（favicon + 可折叠链接列表）
- **📊 上下文用量指示** — 实时 token 消耗可视化
- **📝 内联引用标注** — 消息内嵌引用标签
- **⏳ 队列状态** — 消息排队进度可视化
- **📋 任务步骤面板** — 多步任务的分步展示与跟踪
- **🔗 思维链展示** — 可折叠的 AI 推理过程面板

### 📱 全面响应式适配 (v2026.3.15)

- 导航侧栏在平板端自动收起为水平条
- 聊天输入区在小屏自适应（去除固定 padding，按钮紧凑化）
- 内容区 max-width 自动居中
- 移动端 ≤400px 极致紧凑模式

### 🌐 全面中文化

- 控制面板完整中文界面（导航、配置、Agent、频道、定时任务等）
- Schema 配置项中文标签和帮助文本（700+ 条翻译）
- 搜索支持中文匹配

### 📊 实时 Agent 状态监控

- Overview 页面新增 Agent 活动状态卡片（卡片式网格布局）
- 实时显示会话处理状态（处理中 / 等待中 / 空闲）
- 处理中状态绿色脉冲动画，5 秒自动轮询刷新

### ⚡ 快速配置

- 快速添加模型提供商（预置 11 家：硅基流动 SiliconFlow、Kimi Code、Google Gemini、OpenAI GPT、Anthropic Claude、MiniMax、xAI Grok、OpenRouter、智谱 Coding Plan、方舟 Coding Plan、百炼 Coding Plan）
- 快速添加消息频道（Telegram / 飞书一键配置 + Agent 绑定）
- 视觉模型自动标识

### 🛠 UI 增强

- 独立「编辑 JSON」页面（主导航直达，按需加载 raw 配置文本）
- 自定义 Tooltip 组件（替代原生浏览器 title 提示）
- Usage 页面自动刷新
- Block Streaming 支持（飞书消息分段实时发送）

### 💬 聊天界面升级

- **Shiki 语法高亮** — 集成 Shiki 引擎（github-dark 主题），支持 40+ 编程语言自动识别，行号 + 复制按钮
- **块级 Markdown 缓存** — 流式输出性能大幅提升，仅重渲染最后一个块
- **🧠 思维推理面板** — 可折叠的 AI 思考过程面板，自动提取首行作为摘要标题
- **工具调用卡片** — 三态图标（加载动画 / ✅ 完成 / 🔴 错误），折叠式卡片
- **聊天布局优化** — 无边框气泡、发送者名称加粗、宽屏体验优化
- **悬停复制按钮** — 鼠标悬停消息时显示一键复制

### 🔗 渠道配对审批

- 节点/设备页面顶部新增**渠道配对请求**卡片
- 支持飞书、Telegram 等渠道用户的配对审批
- 一键批准，无需命令行操作

### 📊 令牌用量趋势图增强

- **Chart.js 图表** — 替代手绘 SVG，渐变填充折线图 + 格式化 tooltip
- **1d / 7d / ctx 三模式切换** — 今日按小时、近 7 天按日、上下文构成柱状图
- **上下文构成分析** — 水平柱状图展示 System / Tools / Skills / Files 的 token 占比
- **Agent 下拉筛选** — 多 Agent 场景下按 Agent 过滤数据

### 📂 侧边栏会话历史

- Chat 手风琴组下方显示**会话历史列表**
- 每个会话显示友好名称 + 相对时间（如 5m, 2h, 3d）
- 当前活跃会话左侧高亮标识，点击快速切换
- 新会话按钮创建独立 session

### 🛡 性能修复

- 修复大配置文件 `config.get` RangeError 崩溃问题
- Session 状态追踪独立于 diagnostics 开关，始终启用
- 修复聊天输入区在手机上高度过大、按钮错位
- 修复 tablet 视口下 `.chat-main` 缩为极窄宽度

## 📸 截图预览

### 🆕 v2026.3.15 新功能

#### 概览 + 2D 牧场场景
![概览牧场](assets/overview-ranch.png)

#### 聊天界面（思考过程 + 工具调用）
![聊天界面](assets/chat-tools.png)

#### 配置页面（全中文 Schema）
![配置页面](assets/config-schema.png)

#### Agent 设置 + 侧栏配置
![Agent设置](assets/agent-settings.png)

#### 频道管理 + 快速添加
![频道管理](assets/channel-quickadd.png)

#### 概览下半部分（图表 + Agent 卡片）
![Agent卡片](assets/overview-cards.png)

### 🚀 启动 & 配置引导

#### 启动画面
![启动画面](docs/01.png)

#### 欢迎向导
![欢迎向导](docs/02.png)

#### 选择模型提供商
![选择模型提供商](docs/03.png)

#### 配置 API Key
![配置 API Key](docs/04.png)

#### 添加消息渠道
![添加消息渠道](docs/05.png)

#### 配置完成
![配置完成](docs/06.png)

### 💬 聊天 & 主界面

#### 全量中文界面
![全量中文界面](docs/全量汉化.png)

#### 概览页面
![概览页面](docs/概览页面.png)

#### Markdown 代码高亮
![Markdown 代码高亮](docs/增加markdown代码显示.png)

#### 工具调用优化
![工具调用优化](docs/工具调用显示优化.png)

### ⚙️ 配置管理

#### 模型配置页面
![模型配置页面](docs/模型配置页面.png)

#### 频道快速配置
![频道快速配置](docs/频道快速配置.png)

#### 配置文件编辑
![配置文件编辑](docs/配置文件快速编辑.png)

#### 频道可视化审批
![频道可视化审批](docs/频道可视化审批.png)

### 🎨 更多特性

#### 暗色主题
![暗色主题](docs/暗色主题支持.png)

#### 任务栏支持
![任务栏支持](docs/任务栏支持.png)

## 🖥 Desktop 桌面版（推荐）

独立 Electron 桌面应用，内置完整 Gateway 后端，**无需安装 Node.js，开箱即用**。

### 下载安装

从 [Releases](https://github.com/josephxie1/openclaw-UI--Chinese/releases) 下载对应平台安装包：

| 平台 | 下载 | 说明 |
|------|------|------|
| **macOS Apple Silicon** | [OpenClaw-1.1.0-standalone-arm64.dmg](https://github.com/josephxie1/openclaw-UI--Chinese/releases/download/v2026.3.15-zh/OpenClaw-1.1.0-standalone-arm64.dmg) | M1/M2/M3/M4 |
| **Windows x64** | [OpenClaw-Setup-1.1.0-win-x64.exe](https://github.com/josephxie1/openclaw-UI--Chinese/releases/download/v2026.3.15-zh/OpenClaw-Setup-1.1.0-win-x64.exe) | 64 位 Windows |

#### macOS 首次运行

打开 DMG，将 OpenClaw 拖入 Applications。v2026.3.15 版本已签名并通过 Apple 公证，无需额外操作。

> 如遇 Gatekeeper 提示，运行 `xattr -cr /Applications/OpenClaw.app`。

### Desktop 版特性

- 🚀 **开箱即用** — 内置完整 Gateway 后端，无需安装 Node.js、无需命令行操作
- 🧙 **配置引导向导** — 首次启动自动弹出交互式引导，三步完成配置
- ⚡ **免去繁琐配置** — 无需手动编辑 `openclaw.json`，向导自动生成完整配置文件
- 📡 **快速添加模型** — 内置 11 家预置提供商
- 🔄 **Gateway 自动重启** — 后端崩溃自动恢复，无需手动干预
- 🎯 **原生系统集成** — macOS 托盘图标 / Windows 系统托盘
- 🛡 **Apple 公证** — 已通过 Apple Notarization，安装无警告

### 从源码构建 Desktop

```bash
# 交互式构建脚本（macOS）
./scripts/desktop-build.sh

# 0) 直接启动 Desktop Dev（不构建）
# 1) 构建最新 Desktop Dev（构建后端 + UI + 同步 + 启动 dev）
# 2) 完整构建 DMG（构建后端 + UI + DMG 打包）
```

---

## 📦 CLI 命令行安装

> 💡 **推荐使用上方桌面版**，以下 CLI 方式适合服务器部署或高级用户。

### 先决条件

- **Node.js 22** 或更新版本

```bash
node --version  # 应输出 v22.x.x 或更高
```

> 如未安装 Node.js，前往 [nodejs.org](https://nodejs.org/) 下载安装，或使用 `nvm install 22`。

---

### macOS / Linux

#### 方式一：一键脚本安装（自动检测并安装 Node.js）

```bash
curl -fsSL https://raw.githubusercontent.com/josephxie1/openclaw-UI--Chinese/main/scripts/install-remote.sh | bash
```

#### 方式二：从源码构建

```bash
git clone https://github.com/josephxie1/openclaw-UI--Chinese.git
cd openclaw-UI--Chinese
pnpm install
pnpm build
pnpm pack
npm install -g openclaw-*.tgz
```

---

### Windows

#### 方式一：一键脚本安装（自动检测并安装 Node.js）

以 **管理员身份** 打开 PowerShell，运行：

```powershell
iwr -useb https://raw.githubusercontent.com/josephxie1/openclaw-UI--Chinese/main/scripts/install-remote.ps1 | iex
```

#### 方式二：从源码构建

```powershell
git clone https://github.com/josephxie1/openclaw-UI--Chinese.git
cd openclaw-UI--Chinese
pnpm install
pnpm build
pnpm pack
npm install -g openclaw-2026.3.2.tgz
```

> **注意**：安装会替换已有的 `openclaw` 全局安装。如需恢复官方版，运行 `npm install -g openclaw`。

## ⚙️ 初始配置

安装后需要创建配置文件 `~/.openclaw/openclaw.json`：

```bash
openclaw config init
```

或手动创建最小配置：

```json
{
  "models": {
    "providers": {
      "my-provider": {
        "baseUrl": "https://api.example.com/v1",
        "apiKey": "your-api-key",
        "api": "openai-completions",
        "models": [
          {
            "id": "model-name",
            "name": "模型显示名称",
            "contextWindow": 128000,
            "maxTokens": 8192
          }
        ]
      }
    }
  },
  "agents": {
    "defaults": {
      "model": "my-provider/model-name"
    }
  },
  "gateway": {
    "mode": "local",
    "bind": "loopback"
  }
}
```

启动网关后访问 `http://127.0.0.1:18789` 进入控制面板。

## 🔄 更新

```bash
npm install -g openclaw-新版本.tgz
```

## 🔄 恢复官方版

```bash
npm install -g openclaw
```

## 📋 翻译覆盖

| 模块                         | 状态       |
| ---------------------------- | ---------- |
| 导航和标签栏                 | ✅         |
| 概览页（含 3D 牧场场景）     | ✅         |
| 聊天界面（含 AI 增强元素）   | ✅         |
| 配置表单（Schema 标签）      | ✅ 700+ 条 |
| 配置表单（Schema 帮助文本）  | ✅ 460+ 条 |
| Agent 管理                   | ✅         |
| 频道管理                     | ✅         |
| 会话管理                     | ✅         |
| 使用统计                     | ✅         |
| 定时任务                     | ✅         |
| 技能管理                     | ✅         |
| 节点管理                     | ✅         |
| 日志 / 调试                  | ✅         |

## 📄 许可证

- **原 OpenClaw 代码**：[MIT](LICENSE) — 基于 [OpenClaw](https://github.com/openclaw/openclaw)
- **React 前端 (`ui-react/`)、桌面端、文档截图**：[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/) — © 2026 Joseph Xie，禁止商用
