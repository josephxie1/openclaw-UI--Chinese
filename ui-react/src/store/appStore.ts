import { create } from "zustand";
import { loadSettings, saveSettings, type UiSettings } from "../lib/storage.ts";
// NOTE: applySettings is imported lazily to avoid pulling in the Lit-dependent module tree at evaluation time
import type { Tab } from "../lib/navigation.ts";
import type { GatewayBrowserClient, GatewayHelloOk } from "../lib/gateway.ts";
import type {
  AgentsListResult,
  AgentsFilesListResult,
  AgentIdentityResult,
  ConfigSnapshot,
  ConfigUiHints,
  CronJob,
  CronRunLogEntry,
  CronStatus,
  HealthSnapshot,
  LogEntry,
  LogLevel,
  PresenceEntry,
  ChannelsStatusSnapshot,
  SessionsListResult,
  SkillStatusReport,
  ToolsCatalogResult,
  StatusSummary,
} from "../lib/types.ts";
import type { ChatAttachment, ChatQueueItem, CronFormState } from "../lib/ui-types.ts";
import type { ResolvedTheme, ThemeMode } from "../lib/theme.ts";
import type { ToolStreamEntry, CompactionStatus, FallbackStatus } from "../lib/app-tool-stream.ts";
import type { DevicePairingList } from "../lib/controllers/devices.ts";
import type { ExecApprovalRequest } from "../lib/controllers/exec-approval.ts";
import type { ExecApprovalsFile, ExecApprovalsSnapshot } from "../lib/controllers/exec-approvals.ts";
import type { SkillMessage } from "../lib/controllers/skills.ts";
import type { CronFieldErrors } from "../lib/controllers/cron.ts";
import { normalizeAssistantIdentity } from "../lib/assistant-identity.ts";
import { DEFAULT_CRON_FORM, DEFAULT_LOG_LEVEL_FILTERS } from "../lib/app-defaults.ts";
import type { NostrProfileFormState } from "../lib/views/channels.nostr-profile-form.ts";
import type { ChannelPairingGroup } from "../lib/controllers/channel-pairing.ts";

// ---------------------------------------------------------------------------
// Re-export to avoid spreading imports everywhere
// ---------------------------------------------------------------------------
export type { UiSettings, Tab, GatewayBrowserClient, GatewayHelloOk };

const bootIdentity = normalizeAssistantIdentity({});

