import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import { renderDropdown, renderMultiDropdown } from "../components/dropdown.ts";
import type { ConfigUiHints } from "../types.ts";
import type {
  AgentIdentityResult,
  AgentsFilesListResult,
  AgentsListResult,
  ChannelsStatusSnapshot,
  CronJob,
  CronStatus,
  SkillStatusReport,
  ToolsCatalogResult,
} from "../types.ts";
import {
  renderAgentFiles,
  renderAgentChannels,
  renderAgentCron,
} from "./agents-panels-status-files.ts";
import { renderAgentTools, renderAgentSkills } from "./agents-panels-tools-skills.ts";
import { analyzeConfigSchema, renderNode, schemaType, type JsonSchema } from "./config-form.ts";
import {
  agentBadgeText,
  buildAgentContext,
  resolveGroupedModels,
  normalizeAgentLabel,
  normalizeModelValue,
  resolveAgentConfig,
  resolveAgentAvatarSrc,
  resolveAgentEmoji,
  resolveEffectiveModelFallbacks,
  resolveModelLabel,
  resolveModelPrimary,
} from "./agents-utils.ts";

// ── Module-level avatar preview map ──────────────────────────────────────────
// Stores data URIs set locally this session so they show immediately, before
// any gateway cache/reload cycle. Keyed by agentId.
export const _avatarPreviewMap = new Map<string, string>();

function resolveDisplayAvatarSrc(
  agent: Parameters<typeof resolveAgentAvatarSrc>[0],
  agentIdentity: Parameters<typeof resolveAgentAvatarSrc>[1],
): string | null {
  const preview = _avatarPreviewMap.get(agent.id);
  if (preview) return preview;
  return resolveAgentAvatarSrc(agent, agentIdentity);
}

// Mapa de canal → ruta al SVG de ícono
const CHANNEL_ICON_MAP: Record<string, string> = {
  telegram: "/Telegram_(software)-Logo.wine.svg",
  whatsapp: "/whatsapp-color-svgrepo-com.svg",
  discord: "/discord-svgrepo-com.svg",
  feishu: "/feishu-logo.svg",
};

/** Extrae los tipos de canal vinculados a un agent desde configForm.routing.bindings */
function resolveAgentChannelTypes(
  agentId: string,
  configForm: Record<string, unknown> | null,
  channelsSnapshot: ChannelsStatusSnapshot | null,
): string[] {
  const channelTypes = new Set<string>();

  // Fuente 1: routing.bindings (configuración explícita)
  const routing = (configForm?.routing ?? {}) as Record<string, unknown>;
  const bindings = routing.bindings;
  if (Array.isArray(bindings)) {
    for (const b of bindings) {
      if (b && typeof b === "object" && "agentId" in b && "match" in b) {
        const binding = b as { agentId?: string; match?: { channel?: string } };
        if (binding.agentId?.toLowerCase() === agentId.toLowerCase() && binding.match?.channel) {
          channelTypes.add(binding.match.channel);
        }
      }
    }
  }

  // Fuente 2: channelAccounts (canales que tienen cuentas activas para el agente)
  if (channelsSnapshot?.channelAccounts) {
    for (const [channelId, accounts] of Object.entries(channelsSnapshot.channelAccounts)) {
      if (!Array.isArray(accounts)) continue;
      for (const acct of accounts) {
        if (acct.accountId?.toLowerCase() === agentId.toLowerCase()) {
          channelTypes.add(channelId);
        }
      }
    }
  }

  return Array.from(channelTypes);
}

export type AgentsPanel = "overview" | "files" | "tools" | "skills" | "channels" | "cron" | "config";

