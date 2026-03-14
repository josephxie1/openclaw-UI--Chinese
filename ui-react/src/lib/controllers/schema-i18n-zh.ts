/**
 * Chinese (zh-CN) schema translation map.
 * Provides label overrides for all config schema fields.
 */
import type { SchemaTranslationMap } from "./schema-i18n.ts";

export const ZH_CN_MAP: SchemaTranslationMap = {
  // ── Meta ──
  meta: {
    label: "元数据",
    help: "由 OpenClaw 自动维护的元数据字段，记录配置文件的写入和版本历史。保持系统管理，避免手动编辑。",
  },
  "meta.lastTouchedVersion": { label: "配置最后修改版本", help: "写入配置时自动设置的版本号。" },
  "meta.lastTouchedAt": {
    label: "配置最后修改时间",
    help: "最后一次写入配置的 ISO 时间戳（自动设置）。",
  },

  // ── Environment ──
  env: { label: "环境", help: "环境导入和覆盖设置，用于向网关进程提供运行时变量。" },
  "env.shellEnv": {
    label: "Shell 环境导入",
    help: "Shell 环境导入控制，在启动时从登录 Shell 加载环境变量。",
  },
  "env.shellEnv.enabled": {
    label: "启用 Shell 环境导入",
    help: "启用后在启动初始化时从用户 Shell 配置加载环境变量。开发机建议启用，锁定的服务环境可禁用。",
  },
  "env.shellEnv.timeoutMs": {
    label: "Shell 环境导入超时（毫秒）",
    help: "Shell 环境解析的最大等待时间（毫秒）。缩短可加快启动，延长适合较重的 Shell 初始化。",
  },
  "env.vars": { label: "环境变量覆盖", help: "显式的键值环境变量覆盖，合并到运行时进程环境。" },

  // ── Wizard ──
  wizard: {
    label: "安装向导状态",
    help: "安装向导状态跟踪字段，记录最近一次引导式新手入门的运行详情。",
  },
  "wizard.lastRunAt": {
    label: "向导最后运行时间",
    help: "安装向导最近一次在此主机上完成的 ISO 时间戳。",
  },
  "wizard.lastRunVersion": {
    label: "向导最后运行版本",
    help: "最近一次向导运行时记录的 OpenClaw 版本号。",
  },
  "wizard.lastRunCommit": {
    label: "向导最后运行提交",
    help: "开发构建中最近一次向导运行记录的源码提交标识。",
  },
  "wizard.lastRunCommand": {
    label: "向导最后运行命令",
    help: "最新向导运行记录的命令调用，用于保留执行上下文。",
  },
  "wizard.lastRunMode": {
    label: "向导最后运行模式",
    help: '最近一次向导执行模式，记录为 "local" 或 "remote"。',
  },

  // ── Diagnostics ──
  diagnostics: {
    label: "诊断",
    help: "诊断控制，包括定向追踪、遥测导出和调试时的缓存检查。生产环境保持最小化，调查问题时再启用。",
  },
  "diagnostics.enabled": {
    label: "启用诊断",
    help: "诊断检测输出的主开关。正常观测保持启用，仅在严格受限环境中禁用。",
  },
  "diagnostics.flags": {
    label: "诊断标志",
    help: '按标志启用定向诊断日志（如 ["telegram.http"]），支持通配符如 "telegram.*" 或 "*"。',
  },
  "diagnostics.stuckSessionWarnMs": {
    label: "卡住会话警告阈值（毫秒）",
    help: "会话处于处理状态时触发卡住警告的时间阈值（毫秒）。",
  },
  "diagnostics.otel": {
    label: "OpenTelemetry",
    help: "OpenTelemetry 导出设置，用于网关组件发出的追踪、指标和日志。",
  },
  "diagnostics.otel.enabled": {
    label: "启用 OpenTelemetry",
    help: "启用 OpenTelemetry 导出管线。未完全配置收集器端点和认证时请保持禁用。",
  },
  "diagnostics.otel.endpoint": {
    label: "OpenTelemetry 端点",
    help: "遥测导出使用的收集器端点 URL，包括协议和端口。",
  },
  "diagnostics.otel.protocol": {
    label: "OpenTelemetry 协议",
    help: 'OTel 传输协议："http/protobuf" 或 "grpc"，取决于收集器支持。',
  },
  "diagnostics.otel.headers": {
    label: "OpenTelemetry 请求头",
    help: "随 OpenTelemetry 导出请求发送的额外 HTTP/gRPC 元数据头。",
  },
  "diagnostics.otel.serviceName": {
    label: "OpenTelemetry 服务名",
    help: "遥测资源属性中报告的服务名，用于在可观测性后端中标识此网关实例。",
  },
  "diagnostics.otel.traces": {
    label: "启用 OpenTelemetry 追踪",
    help: "启用追踪信号导出到配置的 OpenTelemetry 收集器端点。",
  },
  "diagnostics.otel.metrics": {
    label: "启用 OpenTelemetry 指标",
    help: "启用指标信号导出到配置的 OpenTelemetry 收集器端点。",
  },
  "diagnostics.otel.logs": {
    label: "启用 OpenTelemetry 日志",
    help: "通过 OpenTelemetry 启用日志信号导出，作为本地日志接收的补充。",
  },
  "diagnostics.otel.sampleRate": {
    label: "OpenTelemetry 采样率",
    help: "追踪采样率（0-1），控制导出到可观测性后端的追踪流量比例。",
  },
  "diagnostics.otel.flushIntervalMs": {
    label: "OpenTelemetry 刷新间隔（毫秒）",
    help: "从缓冲区到收集器的定期遥测刷新间隔（毫秒）。",
  },
  "diagnostics.cacheTrace": {
    label: "缓存追踪",
    help: "缓存追踪日志设置，用于观察嵌入式运行中的缓存决策和载荷上下文。",
  },
  "diagnostics.cacheTrace.enabled": {
    label: "启用缓存追踪",
    help: "记录嵌入式Agent运行的缓存追踪快照（默认：false）。",
  },
  "diagnostics.cacheTrace.filePath": {
    label: "缓存追踪文件路径",
    help: "缓存追踪日志的 JSONL 输出路径。",
  },
  "diagnostics.cacheTrace.includeMessages": {
    label: "缓存追踪包含消息",
    help: "在追踪输出中包含完整消息载荷（默认：true）。",
  },
  "diagnostics.cacheTrace.includePrompt": {
    label: "缓存追踪包含提示词",
    help: "在追踪输出中包含提示词文本（默认：true）。",
  },
  "diagnostics.cacheTrace.includeSystem": {
    label: "缓存追踪包含系统消息",
    help: "在追踪输出中包含系统提示词（默认：true）。",
  },

  // ── Logging ──
  logging: { label: "日志", help: "日志行为控制，包括严重级别、输出目标、格式化和敏感数据脱敏。" },
  "logging.level": {
    label: "日志级别",
    help: '主日志级别阈值："silent"、"fatal"、"error"、"warn"、"info"、"debug" 或 "trace"。生产环境建议 "info" 或 "warn"。',
  },
  "logging.file": {
    label: "日志文件路径",
    help: "持久化日志输出的可选文件路径，作为控制台日志的补充或替代。",
  },
  "logging.consoleLevel": {
    label: "控制台日志级别",
    help: "控制台特定的日志阈值，用于终端输出控制。可保持本地控制台安静并保留更丰富的文件日志。",
  },
  "logging.consoleStyle": {
    label: "控制台日志样式",
    help: '控制台输出格式："pretty"、"compact" 或 "json"。json 适合机器解析，pretty/compact 适合终端阅读。',
  },
  "logging.redactSensitive": {
    label: "敏感数据脱敏模式",
    help: '敏感脱敏模式："off" 禁用内置屏蔽，"tools" 脱敏敏感工具/配置载荷字段。',
  },
  "logging.redactPatterns": {
    label: "自定义脱敏规则",
    help: "在日志输出前应用的额外自定义脱敏正则表达式模式。",
  },

  // ── Updates ──
  update: { label: "更新", help: "更新通道和启动检查行为，用于保持 OpenClaw 运行时版本最新。" },
  "update.channel": {
    label: "更新通道",
    help: 'git + npm 安装的更新通道（"stable"、"beta" 或 "dev"）。',
  },
  "update.checkOnStart": {
    label: "启动时检查更新",
    help: "网关启动时检查 npm 更新（默认：true）。",
  },
  "update.auto.enabled": { label: "启用自动更新", help: "启用后台自动更新包安装（默认：false）。" },
  "update.auto.stableDelayHours": {
    label: "稳定版延迟时间（小时）",
    help: "稳定通道自动应用前的最小延迟（默认：6 小时）。",
  },
  "update.auto.stableJitterHours": {
    label: "稳定版抖动时间（小时）",
    help: "稳定通道额外的滚动发布分散窗口（默认：12 小时）。",
  },
  "update.auto.betaCheckIntervalHours": {
    label: "Beta 版检查间隔（小时）",
    help: "Beta 通道检查运行的频率（默认：1 小时）。",
  },

  // ── Models ──
  models: {
    label: "模型",
    help: "模型目录根节点，包含提供商定义、合并/替换行为和可选的 Bedrock 发现集成。",
  },
  "models.mode": {
    label: "模型目录模式",
    help: '控制提供商目录行为："merge" 保留内置提供商并叠加自定义提供商，"replace" 仅使用配置的提供商。',
  },
  "models.providers": {
    label: "模型提供商",
    help: "按提供商 ID 排列的提供商映射，包含连接/认证设置和具体模型定义。",
  },
  "models.providers.*.baseUrl": {
    label: "提供商 API 基础地址",
    help: "提供商端点的基础 URL，用于处理该提供商的模型请求。",
  },
  "models.providers.*.apiKey": {
    label: "提供商 API 密钥",
    help: "提供商 API 密钥认证凭据。请使用密钥/环境变量替换，避免在配置文件中存储真实密钥。",
  },
  "models.providers.*.auth": {
    label: "提供商认证模式",
    help: '提供商认证方式："api-key"、"token"、"oauth" 或 "aws-sdk"。',
  },
  "models.providers.*.api": {
    label: "提供商 API 适配器",
    help: "提供商 API 适配器选择，控制模型调用的请求/响应兼容性。",
  },
  "models.providers.*.injectNumCtxForOpenAICompat": {
    label: "注入 num_ctx（OpenAI 兼容模式）",
    help: "控制 OpenClaw 是否为使用 OpenAI 兼容适配器的 Ollama 提供商注入 options.num_ctx（默认：true）。",
  },
  "models.providers.*.headers": {
    label: "自定义请求头",
    help: "合并到提供商请求中的静态 HTTP 头，用于租户路由、代理认证等。",
  },
  "models.providers.*.authHeader": {
    label: "自定义认证标头",
    help: "启用后凭据通过 HTTP Authorization 头发送。仅在提供商明确要求时使用。",
  },
  "models.providers.*.models": {
    label: "模型列表",
    help: "提供商的声明模型列表，包含标识符、元数据和可选的兼容性/成本提示。",
  },
  "models.bedrockDiscovery": {
    label: "Bedrock 模型发现",
    help: "自动 AWS Bedrock 模型发现设置，从账户可见性合成提供商模型条目。",
  },
  "models.bedrockDiscovery.enabled": {
    label: "启用 Bedrock 发现",
    help: "启用定期 Bedrock 模型发现和目录刷新。未使用 Bedrock 或 IAM 权限未正确配置时保持禁用。",
  },
  "models.bedrockDiscovery.region": {
    label: "Bedrock 发现区域",
    help: "Bedrock 发现调用使用的 AWS 区域。使用已配置模型的区域。",
  },
  "models.bedrockDiscovery.providerFilter": {
    label: "Bedrock 发现提供商过滤",
    help: "Bedrock 发现的可选提供商允许列表过滤器。",
  },
  "models.bedrockDiscovery.refreshInterval": {
    label: "Bedrock 发现刷新间隔（秒）",
    help: "Bedrock 发现轮询的刷新间隔（秒），用于检测新可用模型。",
  },
  "models.bedrockDiscovery.defaultContextWindow": {
    label: "Bedrock 默认上下文窗口",
    help: "发现的模型缺少显式限制时应用的默认上下文窗口值。",
  },
  "models.bedrockDiscovery.defaultMaxTokens": {
    label: "Bedrock 默认最大 Token 数",
    help: "发现的模型无显式输出 Token 限制时的默认最大 Token 值。",
  },

  // ── Agents ──
  agents: {
    label: "Agent",
    help: "Agent运行时配置根节点，涵盖默认值和用于路由和执行上下文的显式Agent条目。",
  },
  "agents.defaults": {
    label: "Agent默认值",
    help: "除非在 agents.list 中逐个覆盖，否则由Agent继承的共享默认设置。",
  },
  "agents.list": {
    label: "Agent列表",
    help: "已配置Agent的显式列表，包含 ID 和可选的模型、工具、身份、工作区覆盖。",
  },
  "agents.defaults.workspace": {
    label: "工作区",
    help: "暴露给Agent运行时工具的默认工作区路径，用于文件系统上下文和仓库感知行为。",
  },
  "agents.defaults.repoRoot": {
    label: "仓库根目录",
    help: "系统提示运行时行中显示的可选仓库根路径（覆盖自动检测）。",
  },
  "agents.defaults.bootstrapMaxChars": {
    label: "引导最大字符数",
    help: "注入系统提示的每个工作区引导文件的最大字符数（默认：20000）。",
  },
  "agents.defaults.bootstrapTotalMaxChars": {
    label: "引导总最大字符数",
    help: "所有注入的工作区引导文件的最大总字符数（默认：150000）。",
  },
  "agents.defaults.envelopeTimezone": {
    label: "信封时区",
    help: '消息信封的时区："utc"、"local"、"user" 或 IANA 时区字符串。',
  },
  "agents.defaults.envelopeTimestamp": {
    label: "信封时间戳",
    help: '消息信封中包含绝对时间戳（"on" 或 "off"）。',
  },
  "agents.defaults.envelopeElapsed": {
    label: "信封耗时",
    help: '消息信封中包含已用时间（"on" 或 "off"）。',
  },
  "agents.defaults.model.primary": { label: "主模型", help: "主模型（provider/model 格式）。" },
  "agents.defaults.model.fallbacks": {
    label: "模型回退列表",
    help: "有序的回退模型列表。主模型失败时使用。",
  },
  "agents.defaults.imageModel.primary": {
    label: "图像模型",
    help: "主模型缺少图像输入时使用的可选图像模型。",
  },
  "agents.defaults.imageModel.fallbacks": {
    label: "图像模型回退",
    help: "有序的回退图像模型列表。",
  },
  "agents.defaults.pdfModel.primary": {
    label: "PDF 模型",
    help: "PDF 分析工具的可选 PDF 模型。默认使用图像模型，然后是会话模型。",
  },
  "agents.defaults.pdfModel.fallbacks": {
    label: "PDF 模型回退",
    help: "有序的回退 PDF 模型列表。",
  },
  "agents.defaults.pdfMaxBytesMb": {
    label: "PDF 最大大小（MB）",
    help: "PDF 工具的最大 PDF 文件大小（MB，默认：10）。",
  },
  "agents.defaults.pdfMaxPages": {
    label: "PDF 最大页数",
    help: "PDF 工具处理的最大页数（默认：20）。",
  },
  "agents.defaults.imageMaxDimensionPx": {
    label: "图像最大尺寸（像素）",
    help: "清理转录/工具结果图像载荷时的最大图像边长（像素，默认：1200）。",
  },
  "agents.defaults.humanDelay.mode": {
    label: "人类延迟模式",
    help: '分块回复的延迟风格："off"、"natural" 或 "custom"。',
  },
  "agents.defaults.humanDelay.minMs": {
    label: "人类延迟最小值（毫秒）",
    help: "自定义人类延迟的最小延迟（毫秒，默认：800）。",
  },
  "agents.defaults.humanDelay.maxMs": {
    label: "人类延迟最大值（毫秒）",
    help: "自定义人类延迟的最大延迟（毫秒，默认：2500）。",
  },
  "agents.defaults.cliBackends": {
    label: "CLI 后端",
    help: "可选的 CLI 后端，用于纯文本回退（如 claude-cli 等）。",
  },
  "agents.defaults.compaction": {
    label: "压缩",
    help: "上下文接近 Token 限制时的压缩调优，包括历史占比、保留余量和压缩前记忆刷新行为。",
  },
  "agents.defaults.compaction.mode": {
    label: "压缩模式",
    help: '压缩策略模式："default" 使用基线行为，"safeguard" 应用更严格的保护以保留近期上下文。',
  },
  "agents.defaults.compaction.reserveTokens": {
    label: "压缩保留 Token 数",
    help: "压缩运行后为回复生成和工具输出保留的 Token 余量。",
  },
  "agents.defaults.compaction.keepRecentTokens": {
    label: "压缩保留最近 Token 数",
    help: "压缩期间从最近对话窗口保留的最少 Token 预算。",
  },
  "agents.defaults.compaction.reserveTokensFloor": {
    label: "压缩保留 Token 下限",
    help: "Pi 压缩路径中 reserveTokens 强制执行的最低下限（0 禁用）。",
  },
  "agents.defaults.compaction.maxHistoryShare": {
    label: "压缩最大历史占比",
    help: "压缩后保留历史占总上下文预算的最大比例（范围 0.1-0.9）。",
  },
  "agents.defaults.compaction.identifierPolicy": {
    label: "压缩标识策略",
    help: '压缩摘要的标识符保留策略："strict"（默认）预置内置不透明标识符保留指导，"off" 禁用，"custom" 使用自定义指令。',
  },
  "agents.defaults.compaction.identifierInstructions": {
    label: "压缩标识指令",
    help: 'identifierPolicy="custom" 时使用的自定义标识符保留指令文本。',
  },
  "agents.defaults.compaction.memoryFlush": {
    label: "压缩记忆刷新",
    help: "压缩前记忆刷新设置，在重度压缩前运行一次Agent式记忆写入。",
  },
  "agents.defaults.compaction.memoryFlush.enabled": {
    label: "启用压缩记忆刷新",
    help: "在运行时接近 Token 限制执行更强的历史缩减之前启用压缩前记忆刷新。",
  },
  "agents.defaults.compaction.memoryFlush.softThresholdTokens": {
    label: "记忆刷新软阈值",
    help: "触发压缩前记忆刷新的距离压缩阈值（Token 数）。",
  },
  "agents.defaults.compaction.memoryFlush.forceFlushTranscriptBytes": {
    label: "记忆刷新转录大小阈值",
    help: '转录文件大小达到此阈值时强制执行压缩前记忆刷新（字节或如 "2mb" 的字符串）。',
  },
  "agents.defaults.compaction.memoryFlush.prompt": {
    label: "记忆刷新提示词",
    help: "生成记忆候选时用于压缩前记忆刷新轮次的用户提示模板。",
  },
  "agents.defaults.compaction.memoryFlush.systemPrompt": {
    label: "记忆刷新系统提示词",
    help: "压缩前记忆刷新轮次的系统提示覆盖，用于控制提取风格和安全约束。",
  },
  "agents.defaults.embeddedPi": {
    label: "嵌入式 Pi",
    help: "嵌入式 Pi 运行器加固控制，控制工作区本地 Pi 设置如何在 OpenClaw 会话中被信任和应用。",
  },
  "agents.defaults.embeddedPi.projectSettingsPolicy": {
    label: "嵌入式 Pi 项目设置策略",
    help: '嵌入式 Pi 处理工作区本地 .pi/config/settings.json 的方式："sanitize"（默认）剥离 shellPath/shellCommandPrefix，"ignore" 完全禁用，"trusted" 原样应用。',
  },
  "agents.defaults.heartbeat.directPolicy": {
    label: "心跳直接策略",
    help: '控制心跳投递是否可以针对私聊/DM："allow"（默认）允许，"block" 抑制。',
  },
  "agents.list.*.heartbeat.directPolicy": {
    label: "心跳直接策略",
    help: 'Agent级心跳私聊/DM 投递策略覆盖。使用 "block" 使Agent仅向非 DM 目标发送心跳警报。',
  },
  "agents.defaults.heartbeat.suppressToolErrorWarnings": {
    label: "心跳抑制工具错误警告",
    help: "在心跳运行期间抑制工具错误警告载荷。",
  },
  "agents.defaults.sandbox.browser.network": {
    label: "沙盒浏览器网络",
    help: "沙盒浏览器容器的 Docker 网络（默认：openclaw-sandbox-browser）。需更严格隔离时避免 bridge。",
  },
  "agents.defaults.sandbox.browser.cdpSourceRange": {
    label: "沙盒浏览器 CDP 源端口范围",
    help: "容器边缘 CDP 入站的可选 CIDR 允许列表（如 172.21.0.1/32）。",
  },
  "agents.defaults.sandbox.docker.dangerouslyAllowContainerNamespaceJoin": {
    label: "沙盒 Docker 允许容器命名空间连接",
    help: "危险：允许沙盒 Docker 网络模式 container:<id> 的破例覆盖，会削弱沙盒隔离。",
  },
  "agents.list.*.identity.avatar": {
    label: "身份头像",
    help: "Agent头像（工作区相对路径、http(s) URL 或 data URI）。",
  },
  "agents.list.*.skills": {
    label: "Agent技能过滤",
    help: "此Agent的可选技能允许列表（省略=所有技能；空=无技能）。",
  },
  "agents.defaults.memorySearch": {
    label: "记忆搜索",
    help: "对 MEMORY.md 和 memory/*.md 的向量搜索（支持Agent级覆盖）。",
  },
  "agents.defaults.memorySearch.enabled": {
    label: "启用记忆搜索",
    help: "记忆搜索索引和检索行为的主开关。启用用于语义回忆，禁用则完全无状态响应。",
  },
  "agents.defaults.memorySearch.sources": {
    label: "记忆搜索来源",
    help: '选择索引的来源："memory" 读取 MEMORY.md + 记忆文件，"sessions" 包含转录历史。',
  },
  "agents.defaults.memorySearch.extraPaths": {
    label: "额外记忆路径",
    help: "在默认记忆文件之外添加额外目录或 .md 文件到记忆索引。",
  },
  "agents.defaults.memorySearch.experimental.sessionMemory": {
    label: "记忆搜索会话索引（实验性）",
    help: "将会话转录索引到记忆搜索中以便响应可引用先前聊天轮次。",
  },
  "agents.defaults.memorySearch.provider": {
    label: "记忆搜索提供商",
    help: '选择用于构建/查询记忆向量的嵌入后端："openai"、"gemini"、"voyage"、"mistral" 或 "local"。',
  },
  "agents.defaults.memorySearch.model": {
    label: "记忆搜索模型",
    help: "选定记忆提供商使用的嵌入模型覆盖。仅在需要明确调优回忆质量/成本时设置。",
  },
  "agents.defaults.memorySearch.fallback": {
    label: "记忆搜索回退",
    help: '主嵌入失败时使用的备份提供商："openai"、"gemini"、"voyage"、"mistral"、"local" 或 "none"。',
  },
  "agents.defaults.memorySearch.remote.baseUrl": {
    label: "远程嵌入基础 URL",
    help: "覆盖嵌入 API 端点，如 OpenAI 兼容代理或自定义 Gemini 基础 URL。",
  },
  "agents.defaults.memorySearch.remote.apiKey": {
    label: "远程嵌入 API 密钥",
    help: "为记忆索引和查询时嵌入的远程嵌入调用提供专用 API 密钥。",
  },
  "agents.defaults.memorySearch.remote.headers": {
    label: "远程嵌入请求头",
    help: "为远程嵌入请求添加自定义 HTTP 头，与提供商默认值合并。",
  },
  "agents.defaults.memorySearch.remote.batch.enabled": {
    label: "启用远程批量嵌入",
    help: "启用提供商批量 API 进行嵌入作业（支持 OpenAI/Gemini），提升大规模索引运行的吞吐量。",
  },
  "agents.defaults.memorySearch.remote.batch.wait": {
    label: "远程批量等待完成",
    help: "等待批量嵌入作业完全完成后再结束索引操作。",
  },
  "agents.defaults.memorySearch.remote.batch.concurrency": {
    label: "远程批量并发数",
    help: "限制索引期间同时运行的嵌入批量作业数（默认：2）。",
  },
  "agents.defaults.memorySearch.remote.batch.pollIntervalMs": {
    label: "远程批量轮询间隔（毫秒）",
    help: "控制系统轮询提供商 API 检查批量作业状态的频率（毫秒，默认：2000）。",
  },
  "agents.defaults.memorySearch.remote.batch.timeoutMinutes": {
    label: "远程批量超时（分钟）",
    help: "完整嵌入批量操作的最大等待时间（分钟，默认：60）。",
  },
  "agents.defaults.memorySearch.local.modelPath": {
    label: "本地嵌入模型路径",
    help: "本地记忆搜索的本地嵌入模型源，如 GGUF 文件路径或 hf: URI。",
  },
  "agents.defaults.memorySearch.store.path": {
    label: "记忆搜索索引路径",
    help: "设置每个Agent的 SQLite 记忆索引存储位置。默认 ~/.openclaw/memory/{agentId}.sqlite。",
  },
  "agents.defaults.memorySearch.store.vector.enabled": {
    label: "记忆搜索向量索引",
    help: "启用 sqlite-vec 扩展用于记忆搜索中的向量相似度查询（默认：true）。",
  },
  "agents.defaults.memorySearch.store.vector.extensionPath": {
    label: "记忆搜索向量扩展路径",
    help: "覆盖自动发现的 sqlite-vec 扩展库路径（.dylib、.so 或 .dll）。",
  },
  "agents.defaults.memorySearch.chunking.tokens": {
    label: "记忆分块 Token 数",
    help: "将记忆源拆分为嵌入/索引之前的分块大小（Token 数）。",
  },
  "agents.defaults.memorySearch.chunking.overlap": {
    label: "记忆分块重叠 Token 数",
    help: "相邻记忆块之间的 Token 重叠，以保持分割边界的上下文连续性。",
  },
  "agents.defaults.memorySearch.sync.onSessionStart": {
    label: "会话开始时索引",
    help: "会话开始时触发记忆索引同步，使早期轮次看到最新记忆内容。",
  },
  "agents.defaults.memorySearch.sync.onSearch": {
    label: "搜索时索引（惰性）",
    help: "使用惰性同步，在检测到内容变化后搜索时调度重新索引。",
  },
  "agents.defaults.memorySearch.sync.watch": {
    label: "监视记忆文件",
    help: "监视记忆文件并从文件变化事件调度索引更新（chokidar）。",
  },
  "agents.defaults.memorySearch.sync.watchDebounceMs": {
    label: "记忆监视防抖（毫秒）",
    help: "合并快速文件监视事件的防抖窗口（毫秒），在重新索引前等待。",
  },
  "agents.defaults.memorySearch.sync.sessions.deltaBytes": {
    label: "会话增量字节数",
    help: "触发重新索引前需要至少新增的会话转录字节数（默认：100000）。",
  },
  "agents.defaults.memorySearch.sync.sessions.deltaMessages": {
    label: "会话增量消息数",
    help: "触发重新索引前需要至少新增的转录消息数（默认：50）。",
  },
  "agents.defaults.memorySearch.query.maxResults": {
    label: "记忆搜索最大结果数",
    help: "搜索后下游重排序和提示注入之前返回的最大记忆命中数。",
  },
  "agents.defaults.memorySearch.query.minScore": {
    label: "记忆搜索最小分数",
    help: "将记忆结果纳入最终回忆输出的最小相关性分数阈值。",
  },
  "agents.defaults.memorySearch.query.hybrid.enabled": {
    label: "记忆搜索混合模式",
    help: "结合 BM25 关键词匹配和向量相似度，在混合精确+语义查询上获得更好的召回。",
  },
  "agents.defaults.memorySearch.query.hybrid.vectorWeight": {
    label: "记忆搜索向量权重",
    help: "控制语义相似度在混合排名中的权重（0-1）。",
  },
  "agents.defaults.memorySearch.query.hybrid.textWeight": {
    label: "记忆搜索文本权重",
    help: "控制 BM25 关键词相关性在混合排名中的权重（0-1）。",
  },
  "agents.defaults.memorySearch.query.hybrid.candidateMultiplier": {
    label: "记忆搜索候选倍数",
    help: "重排序前扩展候选池（默认：4）。提高可改善嘈杂语料上的召回。",
  },
  "agents.defaults.memorySearch.query.hybrid.mmr.enabled": {
    label: "记忆搜索 MMR 重排序",
    help: "添加 MMR 重排序以多样化结果并减少单个回答窗口中的近似重复片段。",
  },
  "agents.defaults.memorySearch.query.hybrid.mmr.lambda": {
    label: "记忆搜索 MMR Lambda",
    help: "设置 MMR 相关性与多样性的平衡（0=最多样，1=最相关，默认：0.7）。",
  },
  "agents.defaults.memorySearch.query.hybrid.temporalDecay.enabled": {
    label: "记忆搜索时间衰减",
    help: "应用近期衰减，使较新的记忆在分数接近时可超过较旧记忆。",
  },
  "agents.defaults.memorySearch.query.hybrid.temporalDecay.halfLifeDays": {
    label: "记忆搜索时间衰减半衰期（天）",
    help: "启用时间衰减时控制旧记忆失去排名速度的半衰期（天，默认：30）。",
  },
  "agents.defaults.memorySearch.cache.enabled": {
    label: "记忆搜索嵌入缓存",
    help: "在 SQLite 中缓存计算的块嵌入，使重新索引和增量更新更快（默认：true）。",
  },
  "agents.defaults.memorySearch.cache.maxEntries": {
    label: "记忆搜索缓存最大条目数",
    help: "设置 SQLite 中缓存嵌入的最大上限。在控制磁盘增长比峰值重索引速度更重要时使用。",
  },
  "agents.defaults.models": {
    label: "模型",
    help: "已配置的模型目录（键为完整 provider/model ID）。",
  },

  // ── Block Streaming ──
  "agents.defaults.blockStreamingDefault": {
    label: "块流式默认",
    help: '块流式传输的默认开关（"on" 或 "off"）。',
  },
  "agents.defaults.blockStreamingBreak": {
    label: "块流式分割触发",
    help: '块流式传输的分割触发时机（"text_end" 或 "message_end"）。',
  },
  "agents.defaults.blockStreamingChunk": {
    label: "块流式分块",
    help: "块流式分块参数，控制分块大小和分割偏好。",
  },
  "agents.defaults.blockStreamingChunk.breakPreference": {
    label: "分割偏好",
    help: '块流式分块的换行偏好（"paragraph"、"newline" 或 "sentence"）。',
  },
  "agents.defaults.blockStreamingChunk.maxChars": {
    label: "分块最大字符数",
    help: "块流式单个分块的最大字符数。",
  },
  "agents.defaults.blockStreamingChunk.minChars": {
    label: "分块最小字符数",
    help: "块流式单个分块的最小字符数。",
  },
  "agents.defaults.blockStreamingCoalesce": {
    label: "块流式合并",
    help: "块流式合并参数，控制多个小块的合并行为。",
  },
  "agents.defaults.blockStreamingCoalesce.idleMs": {
    label: "空闲合并时间（毫秒）",
    help: "块流式合并的空闲等待时间（毫秒）。",
  },
  "agents.defaults.blockStreamingCoalesce.maxChars": {
    label: "合并最大字符数",
    help: "块流式合并的最大字符数。",
  },
  "agents.defaults.blockStreamingCoalesce.minChars": {
    label: "合并最小字符数",
    help: "块流式合并的最小字符数。",
  },

  // ── Context Pruning ──
  "agents.defaults.contextPruning": {
    label: "上下文修剪",
    help: "上下文窗口修剪策略，用于在工具输出膨胀时自动缩减历史记录。",
  },
  "agents.defaults.contextPruning.mode": {
    label: "修剪模式",
    help: '上下文修剪策略模式（"off" 或 "cache-ttl"）。',
  },
  "agents.defaults.contextPruning.hardClear": {
    label: "硬清除",
    help: "硬清除设置，达到阈值时完全丢弃较早的上下文。",
  },
  "agents.defaults.contextPruning.hardClear.enabled": {
    label: "启用硬清除",
    help: "启用上下文硬清除。",
  },
  "agents.defaults.contextPruning.hardClear.placeholder": {
    label: "硬清除占位符",
    help: "替换被清除上下文的占位符文本。",
  },
  "agents.defaults.contextPruning.hardClearRatio": {
    label: "硬清除比例",
    help: "触发硬清除的上下文占比阈值。",
  },
  "agents.defaults.contextPruning.keepLastAssistants": {
    label: "保留最近助手消息数",
    help: "修剪时始终保留的最近助手消息数。",
  },
  "agents.defaults.contextPruning.minPrunableToolChars": {
    label: "最小可修剪工具字符数",
    help: "工具输出达到此字符数时才会被修剪。",
  },
  "agents.defaults.contextPruning.softTrim": {
    label: "软修剪",
    help: "软修剪设置，保留头尾并截断中间部分。",
  },
  "agents.defaults.contextPruning.softTrim.headChars": {
    label: "软修剪头部字符数",
    help: "软修剪时保留的头部字符数。",
  },
  "agents.defaults.contextPruning.softTrim.maxChars": {
    label: "软修剪最大字符数",
    help: "触发软修剪的最大字符数。",
  },
  "agents.defaults.contextPruning.softTrim.tailChars": {
    label: "软修剪尾部字符数",
    help: "软修剪时保留的尾部字符数。",
  },
  "agents.defaults.contextPruning.softTrimRatio": {
    label: "软修剪比例",
    help: "触发软修剪的上下文占比阈值。",
  },
  "agents.defaults.contextPruning.tools": {
    label: "工具修剪策略",
    help: "按工具名称控制修剪的允许/拒绝列表。",
  },
  "agents.defaults.contextPruning.tools.allow": {
    label: "允许修剪的工具",
    help: "允许修剪输出的工具列表。",
  },
  "agents.defaults.contextPruning.tools.deny": {
    label: "禁止修剪的工具",
    help: "禁止修剪输出的工具列表。",
  },
  "agents.defaults.contextPruning.ttl": { label: "修剪 TTL", help: "上下文条目的存活时间。" },
  "agents.defaults.contextTokens": {
    label: "上下文 Token 数",
    help: "覆盖模型默认上下文窗口大小的 Token 数。",
  },

  // ── Elevated / Thinking / Typing / Verbose ──
  "agents.defaults.elevatedDefault": {
    label: "默认提权策略",
    help: 'Agent默认的工具提权访问策略（"off"、"on"、"ask" 或 "full"）。',
  },
  "agents.defaults.thinkingDefault": {
    label: "默认思维模式",
    help: "Agent默认的推理思维深度级别。",
  },
  "agents.defaults.timeFormat": {
    label: "时间格式",
    help: '时间显示格式（"auto"、"12" 或 "24"）。',
  },
  "agents.defaults.timeoutSeconds": {
    label: "超时时间（秒）",
    help: "Agent请求的超时时间（秒）。",
  },
  "agents.defaults.typingMode": {
    label: "打字指示模式",
    help: '频道中打字指示的显示模式（"never"、"instant"、"thinking" 或 "message"）。',
  },
  "agents.defaults.typingIntervalSeconds": {
    label: "打字指示间隔（秒）",
    help: "打字指示的发送间隔（秒）。",
  },
  "agents.defaults.userTimezone": { label: "用户时区", help: "用户的默认时区设置。" },
  "agents.defaults.verboseDefault": {
    label: "默认详细模式",
    help: 'Agent默认的详细输出模式（"off"、"on" 或 "full"）。',
  },
  "agents.defaults.skipBootstrap": { label: "跳过引导", help: "跳过工作区引导文件的注入。" },
  "agents.defaults.maxConcurrent": { label: "最大并发数", help: "Agent的最大并发请求数。" },
  "agents.defaults.mediaMaxMb": {
    label: "媒体最大大小（MB）",
    help: "Agent处理的最大媒体文件大小（MB）。",
  },

  // ── Heartbeat (nested fields) ──
  "agents.defaults.heartbeat": { label: "心跳", help: "定时心跳设置，Agent自动发送周期性消息。" },
  "agents.defaults.heartbeat.accountId": { label: "心跳账号 ID", help: "心跳投递使用的账号 ID。" },
  "agents.defaults.heartbeat.ackMaxChars": {
    label: "心跳确认最大字符数",
    help: "心跳确认响应的最大字符数。",
  },
  "agents.defaults.heartbeat.activeHours": {
    label: "心跳活跃时段",
    help: "心跳仅在此时段内触发。",
  },
  "agents.defaults.heartbeat.activeHours.start": {
    label: "活跃时段开始",
    help: "心跳活跃时段的开始时间（HH:MM 格式）。",
  },
  "agents.defaults.heartbeat.activeHours.end": {
    label: "活跃时段结束",
    help: "心跳活跃时段的结束时间（HH:MM 格式）。",
  },
  "agents.defaults.heartbeat.activeHours.timezone": {
    label: "活跃时段时区",
    help: "心跳活跃时段的时区。",
  },
  "agents.defaults.heartbeat.every": {
    label: "心跳间隔",
    help: '心跳触发的间隔时间（如 "1h"、"30m"）。',
  },
  "agents.defaults.heartbeat.includeReasoning": {
    label: "包含推理过程",
    help: "心跳响应中包含模型推理过程。",
  },
  "agents.defaults.heartbeat.lightContext": {
    label: "轻量上下文",
    help: "心跳运行时使用轻量上下文。",
  },
  "agents.defaults.heartbeat.model": {
    label: "心跳模型",
    help: "心跳运行时使用的模型（provider/model 格式）。",
  },
  "agents.defaults.heartbeat.prompt": { label: "心跳提示词", help: "心跳运行时的用户提示词模板。" },
  "agents.defaults.heartbeat.session": { label: "心跳会话", help: "心跳关联的会话 ID。" },
  "agents.defaults.heartbeat.target": {
    label: "心跳投递目标",
    help: '投递目标（"last"、"none" 或频道 ID）。已知频道: telegram, whatsapp, discord, irc, googlechat, slack, signal, imessage。',
  },
  "agents.defaults.heartbeat.to": { label: "心跳接收方", help: "心跳消息的接收方标识。" },

  // ── Sandbox > Browser ──
  "agents.defaults.sandbox": {
    label: "沙盒",
    help: "Agent沙盒环境设置，包括浏览器和 Docker 容器配置。",
  },
  "agents.defaults.sandbox.browser": { label: "沙盒浏览器", help: "沙盒浏览器容器配置。" },
  "agents.defaults.sandbox.browser.enabled": {
    label: "启用沙盒浏览器",
    help: "启用沙盒浏览器容器。",
  },
  "agents.defaults.sandbox.browser.allowHostControl": {
    label: "允许宿主控制",
    help: "允许沙盒浏览器控制宿主机。",
  },
  "agents.defaults.sandbox.browser.autoStart": {
    label: "自动启动",
    help: "会话开始时自动启动沙盒浏览器。",
  },
  "agents.defaults.sandbox.browser.autoStartTimeoutMs": {
    label: "自动启动超时（毫秒）",
    help: "沙盒浏览器自动启动的超时时间（毫秒）。",
  },
  "agents.defaults.sandbox.browser.binds": {
    label: "浏览器挂载",
    help: "沙盒浏览器的额外卷挂载。",
  },
  "agents.defaults.sandbox.browser.cdpPort": {
    label: "CDP 端口",
    help: "Chrome DevTools Protocol 调试端口。",
  },
  "agents.defaults.sandbox.browser.containerPrefix": {
    label: "浏览器容器前缀",
    help: "沙盒浏览器容器名称前缀。",
  },
  "agents.defaults.sandbox.browser.enableNoVnc": {
    label: "启用 NoVNC",
    help: "启用 NoVNC 网页远程桌面。",
  },
  "agents.defaults.sandbox.browser.headless": {
    label: "无头模式",
    help: "以无头模式运行沙盒浏览器。",
  },
  "agents.defaults.sandbox.browser.image": {
    label: "浏览器镜像",
    help: "沙盒浏览器的 Docker 镜像。",
  },
  "agents.defaults.sandbox.browser.noVncPort": {
    label: "NoVNC 端口",
    help: "NoVNC 网页远程桌面端口。",
  },
  "agents.defaults.sandbox.browser.vncPort": { label: "VNC 端口", help: "VNC 远程桌面端口。" },

  // ── Sandbox > Docker ──
  "agents.defaults.sandbox.docker": { label: "沙盒 Docker", help: "Agent沙盒 Docker 容器配置。" },
  "agents.defaults.sandbox.docker.apparmorProfile": {
    label: "AppArmor 配置",
    help: "Docker 容器的 AppArmor 安全配置名称。",
  },
  "agents.defaults.sandbox.docker.binds": {
    label: "Docker 挂载",
    help: "Docker 容器的卷挂载列表。",
  },
  "agents.defaults.sandbox.docker.capDrop": {
    label: "丢弃权能",
    help: "从容器中移除的 Linux 权能列表。",
  },
  "agents.defaults.sandbox.docker.containerPrefix": {
    label: "Docker 容器前缀",
    help: "Docker 沙盒容器名称前缀。",
  },
  "agents.defaults.sandbox.docker.cpus": { label: "CPU 限制", help: "容器可使用的 CPU 核数。" },
  "agents.defaults.sandbox.docker.dangerouslyAllowExternalBindSources": {
    label: "危险：允许外部挂载源",
    help: "允许 Docker 容器挂载工作区外部路径。",
  },
  "agents.defaults.sandbox.docker.dangerouslyAllowReservedContainerTargets": {
    label: "危险：允许保留容器目标",
    help: "允许使用保留的容器目标路径。",
  },
  "agents.defaults.sandbox.docker.dns": {
    label: "DNS 服务器",
    help: "Docker 容器的自定义 DNS 服务器列表。",
  },
  "agents.defaults.sandbox.docker.env": {
    label: "Docker 环境变量",
    help: "传递给 Docker 容器的环境变量。",
  },
  "agents.defaults.sandbox.docker.extraHosts": {
    label: "额外主机",
    help: "添加到容器 /etc/hosts 的额外主机映射。",
  },
  "agents.defaults.sandbox.docker.image": {
    label: "Docker 镜像",
    help: "沙盒 Docker 容器使用的镜像。",
  },
  "agents.defaults.sandbox.docker.memory": {
    label: "内存限制",
    help: '容器的内存限制（如 "512m"、"1g"）。',
  },
  "agents.defaults.sandbox.docker.memorySwap": {
    label: "交换内存限制",
    help: "容器的交换内存限制。",
  },
  "agents.defaults.sandbox.docker.network": {
    label: "Docker 网络",
    help: "容器使用的 Docker 网络。",
  },
  "agents.defaults.sandbox.docker.pidsLimit": { label: "进程数限制", help: "容器的最大进程数。" },
  "agents.defaults.sandbox.docker.readOnlyRoot": {
    label: "只读根文件系统",
    help: "以只读方式挂载容器根文件系统。",
  },
  "agents.defaults.sandbox.docker.seccompProfile": {
    label: "Seccomp 配置",
    help: "Docker 容器的 seccomp 安全配置路径。",
  },
  "agents.defaults.sandbox.docker.setupCommand": {
    label: "初始化命令",
    help: "容器启动后执行的初始化命令。",
  },
  "agents.defaults.sandbox.docker.tmpfs": {
    label: "临时文件系统",
    help: "容器中挂载的 tmpfs 路径列表。",
  },
  "agents.defaults.sandbox.docker.user": { label: "容器用户", help: "容器内运行的用户身份。" },
  "agents.defaults.sandbox.docker.workdir": {
    label: "容器工作目录",
    help: "容器内的默认工作目录。",
  },
  "agents.defaults.sandbox.mode": {
    label: "沙盒模式",
    help: '沙盒运行模式（"off"、"non-main" 或 "all"）。',
  },
  "agents.defaults.sandbox.perSession": {
    label: "每会话沙盒",
    help: "为每个会话创建独立的沙盒容器。",
  },
  "agents.defaults.sandbox.prune": { label: "沙盒清理", help: "沙盒容器的自动清理设置。" },
  "agents.defaults.sandbox.prune.idleHours": {
    label: "空闲清理时间（小时）",
    help: "容器空闲此时间后自动清理（小时）。",
  },
  "agents.defaults.sandbox.prune.maxAgeDays": {
    label: "最大存活天数",
    help: "容器的最大存活天数。",
  },
  "agents.defaults.sandbox.scope": {
    label: "沙盒范围",
    help: '沙盒的共享范围（"session"、"agent" 或 "shared"）。',
  },
  "agents.defaults.sandbox.sessionToolsVisibility": {
    label: "会话工具可见性",
    help: '沙盒中会话工具的可见性（"spawned" 或 "all"）。',
  },
  "agents.defaults.sandbox.workspaceAccess": {
    label: "工作区访问",
    help: '沙盒对工作区的访问权限（"none"、"ro" 或 "rw"）。',
  },
  "agents.defaults.sandbox.workspaceRoot": {
    label: "工作区根路径",
    help: "沙盒内工作区的挂载根路径。",
  },

  // ── Subagents ──
  "agents.defaults.subagents": { label: "子Agent", help: "子Agent派生和管理设置。" },
  "agents.defaults.subagents.announceTimeoutMs": {
    label: "子Agent通知超时（毫秒）",
    help: "子Agent通知的超时时间（毫秒）。",
  },
  "agents.defaults.subagents.archiveAfterMinutes": {
    label: "子Agent归档时间（分钟）",
    help: "子Agent完成后的归档等待时间（分钟）。",
  },
  "agents.defaults.subagents.maxChildrenPerAgent": {
    label: "每Agent最大子Agent数",
    help: "单个Agent会话可以派生的最大活跃子Agent数（默认：5）。",
  },
  "agents.defaults.subagents.maxConcurrent": {
    label: "子Agent最大并发数",
    help: "同时运行的最大子Agent数。",
  },
  "agents.defaults.subagents.maxSpawnDepth": {
    label: "最大派生深度",
    help: "子Agent派生的最大嵌套深度。1=不嵌套（默认），2=子Agent可以再派生子Agent。",
  },
  "agents.defaults.subagents.model": { label: "子Agent模型", help: "子Agent使用的模型覆盖。" },
  "agents.defaults.subagents.runTimeoutSeconds": {
    label: "子Agent运行超时（秒）",
    help: "子Agent运行的超时时间（秒）。",
  },
  "agents.defaults.subagents.thinking": {
    label: "子Agent思维模式",
    help: "子Agent的推理思维深度级别覆盖。",
  },

  // ── Gateway ──
  gateway: {
    label: "网关",
    help: "网关运行时界面，包括绑定模式、认证、控制 UI、远程传输和操作安全控制。除非有意将网关暴露到可信本地接口之外，否则保持保守默认值。",
  },
  "gateway.port": {
    label: "网关端口",
    help: "网关监听器使用的 TCP 端口，用于 API、控制 UI 和渠道入站路径。",
  },
  "gateway.mode": {
    label: "网关模式",
    help: '网关操作模式："local" 在此主机运行渠道和Agent运行时，"remote" 通过远程传输连接。',
  },
  "gateway.bind": {
    label: "网关绑定模式",
    help: '网络绑定配置："auto"、"lan"、"loopback"、"custom" 或 "tailnet"，控制接口暴露。',
  },
  "gateway.customBindHost": {
    label: "网关自定义绑定主机",
    help: "gateway.bind 设为 custom 时的自定义绑定主机/IP。",
  },
  "gateway.controlUi": {
    label: "控制面板 UI",
    help: "控制面板 UI 托管设置，包括启用、路径和浏览器源/认证加固行为。",
  },
  "gateway.controlUi.enabled": {
    label: "启用控制面板 UI",
    help: "启用后从网关 HTTP 进程提供控制面板 UI。本地管理保持启用，外部控制面替代时禁用。",
  },
  "gateway.controlUi.basePath": {
    label: "控制面板基础路径",
    help: "控制面板 UI 服务的可选 URL 前缀（如 /openclaw）。",
  },
  "gateway.controlUi.root": {
    label: "控制面板资源根目录",
    help: "控制面板 UI 资源的可选文件系统根目录（默认 dist/control-ui）。",
  },
  "gateway.controlUi.allowedOrigins": {
    label: "控制面板允许的来源",
    help: "控制面板/WebChat WebSocket 连接允许的浏览器源（仅完整源，如 https://control.example.com）。",
  },
  "gateway.controlUi.dangerouslyAllowHostHeaderOriginFallback": {
    label: "危险：允许 Host 头回退",
    help: "危险：启用基于 Host 头的源回退。仅在部署有意依赖 Host 头源策略时使用。",
  },
  "gateway.controlUi.allowInsecureAuth": {
    label: "不安全的控制面板认证",
    help: "放宽控制面板 UI 的严格浏览器认证检查。仅在信任网络和代理路径时使用。",
  },
  "gateway.controlUi.dangerouslyDisableDeviceAuth": {
    label: "危险：禁用设备认证",
    help: "禁用控制面板 UI 设备身份检查，仅依赖令牌/密码。仅用于受信网络上的短期调试。",
  },
  "gateway.auth": {
    label: "网关认证",
    help: "网关 HTTP/WebSocket 访问的认证策略，包括模式、凭据、可信代理行为和速率限制。",
  },
  "gateway.auth.mode": {
    label: "网关认证模式",
    help: '网关认证模式："none"、"token"、"password" 或 "trusted-proxy"。',
  },
  "gateway.auth.token": {
    label: "网关令牌",
    help: "网关访问默认需要（除非使用 Tailscale Serve 身份）；非回环绑定时必需。",
  },
  "gateway.auth.password": { label: "网关密码", help: "Tailscale funnel 所需的密码。" },
  "gateway.auth.allowTailscale": {
    label: "允许 Tailscale 身份认证",
    help: "允许受信的 Tailscale 身份路径满足网关认证检查。",
  },
  "gateway.auth.rateLimit": {
    label: "网关认证速率限制",
    help: "登录/认证尝试限流控制，降低网关边界的凭据暴力破解风险。",
  },
  "gateway.auth.trustedProxy": {
    label: "网关可信代理认证",
    help: "可信代理认证头映射，用于注入用户声明的上游身份提供商。",
  },
  "gateway.trustedProxies": {
    label: "网关可信代理 CIDR",
    help: "允许提供转发客户端身份头的上游代理 CIDR/IP 允许列表。",
  },
  "gateway.allowRealIpFallback": {
    label: "允许 x-real-ip 回退",
    help: "代理场景中缺少 x-forwarded-for 时启用 x-real-ip 回退。",
  },
  "gateway.tools": {
    label: "网关工具暴露策略",
    help: "网关级工具暴露允许/拒绝策略，可独立于Agent/工具配置文件限制运行时工具可用性。",
  },
  "gateway.tools.allow": {
    label: "网关工具白名单",
    help: "显式的网关级工具允许列表，用于需要严格工具集的锁定环境。",
  },
  "gateway.tools.deny": {
    label: "网关工具黑名单",
    help: "显式的网关级工具拒绝列表，即使低级别策略允许也会阻止风险工具。",
  },
  "gateway.channelHealthCheckMinutes": {
    label: "渠道健康检查间隔（分钟）",
    help: "自动渠道健康探测和状态更新的间隔（分钟）。",
  },
  "gateway.tailscale": {
    label: "网关 Tailscale",
    help: "Tailscale 集成设置，用于 Serve/Funnel 暴露和网关启动/退出时的生命周期处理。",
  },
  "gateway.tailscale.mode": {
    label: "网关 Tailscale 模式",
    help: 'Tailscale 发布模式："off"、"serve" 或 "funnel"。"serve" 仅限 tailnet 访问，"funnel" 用于公网可达。',
  },
  "gateway.tailscale.resetOnExit": {
    label: "退出时重置 Tailscale",
    help: "网关退出时重置 Tailscale Serve/Funnel 状态，避免关机后残留发布路由。",
  },
  "gateway.remote": {
    label: "远程网关",
    help: "远程网关连接设置，用于此实例通过直连或 SSH 传输代理到另一运行时主机。",
  },
  "gateway.remote.transport": {
    label: "远程网关传输",
    help: '远程连接传输："direct" 使用配置的 URL 连接，"ssh" 通过 SSH 隧道。',
  },
  "gateway.remote.url": {
    label: "远程网关 URL",
    help: "远程网关 WebSocket URL（ws:// 或 wss://）。",
  },
  "gateway.remote.sshTarget": {
    label: "远程网关 SSH 目标",
    help: "通过 SSH 的远程网关（将网关端口隧道到 localhost）。格式：user@host 或 user@host:port。",
  },
  "gateway.remote.sshIdentity": {
    label: "远程网关 SSH 身份",
    help: "可选的 SSH 身份文件路径（传递给 ssh -i）。",
  },
  "gateway.remote.token": {
    label: "远程网关令牌",
    help: "用于向远程网关进行令牌认证的 Bearer 令牌。",
  },
  "gateway.remote.password": {
    label: "远程网关密码",
    help: "启用密码模式时用于远程网关认证的密码凭据。",
  },
  "gateway.remote.tlsFingerprint": {
    label: "远程网关 TLS 指纹",
    help: "远程网关预期的 sha256 TLS 指纹（用于防止中间人攻击）。",
  },
  "gateway.reload": {
    label: "配置重载",
    help: "实时配置重载策略，控制编辑如何应用以及何时触发完全重启。",
  },
  "gateway.reload.mode": {
    label: "配置重载模式",
    help: '控制配置编辑如何应用："off" 忽略实时编辑，"restart" 始终重启，"hot" 进程内应用，"hybrid" 先尝试热更新再重启。建议 "hybrid"。',
  },
  "gateway.reload.debounceMs": {
    label: "配置重载防抖（毫秒）",
    help: "应用配置更改前的防抖窗口（毫秒）。",
  },
  "gateway.tls": {
    label: "网关 TLS",
    help: "TLS 证书和密钥设置，用于在网关进程中直接终止 HTTPS。",
  },
  "gateway.tls.enabled": {
    label: "启用网关 TLS",
    help: "在网关监听器启用 TLS 终止，客户端直接通过 HTTPS/WSS 连接。",
  },
  "gateway.tls.autoGenerate": {
    label: "自动生成 TLS 证书",
    help: "未配置显式文件时自动生成本地 TLS 证书/密钥对。仅用于本地/开发环境。",
  },
  "gateway.tls.certPath": {
    label: "TLS 证书路径",
    help: "启用 TLS 时网关使用的 TLS 证书文件路径。",
  },
  "gateway.tls.keyPath": {
    label: "TLS 密钥路径",
    help: "启用 TLS 时网关使用的 TLS 私钥文件路径。",
  },
  "gateway.tls.caPath": {
    label: "TLS CA 路径",
    help: "网关边缘用于客户端验证或自定义信任链的可选 CA 包路径。",
  },
  "gateway.http": {
    label: "网关 HTTP API",
    help: "网关 HTTP API 配置，包括端点开关和面向传输的 API 暴露控制。",
  },
  "gateway.http.endpoints": {
    label: "网关 HTTP 端点",
    help: "网关 API 下的 HTTP 端点功能开关，用于兼容性路由和可选集成。",
  },
  "gateway.http.endpoints.chatCompletions.enabled": {
    label: "OpenAI Chat Completions 端点",
    help: "启用 OpenAI 兼容的 POST /v1/chat/completions 端点（默认：false）。",
  },
  "gateway.http.securityHeaders": {
    label: "网关 HTTP 安全头",
    help: "由网关进程自身应用的可选 HTTP 响应安全头。TLS 在反向代理终止时首选在那里设置。",
  },
  "gateway.http.securityHeaders.strictTransportSecurity": {
    label: "Strict-Transport-Security 头",
    help: "Strict-Transport-Security 响应头的值。仅在完全控制的 HTTPS 源上设置。",
  },
  "gateway.nodes.browser.mode": {
    label: "网关节点浏览器模式",
    help: '节点浏览器路由："auto" 选择单个已连接浏览器节点，"manual" 需要 node 参数，"off" 禁用。',
  },
  "gateway.nodes.browser.node": {
    label: "网关节点浏览器绑定",
    help: "将浏览器路由固定到特定节点 ID 或名称（可选）。",
  },
  "gateway.nodes.allowCommands": {
    label: "网关节点额外命令白名单",
    help: "超出网关默认值的额外 node.invoke 命令允许列表。启用危险命令是安全敏感的覆盖。",
  },
  "gateway.nodes.denyCommands": {
    label: "网关节点命令黑名单",
    help: "即使出现在节点声明或默认允许列表中也要阻止的节点命令名称。",
  },

  // ── Browser ──
  browser: {
    label: "浏览器",
    help: "浏览器运行时控制，用于本地或远程 CDP 附加、配置文件路由和截图/快照行为。",
  },
  "browser.enabled": {
    label: "启用浏览器",
    help: "启用网关中的浏览器能力，使浏览器工具和 CDP 驱动的工作流可以运行。",
  },
  "browser.cdpUrl": {
    label: "浏览器 CDP URL",
    help: "用于附加到外部管理的浏览器实例的远程 CDP WebSocket URL。",
  },
  "browser.color": { label: "浏览器强调色", help: "浏览器配置文件/UI 线索中使用的默认强调色。" },
  "browser.executablePath": {
    label: "浏览器可执行文件路径",
    help: "自动发现不足时的显式浏览器可执行文件路径。",
  },
  "browser.headless": {
    label: "无头模式",
    help: "本地启动器启动浏览器实例时强制无头模式。服务器环境保持启用。",
  },
  "browser.noSandbox": {
    label: "无沙盒模式",
    help: "禁用 Chromium 沙盒隔离标志。尽可能保持关闭，因为减少了进程隔离保护。",
  },
  "browser.attachOnly": {
    label: "仅附加模式",
    help: "限制浏览器模式为仅附加行为，不启动本地浏览器进程。",
  },
  "browser.cdpPortRangeStart": {
    label: "CDP 端口范围起始",
    help: "自动分配浏览器配置文件端口的起始本地 CDP 端口。",
  },
  "browser.defaultProfile": {
    label: "默认浏览器配置文件",
    help: "调用方未显式选择配置文件时使用的默认浏览器配置文件名。",
  },
  "browser.profiles": {
    label: "浏览器配置文件",
    help: "命名浏览器配置文件连接映射，用于显式路由到 CDP 端口或带可选元数据的 URL。",
  },
  "browser.profiles.*.cdpPort": {
    label: "配置文件 CDP 端口",
    help: "按配置文件使用的本地 CDP 端口。",
  },
  "browser.profiles.*.cdpUrl": {
    label: "配置文件 CDP URL",
    help: "按配置文件的 CDP WebSocket URL，用于显式远程浏览器路由。",
  },
  "browser.profiles.*.driver": {
    label: "配置文件驱动",
    help: '按配置文件的浏览器驱动模式："clawd" 或 "extension"。',
  },
  "browser.profiles.*.attachOnly": {
    label: "配置文件仅附加模式",
    help: "跳过本地浏览器启动，仅附加到现有 CDP 端点的配置文件级覆盖。",
  },
  "browser.profiles.*.color": {
    label: "配置文件强调色",
    help: "配置文件强调色，用于仪表板和浏览器相关 UI 提示中的视觉区分。",
  },
  "browser.evaluateEnabled": {
    label: "启用浏览器 Evaluate",
    help: "启用浏览器端 evaluate 助手，用于支持的运行时脚本评估能力。",
  },
  "browser.snapshotDefaults": {
    label: "浏览器快照默认值",
    help: "调用方未提供显式快照选项时使用的默认快照捕获配置。",
  },
  "browser.snapshotDefaults.mode": {
    label: "浏览器快照模式",
    help: "默认快照提取模式，控制页面内容如何为Agent消费进行转换。",
  },
  "browser.ssrfPolicy": {
    label: "浏览器 SSRF 策略",
    help: "浏览器/网络获取路径的服务器端请求伪造防护设置。",
  },
  "browser.ssrfPolicy.allowPrivateNetwork": {
    label: "允许私有网络",
    help: "browser.ssrfPolicy.dangerouslyAllowPrivateNetwork 的旧别名。",
  },
  "browser.ssrfPolicy.dangerouslyAllowPrivateNetwork": {
    label: "危险：允许私有网络",
    help: "允许从浏览器工具访问私有网络地址范围。受信网络默认启用；禁用以强制仅公共解析检查。",
  },
  "browser.ssrfPolicy.allowedHostnames": {
    label: "允许的主机名",
    help: "SSRF 策略检查的显式主机名允许列表例外。保持列表精简。",
  },
  "browser.ssrfPolicy.hostnameAllowlist": {
    label: "主机名白名单",
    help: "SSRF 策略消费者使用的旧/替代主机名允许列表字段。",
  },
  "browser.remoteCdpTimeoutMs": {
    label: "远程 CDP 超时（毫秒）",
    help: "连接到远程 CDP 端点的超时时间（毫秒）。",
  },
  "browser.remoteCdpHandshakeTimeoutMs": {
    label: "远程 CDP 握手超时（毫秒）",
    help: "针对远程浏览器目标的连接后 CDP 握手就绪检查超时（毫秒）。",
  },

  // ── Tools ──
  tools: {
    label: "工具",
    help: "全局工具访问策略和能力配置，涵盖网页、执行、媒体、消息和提升权限界面。",
  },
  "tools.allow": {
    label: "工具白名单",
    help: "绝对工具允许列表，替换配置文件派生的默认值，用于严格环境。",
  },
  "tools.deny": {
    label: "工具黑名单",
    help: "全局工具拒绝列表，即使配置文件或提供商规则允许也会阻止列出的工具。",
  },
  "tools.web": {
    label: "网页工具",
    help: "网页工具策略，包括搜索/获取提供商、限制和回退行为调优。",
  },
  "tools.exec": {
    label: "执行工具",
    help: "执行工具策略，包括 Shell 执行主机、安全模式、审批行为和运行时绑定。",
  },
  "tools.profile": {
    label: "工具配置文件",
    help: "全局工具配置文件名，用于选择预定义工具策略基线。",
  },
  "tools.alsoAllow": {
    label: "工具白名单追加",
    help: "在选定工具配置文件和默认策略之上合并的额外工具允许列表条目。",
  },
  "tools.byProvider": {
    label: "按提供商的工具策略",
    help: "按渠道/提供商 ID 的每提供商工具允许/拒绝覆盖。",
  },
  "tools.media.image.enabled": {
    label: "启用图像理解",
    help: "启用图像理解，使附件或引用的图像可被解释为文本上下文。",
  },
  "tools.media.image.maxBytes": {
    label: "图像理解最大字节数",
    help: "策略跳过或截断前接受的最大图像载荷大小（字节）。",
  },
  "tools.media.image.maxChars": {
    label: "图像理解最大字符数",
    help: "模型响应标准化后图像理解输出的最大字符数。",
  },
  "tools.media.image.prompt": {
    label: "图像理解提示词",
    help: "图像理解请求使用的指令模板，塑造提取风格和详细程度。",
  },
  "tools.media.image.timeoutSeconds": {
    label: "图像理解超时（秒）",
    help: "每个图像理解请求的超时（秒）。",
  },
  "tools.media.image.attachments": { label: "图像理解附件策略", help: "图像输入的附件处理策略。" },
  "tools.media.image.models": { label: "图像理解模型", help: "专用于图像理解的有序模型偏好。" },
  "tools.media.image.scope": { label: "图像理解范围", help: "何时尝试图像理解的范围选择器。" },
  "tools.media.models": { label: "媒体理解共享模型", help: "媒体理解工具使用的共享回退模型列表。" },
  "tools.media.concurrency": {
    label: "媒体理解并发数",
    help: "每轮跨图像、音频和视频任务的最大并发媒体理解操作数。",
  },
  "tools.media.audio.enabled": {
    label: "启用音频理解",
    help: "启用音频理解，使语音笔记或音频片段可被转录/摘要。",
  },
  "tools.media.audio.maxBytes": {
    label: "音频理解最大字节数",
    help: "策略拒绝或裁剪前接受的最大音频载荷大小（字节）。",
  },
  "tools.media.audio.maxChars": {
    label: "音频理解最大字符数",
    help: "音频理解输出保留的最大字符数。",
  },
  "tools.media.audio.prompt": { label: "音频理解提示词", help: "指导音频理解输出风格的指令模板。" },
  "tools.media.audio.timeoutSeconds": {
    label: "音频理解超时（秒）",
    help: "音频理解执行超时（秒）。",
  },
  "tools.media.audio.language": { label: "音频理解语言", help: "音频理解/转录的首选语言提示。" },
  "tools.media.audio.attachments": { label: "音频理解附件策略", help: "音频输入的附件策略。" },
  "tools.media.audio.models": { label: "音频理解模型", help: "专用于音频理解的有序模型偏好。" },
  "tools.media.audio.scope": {
    label: "音频理解范围",
    help: "音频理解在入站消息和附件上运行的范围选择器。",
  },
  "tools.media.video.enabled": {
    label: "启用视频理解",
    help: "启用视频理解，使片段可被摘要为文本。",
  },
  "tools.media.video.maxBytes": {
    label: "视频理解最大字节数",
    help: "策略拒绝或修剪前接受的最大视频载荷大小（字节）。",
  },
  "tools.media.video.maxChars": {
    label: "视频理解最大字符数",
    help: "视频理解输出保留的最大字符数。",
  },
  "tools.media.video.prompt": {
    label: "视频理解提示词",
    help: "视频理解的指令模板，描述所需的摘要粒度和关注领域。",
  },
  "tools.media.video.timeoutSeconds": {
    label: "视频理解超时（秒）",
    help: "每个视频理解请求的超时（秒）。",
  },
  "tools.media.video.attachments": { label: "视频理解附件策略", help: "视频分析的附件资格策略。" },
  "tools.media.video.models": { label: "视频理解模型", help: "专用于视频理解的有序模型偏好。" },
  "tools.media.video.scope": {
    label: "视频理解范围",
    help: "控制何时跨入站事件尝试视频理解的范围选择器。",
  },
  "tools.links.enabled": {
    label: "启用链接理解",
    help: "启用自动链接理解预处理，使 URL 可在Agent推理前被摘要。",
  },
  "tools.links.maxLinks": { label: "链接理解最大数", help: "每轮链接理解扩展的最大链接数。" },
  "tools.links.timeoutSeconds": {
    label: "链接理解超时（秒）",
    help: "每链接理解超时预算（秒），超时后跳过未解析链接。",
  },
  "tools.links.models": {
    label: "链接理解模型",
    help: "链接理解任务的首选模型列表，按顺序作为回退。",
  },
  "tools.links.scope": {
    label: "链接理解范围",
    help: "控制链接理解相对于对话上下文和消息类型何时运行。",
  },
  "tools.web.search.enabled": {
    label: "启用网页搜索",
    help: "启用 web_search 工具（需要提供商 API 密钥）。",
  },
  "tools.web.search.provider": {
    label: "网页搜索提供商",
    help: '搜索提供商："brave"、"perplexity"、"grok"、"gemini" 或 "kimi"。省略时从可用 API 密钥自动检测。',
  },
  "tools.web.search.apiKey": {
    label: "Brave 搜索 API 密钥",
    help: "Brave Search API 密钥（回退：BRAVE_API_KEY 环境变量）。",
  },
  "tools.web.search.maxResults": { label: "网页搜索最大结果数", help: "默认返回结果数（1-10）。" },
  "tools.web.search.timeoutSeconds": {
    label: "网页搜索超时（秒）",
    help: "web_search 请求超时（秒）。",
  },
  "tools.web.search.cacheTtlMinutes": {
    label: "网页搜索缓存 TTL（分钟）",
    help: "web_search 结果缓存 TTL（分钟）。",
  },
  "tools.web.search.perplexity.apiKey": {
    label: "Perplexity API 密钥",
    help: "Perplexity 或 OpenRouter API 密钥。",
  },
  "tools.web.search.perplexity.baseUrl": {
    label: "Perplexity 基础 URL",
    help: "Perplexity 基础 URL 覆盖。",
  },
  "tools.web.search.perplexity.model": {
    label: "Perplexity 模型",
    help: 'Perplexity 模型覆盖（默认："perplexity/sonar-pro"）。',
  },
  "tools.web.search.gemini.apiKey": {
    label: "Gemini 搜索 API 密钥",
    help: "Gemini API 密钥（回退：GEMINI_API_KEY 环境变量）。",
  },
  "tools.web.search.gemini.model": {
    label: "Gemini 搜索模型",
    help: 'Gemini 模型覆盖（默认："gemini-2.5-flash"）。',
  },
  "tools.web.search.grok.apiKey": {
    label: "Grok 搜索 API 密钥",
    help: "Grok (xAI) API 密钥（回退：XAI_API_KEY 环境变量）。",
  },
  "tools.web.search.grok.model": {
    label: "Grok 搜索模型",
    help: 'Grok 模型覆盖（默认："grok-4-1-fast"）。',
  },
  "tools.web.search.kimi.apiKey": {
    label: "Kimi 搜索 API 密钥",
    help: "Moonshot/Kimi API 密钥（回退：KIMI_API_KEY 或 MOONSHOT_API_KEY 环境变量）。",
  },
  "tools.web.search.kimi.baseUrl": {
    label: "Kimi 搜索基础 URL",
    help: 'Kimi 基础 URL 覆盖（默认："https://api.moonshot.ai/v1"）。',
  },
  "tools.web.search.kimi.model": {
    label: "Kimi 搜索模型",
    help: 'Kimi 模型覆盖（默认："moonshot-v1-128k"）。',
  },
  "tools.web.fetch.enabled": {
    label: "启用网页抓取",
    help: "启用 web_fetch 工具（轻量 HTTP 获取）。",
  },
  "tools.web.fetch.maxChars": {
    label: "网页抓取最大字符数",
    help: "web_fetch 返回的最大字符数（截断）。",
  },
  "tools.web.fetch.maxCharsCap": {
    label: "网页抓取硬上限字符数",
    help: "web_fetch maxChars 的硬上限（应用于配置和工具调用）。",
  },
  "tools.web.fetch.timeoutSeconds": {
    label: "网页抓取超时（秒）",
    help: "web_fetch 请求超时（秒）。",
  },
  "tools.web.fetch.cacheTtlMinutes": {
    label: "网页抓取缓存 TTL（分钟）",
    help: "web_fetch 结果缓存 TTL（分钟）。",
  },
  "tools.web.fetch.maxRedirects": {
    label: "网页抓取最大重定向数",
    help: "web_fetch 允许的最大重定向数（默认：3）。",
  },
  "tools.web.fetch.userAgent": {
    label: "网页抓取 User-Agent",
    help: "web_fetch 请求的 User-Agent 头覆盖。",
  },
  "tools.web.fetch.readability": {
    label: "网页抓取正文提取",
    help: "使用 Readability 从 HTML 提取主要内容（回退到基本 HTML 清理）。",
  },
  "tools.web.fetch.firecrawl.enabled": {
    label: "启用 Firecrawl 回退",
    help: "启用 Firecrawl 作为 web_fetch 的回退（如已配置）。",
  },
  "tools.web.fetch.firecrawl.apiKey": {
    label: "Firecrawl API 密钥",
    help: "Firecrawl API 密钥（回退：FIRECRAWL_API_KEY 环境变量）。",
  },
  "tools.web.fetch.firecrawl.baseUrl": {
    label: "Firecrawl 基础 URL",
    help: "Firecrawl 基础 URL（如 https://api.firecrawl.dev 或自定义端点）。",
  },
  "tools.web.fetch.firecrawl.onlyMainContent": {
    label: "Firecrawl 仅主要内容",
    help: "启用后 Firecrawl 仅返回主要内容（默认：true）。",
  },
  "tools.web.fetch.firecrawl.maxAgeMs": {
    label: "Firecrawl 缓存最大时间（毫秒）",
    help: "API 支持时 Firecrawl 缓存结果的 maxAge（毫秒）。",
  },
  "tools.web.fetch.firecrawl.timeoutSeconds": {
    label: "Firecrawl 超时（秒）",
    help: "Firecrawl 请求超时（秒）。",
  },
  "tools.exec.applyPatch.enabled": {
    label: "启用 apply_patch",
    help: "实验性。在工具策略允许时为 OpenAI 模型启用 apply_patch。",
  },
  "tools.exec.applyPatch.workspaceOnly": {
    label: "apply_patch 仅工作区",
    help: "将 apply_patch 路径限制在工作区目录（默认：true）。设为 false 允许写入工作区外（危险）。",
  },
  "tools.exec.applyPatch.allowModels": {
    label: "apply_patch 模型白名单",
    help: '可选的允许模型 ID 列表（如 "gpt-5.2" 或 "openai/gpt-5.2"）。',
  },
  "tools.exec.notifyOnExit": {
    label: "执行完成通知",
    help: "启用后，后台执行会话退出和节点执行生命周期事件会入队系统事件并请求心跳（默认：true）。",
  },
  "tools.exec.notifyOnExitEmptySuccess": {
    label: "执行空成功通知",
    help: "启用后，空输出的成功后台执行退出仍入队完成系统事件（默认：false）。",
  },
  "tools.exec.approvalRunningNoticeMs": {
    label: "执行审批运行提示（毫秒）",
    help: "执行审批通过后显示进行中通知的延迟（毫秒）。",
  },
  "tools.exec.host": {
    label: "执行主机",
    help: "Shell 命令的执行主机策略选择，通常控制本地与委派执行环境。",
  },
  "tools.exec.security": {
    label: "执行安全策略",
    help: "执行安全态势选择器，控制命令执行的沙盒/审批预期。",
  },
  "tools.exec.ask": { label: "执行询问", help: "执行命令需要人工确认时的审批策略。" },
  "tools.exec.node": {
    label: "执行节点绑定",
    help: "执行工具的节点绑定配置，用于通过连接的节点委派命令执行。",
  },
  "tools.exec.pathPrepend": {
    label: "执行 PATH 前置",
    help: "为执行运行（网关/沙盒）预置到 PATH 的目录。",
  },
  "tools.exec.safeBins": {
    label: "执行安全二进制",
    help: "允许仅 stdin 的安全二进制文件无需显式允许列表即可运行。",
  },
  "tools.exec.safeBinTrustedDirs": {
    label: "执行安全二进制可信目录",
    help: "用于安全二进制检查的额外显式受信目录（PATH 条目永远不会自动受信）。",
  },
  "tools.exec.safeBinProfiles": {
    label: "执行安全二进制配置文件",
    help: "可选的按二进制文件安全二进制配置文件（位置限制 + 允许/拒绝标志）。",
  },
  "tools.loopDetection.enabled": {
    label: "工具循环检测",
    help: "启用重复工具调用循环检测和退避安全检查（默认：false）。",
  },
  "tools.loopDetection.historySize": {
    label: "工具循环历史大小",
    help: "循环检测的工具历史窗口大小（默认：30）。",
  },
  "tools.loopDetection.warningThreshold": {
    label: "工具循环警告阈值",
    help: "启用检测器时重复模式的警告阈值（默认：10）。",
  },
  "tools.loopDetection.criticalThreshold": {
    label: "工具循环严重阈值",
    help: "启用检测器时重复模式的严重阈值（默认：20）。",
  },
  "tools.loopDetection.globalCircuitBreakerThreshold": {
    label: "工具循环全局熔断阈值",
    help: "全局无进展熔断阈值（默认：30）。",
  },
  "tools.loopDetection.detectors.genericRepeat": {
    label: "工具循环通用重复检测",
    help: "启用通用重复相同工具/相同参数循环检测（默认：true）。",
  },
  "tools.loopDetection.detectors.knownPollNoProgress": {
    label: "工具循环轮询无进展检测",
    help: "启用已知轮询工具无进展循环检测（默认：true）。",
  },
  "tools.loopDetection.detectors.pingPong": {
    label: "工具循环乒乓检测",
    help: "启用乒乓循环检测（默认：true）。",
  },
  "tools.fs.workspaceOnly": {
    label: "仅工作区文件系统工具",
    help: "将文件系统工具（读/写/编辑/apply_patch）限制在工作区目录（默认：false）。",
  },
  "tools.sessions.visibility": {
    label: "会话工具可见性",
    help: '控制 sessions_list/sessions_history/sessions_send 可针对哪些会话。"tree"（默认）= 当前会话 + 派生子Agent会话。',
  },
  "tools.agentToAgent": {
    label: "Agent间工具访问",
    help: "Agent间工具调用策略，约束可达的目标Agent。",
  },
  "tools.agentToAgent.enabled": {
    label: "启用Agent间工具",
    help: "启用 agent_to_agent 工具界面，使一个Agent可在运行时调用另一个Agent。",
  },
  "tools.agentToAgent.allow": {
    label: "Agent间目标白名单",
    help: "启用编排时允许 agent_to_agent 调用的目标Agent ID 允许列表。",
  },
  "tools.elevated": {
    label: "提升工具访问",
    help: "提升工具访问控制，用于仅受信发送者可达的特权命令界面。",
  },
  "tools.elevated.enabled": {
    label: "启用提升工具访问",
    help: "当发送者和策略检查通过时启用提升工具执行路径。",
  },
  "tools.elevated.allowFrom": {
    label: "提升工具允许规则",
    help: "提升工具的发送者允许规则，通常按渠道/提供商身份格式键控。",
  },
  "tools.subagents": {
    label: "子Agent工具策略",
    help: "派生子Agent的工具策略包装器，限制或扩展相对于父默认值的工具可用性。",
  },
  "tools.subagents.tools": {
    label: "子Agent工具允许/拒绝策略",
    help: "应用于派生子Agent运行时的允许/拒绝工具策略。",
  },
  "tools.sandbox": {
    label: "沙盒工具策略",
    help: "沙盒Agent执行的工具策略包装器，使沙盒运行具有独立的能力边界。",
  },
  "tools.sandbox.tools": {
    label: "沙盒工具允许/拒绝策略",
    help: "Agent在沙盒执行环境中运行时应用的允许/拒绝工具策略。",
  },
  "tools.message.allowCrossContextSend": {
    label: "允许跨上下文消息发送",
    help: "旧覆盖：允许跨所有提供商的跨上下文发送。",
  },
  "tools.message.crossContext.allowWithinProvider": {
    label: "允许同提供商跨上下文",
    help: "允许在同一提供商内向其他渠道发送（默认：true）。",
  },
  "tools.message.crossContext.allowAcrossProviders": {
    label: "允许跨提供商跨上下文",
    help: "允许跨不同提供商发送（默认：false）。",
  },
  "tools.message.crossContext.marker.enabled": {
    label: "跨上下文标记",
    help: "跨上下文发送时添加可见源标记（默认：true）。",
  },
  "tools.message.crossContext.marker.prefix": {
    label: "跨上下文标记前缀",
    help: '跨上下文标记的文本前缀（支持 "{channel}"）。',
  },
  "tools.message.crossContext.marker.suffix": {
    label: "跨上下文标记后缀",
    help: '跨上下文标记的文本后缀（支持 "{channel}"）。',
  },
  "tools.message.broadcast.enabled": {
    label: "启用消息广播",
    help: "启用广播操作（默认：true）。",
  },
  "agents.list[].tools.profile": { label: "Agent工具配置文件", help: "Agent级工具配置文件覆盖。" },
  "agents.list[].tools.alsoAllow": {
    label: "Agent工具白名单追加",
    help: "Agent级在全局和配置文件策略之上的追加允许列表。",
  },
  "agents.list[].tools.byProvider": {
    label: "Agent按提供商工具策略",
    help: "Agent级按提供商的工具策略覆盖。",
  },

  // ── Approvals ──
  approvals: { label: "审批", help: "审批路由控制，将执行审批请求转发到发起会话之外的聊天目标。" },
  "approvals.exec": {
    label: "执行审批转发",
    help: "执行审批转发行为组，包括启用、路由模式、过滤和显式目标。",
  },
  "approvals.exec.enabled": {
    label: "转发执行审批",
    help: "启用将执行审批请求转发到配置的投递目标（默认：false）。",
  },
  "approvals.exec.mode": {
    label: "审批转发模式",
    help: '控制审批提示发送位置："session" 使用源聊天，"targets" 使用配置的目标，"both" 两者都发。',
  },
  "approvals.exec.agentFilter": {
    label: "审批Agent过滤",
    help: "适用于转发审批的可选Agent ID 允许列表。",
  },
  "approvals.exec.sessionFilter": {
    label: "审批会话过滤",
    help: "可选会话键过滤器，作为子串或正则匹配模式。",
  },
  "approvals.exec.targets": {
    label: "审批转发目标",
    help: "转发模式包含目标时使用的显式投递目标。",
  },
  "approvals.exec.targets[].channel": {
    label: "审批目标渠道",
    help: "用于转发审批投递的渠道/提供商 ID。",
  },
  "approvals.exec.targets[].to": {
    label: "审批目标地址",
    help: "目标渠道内的目标标识符（渠道 ID、用户 ID 或线程根）。",
  },
  "approvals.exec.targets[].accountId": {
    label: "审批目标账号 ID",
    help: "多账号渠道设置的可选账号选择器。",
  },
  "approvals.exec.targets[].threadId": {
    label: "审批目标线程 ID",
    help: "支持线程投递的渠道的可选线程/话题目标。",
  },

  // ── Memory ──
  memory: { label: "记忆", help: "记忆后端配置（全局）。" },
  "memory.backend": {
    label: "记忆后端",
    help: '全局记忆引擎选择："builtin" 使用 OpenClaw 记忆内部实现，"qmd" 使用 QMD 侧车管线。',
  },
  "memory.citations": {
    label: "记忆引用模式",
    help: '回复中引用可见性控制："auto" 在有用时显示，"on" 始终显示，"off" 隐藏。',
  },
  "memory.qmd.command": {
    label: "QMD 二进制文件",
    help: "QMD 后端使用的 qmd 二进制可执行路径（默认：从 PATH 解析）。",
  },
  "memory.qmd.mcporter": {
    label: "QMD MCPorter",
    help: "通过 mcporter（MCP 运行时）路由 QMD 工作，而非每次调用生成 qmd。",
  },
  "memory.qmd.mcporter.enabled": {
    label: "启用 QMD MCPorter",
    help: "通过 mcporter 守护进程路由 QMD，减少大模型的冷启动开销。",
  },
  "memory.qmd.mcporter.serverName": {
    label: "QMD MCPorter 服务名",
    help: "QMD 调用使用的 mcporter 服务器目标名称（默认：qmd）。",
  },
  "memory.qmd.mcporter.startDaemon": {
    label: "QMD MCPorter 启动守护进程",
    help: "启用 mcporter 模式时自动启动 mcporter 守护进程（默认：true）。",
  },
  "memory.qmd.searchMode": {
    label: "QMD 搜索模式",
    help: 'QMD 检索路径选择："query" 标准查询，"search" 搜索导向，"vsearch" 强调向量检索。',
  },
  "memory.qmd.includeDefaultMemory": {
    label: "QMD 包含默认记忆",
    help: "自动将默认记忆文件（MEMORY.md 和 memory/**/*.md）索引到 QMD 集合。",
  },
  "memory.qmd.paths": {
    label: "QMD 额外路径",
    help: "添加自定义目录或文件到 QMD 索引，每个可带可选名称和 glob 模式。",
  },
  "memory.qmd.sessions.enabled": {
    label: "QMD 会话索引",
    help: "将会话转录索引到 QMD，使回忆可包含先前对话内容（实验性，默认：false）。",
  },
  "memory.qmd.sessions.exportDir": {
    label: "QMD 会话导出目录",
    help: "覆盖清理后的会话导出在 QMD 索引前的写入位置。",
  },
  "memory.qmd.sessions.retentionDays": {
    label: "QMD 会话保留（天）",
    help: "定义导出会话文件自动清理前保留的天数（默认：无限）。",
  },
  "memory.qmd.update.interval": {
    label: "QMD 更新间隔",
    help: "QMD 从源内容刷新索引的频率（时长字符串，默认：5m）。",
  },
  "memory.qmd.update.debounceMs": {
    label: "QMD 更新防抖（毫秒）",
    help: "连续 QMD 刷新尝试间的最小延迟（毫秒，默认：15000）。",
  },
  "memory.qmd.update.onBoot": {
    label: "启动时 QMD 更新",
    help: "网关启动时运行一次初始 QMD 更新（默认：true）。",
  },
  "memory.qmd.update.waitForBootSync": {
    label: "等待 QMD 启动同步",
    help: "阻塞启动完成直到初始启动时 QMD 同步完成（默认：false）。",
  },
  "memory.qmd.update.embedInterval": {
    label: "QMD 嵌入间隔",
    help: "QMD 重新计算嵌入的频率（时长字符串，默认：60m；设 0 禁用）。",
  },
  "memory.qmd.update.commandTimeoutMs": {
    label: "QMD 命令超时（毫秒）",
    help: "QMD 维护命令（如集合列表/添加）的超时（毫秒，默认：30000）。",
  },
  "memory.qmd.update.updateTimeoutMs": {
    label: "QMD 更新超时（毫秒）",
    help: "每次 qmd update 周期的最大运行时间（毫秒，默认：120000）。",
  },
  "memory.qmd.update.embedTimeoutMs": {
    label: "QMD 嵌入超时（毫秒）",
    help: "每次 qmd embed 周期的最大运行时间（毫秒，默认：120000）。",
  },
  "memory.qmd.limits.maxResults": {
    label: "QMD 最大结果数",
    help: "每次回忆请求返回到Agent循环的最大 QMD 命中数（默认：6）。",
  },
  "memory.qmd.limits.maxSnippetChars": {
    label: "QMD 最大片段字符数",
    help: "从 QMD 命中提取的每结果片段最大长度（字符，默认：700）。",
  },
  "memory.qmd.limits.maxInjectedChars": {
    label: "QMD 最大注入字符数",
    help: "跨所有命中一轮可注入的最大 QMD 文本字符数。",
  },
  "memory.qmd.limits.timeoutMs": {
    label: "QMD 搜索超时（毫秒）",
    help: "每查询 QMD 搜索超时（毫秒，默认：4000）。",
  },
  "memory.qmd.scope": { label: "QMD 展示范围", help: "定义哪些会话/渠道有资格进行 QMD 回忆。" },

  // ── Auth ──
  auth: {
    label: "认证",
    help: "认证配置文件根节点，用于多配置文件提供商凭据和基于冷却的故障转移排序。",
  },
  "auth.profiles": {
    label: "认证配置文件",
    help: "命名认证配置文件（提供商 + 模式 + 可选邮箱）。",
  },
  "auth.order": {
    label: "认证配置文件顺序",
    help: "每提供商的有序认证配置文件 ID（用于自动故障转移）。",
  },
  "auth.cooldowns": {
    label: "认证冷却",
    help: "认证配置文件在账单相关失败后的冷却/退避控制和重试窗口。",
  },
  "auth.cooldowns.billingBackoffHours": {
    label: "账单退避（小时）",
    help: "配置文件因账单/余额不足失败时的基础退避（小时，默认：5）。",
  },
  "auth.cooldowns.billingBackoffHoursByProvider": {
    label: "账单退避覆盖",
    help: "可选的按提供商账单退避覆盖（小时）。",
  },
  "auth.cooldowns.billingMaxHours": {
    label: "账单退避上限（小时）",
    help: "账单退避上限（小时，默认：24）。",
  },
  "auth.cooldowns.failureWindowHours": {
    label: "故障转移窗口（小时）",
    help: "退避计数器的失败窗口（小时，默认：24）。",
  },

  // ── Session ──
  session: { label: "会话", help: "全局会话路由、重置、投递策略和维护控制。" },
  "session.scope": {
    label: "会话范围",
    help: '基础会话分组策略："per-sender" 按发送者隔离，"global" 每渠道上下文共享一个会话。',
  },
  "session.dmScope": {
    label: "私信会话范围",
    help: 'DM 会话范围："main" 保持连续性，"per-peer"、"per-channel-peer" 和 "per-account-channel-peer" 增加隔离。',
  },
  "session.identityLinks": {
    label: "会话身份链接",
    help: "映射规范身份到提供商前缀的对等 ID，使等效用户解析到同一 DM 线程。",
  },
  "session.resetTriggers": {
    label: "会话重置触发器",
    help: "在入站内容中匹配时强制会话重置的消息触发器列表。",
  },
  "session.idleMinutes": {
    label: "会话空闲时间（分钟）",
    help: "旧版空闲重置窗口（分钟），用于跨不活跃间隙的会话重用行为。",
  },
  "session.reset": {
    label: "会话重置策略",
    help: "无类型特定或渠道特定覆盖时使用的默认重置策略对象。",
  },
  "session.reset.mode": {
    label: "会话重置模式",
    help: '重置策略选择："daily" 在配置的小时重置，"idle" 在不活跃窗口后重置。',
  },
  "session.reset.atHour": {
    label: "会话每日重置时间",
    help: "每日重置模式的本地小时边界（0-23）。",
  },
  "session.reset.idleMinutes": {
    label: "会话重置空闲时间（分钟）",
    help: "空闲模式的不活跃窗口（分钟），也可作为每日模式的次要保护。",
  },
  "session.resetByType": {
    label: "按聊天类型重置会话",
    help: "按聊天类型（direct、group、thread）覆盖重置行为。",
  },
  "session.resetByType.direct": {
    label: "会话重置（私聊）",
    help: "私聊的重置策略，取代基础 session.reset 配置。",
  },
  "session.resetByType.dm": {
    label: "会话重置（私信，已弃用别名）",
    help: "私信重置行为的已弃用别名，保持向后兼容。请使用 session.resetByType.direct。",
  },
  "session.resetByType.group": { label: "会话重置（群组）", help: "群聊会话的重置策略。" },
  "session.resetByType.thread": { label: "会话重置（线程）", help: "线程范围会话的重置策略。" },
  "session.resetByChannel": {
    label: "按渠道重置会话",
    help: "按提供商/渠道 ID 的渠道特定重置覆盖。",
  },
  "session.store": { label: "会话存储路径", help: "会话存储文件路径，用于跨重启持久化会话记录。" },
  "session.typingIntervalSeconds": {
    label: "会话打字间隔（秒）",
    help: "支持打字指示器的渠道中重复打字指示器的间隔控制。",
  },
  "session.typingMode": {
    label: "会话打字模式",
    help: '打字行为时序控制："never"、"instant"、"thinking" 或 "message"。',
  },
  "session.parentForkMaxTokens": {
    label: "会话父分支最大 Token 数",
    help: "线程/会话继承分叉允许的最大父会话 Token 数。超过时启动全新线程会话。",
  },
  "session.mainKey": {
    label: "会话主键",
    help: '覆盖 dmScope 或路由逻辑指向 "main" 时使用的规范主会话键。',
  },
  "session.sendPolicy": { label: "会话发送策略", help: "使用允许/拒绝规则控制跨会话发送权限。" },
  "session.sendPolicy.default": {
    label: "会话发送策略默认行为",
    help: '无 sendPolicy 规则匹配时的回退操作："allow" 或 "deny"。',
  },
  "session.sendPolicy.rules": {
    label: "会话发送策略规则",
    help: "在默认操作前评估的有序允许/拒绝规则。",
  },
  "session.agentToAgent": {
    label: "会话Agent间通信",
    help: "Agent间会话交换控制，包括回复链的循环防止限制。",
  },
  "session.agentToAgent.maxPingPongTurns": {
    label: "Agent间乒乓对话轮次",
    help: "Agent间交换期间请求者和目标Agent之间的最大回复轮次（0-5）。",
  },
  "session.threadBindings": {
    label: "会话线程绑定",
    help: "支持线程聚焦工作流的提供商的线程绑定会话路由共享默认值。",
  },
  "session.threadBindings.enabled": {
    label: "启用线程绑定",
    help: "线程绑定会话路由功能和聚焦线程投递行为的全局主开关。",
  },
  "session.threadBindings.idleHours": {
    label: "线程绑定空闲超时（小时）",
    help: "跨提供商/渠道的线程绑定会话默认不活跃窗口（小时，0 禁用，默认：24）。",
  },
  "session.threadBindings.maxAgeHours": {
    label: "线程绑定最大时长（小时）",
    help: "跨提供商/渠道的线程绑定会话可选最大年龄（小时，0 禁用，默认：0）。",
  },
  "session.maintenance": {
    label: "会话维护",
    help: "自动会话存储维护控制，包括清理年龄、条目上限和文件轮转行为。",
  },
  "session.maintenance.mode": {
    label: "会话维护模式",
    help: '维护策略是仅报告（"warn"）还是主动应用（"enforce"）。',
  },
  "session.maintenance.pruneAfter": {
    label: "会话清理期限",
    help: "维护期间移除超过此时长的条目（如 30d 或 12h）。",
  },
  "session.maintenance.pruneDays": {
    label: "会话清理天数（已弃用）",
    help: "已弃用的天数年龄保留字段。请使用 session.maintenance.pruneAfter。",
  },
  "session.maintenance.maxEntries": {
    label: "会话最大条目数",
    help: "存储中保留的会话条目总数上限，防止无限增长。",
  },
  "session.maintenance.rotateBytes": {
    label: "会话轮转大小",
    help: "文件大小超过阈值时轮转会话存储（如 10mb 或 1gb）。",
  },
  "session.maintenance.resetArchiveRetention": {
    label: "会话重置归档保留",
    help: "重置转录归档的保留期限。接受时长（如 30d）或 false 禁用清理。",
  },
  "session.maintenance.maxDiskBytes": {
    label: "会话最大磁盘预算",
    help: "可选的每Agent会话目录磁盘预算（如 500mb）。",
  },
  "session.maintenance.highWaterBytes": {
    label: "会话磁盘高水位目标",
    help: "磁盘预算清理后的目标大小（高水位标记）。默认 maxDiskBytes 的 80%。",
  },

  // ── Commands ──
  commands: { label: "命令", help: "聊天命令界面控制，包括拥有者门控和提升命令访问行为。" },
  "commands.native": { label: "原生命令", help: "启用时暴露内置命令（如 /help、/status 等），禁用则隐藏。" },
  "commands.nativeSkills": { label: "原生技能命令", help: "启用时暴露内置技能命令，如 /search、/web 等。" },
  "commands.text": { label: "文本命令", help: "自定义文本命令映射表，键为命令名，值为响应模板。" },
  "commands.bash": { label: "允许 Bash 聊天命令", help: "允许通过聊天执行 bash/shell 命令。启用有安全风险，仅在受信环境中使用。" },
  "commands.bashForegroundMs": { label: "Bash 前台窗口（毫秒）", help: "Bash 命令在前台等待完成的最大时间（毫秒），超时后转为后台执行。" },
  "commands.config": { label: "允许 /config", help: "启用 /config 命令，允许通过聊天查看和修改配置。" },
  "commands.debug": { label: "允许 /debug", help: "启用 /debug 命令，允许通过聊天访问调试信息。" },
  "commands.restart": { label: "允许重启", help: "启用 /restart 命令，允许通过聊天重启网关。" },
  "commands.useAccessGroups": { label: "使用访问组", help: "启用渠道级别的访问组门控，用于细粒度命令权限控制。" },
  "commands.ownerAllowFrom": { label: "命令拥有者", help: "指定命令拥有者的渠道 ID 列表，拥有者可执行所有提升命令。" },
  "commands.ownerDisplay": { label: "拥有者 ID 显示", help: "控制是否在状态输出中显示拥有者 ID。" },
  "commands.ownerDisplaySecret": { label: "拥有者 ID 哈希密钥", help: "用于对拥有者 ID 进行哈希处理的密钥，保护隐私。" },
  "commands.allowFrom": { label: "命令提升访问规则", help: "按命令名定义的提升访问规则，控制哪些用户可以执行特定命令。" },

  // ── Messages ──
  messages: { label: "消息", help: "消息处理和路由设置。" },
  "messages.messagePrefix": { label: "入站消息前缀", help: "添加到所有入站消息前的前缀文本，可用于指令注入。" },
  "messages.responsePrefix": { label: "出站响应前缀", help: "添加到所有出站响应前的前缀文本。" },
  "messages.groupChat": { label: "群聊规则", help: "群聊行为控制，包括提及检测和历史记录限制。" },
  "messages.groupChat.mentionPatterns": { label: "群聊提及模式", help: "触发机器人在群聊中回复的正则表达式提及模式列表。" },
  "messages.groupChat.historyLimit": { label: "群聊历史限制", help: "群聊中加载的历史消息数量上限。" },
  "messages.queue": { label: "入站队列", help: "入站消息队列设置，控制并发处理和消息去重。" },
  "messages.queue.mode": { label: "队列模式", help: "队列处理模式：串行、并行或防抖。" },
  "messages.queue.byChannel": { label: "按渠道队列模式", help: "按渠道覆盖的队列处理模式。" },
  "messages.queue.debounceMs": { label: "队列防抖（毫秒）", help: "全局消息防抖间隔（毫秒），在此时间内合并重复消息。" },
  "messages.queue.debounceMsByChannel": { label: "按渠道队列防抖（毫秒）", help: "按渠道覆盖的消息防抖间隔（毫秒）。" },
  "messages.queue.cap": { label: "队列容量", help: "入站队列最大长度，超过后按丢弃策略处理。" },
  "messages.queue.drop": { label: "队列丢弃策略", help: "队列满时的丢弃策略：丢弃最新或最旧消息。" },
  "messages.inbound": { label: "入站防抖", help: "入站消息防抖设置。" },
  "messages.inbound.debounceMs": { label: "入站消息防抖（毫秒）", help: "入站消息的全局防抖间隔（毫秒）。" },
  "messages.inbound.byChannel": { label: "按渠道入站防抖（毫秒）", help: "按渠道覆盖的入站消息防抖间隔。" },
  "messages.suppressToolErrors": { label: "抑制工具错误警告", help: "启用后工具执行错误不会在聊天中显示警告消息。" },
  "messages.ackReaction": { label: "确认反应表情", help: "收到消息后添加的确认反应表情（如 👀），设为空字符串禁用。" },
  "messages.ackReactionScope": { label: "确认反应范围", help: "确认反应的适用范围：所有消息、仅私信或仅群聊。" },
  "messages.removeAckAfterReply": { label: "回复后移除确认反应", help: "回复发送后自动移除确认反应表情。" },
  "messages.statusReactions": { label: "状态反应", help: "处理状态反应设置，在消息处理时显示动态状态表情。" },
  "messages.statusReactions.enabled": { label: "启用状态反应", help: "启用后处理消息时显示动态状态反应表情。" },
  "messages.statusReactions.emojis": { label: "状态反应表情", help: "按处理阶段显示的状态反应表情列表。" },
  "messages.statusReactions.timing": { label: "状态反应时间", help: "状态反应的更新间隔和计时设置。" },
  "messages.tts": { label: "消息文本转语音", help: "消息的文本转语音设置，启用后自动将回复转为语音。" },

  // ── Channels ──
  channels: { label: "渠道", help: "消息渠道配置（Telegram、Discord、Slack 等）。" },
  "channels.defaults": { label: "渠道默认值", help: "所有渠道共享的默认配置。" },
  "channels.defaults.groupPolicy": { label: "默认群组策略", help: "所有渠道的默认群聊访问策略。" },
  "channels.defaults.heartbeat": { label: "默认心跳可见性", help: "渠道心跳消息的默认显示设置。" },
  "channels.defaults.heartbeat.showOk": { label: "心跳显示正常", help: "心跳状态正常时是否显示通知。" },
  "channels.defaults.heartbeat.showAlerts": { label: "心跳显示警告", help: "心跳检测到问题时是否显示警告。" },
  "channels.defaults.heartbeat.useIndicator": { label: "心跳使用指示器", help: "使用视觉指示器（如表情）显示心跳状态。" },
  "channels.whatsapp": { label: "WhatsApp", help: "WhatsApp 渠道配置，通过 Web 协议连接。" },
  "channels.telegram": { label: "Telegram", help: "Telegram 机器人渠道配置。" },
  "channels.telegram.botToken": { label: "Telegram Bot Token", help: "Telegram Bot API 令牌，从 @BotFather 获取。" },
  "channels.telegram.dmPolicy": { label: "Telegram 私信策略", help: "Telegram 私信访问策略。" },
  "channels.telegram.configWrites": { label: "Telegram 配置写入", help: "控制是否允许通过 Telegram 修改配置。" },
  "channels.telegram.commands.native": { label: "Telegram 原生命令", help: "Telegram 中是否启用原生命令。" },
  "channels.telegram.commands.nativeSkills": { label: "Telegram 原生技能命令", help: "Telegram 中是否启用原生技能命令。" },
  "channels.telegram.streaming": { label: "Telegram 流式模式", help: "启用后 Telegram 消息会逐步流式输出。" },
  "channels.telegram.customCommands": { label: "Telegram 自定义命令", help: "Telegram 中的自定义斜杠命令列表。" },
  "channels.discord": { label: "Discord", help: "Discord 机器人渠道配置。" },
  "channels.slack": { label: "Slack", help: "Slack 应用渠道配置。" },
  "channels.mattermost": { label: "Mattermost", help: "Mattermost 渠道配置。" },
  "channels.signal": { label: "Signal", help: "Signal 渠道配置。" },
  "channels.imessage": { label: "iMessage", help: "iMessage 渠道配置（仅 macOS）。" },
  "channels.bluebubbles": { label: "BlueBubbles", help: "BlueBubbles 渠道配置，用于 iMessage 跨平台访问。" },
  "channels.msteams": { label: "MS Teams", help: "Microsoft Teams 渠道配置。" },
  "channels.modelByChannel": { label: "渠道模型覆盖", help: "按渠道覆盖默认 AI 模型配置。" },

  // ── Feishu Channel ──
  "channels.feishu": {
    label: "飞书",
    help: "飞书机器人渠道配置。通过飞书 SDK 建立 WebSocket 长连接，无需公共 URL。",
  },
  "channels.feishu.enabled": { label: "启用飞书渠道", help: "启用/禁用飞书渠道。" },
  "channels.feishu.accounts": {
    label: "飞书账号",
    help: "飞书应用账号列表。每个条目对应一个飞书自建应用。",
  },
  "channels.feishu.accounts.*.appId": { label: "App ID", help: "飞书开发者后台的应用 App ID。" },
  "channels.feishu.accounts.*.appSecret": {
    label: "App Secret",
    help: "飞书开发者后台的应用 App Secret。",
  },
  "channels.feishu.accounts.*.name": { label: "账号名称", help: "用于标识此账号的显示名称。" },
  "channels.feishu.accounts.*.botName": { label: "机器人名称", help: "飞书机器人的显示名称。" },
  "channels.feishu.accounts.*.enabled": { label: "启用此账号", help: "是否启用此飞书账号。" },
  "channels.feishu.accounts.*.connectionMode": {
    label: "连接模式",
    help: '与飞书服务器的连接方式："websocket" 使用长连接（推荐），"webhook" 使用回调。',
    defaultValue: "websocket",
  },
  "channels.feishu.accounts.*.domain": {
    label: "服务域名",
    help: '飞书服务域名："feishu"（国内版），"lark"（国际版）。',
    defaultValue: "feishu",
  },
  "channels.feishu.accounts.*.encryptKey": {
    label: "加密密钥",
    help: "飞书事件订阅的加密密钥（Encrypt Key），用于验证与解密事件推送。",
  },
  "channels.feishu.accounts.*.verificationToken": {
    label: "验证令牌",
    help: "飞书事件订阅的验证令牌（Verification Token），用于验证请求来源。",
  },
  "channels.feishu.accounts.*.webhookHost": {
    label: "Webhook 主机",
    help: "Webhook 模式下的回调主机地址。WebSocket 模式不需要。",
  },
  "channels.feishu.accounts.*.webhookPath": {
    label: "Webhook 路径",
    help: "Webhook 模式下的回调路径。",
  },
  "channels.feishu.accounts.*.webhookPort": {
    label: "Webhook 端口",
    help: "Webhook 模式下的回调端口号。",
  },
  "channels.feishu.appId": {
    label: "默认 App ID",
    help: "渠道级别的默认 App ID（覆盖单个账号设置）。",
  },
  "channels.feishu.appSecret": { label: "默认 App Secret", help: "渠道级别的默认 App Secret。" },
  "channels.feishu.connectionMode": {
    label: "默认连接模式",
    help: '默认连接方式："websocket"（推荐）或 "webhook"。',
  },
  "channels.feishu.domain": {
    label: "默认服务域名",
    help: '默认域名："feishu"（国内）或 "lark"（国际）。',
  },
  "channels.feishu.dmPolicy": {
    label: "私信策略",
    help: '私信访问策略："open" 允许所有人，"pairing" 未知用户需配对码（默认），"allowlist" 仅允许列表中的用户。',
    defaultValue: "pairing",
  },
  "channels.feishu.allowFrom": {
    label: "私信允许列表",
    help: '允许私信的飞书用户 open_id 列表（格式如 ou_xxx）。配合 dmPolicy="allowlist" 使用。',
  },
  "channels.feishu.groupPolicy": {
    label: "群组策略",
    help: '群聊访问策略："open" 允许所有群（默认），"allowlist" 仅允许指定群，"disabled" 禁用群消息。',
    defaultValue: "open",
  },
  "channels.feishu.groupAllowFrom": {
    label: "群组允许列表",
    help: '允许的飞书群 chat_id 列表（格式如 oc_xxx）。配合 groupPolicy="allowlist" 使用。',
  },
  "channels.feishu.groupSessionScope": {
    label: "群组会话范围",
    help: '群聊会话隔离策略："group" 每群一个会话，"group_sender" 群+发送者隔离。',
  },
  "channels.feishu.requireMention": {
    label: "需要 @提及",
    help: "群聊中是否需要 @机器人 才触发回复（默认 true）。",
    defaultValue: true,
  },
  "channels.feishu.historyLimit": { label: "历史消息限制", help: "加载的历史消息数量上限。" },
  "channels.feishu.dmHistoryLimit": { label: "私信历史限制", help: "私信历史消息数量上限。" },
  "channels.feishu.chunkMode": {
    label: "分块模式",
    help: '长消息分块策略："length" 按长度拆分，"newline" 按换行拆分。',
  },
  "channels.feishu.textChunkLimit": { label: "文本分块大小", help: "每个消息分块的最大字符数。" },
  "channels.feishu.renderMode": {
    label: "渲染模式",
    help: '消息渲染方式："auto" 自动选择，"raw" 纯文本，"card" 卡片消息。',
  },
  "channels.feishu.replyInThread": {
    label: "话题回复",
    help: '是否在消息话题中回复："disabled" 不使用话题，"enabled" 使用话题。',
  },
  "channels.feishu.topicSessionMode": {
    label: "话题会话模式",
    help: '话题会话隔离："disabled" 不隔离，"enabled" 每个话题独立会话。',
  },
  "channels.feishu.mediaMaxMb": {
    label: "媒体最大大小（MB）",
    help: "处理的最大媒体文件大小（MB）。",
  },
  "channels.feishu.defaultAccount": { label: "默认账号", help: "多账号时使用的默认账号 ID。" },
  "channels.feishu.encryptKey": { label: "默认加密密钥", help: "渠道级别的默认事件加密密钥。" },
  "channels.feishu.verificationToken": {
    label: "默认验证令牌",
    help: "渠道级别的默认事件验证令牌。",
  },
  "channels.feishu.webhookHost": {
    label: "默认 Webhook 主机",
    help: "渠道级别的默认 Webhook 回调主机。",
  },
  "channels.feishu.webhookPath": {
    label: "默认 Webhook 路径",
    help: "渠道级别的默认 Webhook 回调路径。",
  },
  "channels.feishu.webhookPort": {
    label: "默认 Webhook 端口",
    help: "渠道级别的默认 Webhook 回调端口。",
  },

  // ── Bindings ──
  bindings: { label: "绑定", help: "Agent路由绑定，将入站消息映射到指定Agent。" },
  "bindings[].agentId": { label: "绑定Agent ID", help: "绑定Agent ID。" },
  "bindings[].match": { label: "绑定匹配规则", help: "绑定匹配规则。" },
  "bindings[].match.channel": { label: "绑定渠道", help: "绑定渠道。" },
  "bindings[].match.accountId": { label: "绑定账号 ID", help: "绑定账号 ID。" },
  "bindings[].match.peer": { label: "绑定对等匹配", help: "绑定对等匹配。" },
  "bindings[].match.peer.kind": { label: "绑定对等类型", help: "绑定对等类型。" },
  "bindings[].match.peer.id": { label: "绑定对等 ID", help: "绑定对等 ID。" },
  "bindings[].match.guildId": { label: "绑定公会 ID", help: "绑定公会 ID。" },
  "bindings[].match.teamId": { label: "绑定团队 ID", help: "绑定团队 ID。" },
  "bindings[].match.roles": { label: "绑定角色", help: "绑定角色。" },

  // ── Cron ──
  cron: { label: "定时任务", help: "定时任务引擎配置，包括启用、存储、并发限制和自动重试。" },
  "cron.enabled": { label: "启用定时任务", help: "启用定时任务。" },
  "cron.store": { label: "定时任务存储路径", help: "定时任务存储路径。" },
  "cron.maxConcurrentRuns": { label: "定时任务最大并发运行", help: "定时任务最大并发运行。" },
  "cron.retry": { label: "定时任务重试策略", help: "定时任务重试策略。" },
  "cron.retry.maxAttempts": { label: "定时任务重试最大次数", help: "定时任务重试最大次数。" },
  "cron.retry.backoffMs": { label: "定时任务重试退避（毫秒）", help: "定时任务重试退避（毫秒）。" },
  "cron.retry.retryOn": { label: "定时任务重试错误类型", help: "定时任务重试错误类型。" },
  "cron.webhook": { label: "定时任务旧版 Webhook（已弃用）", help: "定时任务旧版 Webhook（已弃用）。" },
  "cron.webhookToken": { label: "定时任务 Webhook Bearer Token", help: "定时任务 Webhook Bearer Token。" },
  "cron.sessionRetention": { label: "定时任务会话保留", help: "定时任务会话保留。" },
  "cron.runLog": { label: "定时任务运行日志清理", help: "定时任务运行日志清理。" },
  "cron.runLog.maxBytes": { label: "定时任务运行日志最大字节数", help: "定时任务运行日志最大字节数。" },
  "cron.runLog.keepLines": { label: "定时任务运行日志保留行数", help: "定时任务运行日志保留行数。" },

  // ── Hooks ──
  hooks: { label: "钩子", help: "Webhook 和事件钩子。" },
  "hooks.enabled": { label: "启用钩子", help: "启用钩子端点和映射执行管线，用于处理入站 Webhook 请求。" },
  "hooks.path": { label: "钩子端点路径", help: "钩子端点在网关控制服务器上使用的 HTTP 路径。" },
  "hooks.token": { label: "钩子认证令牌", help: "钩子入站请求校验的共享 Bearer 令牌。" },
  "hooks.defaultSessionKey": { label: "钩子默认会话键", help: "钩子请求未提供会话键时使用的默认会话键。" },
  "hooks.allowRequestSessionKey": { label: "钩子允许请求会话键", help: "允许调用方在钩子请求中提供会话键，支持调用方控制的会话路由。" },
  "hooks.allowedSessionKeyPrefixes": { label: "钩子允许的会话键前缀", help: "允许的会话键前缀白名单，防止任意会话键注入。" },
  "hooks.allowedAgentIds": { label: "钩子允许的Agent ID", help: "允许钩子映射目标的 Agent ID 白名单。" },
  "hooks.maxBodyBytes": { label: "钩子最大请求体字节数", help: "Webhook 请求体的最大字节数，超过则拒绝请求。" },
  "hooks.presets": { label: "钩子预设", help: "预定义的钩子配置包，加载时应用标准映射和行为默认值。" },
  "hooks.transformsDir": { label: "钩子转换目录", help: "包含钩子转换脚本模块的目录路径。" },
  "hooks.mappings": { label: "钩子映射", help: "钩子路由映射列表，将入站请求指向特定 Agent 和操作。" },
  "hooks.gmail": { label: "Gmail 钩子", help: "Gmail 集成钩子设置，通过 Google Pub/Sub 接收邮件通知。" },
  "hooks.internal": { label: "内部钩子", help: "内部钩子设置，用于系统内部事件处理。" },
  "hooks.internal.enabled": { label: "启用内部钩子", help: "启用内部事件钩子处理管线。" },

  // ── Plugins ──
  plugins: { label: "插件", help: "插件管理和扩展。" },
  "plugins.enabled": { label: "启用插件", help: "插件系统主开关，禁用后所有插件停止加载。" },
  "plugins.allow": { label: "插件白名单", help: "允许加载的插件名称列表（空则允许所有）。" },
  "plugins.deny": { label: "插件黑名单", help: "禁止加载的插件名称列表。" },
  "plugins.load": { label: "插件加载器", help: "插件加载设置，包括搜索路径。" },
  "plugins.load.paths": { label: "插件加载路径", help: "插件搜索目录列表。" },
  "plugins.slots": { label: "插件槽位", help: "插件功能槽位配置，指定各功能使用的插件。" },
  "plugins.slots.memory": { label: "记忆插件", help: "记忆功能插槽，指定用于长期记忆存储的插件。" },
  "plugins.entries": { label: "插件条目", help: "已安装插件的配置条目列表。" },
  "plugins.entries.*.enabled": { label: "启用插件", help: "是否启用此插件。" },
  "plugins.entries.*.apiKey": { label: "插件 API 密钥", help: "插件使用的 API 密钥。" },
  "plugins.entries.*.env": { label: "插件环境变量", help: "传递给插件进程的环境变量。" },
  "plugins.entries.*.config": { label: "插件配置", help: "插件特定的配置对象。" },
  "plugins.installs": { label: "插件安装记录", help: "已安装插件的持久化记录。" },

  // ── Other ──
  nodeHost: { label: "节点主机", help: "节点主机设置，控制连接到中央网关的远程节点行为和能力。" },
  "nodeHost.browserProxy": { label: "节点浏览器代理", help: "节点浏览器代理设置。" },
  "nodeHost.browserProxy.enabled": { label: "启用节点浏览器代理", help: "启用后节点可代理浏览器操作。" },
  "nodeHost.browserProxy.allowProfiles": { label: "节点浏览器代理允许的配置文件", help: "允许代理使用的浏览器配置文件列表。" },
  media: { label: "媒体", help: "媒体处理控制。" },
  "media.preserveFilenames": { label: "保留媒体文件名", help: "启用后保留原始媒体文件名而不是生成随机名称。" },
  audio: { label: "音频", help: "音频输入/输出设置。" },
  "audio.transcription": { label: "音频转录", help: "音频转录设置，将语音消息转为文本。" },
  "audio.transcription.command": { label: "音频转录命令", help: "音频转录使用的外部命令。" },
  "audio.transcription.timeoutSeconds": { label: "音频转录超时（秒）", help: "音频转录的最大等待时间（秒）。" },
  broadcast: { label: "广播", help: "广播和通知设置。" },
  "broadcast.strategy": { label: "广播策略", help: "广播消息的投递策略。" },
  "broadcast.*": { label: "广播目标列表", help: "广播消息的目标渠道列表。" },
  skills: { label: "技能", help: "技能包和能力配置。" },
  "skills.load.watch": { label: "监视技能", help: "启用后监视技能文件变化并自动重新加载。" },
  "skills.load.watchDebounceMs": { label: "技能监视防抖（毫秒）", help: "技能文件变化检测的防抖间隔（毫秒）。" },
  ui: { label: "界面", help: "用户界面偏好设置。" },
  "ui.seamColor": { label: "强调色", help: "UI 界面的主强调色。" },
  "ui.assistant": { label: "助手外观", help: "AI 助手的外观设置。" },
  "ui.assistant.name": { label: "助手名称", help: "AI 助手的显示名称。" },
  "ui.assistant.avatar": { label: "助手头像", help: "AI 助手的头像 URL。" },
  acp: { label: "ACP", help: "ACP（Agent通信协议）会话管理设置。" },
  "acp.enabled": { label: "启用 ACP", help: "ACP 服务主开关。" },
  "acp.dispatch.enabled": { label: "启用 ACP 调度", help: "启用 ACP 调度服务。" },
  "acp.backend": { label: "ACP 后端", help: "ACP 后端服务配置。" },
  "acp.defaultAgent": { label: "ACP 默认Agent", help: "ACP 会话的默认 Agent ID。" },
  "acp.allowedAgents": { label: "ACP 允许的Agent", help: "允许在 ACP 会话中使用的 Agent ID 列表。" },
  "acp.maxConcurrentSessions": { label: "ACP 最大并发会话", help: "ACP 允许的最大并发会话数。" },
  "acp.stream": { label: "ACP 流", help: "ACP 流式传输设置。" },
  "acp.runtime.ttlMinutes": { label: "ACP 运行时 TTL（分钟）", help: "ACP 运行时实例的存活时间（分钟）。" },
  "acp.runtime.installCommand": { label: "ACP 运行时安装命令", help: "ACP 运行时的安装命令。" },
  web: { label: "Web 渠道", help: "Web 服务器和 API 设置。" },
  "web.enabled": { label: "启用 Web 渠道", help: "启用 Web 渠道以允许通过浏览器进行聊天。" },
  "web.heartbeatSeconds": { label: "Web 渠道心跳间隔（秒）", help: "Web 渠道客户端心跳间隔（秒）。" },
  discovery: { label: "发现", help: "服务发现和网络设置。" },
  "discovery.wideArea": { label: "广域发现", help: "广域网络服务发现设置。" },
  "discovery.wideArea.enabled": { label: "启用广域发现", help: "启用广域服务发现。" },
  "discovery.mdns": { label: "mDNS 发现", help: "mDNS 局域网服务发现设置。" },
  "discovery.mdns.mode": { label: "mDNS 发现模式", help: "mDNS 服务发现模式。" },
  canvasHost: { label: "Canvas 主机", help: "Canvas 渲染和显示设置。" },
  "canvasHost.enabled": { label: "启用 Canvas 主机", help: "启用 Canvas 渲染服务。" },
  "canvasHost.root": { label: "Canvas 主机根目录", help: "Canvas 内容的服务根目录。" },
  "canvasHost.port": { label: "Canvas 主机端口", help: "Canvas 服务器监听端口。" },
  "canvasHost.liveReload": { label: "Canvas 主机实时重载", help: "启用 Canvas 内容变化时自动重新加载。" },
  talk: { label: "语音", help: "语音和语音合成设置。" },
  "talk.voiceId": { label: "语音 ID", help: "文本转语音使用的语音 ID。" },
  "talk.voiceAliases": { label: "语音别名", help: "语音 ID 别名映射，用于简化语音选择。" },
  "talk.modelId": { label: "语音模型 ID", help: "文本转语音使用的模型 ID。" },
  "talk.outputFormat": { label: "语音输出格式", help: "语音输出的音频格式。" },
  "talk.interruptOnSpeech": { label: "语音打断", help: "用户说话时是否中断当前语音输出。" },
  "talk.provider": { label: "语音提供商", help: "文本转语音提供商。" },
  "talk.providers": { label: "语音提供商设置", help: "各语音提供商的详细配置。" },
  "talk.apiKey": { label: "语音 API 密钥", help: "语音服务的 API 密钥。" },

  // ── Additional Labels (Auto-generated) ──
  "memory.qmd.paths.path": {
    label: "QMD 路径",
    help: "定义 QMD 应扫描的根位置，使用绝对路径或 ~ 相对路径。",
  },
  "memory.qmd.paths.pattern": {
    label: "QMD 路径模式",
    help: "使用 glob 模式过滤每个已索引根下的文件（默认 **/*.md）。",
  },
  "memory.qmd.paths.name": {
    label: "QMD 路径名称",
    help: "为已索引路径设置稳定的集合名称，而非从文件系统位置派生。",
  },
  "acp.stream.coalesceIdleMs": { label: "ACP 流空闲合并（毫秒）", help: "流空闲时合并等待时间（毫秒）。" },
  "acp.stream.maxChunkChars": { label: "ACP 流最大块字符数", help: "每个流块的最大字符数。" },
  "acp.stream.repeatSuppression": { label: "ACP 流重复抑制", help: "启用后抑制流中的重复内容。" },
  "acp.stream.deliveryMode": { label: "ACP 流传输模式", help: "流内容的传输模式。" },
  "acp.stream.hiddenBoundarySeparator": { label: "ACP 流隐藏边界分隔符", help: "流中用于隐藏边界的分隔符。" },
  "acp.stream.maxOutputChars": { label: "ACP 流最大输出字符数", help: "流输出的最大字符数限制。" },
  "acp.stream.maxSessionUpdateChars": { label: "ACP 流最大会话更新字符数", help: "会话更新流的最大字符数限制。" },
  "acp.stream.tagVisibility": { label: "ACP 流标签可见性", help: "控制流中标签的可见性。" },
  "session.sendPolicy.rules[].action": {
    label: "会话发送规则操作",
    help: '规则决定为 "allow" 或 "deny"。',
  },
  "session.sendPolicy.rules[].match": {
    label: "会话发送规则匹配",
    help: "规则匹配条件定义，可组合渠道、聊天类型和键前缀约束。",
  },
  "session.sendPolicy.rules[].match.channel": {
    label: "会话发送规则渠道",
    help: "将规则匹配到特定渠道/提供商 ID。",
  },
  "session.sendPolicy.rules[].match.chatType": {
    label: "会话发送规则聊天类型",
    help: "将规则匹配到聊天类型（direct、group、thread）。",
  },
  "session.sendPolicy.rules[].match.keyPrefix": {
    label: "会话发送规则键前缀",
    help: "内部键标准化后匹配标准化会话键前缀。",
  },
  "session.sendPolicy.rules[].match.rawKeyPrefix": {
    label: "会话发送规则原始键前缀",
    help: "匹配原始未标准化的会话键前缀，用于精确全键策略定位。",
  },
  "hooks.mappings[].id": { label: "钩子映射 ID", help: "此钩子映射的唯一标识符。" },
  "hooks.mappings[].match": { label: "钩子映射匹配", help: "入站请求的匹配条件。" },
  "hooks.mappings[].match.path": { label: "钩子映射匹配路径", help: "按 URL 路径匹配入站请求。" },
  "hooks.mappings[].match.source": { label: "钩子映射匹配源", help: "按来源匹配入站请求。" },
  "hooks.mappings[].action": { label: "钩子映射操作", help: "匹配后执行的操作类型。" },
  "hooks.mappings[].wakeMode": { label: "钩子映射唤醒模式", help: "映射触发时的 Agent 唤醒模式。" },
  "hooks.mappings[].name": { label: "钩子映射名称", help: "映射的显示名称。" },
  "hooks.mappings[].agentId": { label: "钩子映射Agent ID", help: "映射目标 Agent 的 ID。" },
  "hooks.mappings[].sessionKey": { label: "钩子映射会话键", help: "此映射使用的会话键。" },
  "hooks.mappings[].messageTemplate": { label: "钩子映射消息模板", help: "映射生成消息的模板。" },
  "hooks.mappings[].textTemplate": { label: "钩子映射文本模板", help: "映射生成纯文本的模板。" },
  "hooks.mappings[].deliver": { label: "钩子映射投递回复", help: "是否将回复投递到指定渠道。" },
  "hooks.mappings[].allowUnsafeExternalContent": { label: "钩子映射允许不安全外部内容", help: "允许传递未经消毒的外部内容。" },
  "hooks.mappings[].channel": { label: "钩子映射投递渠道", help: "回复投递的目标渠道。" },
  "hooks.mappings[].to": { label: "钩子映射投递目标", help: "回复投递的目标地址。" },
  "hooks.mappings[].model": { label: "钩子映射模型覆盖", help: "此映射使用的模型覆盖。" },
  "hooks.mappings[].thinking": { label: "钩子映射思考覆盖", help: "此映射的思考模式覆盖。" },
  "hooks.mappings[].timeoutSeconds": { label: "钩子映射超时（秒）", help: "映射执行的超时时间（秒）。" },
  "hooks.mappings[].transform": { label: "钩子映射转换", help: "入站请求的转换脚本配置。" },
  "hooks.mappings[].transform.module": { label: "钩子转换模块", help: "转换脚本模块路径。" },
  "hooks.mappings[].transform.export": { label: "钩子转换导出", help: "转换模块的导出函数名。" },
  "hooks.gmail.account": { label: "Gmail 钩子账号", help: "Gmail 集成使用的账号。" },
  "hooks.gmail.label": { label: "Gmail 钩子标签", help: "监控的 Gmail 标签。" },
  "hooks.gmail.topic": { label: "Gmail 钩子 Pub/Sub 主题", help: "Google Pub/Sub 主题名称。" },
  "hooks.gmail.subscription": { label: "Gmail 钩子订阅", help: "Google Pub/Sub 订阅名称。" },
  "hooks.gmail.pushToken": { label: "Gmail 钩子推送令牌", help: "Gmail 推送通知的验证令牌。" },
  "hooks.gmail.hookUrl": { label: "Gmail 钩子回调 URL", help: "Gmail 推送通知的回调 URL。" },
  "hooks.gmail.includeBody": { label: "Gmail 钩子包含正文", help: "是否包含邮件正文内容。" },
  "hooks.gmail.maxBytes": { label: "Gmail 钩子最大请求体字节数", help: "Gmail 请求体的最大字节数。" },
  "hooks.gmail.renewEveryMinutes": { label: "Gmail 钩子续订间隔（分钟）", help: "Gmail watch 订阅的自动续订间隔。" },
  "hooks.gmail.allowUnsafeExternalContent": { label: "Gmail 钩子允许不安全外部内容", help: "允许传递未经消毒的邮件内容。" },
  "hooks.gmail.serve": { label: "Gmail 钩子本地服务器", help: "Gmail 钩子的本地 HTTP 服务器设置。" },
  "hooks.gmail.serve.bind": { label: "Gmail 钩子服务器绑定地址", help: "本地服务器绑定的网络地址。" },
  "hooks.gmail.serve.port": { label: "Gmail 钩子服务器端口", help: "本地服务器监听端口。" },
  "hooks.gmail.serve.path": { label: "Gmail 钩子服务器路径", help: "本地服务器的 HTTP 路径。" },
  "hooks.gmail.tailscale": { label: "Gmail 钩子 Tailscale", help: "Gmail 钩子的 Tailscale 隧道设置。" },
  "hooks.gmail.tailscale.mode": { label: "Gmail 钩子 Tailscale 模式", help: "Tailscale 隧道模式。" },
  "hooks.gmail.tailscale.path": { label: "Gmail 钩子 Tailscale 路径", help: "Tailscale 回调路径。" },
  "hooks.gmail.tailscale.target": { label: "Gmail 钩子 Tailscale 目标", help: "Tailscale 隧道目标地址。" },
  "hooks.gmail.model": { label: "Gmail 钩子模型覆盖", help: "Gmail 钩子使用的模型覆盖。" },
  "hooks.gmail.thinking": { label: "Gmail 钩子思考覆盖", help: "Gmail 钩子的思考模式覆盖。" },
  "hooks.internal.handlers": { label: "内部钩子处理器", help: "内部事件处理器列表。" },
  "hooks.internal.handlers[].event": { label: "内部钩子事件", help: "处理器监听的事件类型。" },
  "hooks.internal.handlers[].module": { label: "内部钩子模块", help: "处理器脚本模块路径。" },
  "hooks.internal.handlers[].export": { label: "内部钩子导出", help: "处理器模块的导出函数名。" },
  "hooks.internal.entries": { label: "内部钩子条目", help: "内部钩子的配置条目。" },
  "hooks.internal.load": { label: "内部钩子加载器", help: "内部钩子加载设置。" },
  "hooks.internal.load.extraDirs": { label: "内部钩子额外目录", help: "额外的内部钩子搜索目录。" },
  "hooks.internal.installs": { label: "内部钩子安装记录", help: "内部钩子的安装记录。" },
  "web.reconnect": { label: "Web 渠道重连策略", help: "Web 客户端断线重连策略。" },
  "web.reconnect.initialMs": { label: "Web 重连初始延迟（毫秒）", help: "首次重连的等待时间。" },
  "web.reconnect.maxMs": { label: "Web 重连最大延迟（毫秒）", help: "重连的最大等待时间。" },
  "web.reconnect.factor": { label: "Web 重连退避因子", help: "重连延迟的指数退避因子。" },
  "web.reconnect.jitter": { label: "Web 重连抖动", help: "重连延迟的随机抖动系数。" },
  "web.reconnect.maxAttempts": { label: "Web 重连最大尝试次数", help: "自动重连的最大尝试次数。" },
  "talk.providers.*.voiceId": { label: "语音提供商语音 ID", help: "语音提供商语音 ID。" },
  "talk.providers.*.voiceAliases": { label: "语音提供商语音别名", help: "语音提供商语音别名。" },
  "talk.providers.*.modelId": { label: "语音提供商模型 ID", help: "语音提供商模型 ID。" },
  "talk.providers.*.outputFormat": { label: "语音提供商输出格式", help: "语音提供商输出格式。" },
  "talk.providers.*.apiKey": { label: "语音提供商 API 密钥", help: "语音提供商 API 密钥。" },
  "channels.telegram.retry.attempts": { label: "Telegram 重试次数", help: "Telegram 重试次数。" },
  "channels.telegram.retry.minDelayMs": { label: "Telegram 重试最小延迟（毫秒）", help: "Telegram 重试最小延迟（毫秒）。" },
  "channels.telegram.retry.maxDelayMs": { label: "Telegram 重试最大延迟（毫秒）", help: "Telegram 重试最大延迟（毫秒）。" },
  "channels.telegram.retry.jitter": { label: "Telegram 重试抖动", help: "Telegram 重试抖动。" },
  "channels.telegram.network.autoSelectFamily": { label: "Telegram 自动选择地址族", help: "Telegram 自动选择地址族。" },
  "channels.telegram.timeoutSeconds": { label: "Telegram API 超时（秒）", help: "Telegram API 超时（秒）。" },
  "channels.telegram.capabilities.inlineButtons": { label: "Telegram 内联按钮", help: "Telegram 内联按钮。" },
  "channels.whatsapp.dmPolicy": { label: "WhatsApp 私信策略", help: "WhatsApp 私信策略。" },
  "channels.whatsapp.selfChatMode": { label: "WhatsApp 自用手机模式", help: "WhatsApp 自用手机模式。" },
  "channels.whatsapp.debounceMs": { label: "WhatsApp 消息防抖（毫秒）", help: "WhatsApp 消息防抖（毫秒）。" },
  "channels.whatsapp.configWrites": { label: "WhatsApp 配置写入", help: "WhatsApp 配置写入。" },
  "channels.signal.dmPolicy": { label: "Signal 私信策略", help: "Signal 私信策略。" },
  "channels.signal.configWrites": { label: "Signal 配置写入", help: "Signal 配置写入。" },
  "channels.imessage.dmPolicy": { label: "iMessage 私信策略", help: "iMessage 私信策略。" },
  "channels.imessage.configWrites": { label: "iMessage 配置写入", help: "iMessage 配置写入。" },
  "channels.bluebubbles.dmPolicy": { label: "BlueBubbles 私信策略", help: "BlueBubbles 私信策略。" },
  "channels.msteams.configWrites": { label: "MS Teams 配置写入", help: "MS Teams 配置写入。" },
  "channels.discord.dmPolicy": { label: "Discord 私信策略", help: "Discord 私信策略。" },
  "channels.discord.dm.policy": { label: "Discord 私信策略", help: "Discord 私信策略。" },
  "channels.discord.configWrites": { label: "Discord 配置写入", help: "Discord 配置写入。" },
  "channels.discord.proxy": { label: "Discord 代理 URL", help: "Discord 代理 URL。" },
  "channels.discord.commands.native": { label: "Discord 原生命令", help: "Discord 原生命令。" },
  "channels.discord.commands.nativeSkills": { label: "Discord 原生技能命令", help: "Discord 原生技能命令。" },
  "channels.discord.streaming": { label: "Discord 流式模式", help: "Discord 流式模式。" },
  "channels.discord.streamMode": { label: "Discord 流式模式（旧版）", help: "Discord 流式模式（旧版）。" },
  "channels.discord.draftChunk.minChars": { label: "Discord 草稿块最小字符数", help: "Discord 草稿块最小字符数。" },
  "channels.discord.draftChunk.maxChars": { label: "Discord 草稿块最大字符数", help: "Discord 草稿块最大字符数。" },
  "channels.discord.draftChunk.breakPreference": { label: "Discord 草稿块断行偏好", help: "Discord 草稿块断行偏好。" },
  "channels.discord.retry.attempts": { label: "Discord 重试次数", help: "Discord 重试次数。" },
  "channels.discord.retry.minDelayMs": { label: "Discord 重试最小延迟（毫秒）", help: "Discord 重试最小延迟（毫秒）。" },
  "channels.discord.retry.maxDelayMs": { label: "Discord 重试最大延迟（毫秒）", help: "Discord 重试最大延迟（毫秒）。" },
  "channels.discord.retry.jitter": { label: "Discord 重试抖动", help: "Discord 重试抖动。" },
  "channels.discord.maxLinesPerMessage": { label: "Discord 每条消息最大行数", help: "Discord 每条消息最大行数。" },
  "channels.discord.eventQueue.listenerTimeout": { label: "Discord 事件队列监听超时（毫秒）", help: "Discord 事件队列监听超时（毫秒）。" },
  "channels.discord.eventQueue.maxQueueSize": { label: "Discord 事件队列最大大小", help: "Discord 事件队列最大大小。" },
  "channels.discord.eventQueue.maxConcurrency": { label: "Discord 事件队列最大并发", help: "Discord 事件队列最大并发。" },
  "channels.discord.threadBindings.enabled": { label: "Discord 线程绑定启用", help: "Discord 线程绑定启用。" },
  "channels.discord.threadBindings.idleHours": { label: "Discord 线程绑定空闲超时（小时）", help: "Discord 线程绑定空闲超时（小时）。" },
  "channels.discord.threadBindings.maxAgeHours": { label: "Discord 线程绑定最大时长（小时）", help: "Discord 线程绑定最大时长（小时）。" },
  "channels.discord.threadBindings.spawnSubagentSessions": { label: "Discord 线程绑定子Agent派生", help: "Discord 线程绑定子Agent派生。" },
  "channels.discord.threadBindings.spawnAcpSessions": { label: "Discord 线程绑定 ACP 派生", help: "Discord 线程绑定 ACP 派生。" },
  "channels.discord.ui.components.accentColor": { label: "Discord 组件强调色", help: "Discord 组件强调色。" },
  "channels.discord.intents.presence": { label: "Discord 存在状态意图", help: "Discord 存在状态意图。" },
  "channels.discord.intents.guildMembers": { label: "Discord 公会成员意图", help: "Discord 公会成员意图。" },
  "channels.discord.voice.enabled": { label: "Discord 语音启用", help: "Discord 语音启用。" },
  "channels.discord.voice.autoJoin": { label: "Discord 语音自动加入", help: "Discord 语音自动加入。" },
  "channels.discord.voice.daveEncryption": { label: "Discord 语音 DAVE 加密", help: "Discord 语音 DAVE 加密。" },
  "channels.discord.voice.decryptionFailureTolerance": { label: "Discord 语音解密失败容错", help: "Discord 语音解密失败容错。" },
  "channels.discord.voice.tts": { label: "Discord 语音文本转语音", help: "Discord 语音文本转语音。" },
  "channels.discord.pluralkit.enabled": { label: "Discord PluralKit 启用", help: "Discord PluralKit 启用。" },
  "channels.discord.pluralkit.token": { label: "Discord PluralKit 令牌", help: "Discord PluralKit 令牌。" },
  "channels.discord.activity": { label: "Discord 存在状态活动", help: "Discord 存在状态活动。" },
  "channels.discord.status": { label: "Discord 存在状态", help: "Discord 存在状态。" },
  "channels.discord.activityType": { label: "Discord 存在状态活动类型", help: "Discord 存在状态活动类型。" },
  "channels.discord.activityUrl": { label: "Discord 存在状态活动 URL", help: "Discord 存在状态活动 URL。" },
  "channels.slack.dm.policy": { label: "Slack 私信策略", help: "Slack 私信策略。" },
  "channels.slack.dmPolicy": { label: "Slack 私信策略", help: "Slack 私信策略。" },
  "channels.slack.configWrites": { label: "Slack 配置写入", help: "Slack 配置写入。" },
  "channels.slack.commands.native": { label: "Slack 原生命令", help: "Slack 原生命令。" },
  "channels.slack.commands.nativeSkills": { label: "Slack 原生技能命令", help: "Slack 原生技能命令。" },
  "channels.slack.allowBots": { label: "Slack 允许机器人消息", help: "Slack 允许机器人消息。" },
  "channels.discord.token": { label: "Discord Bot 令牌", help: "Discord Bot 令牌。" },
  "channels.slack.botToken": { label: "Slack Bot 令牌", help: "Slack Bot 令牌。" },
  "channels.slack.appToken": { label: "Slack 应用令牌", help: "Slack 应用令牌。" },
  "channels.slack.userToken": { label: "Slack 用户令牌", help: "Slack 用户令牌。" },
  "channels.slack.userTokenReadOnly": { label: "Slack 用户令牌只读", help: "Slack 用户令牌只读。" },
  "channels.slack.streaming": { label: "Slack 流式模式", help: "Slack 流式模式。" },
  "channels.slack.nativeStreaming": { label: "Slack 原生流式", help: "Slack 原生流式。" },
  "channels.slack.streamMode": { label: "Slack 流式模式（旧版）", help: "Slack 流式模式（旧版）。" },
  "channels.slack.thread.historyScope": { label: "Slack 线程历史范围", help: "Slack 线程历史范围。" },
  "channels.slack.thread.inheritParent": { label: "Slack 线程父继承", help: "Slack 线程父继承。" },
  "channels.slack.thread.initialHistoryLimit": { label: "Slack 线程初始历史限制", help: "Slack 线程初始历史限制。" },
  "channels.mattermost.botToken": { label: "Mattermost Bot 令牌", help: "Mattermost Bot 令牌。" },
  "channels.mattermost.baseUrl": { label: "Mattermost 基础 URL", help: "Mattermost 基础 URL。" },
  "channels.mattermost.configWrites": { label: "Mattermost 配置写入", help: "Mattermost 配置写入。" },
  "channels.mattermost.chatmode": { label: "Mattermost 聊天模式", help: "Mattermost 聊天模式。" },
  "channels.mattermost.oncharPrefixes": { label: "Mattermost 触发字符前缀", help: "Mattermost 触发字符前缀。" },
  "channels.mattermost.requireMention": { label: "Mattermost 需要@提及", help: "Mattermost 需要@提及。" },
  "channels.signal.account": { label: "Signal 账号", help: "Signal 账号。" },
  "channels.imessage.cliPath": { label: "iMessage CLI 路径", help: "iMessage CLI 路径。" },
  "agents.list[].skills": { label: "Agent技能过滤", help: "Agent技能过滤。" },
  "agents.list[].identity.avatar": { label: "Agent头像", help: "Agent头像。" },
  "agents.list[].heartbeat.suppressToolErrorWarnings": { label: "Agent心跳抑制工具错误警告", help: "Agent心跳抑制工具错误警告。" },
  "agents.list[].sandbox.browser.network": { label: "Agent沙盒浏览器网络", help: "Agent沙盒浏览器网络。" },
  "agents.list[].sandbox.browser.cdpSourceRange": { label: "Agent沙盒浏览器 CDP 源端口范围", help: "Agent沙盒浏览器 CDP 源端口范围。" },
  "agents.list[].sandbox.docker.dangerouslyAllowContainerNamespaceJoin": {
    label: "Agent沙盒 Docker 允许容器命名空间连接",
  },
  "plugins.installs.*.source": { label: "插件安装来源", help: "插件安装来源。" },
  "plugins.installs.*.spec": { label: "插件安装规格", help: "插件安装规格。" },
  "plugins.installs.*.sourcePath": { label: "插件安装源路径", help: "插件安装源路径。" },
  "plugins.installs.*.installPath": { label: "插件安装路径", help: "插件安装路径。" },
  "plugins.installs.*.version": { label: "插件安装版本", help: "插件安装版本。" },
  "plugins.installs.*.resolvedName": { label: "插件解析包名", help: "插件解析包名。" },
  "plugins.installs.*.resolvedVersion": { label: "插件解析包版本", help: "插件解析包版本。" },
  "plugins.installs.*.resolvedSpec": { label: "插件解析包规格", help: "插件解析包规格。" },
  "plugins.installs.*.integrity": { label: "插件解析完整性", help: "插件解析完整性。" },
  "plugins.installs.*.shasum": { label: "插件解析 Shasum", help: "插件解析 Shasum。" },
  "plugins.installs.*.resolvedAt": { label: "插件解析时间", help: "插件解析时间。" },
  "plugins.installs.*.installedAt": { label: "插件安装时间", help: "插件安装时间。" },
};