function resolveOnboardingMode(): boolean {
  const desktop = (window as unknown as Record<string, unknown>).desktop as
    | { isOnboarding?: boolean }
    | undefined;
  if (desktop?.isOnboarding) return true;
  if (!window.location.search) return false;
  const p = new URLSearchParams(window.location.search).get("onboarding");
  if (!p) return false;
  const n = p.trim().toLowerCase();
  return n === "1" || n === "true" || n === "yes" || n === "on";
}

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
export type AppState = {
  settings: UiSettings;
  tab: Tab;
  onboarding: boolean;
  theme: ThemeMode;
  themeResolved: ResolvedTheme;
  password: string;

  connected: boolean;
  hello: GatewayHelloOk | null;
  lastError: string | null;
  lastErrorCode: string | null;
  client: GatewayBrowserClient | null;
  basePath: string;
  pendingGatewayUrl: string | null;

  assistantName: string;
  assistantAvatar: string;
  assistantAgentId: string | null;

  wizardStep: number;
  wizardDirection: number;
  wizardAnimating: boolean;
  wizardPresetDropdownOpen: boolean;
  wizardModelDropdownOpen: boolean;
  wizardApiKeyVisible: boolean;
  wizardSaving: boolean;

  sessionKey: string;
  chatLoading: boolean;
  chatSending: boolean;
  chatMessage: string;
  chatMessages: unknown[];
  chatToolMessages: unknown[];
  chatStream: string | null;
  chatStreamStartedAt: number | null;
  chatRunId: string | null;
  compactionStatus: CompactionStatus | null;
  fallbackStatus: FallbackStatus | null;
  chatAvatarUrl: string | null;
  chatThinkingLevel: string | null;
  chatQueue: ChatQueueItem[];
  chatAttachments: ChatAttachment[];
  chatManualRefreshInFlight: boolean;
  chatNewMessagesBelow: boolean;
  /** Set of runIds to refresh sessions for after chat completes */
  refreshSessionsAfterChat: Set<string>;

  sidebarOpen: boolean;
  sidebarContent: string | null;
  sidebarError: string | null;
  splitRatio: number;

  nodesLoading: boolean;
  nodes: Array<Record<string, unknown>>;

  devicesLoading: boolean;
  devicesError: string | null;
  devicesList: DevicePairingList | null;

  execApprovalsLoading: boolean;
  execApprovalsSaving: boolean;
  execApprovalsDirty: boolean;
  execApprovalsSnapshot: ExecApprovalsSnapshot | null;
  execApprovalsForm: ExecApprovalsFile | null;
  execApprovalsSelectedAgent: string | null;
  execApprovalsTarget: "gateway" | "node";
  execApprovalsTargetNodeId: string | null;
  execApprovalQueue: ExecApprovalRequest[];
  execApprovalBusy: boolean;
  execApprovalError: string | null;

  configLoading: boolean;
  configRaw: string;
  configRawOriginal: string;
  configValid: boolean | null;
  configIssues: unknown[];
  configSaving: boolean;
  configApplying: boolean;
  updateRunning: boolean;
  applySessionKey: string;
  configSnapshot: ConfigSnapshot | null;
  configSchema: unknown;
  configSchemaVersion: string | null;
  configSchemaLoading: boolean;
  pluginSchemaCache: Record<string, unknown>;
  configUiHints: ConfigUiHints;
  configForm: Record<string, unknown> | null;
  configFormOriginal: Record<string, unknown> | null;
  configFormDirty: boolean;
  configRawLoading: boolean;
  configFormMode: "form" | "raw";
  configSearchQuery: string;
  configActiveSection: string | null;
  configActiveSubsection: string | null;
  modelsActiveSubsection: string | null;
  agentsConfigActiveSubsection: string | null;
  modelsQuickAddExpanded: boolean;
  modelsQuickAddForm: {
    provider: string;
    baseUrl: string;
    api: string;
    apiKey: string;
    models: Array<{ id: string; name: string; supportsImage?: boolean }>;
  };
  modelsQuickAddBusy: boolean;
  modelsQuickAddError: string | null;
  modelsQuickAddPreset: string;
  modelsQuickAddSelectedIds: string[];

  channelQuickAddExpanded: boolean;
  channelQuickAddBusy: boolean;
  channelQuickAddError: string | null;
  channelQuickAddForm: {
    channelType: "telegram" | "feishu" | "discord" | "whatsapp";
    accountId: string;
    botToken: string;
    telegramStreaming: boolean;
    telegramBlockStreaming: boolean;
    appId: string;
    appSecret: string;
    botName: string;
    discordToken: string;
    whatsappDmPolicy: "pairing" | "allowlist" | "open";
    whatsappAllowFrom: string;
    feishuRequireMention: boolean;
    feishuStreaming: boolean;
    feishuBlockStreaming: boolean;
    createAgent: boolean;
    agentId: string;
    agentName: string;
    agentEmoji: string;
    agentModel: string;
  };
  chAgentDropdownOpen: boolean;
  chModelDropdownOpen: boolean;
  chModelDropdownExpandedGroups: Set<string>;

  channelsLoading: boolean;
  channelsSnapshot: ChannelsStatusSnapshot | null;
  channelsError: string | null;
  channelsLastSuccess: number | null;
  whatsappLoginMessage: string | null;
  whatsappLoginQrDataUrl: string | null;
  whatsappLoginConnected: boolean | null;
  whatsappBusy: boolean;
  nostrProfileFormState: NostrProfileFormState | null;
  nostrProfileAccountId: string | null;

  presenceLoading: boolean;
  presenceEntries: PresenceEntry[];
  presenceError: string | null;
  presenceStatus: string | null;

  channelPairingsLoading: boolean;
  channelPairings: ChannelPairingGroup[];
  channelPairingsError: string | null;

  agentsLoading: boolean;
  agentsList: AgentsListResult | null;
  agentsError: string | null;
  agentsSelectedId: string | null;
  toolsCatalogLoading: boolean;
  toolsCatalogError: string | null;
  toolsCatalogResult: ToolsCatalogResult | null;
  agentsPanel: "overview" | "files" | "tools" | "skills" | "channels" | "cron" | "config";
  modelDropdownOpen: boolean;
  modelDropdownExpandedGroups: Set<string>;
  fallbackDropdownOpen: boolean;
  fallbackDropdownExpandedGroups: Set<string>;
  agentFilesLoading: boolean;
  agentFilesError: string | null;
  agentFilesList: AgentsFilesListResult | null;
  agentFileContents: Record<string, string>;
  agentFileDrafts: Record<string, string>;
  agentFileActive: string | null;
  agentFileSaving: boolean;
  agentIdentityLoading: boolean;
  agentIdentityError: string | null;
  agentIdentityById: Record<string, AgentIdentityResult>;
  agentSkillsLoading: boolean;
  agentSkillsError: string | null;
  agentSkillsReport: SkillStatusReport | null;
  agentSkillsAgentId: string | null;

  sessionsLoading: boolean;
  sessionsResult: SessionsListResult | null;
  sessionsError: string | null;
  sessionActivity: unknown;
  overviewCostDaily: unknown;
  overviewUsageResult: unknown;
  overviewWeekUsageResult: unknown;
  sessionsFilterActive: string;
  sessionsFilterLimit: string;
  sessionsIncludeGlobal: boolean;
  sessionsIncludeUnknown: boolean;
  sessionsHideCron: boolean;

  usageLoading: boolean;
  usageResult: unknown;
  usageCostSummary: unknown;
  usageError: string | null;
  usageStartDate: string;
  usageEndDate: string;
  usageSelectedSessions: string[];
  usageSelectedDays: string[];
  usageSelectedHours: number[];
  usageChartMode: "tokens" | "cost";
  usageDailyChartMode: "total" | "by-type";
  usageTimeSeriesMode: "cumulative" | "per-turn";
  usageTimeSeriesBreakdownMode: "total" | "by-type";
  usageTimeSeries: unknown;
  usageTimeSeriesLoading: boolean;
  usageTimeSeriesCursorStart: number | null;
  usageTimeSeriesCursorEnd: number | null;
  usageSessionLogs: unknown;
  usageSessionLogsLoading: boolean;
  usageSessionLogsExpanded: boolean;
  usageQuery: string;
  usageQueryDraft: string;
  usageSessionSort: "tokens" | "cost" | "recent" | "messages" | "errors";
  usageSessionSortDir: "desc" | "asc";
  usageRecentSessions: string[];
  usageTimeZone: "local" | "utc";
  usageContextExpanded: boolean;
  usageHeaderPinned: boolean;
  usageSessionsTab: "all" | "recent";
  usageVisibleColumns: string[];
  usageLogFilterRoles: unknown[];
  usageLogFilterTools: string[];
  usageLogFilterHasTools: boolean;
  usageLogFilterQuery: string;

  cronLoading: boolean;
  cronJobsLoadingMore: boolean;
  cronJobs: CronJob[];
  cronJobsTotal: number;
  cronJobsHasMore: boolean;
  cronJobsNextOffset: number | null;
  cronJobsLimit: number;
  cronJobsQuery: string;
  cronJobsEnabledFilter: string;
  cronJobsScheduleKindFilter: string;
  cronJobsLastStatusFilter: string;
  cronJobsSortBy: string;
  cronJobsSortDir: string;
  cronStatus: CronStatus | null;
  cronError: string | null;
  cronForm: CronFormState;
  cronFieldErrors: CronFieldErrors;
  cronEditingJobId: string | null;
  cronRunsJobId: string | null;
  cronRunsLoadingMore: boolean;
  cronRuns: CronRunLogEntry[];
  cronRunsTotal: number;
  cronRunsHasMore: boolean;
  cronRunsNextOffset: number | null;
  cronRunsLimit: number;
  cronRunsScope: string;
  cronRunsStatuses: string[];
  cronRunsDeliveryStatuses: string[];
  cronRunsStatusFilter: string;
  cronRunsQuery: string;
  cronRunsSortDir: string;
  cronModelSuggestions: string[];
  cronBusy: boolean;

  updateAvailable: unknown;

  skillsLoading: boolean;
  skillsReport: SkillStatusReport | null;
  skillsError: string | null;
  skillsFilter: string;
  skillEdits: Record<string, string>;
  skillsBusyKey: string | null;
  skillMessages: Record<string, SkillMessage>;

  clawhubQuery: string;
  clawhubResults: unknown[];
  clawhubLoading: boolean;
  clawhubInstalling: string | null;
  clawhubError: string | null;
  clawhubMessage: string | null;
  clawhubTokenMasked: string | null;
  clawhubTokenDraft: string;
  clawhubTokenSaving: boolean;

  debugLoading: boolean;
  debugStatus: StatusSummary | null;
  debugHealth: HealthSnapshot | null;
  debugModels: unknown[];
  debugHeartbeat: unknown;
  debugCallMethod: string;
  debugCallParams: string;
  debugCallResult: string | null;
  debugCallError: string | null;

  logsLoading: boolean;
  logsError: string | null;
  logsFile: string | null;
  logsEntries: LogEntry[];
  logsFilterText: string;
  logsLevelFilters: Record<LogLevel, boolean>;
  logsAutoFollow: boolean;
  logsTruncated: boolean;
  logsCursor: number | null;
  logsLastFetchAt: number | null;
  logsLimit: number;
  logsMaxBytes: number;
  logsAtBottom: boolean;

  toolStreamById: Map<string, ToolStreamEntry>;
  toolStreamOrder: string[];
  eventLog: Array<{ ts: number; event: string; payload?: unknown }>;
};