export type AgentsProps = {
  loading: boolean;
  error: string | null;
  agentsList: AgentsListResult | null;
  selectedAgentId: string | null;
  activePanel: AgentsPanel;
  configForm: Record<string, unknown> | null;
  configSchema: unknown;
  configSchemaLoading: boolean;
  configUiHints: import("../types.ts").ConfigUiHints;
  configLoading: boolean;
  configSaving: boolean;
  configDirty: boolean;
  onConfigPatch: (path: Array<string | number>, value: unknown) => void;
  channelsLoading: boolean;
  channelsError: string | null;
  channelsSnapshot: ChannelsStatusSnapshot | null;
  channelsLastSuccess: number | null;
  cronLoading: boolean;
  cronStatus: CronStatus | null;
  cronJobs: CronJob[];
  cronError: string | null;
  agentFilesLoading: boolean;
  agentFilesError: string | null;
  agentFilesList: AgentsFilesListResult | null;
  agentFileActive: string | null;
  agentFileContents: Record<string, string>;
  agentFileDrafts: Record<string, string>;
  agentFileSaving: boolean;
  agentIdentityLoading: boolean;
  agentIdentityError: string | null;
  agentIdentityById: Record<string, AgentIdentityResult>;
  agentSkillsLoading: boolean;
  agentSkillsReport: SkillStatusReport | null;
  agentSkillsError: string | null;
  agentSkillsAgentId: string | null;
  toolsCatalogLoading: boolean;
  toolsCatalogError: string | null;
  toolsCatalogResult: ToolsCatalogResult | null;
  skillsFilter: string;
  modelDropdownOpen: boolean;
  modelDropdownExpandedGroups: Set<string>;
  onRefresh: () => void;
  onSelectAgent: (agentId: string) => void;
  onSelectPanel: (panel: AgentsPanel) => void;
  onLoadFiles: (agentId: string) => void;
  onSelectFile: (name: string) => void;
  onFileDraftChange: (name: string, content: string) => void;
  onFileReset: (name: string) => void;
  onFileSave: (name: string) => void;
  onToolsProfileChange: (agentId: string, profile: string | null, clearAllow: boolean) => void;
  onToolsOverridesChange: (agentId: string, alsoAllow: string[], deny: string[]) => void;
  onConfigReload: () => void;
  onConfigSave: () => void;
  onModelChange: (agentId: string, modelId: string | null) => void;
  onModelFallbacksChange: (agentId: string, fallbacks: string[]) => void;
  onModelDropdownToggle: () => void;
  onModelDropdownGroupToggle: (label: string) => void;
  fallbackDropdownOpen: boolean;
  fallbackDropdownExpandedGroups: Set<string>;
  onFallbackDropdownToggle: () => void;
  onFallbackDropdownGroupToggle: (label: string) => void;
  onChannelsRefresh: () => void;
  onCronRefresh: () => void;
  onSkillsFilterChange: (next: string) => void;
  onSkillsRefresh: () => void;
  onAgentSkillToggle: (agentId: string, skillName: string, enabled: boolean) => void;
  onAgentSkillsClear: (agentId: string) => void;
  onAgentSkillsDisableAll: (agentId: string) => void;
  onAvatarUrlChange: (agentId: string, url: string) => void;
  onGlobalSettings: () => void;
};

export type AgentContext = {
  workspace: string;
  model: string;
  identityName: string;
  identityEmoji: string;
  skillsLabel: string;
  isDefault: boolean;
};