// ---------------------------------------------------------------------------
// Actions
// ---------------------------------------------------------------------------
export type AppActions = {
  set: (patch: Partial<AppState>) => void;
  applySettings: (next: UiSettings) => void;
};

// ---------------------------------------------------------------------------
// Initial state
// ---------------------------------------------------------------------------
function makeInitialState(): AppState {
  const settings = loadSettings();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  return {
    settings,
    tab: "chat",
    onboarding: resolveOnboardingMode(),
    theme: settings.theme ?? "system",
    themeResolved: "dark",
    password: "",

    connected: false,
    hello: null,
    lastError: null,
    lastErrorCode: null,
    client: null,
    basePath: "",
    pendingGatewayUrl: null,

    assistantName: bootIdentity.name,
    assistantAvatar: bootIdentity.avatar ?? "",
    assistantAgentId: bootIdentity.agentId ?? null,

    wizardStep: 1,
    wizardDirection: 1,
    wizardAnimating: false,
    wizardPresetDropdownOpen: false,
    wizardModelDropdownOpen: false,
    wizardApiKeyVisible: false,
    wizardSaving: false,

    sessionKey: settings.sessionKey,
    chatLoading: false,
    chatSending: false,
    chatMessage: "",
    chatMessages: [],
    chatToolMessages: [],
    chatStream: null,
    chatStreamStartedAt: null,
    chatRunId: null,
    compactionStatus: null,
    fallbackStatus: null,
    chatAvatarUrl: null,
    chatThinkingLevel: null,
    chatQueue: [],
    chatAttachments: [],
    chatManualRefreshInFlight: false,
    chatNewMessagesBelow: false,
    refreshSessionsAfterChat: new Set(),

    sidebarOpen: false,
    sidebarContent: null,
    sidebarError: null,
    splitRatio: settings.splitRatio,

    nodesLoading: false,
    nodes: [],
    devicesLoading: false,
    devicesError: null,
    devicesList: null,

    execApprovalsLoading: false,
    execApprovalsSaving: false,
    execApprovalsDirty: false,
    execApprovalsSnapshot: null,
    execApprovalsForm: null,
    execApprovalsSelectedAgent: null,
    execApprovalsTarget: "gateway",
    execApprovalsTargetNodeId: null,
    execApprovalQueue: [],
    execApprovalBusy: false,
    execApprovalError: null,

    configLoading: false,
    configRaw: "{\n}\n",
    configRawOriginal: "",
    configValid: null,
    configIssues: [],
    configSaving: false,
    configApplying: false,
    updateRunning: false,
    applySessionKey: settings.lastActiveSessionKey,
    configSnapshot: null,
    configSchema: null,
    configSchemaVersion: null,
    configSchemaLoading: false,
    pluginSchemaCache: {},
    configUiHints: {},
    configForm: null,
    configFormOriginal: null,
    configFormDirty: false,
    configRawLoading: false,
    configFormMode: "form",
    configSearchQuery: "",
    configActiveSection: null,
    configActiveSubsection: null,
    modelsActiveSubsection: null,
    agentsConfigActiveSubsection: null,
    modelsQuickAddExpanded: false,
    modelsQuickAddForm: {
      provider: "",
      baseUrl: "",
      api: "openai-completions",
      apiKey: "",
      models: [{ id: "", name: "" }],
    },
    modelsQuickAddBusy: false,
    modelsQuickAddError: null,
    modelsQuickAddPreset: "",
    modelsQuickAddSelectedIds: [],

    channelQuickAddExpanded: false,
    channelQuickAddBusy: false,
    channelQuickAddError: null,
    channelQuickAddForm: {
      channelType: "telegram",
      accountId: "",
      botToken: "",
      telegramStreaming: false,
      telegramBlockStreaming: true,
      appId: "",
      appSecret: "",
      botName: "",
      discordToken: "",
      whatsappDmPolicy: "pairing" as const,
      whatsappAllowFrom: "",
      feishuRequireMention: true,
      feishuStreaming: false,
      feishuBlockStreaming: true,
      createAgent: true,
      agentId: "",
      agentName: "",
      agentEmoji: "🤖",
      agentModel: "",
    },
    chAgentDropdownOpen: false,
    chModelDropdownOpen: false,
    chModelDropdownExpandedGroups: new Set(),

    channelsLoading: false,
    channelsSnapshot: null,
    channelsError: null,
    channelsLastSuccess: null,
    whatsappLoginMessage: null,
    whatsappLoginQrDataUrl: null,
    whatsappLoginConnected: null,
    whatsappBusy: false,
    nostrProfileFormState: null,
    nostrProfileAccountId: null,

    presenceLoading: false,
    presenceEntries: [],
    presenceError: null,
    presenceStatus: null,

    channelPairingsLoading: false,
    channelPairings: [],
    channelPairingsError: null,

    agentsLoading: false,
    agentsList: null,
    agentsError: null,
    agentsSelectedId: null,
    toolsCatalogLoading: false,
    toolsCatalogError: null,
    toolsCatalogResult: null,
    agentsPanel: "overview",
    modelDropdownOpen: false,
    modelDropdownExpandedGroups: new Set(),
    fallbackDropdownOpen: false,
    fallbackDropdownExpandedGroups: new Set(),
    agentFilesLoading: false,
    agentFilesError: null,
    agentFilesList: null,
    agentFileContents: {},
    agentFileDrafts: {},
    agentFileActive: null,
    agentFileSaving: false,
    agentIdentityLoading: false,
    agentIdentityError: null,
    agentIdentityById: {},
    agentSkillsLoading: false,
    agentSkillsError: null,
    agentSkillsReport: null,
    agentSkillsAgentId: null,

    sessionsLoading: false,
    sessionsResult: null,
    sessionsError: null,
    sessionActivity: null,
    overviewCostDaily: null,
    overviewUsageResult: null,
    overviewWeekUsageResult: null,
    sessionsFilterActive: "",
    sessionsFilterLimit: "120",
    sessionsIncludeGlobal: true,
    sessionsIncludeUnknown: false,
    sessionsHideCron: true,

    usageLoading: false,
    usageResult: null,
    usageCostSummary: null,
    usageError: null,
    usageStartDate: todayStr,
    usageEndDate: todayStr,
    usageSelectedSessions: [],
    usageSelectedDays: [],
    usageSelectedHours: [],
    usageChartMode: "tokens",
    usageDailyChartMode: "by-type",
    usageTimeSeriesMode: "per-turn",
    usageTimeSeriesBreakdownMode: "by-type",
    usageTimeSeries: null,
    usageTimeSeriesLoading: false,
    usageTimeSeriesCursorStart: null,
    usageTimeSeriesCursorEnd: null,
    usageSessionLogs: null,
    usageSessionLogsLoading: false,
    usageSessionLogsExpanded: false,
    usageQuery: "",
    usageQueryDraft: "",
    usageSessionSort: "recent",
    usageSessionSortDir: "desc",
    usageRecentSessions: [],
    usageTimeZone: "local",
    usageContextExpanded: false,
    usageHeaderPinned: false,
    usageSessionsTab: "all",
    usageVisibleColumns: ["channel", "agent", "provider", "model", "messages", "tools", "errors", "duration"],
    usageLogFilterRoles: [],
    usageLogFilterTools: [],
    usageLogFilterHasTools: false,
    usageLogFilterQuery: "",

    cronLoading: false,
    cronJobsLoadingMore: false,
    cronJobs: [],
    cronJobsTotal: 0,
    cronJobsHasMore: false,
    cronJobsNextOffset: null,
    cronJobsLimit: 50,
    cronJobsQuery: "",
    cronJobsEnabledFilter: "all",
    cronJobsScheduleKindFilter: "all",
    cronJobsLastStatusFilter: "all",
    cronJobsSortBy: "nextRunAtMs",
    cronJobsSortDir: "asc",
    cronStatus: null,
    cronError: null,
    cronForm: { ...DEFAULT_CRON_FORM },
    cronFieldErrors: {},
    cronEditingJobId: null,
    cronRunsJobId: null,
    cronRunsLoadingMore: false,
    cronRuns: [],
    cronRunsTotal: 0,
    cronRunsHasMore: false,
    cronRunsNextOffset: null,
    cronRunsLimit: 50,
    cronRunsScope: "all",
    cronRunsStatuses: [],
    cronRunsDeliveryStatuses: [],
    cronRunsStatusFilter: "all",
    cronRunsQuery: "",
    cronRunsSortDir: "desc",
    cronModelSuggestions: [],
    cronBusy: false,

    updateAvailable: null,

    skillsLoading: false,
    skillsReport: null,
    skillsError: null,
    skillsFilter: "",
    skillEdits: {},
    skillsBusyKey: null,
    skillMessages: {},

    clawhubQuery: "",
    clawhubResults: [],
    clawhubLoading: false,
    clawhubInstalling: null,
    clawhubError: null,
    clawhubMessage: null,
    clawhubTokenMasked: null,
    clawhubTokenDraft: "",
    clawhubTokenSaving: false,

    debugLoading: false,
    debugStatus: null,
    debugHealth: null,
    debugModels: [],
    debugHeartbeat: null,
    debugCallMethod: "",
    debugCallParams: "{}",
    debugCallResult: null,
    debugCallError: null,

    logsLoading: false,
    logsError: null,
    logsFile: null,
    logsEntries: [],
    logsFilterText: "",
    logsLevelFilters: { ...DEFAULT_LOG_LEVEL_FILTERS },
    logsAutoFollow: true,
    logsTruncated: false,
    logsCursor: null,
    logsLastFetchAt: null,
    logsLimit: 500,
    logsMaxBytes: 250_000,
    logsAtBottom: true,

    toolStreamById: new Map(),
    toolStreamOrder: [],
    eventLog: [],
  };
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------
export const useAppStore = create<AppState & AppActions>()((setState) => ({
  ...makeInitialState(),

  // ---------------------------------------------------------------------------
  // LitElement-compatible shims — the lib layer (app-render.ts, app-scroll.ts,
  // app-render.helpers.ts) calls these methods on the state host object.
  // In Lit, the host is a LitElement with DOM methods; in React, we shim them.
  // ---------------------------------------------------------------------------
  /** Lit's updateComplete — resolves immediately in React */
  updateComplete: Promise.resolve(),
  /** Lit's requestUpdate — no-op in React (Zustand handles reactivity) */
  requestUpdate() { /* no-op */ },
  /** querySelector — delegate to document in React */
  querySelector(sel: string) { return document.querySelector(sel); },
  /** style — delegate to root element */
  get style() { return document.documentElement.style; },
  /** resetToolStream — imported lazily to avoid circular deps */
  resetToolStream() {
    void import("../lib/app-tool-stream.ts").then(({ resetToolStream: rst }) => {
      rst(useAppStore.getState() as never);
    });
  },
  /** scrollToBottom — use scheduleChatScroll */
  scrollToBottom(opts?: { smooth?: boolean }) {
    void import("../lib/app-scroll.ts").then(({ resetChatScroll, scheduleChatScroll }) => {
      const host = useAppStore.getState() as never;
      resetChatScroll(host);
      scheduleChatScroll(host, true, Boolean(opts?.smooth));
    });
  },
  /** connect — reconnect the gateway */
  connect() {
    // The React version reconnects by having useGateway re-mount; this is best-effort.
    void import("../lib/app-gateway.ts").then(({ connectGateway }) => {
      connectGateway(useAppStore.getState() as never);
    });
  },

  set: (patch: Partial<AppState>) =>
    setState((s) => ({ ...s, ...patch })),

  applySettings: (next: UiSettings) => {
    // Immediately apply theme to DOM (synchronous — no flicker/refresh needed)
    const resolved: ResolvedTheme =
      next.theme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : next.theme;
    document.documentElement.dataset.theme = resolved;
    document.documentElement.style.colorScheme = resolved;

    // Optimistic: update Zustand state + persist immediately
    saveSettings(next);
    setState((s) => ({ ...s, settings: next, theme: next.theme, themeResolved: resolved }));

    // Async: run full lib applySettings for side-effects (polling, tab sync, etc.)
    void import("../lib/app-settings.ts").then(({ applySettings: libApplySettings }) => {
      const host = useAppStore.getState() as Record<string, unknown>;
      libApplySettings(host as never, next);
      setState((s) => ({
        ...s,
        settings: host.settings as UiSettings,
        theme: (host.theme ?? s.theme) as ThemeMode,
        themeResolved: (host.themeResolved ?? s.themeResolved) as ResolvedTheme,
        applySessionKey: (host.applySessionKey ?? s.applySessionKey) as string,
      }));
    });
  },
}));

/** Convenience selector — returns a single value from state */
export function useAppState<K extends keyof AppState>(key: K): AppState[K] {
  return useAppStore((s) => s[key]);
}

// ---------------------------------------------------------------------------
// Reactive proxy — bridges Lit's mutation-based reactivity with Zustand
// ---------------------------------------------------------------------------
// Lit controller functions (loadChatHistory, sendChatMessage, handleChatEvent,
// etc.) directly mutate properties like `state.chatMessages = [...]`. In Lit,
// this triggers `requestUpdate()`. In Zustand, we need `setState()`.
//
// This proxy intercepts property sets and batches them into setState calls.
// It is a MODULE-LEVEL SINGLETON — all callers share the same proxy and the
// same pending-patch buffer, so writes from one function are immediately
// visible to reads in another function.
// ---------------------------------------------------------------------------
let _reactiveProxy: (AppState & AppActions) | null = null;
let _pendingPatch: Record<string, unknown> = {};
let _flushScheduled = false;

function flushPatch() {
  _flushScheduled = false;
  if (Object.keys(_pendingPatch).length === 0) return;
  const patch = _pendingPatch;
  _pendingPatch = {};
  useAppStore.setState((s) => ({ ...s, ...patch }));
}

/**
 * Force-flush any pending property mutations to the Zustand store immediately.
 * Call this before reading state that other React components depend on.
 */
export function flushReactiveState() {
  flushPatch();
}

/**
 * Returns a Proxy-wrapped version of the Zustand store state.
 * Property reads come from the live store (with pending-patch overlay);
 * property writes are batched and flushed via `setState` on a microtask,
 * so Lit-style mutation patterns trigger React re-renders.
 */
export function getReactiveState(): AppState & AppActions {
  if (_reactiveProxy) return _reactiveProxy;
  _reactiveProxy = new Proxy({} as AppState & AppActions, {
    get(_target, prop, _receiver) {
      // Prefer pending patch values (for reads-after-writes within the same task)
      if (prop in _pendingPatch) return _pendingPatch[prop as string];
      return (useAppStore.getState() as Record<string, unknown>)[prop as string];
    },
    set(_target, prop, value) {
      _pendingPatch[prop as string] = value;
      if (!_flushScheduled) {
        _flushScheduled = true;
        queueMicrotask(flushPatch);
      }
      return true;
    },
    has(_target, prop) {
      if (prop in _pendingPatch) return true;
      return prop in useAppStore.getState();
    },
  });
  return _reactiveProxy;
}