export function renderAgents(props: AgentsProps) {
  const agents = props.agentsList?.agents ?? [];
  const defaultId = props.agentsList?.defaultId ?? null;
  const selectedId = props.selectedAgentId ?? defaultId ?? agents[0]?.id ?? null;
  const selectedAgent = selectedId
    ? (agents.find((agent) => agent.id === selectedId) ?? null)
    : null;

  return html`
    <div class="agents-layout">
      <section class="card agents-sidebar">
        <div class="row" style="justify-content: space-between;">
          <div>
            <div class="card-title">${t("agentsView.agents")}</div>
            <div class="card-sub">${t("agentsView.configured", { count: String(agents.length) })}</div>
          </div>
          <button class="btn btn--sm" @click=${props.onGlobalSettings}>
            ${t("agentsView.globalSettings") ?? "全局设置"}
          </button>
          <button class="btn btn--sm" ?disabled=${props.loading} @click=${props.onRefresh}>
            ${props.loading ? t("shared.loading") : t("shared.refresh")}
          </button>
        </div>
        ${
          props.error
            ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
            : nothing
        }
        <div class="agent-list" style="margin-top: 12px;">
          ${
            agents.length === 0
              ? html`
                  <div class="muted">${t("agentsView.noAgentsFound")}</div>
                `
              : agents.map((agent) => {
                  const badge = agentBadgeText(agent.id, defaultId);
                  const emoji = resolveAgentEmoji(agent, props.agentIdentityById[agent.id] ?? null);
                  const avatarSrc = resolveDisplayAvatarSrc(
                    agent,
                    props.agentIdentityById[agent.id] ?? null,
                  );
                  const boundChannels = resolveAgentChannelTypes(
                    agent.id,
                    props.configForm,
                    props.channelsSnapshot,
                  );
                  return html`
                    <button
                      type="button"
                      class="agent-row ${selectedId === agent.id ? "active" : ""}"
                      @click=${() => props.onSelectAgent(agent.id)}
                    >
                      ${
                        avatarSrc
                          ? html`<img class="agent-avatar" src="${avatarSrc}" alt="${normalizeAgentLabel(agent)}" />`
                          : html`<div class="agent-avatar">${emoji || normalizeAgentLabel(agent).slice(0, 1)}</div>`
                      }
                      <div class="agent-info">
                        <div class="agent-title">${normalizeAgentLabel(agent)}</div>
                        <div class="agent-sub mono">${agent.id}</div>
                        ${boundChannels.length > 0
                          ? html`
                            <div class="agent-channels-row">
                              ${boundChannels.map((ch) => {
                                const iconSrc = CHANNEL_ICON_MAP[ch];
                                return iconSrc
                                  ? html`<img class="agent-channel-icon" src="${iconSrc}" alt="${ch}" title="${ch}" width="14" height="14" />`
                                  : html`<span class="agent-channel-text" title="${ch}">${ch}</span>`;
                              })}
                            </div>
                          `
                          : nothing
                        }
                      </div>
                      ${badge ? html`<span class="agent-pill">${badge}</span>` : nothing}
                    </button>
                  `;
                })
          }
        </div>
      </section>
      <section class="agents-main">
        ${
          !selectedAgent
            ? html`
                <div class="card">
                  <div class="card-title">${t("agentsView.selectAgent")}</div>
                  <div class="card-sub">${t("agentsView.selectAgentSub")}</div>
                </div>
              `
            : html`
                ${renderAgentHeader(
                  selectedAgent,
                  defaultId,
                  props.agentIdentityById[selectedAgent.id] ?? null,
                  {
                    configForm: props.configForm,
                    configSaving: props.configSaving,
                    onAvatarUrlChange: props.onAvatarUrlChange,
                    onConfigSave: props.onConfigSave,
                  },
                )}
                ${renderAgentTabs(props.activePanel, (panel) => props.onSelectPanel(panel))}
                ${
                  props.activePanel === "overview"
                    ? renderAgentOverview({
                        agent: selectedAgent,
                        defaultId,
                        configForm: props.configForm,
                        agentFilesList: props.agentFilesList,
                        agentIdentity: props.agentIdentityById[selectedAgent.id] ?? null,
                        agentIdentityError: props.agentIdentityError,
                        agentIdentityLoading: props.agentIdentityLoading,
                        configLoading: props.configLoading,
                        configSaving: props.configSaving,
                        configDirty: props.configDirty,
                        modelDropdownOpen: props.modelDropdownOpen,
                        modelDropdownExpandedGroups: props.modelDropdownExpandedGroups,
                        onConfigReload: props.onConfigReload,
                        onConfigSave: props.onConfigSave,
                        onModelChange: props.onModelChange,
                        onModelFallbacksChange: props.onModelFallbacksChange,
                        onModelDropdownToggle: props.onModelDropdownToggle,
                        onModelDropdownGroupToggle: props.onModelDropdownGroupToggle,
                        fallbackDropdownOpen: props.fallbackDropdownOpen,
                        fallbackDropdownExpandedGroups: props.fallbackDropdownExpandedGroups,
                        onFallbackDropdownToggle: props.onFallbackDropdownToggle,
                        onFallbackDropdownGroupToggle: props.onFallbackDropdownGroupToggle,
                        onAvatarUrlChange: props.onAvatarUrlChange,
                      })
                    : nothing
                }
                ${
                  props.activePanel === "files"
                    ? renderAgentFiles({
                        agentId: selectedAgent.id,
                        agentFilesList: props.agentFilesList,
                        agentFilesLoading: props.agentFilesLoading,
                        agentFilesError: props.agentFilesError,
                        agentFileActive: props.agentFileActive,
                        agentFileContents: props.agentFileContents,
                        agentFileDrafts: props.agentFileDrafts,
                        agentFileSaving: props.agentFileSaving,
                        onLoadFiles: props.onLoadFiles,
                        onSelectFile: props.onSelectFile,
                        onFileDraftChange: props.onFileDraftChange,
                        onFileReset: props.onFileReset,
                        onFileSave: props.onFileSave,
                      })
                    : nothing
                }
                ${
                  props.activePanel === "tools"
                    ? renderAgentTools({
                        agentId: selectedAgent.id,
                        configForm: props.configForm,
                        configLoading: props.configLoading,
                        configSaving: props.configSaving,
                        configDirty: props.configDirty,
                        toolsCatalogLoading: props.toolsCatalogLoading,
                        toolsCatalogError: props.toolsCatalogError,
                        toolsCatalogResult: props.toolsCatalogResult,
                        onProfileChange: props.onToolsProfileChange,
                        onOverridesChange: props.onToolsOverridesChange,
                        onConfigReload: props.onConfigReload,
                        onConfigSave: props.onConfigSave,
                      })
                    : nothing
                }
                ${
                  props.activePanel === "skills"
                    ? renderAgentSkills({
                        agentId: selectedAgent.id,
                        report: props.agentSkillsReport,
                        loading: props.agentSkillsLoading,
                        error: props.agentSkillsError,
                        activeAgentId: props.agentSkillsAgentId,
                        configForm: props.configForm,
                        configLoading: props.configLoading,
                        configSaving: props.configSaving,
                        configDirty: props.configDirty,
                        filter: props.skillsFilter,
                        onFilterChange: props.onSkillsFilterChange,
                        onRefresh: props.onSkillsRefresh,
                        onToggle: props.onAgentSkillToggle,
                        onClear: props.onAgentSkillsClear,
                        onDisableAll: props.onAgentSkillsDisableAll,
                        onConfigReload: props.onConfigReload,
                        onConfigSave: props.onConfigSave,
                      })
                    : nothing
                }
                ${
                  props.activePanel === "channels"
                    ? renderAgentChannels({
                        context: buildAgentContext(
                          selectedAgent,
                          props.configForm,
                          props.agentFilesList,
                          defaultId,
                          props.agentIdentityById[selectedAgent.id] ?? null,
                        ),
                        configForm: props.configForm,
                        snapshot: props.channelsSnapshot,
                        loading: props.channelsLoading,
                        error: props.channelsError,
                        lastSuccess: props.channelsLastSuccess,
                        onRefresh: props.onChannelsRefresh,
                      })
                    : nothing
                }
                ${
                  props.activePanel === "cron"
                    ? renderAgentCron({
                        context: buildAgentContext(
                          selectedAgent,
                          props.configForm,
                          props.agentFilesList,
                          defaultId,
                          props.agentIdentityById[selectedAgent.id] ?? null,
                        ),
                        agentId: selectedAgent.id,
                        jobs: props.cronJobs,
                        status: props.cronStatus,
                        loading: props.cronLoading,
                        error: props.cronError,
                        onRefresh: props.onCronRefresh,
                      })
                    : nothing
                }
              `
        }
      </section>
    </div>
  `;
}

function renderAgentHeader(
  agent: AgentsListResult["agents"][number],
  defaultId: string | null,
  agentIdentity: AgentIdentityResult | null,
  opts?: {
    configForm: Record<string, unknown> | null;
    configSaving: boolean;
    onAvatarUrlChange: (agentId: string, url: string) => void;
    onConfigSave: () => void;
  },
) {
  const badge = agentBadgeText(agent.id, defaultId);
  const displayName = normalizeAgentLabel(agent);
  const subtitle = agent.identity?.theme?.trim() || t("agentsView.defaultSubtitle");
  const emoji = resolveAgentEmoji(agent, agentIdentity);
  const avatarSrc = resolveDisplayAvatarSrc(agent, agentIdentity);

  // Resolve current config avatar URL for the input
  const configEntry = opts?.configForm
    ? (resolveAgentConfig(opts.configForm, agent.id).entry as Record<string, unknown> | undefined)
    : undefined;
  const configAvatarUrl =
    configEntry?.identity &&
    typeof (configEntry.identity as Record<string, unknown>)?.avatar === "string"
      ? ((configEntry.identity as Record<string, unknown>).avatar as string)
      : "";

  const handleUrlInput = (e: Event) => {
    if (!opts) return;
    const url = (e.target as HTMLInputElement).value.trim();
    if (url) {
      _avatarPreviewMap.set(agent.id, url);
    } else {
      _avatarPreviewMap.delete(agent.id);
    }
    opts.onAvatarUrlChange(agent.id, url);
  };

  const handleUrlCommit = () => {
    if (!opts) return;
    opts.onConfigSave();
  };

  return html`
    <section class="card agent-header">
      <div class="agent-header-main">
        ${
          avatarSrc
            ? html`<img class="agent-avatar agent-avatar--lg" src="${avatarSrc}" alt="${displayName}" />`
            : html`<div class="agent-avatar agent-avatar--lg">${emoji || displayName.slice(0, 1)}</div>`
        }
        <div style="min-width:0;flex:1;">
          <div class="card-title">${displayName}</div>
          <div class="card-sub">${subtitle}</div>
          ${opts ? html`
            <div style="display:flex;align-items:center;gap:6px;margin-top:6px;">
              <input
                class="input"
                type="url"
                placeholder="头像 URL (https://...)"
                .value=${configAvatarUrl}
                ?disabled=${opts.configSaving}
                @input=${handleUrlInput}
                @blur=${handleUrlCommit}
                @keydown=${(e: KeyboardEvent) => { if (e.key === "Enter") { (e.target as HTMLInputElement).blur(); } }}
                style="font-size:11px;flex:1;min-width:0;height:26px;padding:0 8px;"
              />
            </div>
          ` : nothing}
        </div>
      </div>
      <div class="agent-header-meta">
        <div class="mono">${agent.id}</div>
        ${badge ? html`<span class="agent-pill">${badge}</span>` : nothing}
      </div>
    </section>
  `;
}

function renderAgentTabs(active: AgentsPanel, onSelect: (panel: AgentsPanel) => void) {
  const tabs: Array<{ id: AgentsPanel; label: string }> = [
    { id: "overview", label: t("agentsView.overview") },
    { id: "files", label: t("agentsView.files") },
    { id: "tools", label: t("agentsView.tools") },
    { id: "skills", label: t("agentsView.skills") },
    { id: "channels", label: t("agentsView.channels") },
    { id: "cron", label: t("agentsView.cronJobs") },
    { id: "config", label: t("agentsView.advancedSettings") ?? "高级设置" },
  ];
  return html`
    <div class="agent-tabs">
      ${tabs.map(
        (tab) => html`
          <button
            class="agent-tab ${active === tab.id ? "active" : ""}"
            type="button"
            @click=${() => onSelect(tab.id)}
          >
            ${tab.label}
          </button>
        `,
      )}
    </div>
  `;
}

function renderAgentOverview(params: {
  agent: AgentsListResult["agents"][number];
  defaultId: string | null;
  configForm: Record<string, unknown> | null;
  agentFilesList: AgentsFilesListResult | null;
  agentIdentity: AgentIdentityResult | null;
  agentIdentityLoading: boolean;
  agentIdentityError: string | null;
  configLoading: boolean;
  configSaving: boolean;
  configDirty: boolean;
  modelDropdownOpen: boolean;
  modelDropdownExpandedGroups: Set<string>;
  onConfigReload: () => void;
  onConfigSave: () => void;
  onModelChange: (agentId: string, modelId: string | null) => void;
  onModelFallbacksChange: (agentId: string, fallbacks: string[]) => void;
  onModelDropdownToggle: () => void;
  onModelDropdownGroupToggle: (label: string) => void;
  fallbackDropdownOpen: boolean;
  fallbackDropdownExpandedGroups: Set<string>;
  onFallbackDropdownToggle: () => void;
  onFallbackDropdownGroupToggle: (label: string) => void;
  onAvatarUrlChange: (agentId: string, url: string) => void;
}) {
  const {
    agent,
    configForm,
    agentFilesList,
    agentIdentity,
    agentIdentityLoading,
    agentIdentityError,
    configLoading,
    configSaving,
    configDirty,
    onConfigReload,
    onConfigSave,
    onModelChange,
    onModelFallbacksChange,
    onModelDropdownToggle,
    onModelDropdownGroupToggle,
    onFallbackDropdownToggle,
    onFallbackDropdownGroupToggle,
    onAvatarUrlChange,
  } = params;
  const config = resolveAgentConfig(configForm, agent.id);
  const modelGroups = resolveGroupedModels(configForm);
  const workspaceFromFiles =
    agentFilesList && agentFilesList.agentId === agent.id ? agentFilesList.workspace : null;
  const workspace =
    workspaceFromFiles || config.entry?.workspace || config.defaults?.workspace || "default";
  const model = config.entry?.model
    ? resolveModelLabel(config.entry?.model)
    : resolveModelLabel(config.defaults?.model);
  const defaultModel = resolveModelLabel(config.defaults?.model);
  const modelPrimary =
    resolveModelPrimary(config.entry?.model) || (model !== "-" ? normalizeModelValue(model) : null);
  const defaultPrimary =
    resolveModelPrimary(config.defaults?.model) ||
    (defaultModel !== "-" ? normalizeModelValue(defaultModel) : null);
  const effectivePrimary = modelPrimary ?? defaultPrimary ?? null;
  const modelFallbacks = resolveEffectiveModelFallbacks(
    config.entry?.model,
    config.defaults?.model,
  );
  const identityName =
    agentIdentity?.name?.trim() ||
    agent.identity?.name?.trim() ||
    agent.name?.trim() ||
    config.entry?.name ||
    "-";
  const resolvedEmoji = resolveAgentEmoji(agent, agentIdentity);
  const identityEmoji = resolvedEmoji || "-";
  const skillFilter = Array.isArray(config.entry?.skills) ? config.entry?.skills : null;
  const skillCount = skillFilter?.length ?? null;
  const identityStatus = agentIdentityLoading
    ? t("shared.loading")
    : agentIdentityError
      ? t("agentsView.unavailable")
      : "";
  // Current avatar URL from config (editable)
  const currentAvatarUrl =
    (config.entry as Record<string, unknown> | undefined)?.identity &&
    typeof ((config.entry as Record<string, unknown>).identity as Record<string, unknown>)?.avatar === "string"
      ? ((config.entry as Record<string, unknown>).identity as Record<string, unknown>).avatar as string
      : "";
  const isDefault = Boolean(params.defaultId && agent.id === params.defaultId);

  return html`
    <section class="card">
      <div class="card-title">${t("agentsView.overviewTitle")}</div>
      <div class="card-sub">${t("agentsView.overviewSub")}</div>
      <div class="agents-overview-grid" style="margin-top: 16px;">
        <div class="agent-kv">
          <div class="label">${t("agentsView.workspace")}</div>
          <div class="mono">${workspace}</div>
        </div>
        <div class="agent-kv">
          <div class="label">${t("agentsView.primaryModel")}</div>
          <div class="mono">${model}</div>
        </div>
        <div class="agent-kv">
          <div class="label">${t("agentsView.identityName")}</div>
          <div>${identityName}</div>
          ${identityStatus ? html`<div class="agent-kv-sub muted">${identityStatus}</div>` : nothing}
        </div>
        <div class="agent-kv">
          <div class="label">${t("agentsView.defaultLabel")}</div>
          <div>${isDefault ? t("agentsView.yes") : t("agentsView.no")}</div>
        </div>
        <div class="agent-kv">
          <div class="label">${t("agentsView.identityEmoji")}</div>
          <div>${identityEmoji}</div>
        </div>
        <div class="agent-kv" style="grid-column: span 2;">
          <div class="label">头像 URL</div>
          <input
            class="input"
            type="url"
            placeholder="https://example.com/avatar.png 或留空使用自动生成头像"
            .value=${currentAvatarUrl}
            ?disabled=${configLoading || configSaving}
            @input=${(e: Event) => {
              const url = (e.target as HTMLInputElement).value.trim();
              // Immediate preview via the module-level map
              if (url) {
                _avatarPreviewMap.set(agent.id, url);
              } else {
                _avatarPreviewMap.delete(agent.id);
              }
              onAvatarUrlChange(agent.id, url);
            }}
            style="font-size:12px;"
          />
          <div class="agent-kv-sub muted">支持 http/https URL。修改后点击下方保存生效。</div>
        </div>
        <div class="agent-kv">
          <div class="label">${t("agentsView.skillsFilter")}</div>
          <div>${skillFilter ? t("agentsView.selectedSkills", { count: String(skillCount) }) : t("agentsView.allSkills")}</div>
        </div>
      </div>

      <div class="agent-model-select" style="margin-top: 20px;">
        <div class="label">${t("agentsView.modelSelection")}</div>
        <div class="row" style="gap: 12px; flex-wrap: wrap;">
          <div style="min-width: 260px; flex: 1;">
            <div class="label" style="margin-bottom: 6px;">${isDefault ? t("agentsView.primaryModelDefault") : t("agentsView.primaryModel")}</div>
            ${renderDropdown({
              value: effectivePrimary,
              placeholder: isDefault
                ? t("agentsView.noConfiguredModels")
                : defaultPrimary
                  ? t("agentsView.inheritDefaultWith", { model: defaultPrimary })
                  : t("agentsView.inheritDefault"),
              groups: modelGroups.map((g) => ({
                label: g.providerId,
                items: g.models,
              })),
              open: params.modelDropdownOpen,
              disabled: !configForm || configLoading || configSaving,
              expandedGroups: params.modelDropdownExpandedGroups,
              onSelect: (value) => onModelChange(agent.id, value || null),
              onToggle: onModelDropdownToggle,
              onGroupToggle: onModelDropdownGroupToggle,
            })}
          </div>
          <div style="min-width: 260px; flex: 1;">
            <div class="label" style="margin-bottom: 6px;">${t("agentsView.fallbacks")}</div>
            ${renderMultiDropdown({
              values: modelFallbacks ?? [],
              placeholder: t("agentsView.fallbacksPlaceholder") ?? "选择备选模型",
              groups: modelGroups
                .map((g) => ({
                  label: g.providerId,
                  items: g.models.filter((m) => m.value !== effectivePrimary),
                }))
                .filter((g) => g.items.length > 0),
              open: params.fallbackDropdownOpen,
              disabled: !configForm || configLoading || configSaving,
              expandedGroups: params.fallbackDropdownExpandedGroups,
              onToggleItem: (value) => {
                const current = modelFallbacks ?? [];
                const next = current.includes(value)
                  ? current.filter((v) => v !== value)
                  : [...current, value];
                onModelFallbacksChange(agent.id, next);
              },
              onToggle: onFallbackDropdownToggle,
              onGroupToggle: onFallbackDropdownGroupToggle,
            })}
          </div>
        </div>
        <div class="row" style="justify-content: flex-end; gap: 8px;">
          <button class="btn btn--sm" ?disabled=${configLoading} @click=${onConfigReload}>
            ${t("agentsView.reloadConfig")}
          </button>
          <button
            class="btn btn--sm primary"
            ?disabled=${configSaving || !configDirty}
            @click=${onConfigSave}
          >
            ${configSaving ? t("shared.saving") : t("shared.save")}
          </button>
        </div>
      </div>
    </section>
  `;
}
