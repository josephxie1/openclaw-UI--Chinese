import React, { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { LitBridge } from "../components/LitBridge.tsx";
import { renderAgents, type AgentsPanel } from "../lib/views/agents.ts";
import { loadAgents, loadToolsCatalog } from "../lib/controllers/agents.ts";
import { loadAgentIdentity, loadAgentIdentities } from "../lib/controllers/agent-identity.ts";
import { loadAgentSkills } from "../lib/controllers/agent-skills.ts";
import { loadAgentFiles, loadAgentFileContent, saveAgentFile } from "../lib/controllers/agent-files.ts";
import { loadChannels } from "../lib/controllers/channels.ts";
import { loadConfig, loadConfigSchema, saveConfig, updateConfigFormValue, removeConfigFormValue } from "../lib/controllers/config.ts";
import { loadCron } from "../lib/app-settings.ts";
import { _avatarPreviewMap } from "../lib/views/agents.ts";
import { AgentConfigDrawer, DefaultsConfigDrawer } from "./AgentsConfig.tsx";
import { analyzeConfigSchema } from "../lib/views/config-form.ts";
import type { JsonSchema } from "../lib/views/config-form.shared.ts";
import { Dropdown, MultiDropdown } from "../components/common/Dropdown.tsx";
import {
  resolveGroupedModels,
  resolveAgentConfig,
  resolveModelPrimary,
  resolveModelLabel,
  normalizeModelValue,
  resolveEffectiveModelFallbacks,
} from "../lib/views/agents-utils.ts";
import { t } from "../i18n/index.ts";
import "../styles/agents-config.css";

export function AgentsView() {
  const s = useAppStore;
  // Estado principal
  const loading = s((st) => st.agentsLoading);
  const error = s((st) => st.agentsError);
  const agentsList = s((st) => st.agentsList);
  const selectedAgentId = s((st) => st.agentsSelectedId);
  const activePanel = s((st) => st.agentsPanel) as AgentsPanel;
  const configForm = s((st) => st.configForm);
  const configSchema = s((st) => st.configSchema);
  const configSchemaLoading = s((st) => st.configSchemaLoading ?? false);
  const configUiHints = s((st) => st.configUiHints ?? {});
  const configLoading = s((st) => st.configLoading);
  const configSaving = s((st) => st.configSaving);
  const configFormDirty = s((st) => st.configFormDirty);
  const agentIdentityById = s((st) => st.agentIdentityById);

  // Archivos
  const agentFilesList = s((st) => st.agentFilesList);
  const agentFileContents = s((st) => st.agentFileContents);
  const agentFileDrafts = s((st) => st.agentFileDrafts);
  const agentFileActive = s((st) => st.agentFileActive);
  const agentFileSaving = s((st) => st.agentFileSaving);
  const agentFilesLoading = s((st) => st.agentFilesLoading ?? false);
  const agentFilesError = s((st) => st.agentFilesError ?? null);

  // Herramientas
  const toolsCatalogResult = s((st) => st.toolsCatalogResult);
  const toolsCatalogLoading = s((st) => st.toolsCatalogLoading ?? false);
  const toolsCatalogError = s((st) => st.toolsCatalogError ?? null);

  // Modelo — ahora gestionado por el componente React AgentModelSection

  // Habilidades
  const agentSkillsReport = s((st) => st.agentSkillsReport);
  const agentSkillsLoading = s((st) => st.agentSkillsLoading);
  const agentSkillsError = s((st) => st.agentSkillsError ?? null);
  const agentSkillsAgentId = s((st) => st.agentSkillsAgentId ?? null);
  const skillsFilter = s((st) => st.skillsFilter ?? "");

  // Canales
  const channelsSnapshot = s((st) => st.channelsSnapshot);
  const channelsLoading = s((st) => st.channelsLoading ?? false);
  const channelsError = s((st) => st.channelsError ?? null);
  const channelsLastSuccess = s((st) => st.channelsLastSuccess ?? null);

  // Identity
  const agentIdentityLoading = s((st) => st.agentIdentityLoading ?? false);
  const agentIdentityError = s((st) => st.agentIdentityError ?? null);

  // Cron
  const cronLoading = s((st) => st.cronLoading ?? false);
  const cronStatus = s((st) => st.cronStatus ?? null);
  const cronJobs = s((st) => st.cronJobs ?? []);
  const cronError = s((st) => st.cronError ?? null);

  const set = s((st) => st.set);

  // ── Drawer state for agent config ──
  const [configDrawerOpen, setConfigDrawerOpen] = useState(false);
  const [defaultsDrawerOpen, setDefaultsDrawerOpen] = useState(false);

  // Resolve agent item schema for the drawer
  const analysis = React.useMemo(() => analyzeConfigSchema(configSchema), [configSchema]);
  const agentsSchema = analysis.schema?.properties?.agents as JsonSchema | undefined;
  const listSchema = agentsSchema?.properties?.list as JsonSchema | undefined;
  const itemSchema = listSchema?.items && !Array.isArray(listSchema.items)
    ? listSchema.items
    : undefined;
  const defaultsSchema = agentsSchema?.properties?.defaults as JsonSchema | undefined;
  const defaults = ((configForm?.agents as Record<string, unknown> | undefined)?.defaults ?? {}) as Record<string, unknown>;

  // Find agent index and data for drawer
  const agentsList2 = (configForm?.agents as Record<string, unknown> | undefined)?.list;
  const agentListArr = Array.isArray(agentsList2) ? agentsList2 : [];
  const selectedAgentIndex = agentListArr.findIndex(
    (e) => e && typeof e === "object" && "id" in e && (e as { id?: string }).id === selectedAgentId,
  );
  const selectedAgentData = selectedAgentIndex >= 0
    ? (agentListArr[selectedAgentIndex] as Record<string, unknown>)
    : null;

  const handleConfigPatch = useCallback((path: Array<string | number>, value: unknown) => {
    updateConfigFormValue(getReactiveState() as never, path, value);
  }, []);

  const handleConfigSave = useCallback(() => void saveConfig(getReactiveState() as never), []);
  const handleConfigReload = useCallback(() => void loadConfig(getReactiveState() as never), []);

  const template = React.useMemo(
    () =>
      renderAgents({
        loading,
        error,
        agentsList,
        selectedAgentId,
        activePanel,
        configForm,
        configSchema,
        configSchemaLoading,
        configUiHints,
        configLoading,
        configSaving,
        configDirty: configFormDirty,
        agentIdentityById,
        agentIdentityLoading,
        agentIdentityError,
        // Archivos
        agentFilesList,
        agentFileContents,
        agentFileDrafts,
        agentFileActive,
        agentFileSaving,
        agentFilesLoading,
        agentFilesError,
        // Herramientas
        toolsCatalogResult,
        toolsCatalogLoading,
        toolsCatalogError,
        // Habilidades
        agentSkillsReport,
        agentSkillsLoading,
        agentSkillsError,
        agentSkillsAgentId,
        skillsFilter,
        // Canales
        channelsSnapshot,
        channelsLoading,
        channelsError,
        channelsLastSuccess,
        // Cron
        cronLoading,
        cronStatus,
        cronJobs,
        cronError,
        // ─── Callbacks ──────────────────────────────────────────
        onSelectAgent: (id: string) => {
          const state = s.getState();
          if (state.agentsSelectedId === id) return;
          // Resetear estado de archivos y habilidades del agente anterior
          set({
            agentsSelectedId: id,
            agentFilesList: null,
            agentFilesError: null,
            agentFilesLoading: false,
            agentFileActive: null,
            agentFileContents: {},
            agentFileDrafts: {},
            agentSkillsReport: null,
            agentSkillsError: null,
            agentSkillsAgentId: null,
          });
          void loadAgentIdentity(getReactiveState() as never, id);
          // Pre-cargar datos según el panel activo
          const panel = s.getState().agentsPanel;
          if (panel === "tools") void loadToolsCatalog(getReactiveState() as never);
          if (panel === "files") void loadAgentFiles(getReactiveState() as never, id);
          if (panel === "skills") void loadAgentSkills(getReactiveState() as never, id);
        },
        onSelectPanel: (panel: AgentsPanel) => {
          set({ agentsPanel: panel });
          const state = s.getState();
          const agentId = state.agentsSelectedId;
          if (panel === "files" && agentId) {
            // Solo recargar si los archivos no están en cache para este agent
            const cached = state.agentFilesList as { agentId?: string } | null;
            if (cached?.agentId !== agentId) {
              set({
                agentFilesList: null,
                agentFilesError: null,
                agentFileActive: null,
                agentFileContents: {},
                agentFileDrafts: {},
              });
              void loadAgentFiles(getReactiveState() as never, agentId);
            }
          }
          if (panel === "tools") void loadToolsCatalog(getReactiveState() as never);
          if (panel === "skills" && agentId) void loadAgentSkills(getReactiveState() as never, agentId);
          if (panel === "channels") void loadChannels(getReactiveState() as never, false);
          if (panel === "cron") void loadCron(getReactiveState() as never);
          if (panel === "config") {
            // Cargar schema si no está disponible y abrir drawer
            const rs = getReactiveState();
            if (!rs.configSchema && !rs.configSchemaLoading) {
              void loadConfigSchema(rs as never);
            }
            setConfigDrawerOpen(true);
            // Volver al panel anterior para no mostrar contenido vacío
            set({ agentsPanel: "overview" });
          }
        },
        onRefresh: async () => {
          await loadAgents(getReactiveState() as never);
          const rs = getReactiveState();
          const nextSelected = rs.agentsSelectedId ?? rs.agentsList?.defaultId ?? rs.agentsList?.agents?.[0]?.id ?? null;
          await loadToolsCatalog(getReactiveState() as never, nextSelected);
          const agentIds = rs.agentsList?.agents?.map((entry) => entry.id) ?? [];
          if (agentIds.length > 0) void loadAgentIdentities(getReactiveState() as never, agentIds);
        },
        onConfigReload: () => void loadConfig(getReactiveState() as never),
        onConfigSave: () => void saveConfig(getReactiveState() as never),
        onConfigPatch: (path: Array<string | number>, value: unknown) => {
          updateConfigFormValue(getReactiveState() as never, path, value);
        },
        // Archivos callbacks
        onLoadFiles: (agentId: string) => void loadAgentFiles(getReactiveState() as never, agentId),
        onSelectFile: (path: string) => {
          set({ agentFileActive: path });
          const agentId = s.getState().agentsSelectedId;
          if (agentId) void loadAgentFileContent(getReactiveState() as never, agentId, path);
        },
        onFileDraftChange: (path: string, content: string) =>
          set({ agentFileDrafts: { ...s.getState().agentFileDrafts, [path]: content } }),
        onFileReset: (name: string) => {
          const base = s.getState().agentFileContents[name] ?? "";
          set({ agentFileDrafts: { ...s.getState().agentFileDrafts, [name]: base } });
        },
        onFileSave: (name: string) => {
          const state = s.getState();
          const agentId = state.agentsSelectedId;
          const content = state.agentFileDrafts[name] ?? state.agentFileContents[name] ?? "";
          if (agentId) void saveAgentFile(getReactiveState() as never, agentId, name, content);
        },
        // Herramientas callbacks
        onToolsProfileChange: (agentId: string, profile: string | null, clearAllow: boolean) => {
          const rs = getReactiveState();
          if (!rs.configForm) return;
          const list = (rs.configForm as { agents?: { list?: unknown[] } }).agents?.list;
          if (!Array.isArray(list)) return;
          const index = list.findIndex((e) => e && typeof e === "object" && "id" in e && (e as { id?: string }).id === agentId);
          if (index < 0) return;
          const basePath = ["agents", "list", index, "tools"];
          if (profile) {
            updateConfigFormValue(rs as never, [...basePath, "profile"], profile);
          } else {
            removeConfigFormValue(rs as never, [...basePath, "profile"]);
          }
          if (clearAllow) removeConfigFormValue(rs as never, [...basePath, "allow"]);
        },
        onToolsOverridesChange: (agentId: string, alsoAllow: string[], deny: string[]) => {
          const rs = getReactiveState();
          if (!rs.configForm) return;
          const list = (rs.configForm as { agents?: { list?: unknown[] } }).agents?.list;
          if (!Array.isArray(list)) return;
          const index = list.findIndex((e) => e && typeof e === "object" && "id" in e && (e as { id?: string }).id === agentId);
          if (index < 0) return;
          const basePath = ["agents", "list", index, "tools"];
          if (alsoAllow.length > 0) {
            updateConfigFormValue(rs as never, [...basePath, "alsoAllow"], alsoAllow);
          } else {
            removeConfigFormValue(rs as never, [...basePath, "alsoAllow"]);
          }
          if (deny.length > 0) {
            updateConfigFormValue(rs as never, [...basePath, "deny"], deny);
          } else {
            removeConfigFormValue(rs as never, [...basePath, "deny"]);
          }
        },
        // Habilidades callbacks
        onSkillsFilterChange: (next: string) => set({ skillsFilter: next }),
        onSkillsRefresh: () => {
          const agentId = s.getState().agentsSelectedId;
          if (agentId) void loadAgentSkills(getReactiveState() as never, agentId);
        },
        onAgentSkillToggle: (agentId: string, skillName: string, enabled: boolean) => {
          const rs = getReactiveState();
          if (!rs.configForm) return;
          const list = (rs.configForm as { agents?: { list?: unknown[] } }).agents?.list;
          if (!Array.isArray(list)) return;
          const index = list.findIndex((e) => e && typeof e === "object" && "id" in e && (e as { id?: string }).id === agentId);
          if (index < 0) return;
          const entry = list[index] as { skills?: unknown };
          const normalizedSkill = skillName.trim();
          if (!normalizedSkill) return;
          const allSkills = rs.agentSkillsReport?.skills?.map((sk) => sk.name).filter(Boolean) ?? [];
          const existing = Array.isArray(entry.skills) ? entry.skills.map((n) => String(n).trim()).filter(Boolean) : undefined;
          const base = existing ?? allSkills;
          const next = new Set(base);
          if (enabled) { next.add(normalizedSkill); } else { next.delete(normalizedSkill); }
          updateConfigFormValue(rs as never, ["agents", "list", index, "skills"], [...next]);
        },
        onAgentSkillsClear: (agentId: string) => {
          const rs = getReactiveState();
          if (!rs.configForm) return;
          const list = (rs.configForm as { agents?: { list?: unknown[] } }).agents?.list;
          if (!Array.isArray(list)) return;
          const index = list.findIndex((e) => e && typeof e === "object" && "id" in e && (e as { id?: string }).id === agentId);
          if (index < 0) return;
          removeConfigFormValue(rs as never, ["agents", "list", index, "skills"]);
        },
        onAgentSkillsDisableAll: (agentId: string) => {
          const rs = getReactiveState();
          if (!rs.configForm) return;
          const list = (rs.configForm as { agents?: { list?: unknown[] } }).agents?.list;
          if (!Array.isArray(list)) return;
          const index = list.findIndex((e) => e && typeof e === "object" && "id" in e && (e as { id?: string }).id === agentId);
          if (index < 0) return;
          updateConfigFormValue(rs as never, ["agents", "list", index, "skills"], []);
        },
        // Canales callbacks
        onChannelsRefresh: () => void loadChannels(getReactiveState() as never, true),
        // Cron callbacks
        onCronRefresh: () => void loadCron(getReactiveState() as never),
        // Avatar
        onAvatarUrlChange: (agentId: string, url: string) => {
          if (url) {
            _avatarPreviewMap.set(agentId, url);
          } else {
            _avatarPreviewMap.delete(agentId);
          }
          const rs = getReactiveState();
          if (!rs.configForm) return;
          const list = (rs.configForm as { agents?: { list?: unknown[] } }).agents?.list;
          if (!Array.isArray(list)) return;
          const index = list.findIndex((e) => e && typeof e === "object" && "id" in e && (e as { id?: string }).id === agentId);
          if (index < 0) return;
          updateConfigFormValue(rs as never, ["agents", "list", index, "identity", "avatar"], url || null);
        },
        // Global settings (defaults drawer)
        onGlobalSettings: () => {
          const rs = getReactiveState();
          if (!rs.configSchema && !rs.configSchemaLoading) {
            void loadConfigSchema(rs as never);
          }
          setDefaultsDrawerOpen(true);
        },
      } as unknown as Parameters<typeof renderAgents>[0]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [loading, error, agentsList, selectedAgentId, activePanel, configForm, configLoading, configSaving,
     configFormDirty, agentIdentityById, agentIdentityLoading, agentIdentityError,
     configSchema, configSchemaLoading, configUiHints,
     agentFilesList, agentFileActive, agentFileSaving, agentFilesLoading, agentFilesError,
     toolsCatalogResult, toolsCatalogLoading, toolsCatalogError,
     agentSkillsReport, agentSkillsLoading, agentSkillsError, agentSkillsAgentId, skillsFilter,
     channelsSnapshot, channelsLoading, channelsError, channelsLastSuccess,
     cronLoading, cronStatus, cronJobs, cronError],
  );

  return (
    <>
      <LitBridge template={template} />
      <AgentModelSection />
      <AgentConfigDrawer
        open={configDrawerOpen}
        agent={selectedAgentData}
        agentIndex={selectedAgentIndex >= 0 ? selectedAgentIndex : 0}
        itemSchema={itemSchema}
        uiHints={configUiHints}
        onPatch={handleConfigPatch}
        onClose={() => setConfigDrawerOpen(false)}
        configSaving={configSaving}
        configFormDirty={configFormDirty}
        onSave={handleConfigSave}
        onReload={handleConfigReload}
      />
      <DefaultsConfigDrawer
        open={defaultsDrawerOpen}
        defaultsSchema={defaultsSchema}
        defaults={defaults}
        uiHints={configUiHints}
        onPatch={handleConfigPatch}
        onClose={() => setDefaultsDrawerOpen(false)}
        configSaving={configSaving}
        configFormDirty={configFormDirty}
        onSave={handleConfigSave}
        onReload={handleConfigReload}
      />
    </>
  );
}

// ─── Sección de modelo con React Dropdowns (Portal) ─────────

function AgentModelSection() {
  const s = useAppStore;
  const configForm = s((st) => st.configForm);
  const configLoading = s((st) => st.configLoading);
  const configSaving = s((st) => st.configSaving);
  const configFormDirty = s((st) => st.configFormDirty);
  const selectedAgentId = s((st) => st.agentsSelectedId);
  const agentsList = s((st) => st.agentsList);
  const activePanel = s((st) => st.agentsPanel);

  // Buscar el portal container renderizado por Lit
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null);

  useEffect(() => {
    // Comprobar si ya existe
    const el = document.getElementById("agents-model-portal");
    if (el) { setPortalEl(el); return; }

    // Observar mutaciones hasta que aparezca
    const observer = new MutationObserver(() => {
      const found = document.getElementById("agents-model-portal");
      if (found) {
        setPortalEl(found);
        observer.disconnect();
      }
    });
    observer.observe(document.body, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [selectedAgentId, activePanel]);

  // Datos del modelo
  const defaultId = agentsList?.defaultId ?? null;
  const agents = agentsList?.agents ?? [];
  const agent = selectedAgentId ? agents.find((a) => a.id === selectedAgentId) ?? null : null;

  const config = useMemo(
    () => (agent ? resolveAgentConfig(configForm, agent.id) : null),
    [configForm, agent],
  );

  const modelGroups = useMemo(() => resolveGroupedModels(configForm), [configForm]);

  const isDefault = Boolean(defaultId && agent?.id === defaultId);

  const model = config?.entry?.model
    ? resolveModelLabel(config.entry.model)
    : resolveModelLabel(config?.defaults?.model);
  const defaultModel = resolveModelLabel(config?.defaults?.model);
  const modelPrimary =
    resolveModelPrimary(config?.entry?.model) || (model !== "-" ? normalizeModelValue(model) : null);
  const defaultPrimary =
    resolveModelPrimary(config?.defaults?.model) || (defaultModel !== "-" ? normalizeModelValue(defaultModel) : null);
  const effectivePrimary = modelPrimary ?? defaultPrimary ?? null;
  const modelFallbacks = resolveEffectiveModelFallbacks(config?.entry?.model, config?.defaults?.model);

  // Handlers
  const handleModelChange = useCallback(
    (modelId: string) => {
      if (!agent) return;
      const rs = getReactiveState();
      if (!rs.configForm) return;
      const list = (rs.configForm as { agents?: { list?: unknown[] } }).agents?.list;
      if (!Array.isArray(list)) return;
      const index = list.findIndex(
        (e) => e && typeof e === "object" && "id" in e && (e as { id?: string }).id === agent.id,
      );
      if (index < 0) return;
      const basePath = ["agents", "list", index, "model"];
      if (!modelId) {
        removeConfigFormValue(rs as never, basePath);
        return;
      }
      const entry = list[index] as { model?: unknown };
      const existing = entry?.model;
      if (existing && typeof existing === "object" && !Array.isArray(existing)) {
        const fallbacks = (existing as { fallbacks?: unknown }).fallbacks;
        const next = { primary: modelId, ...(Array.isArray(fallbacks) ? { fallbacks } : {}) };
        updateConfigFormValue(rs as never, basePath, next);
      } else {
        updateConfigFormValue(rs as never, basePath, modelId);
      }
    },
    [agent],
  );

  const handleFallbackToggle = useCallback(
    (value: string) => {
      if (!agent) return;
      const rs = getReactiveState();
      if (!rs.configForm) return;
      const list = (rs.configForm as { agents?: { list?: unknown[] } }).agents?.list;
      if (!Array.isArray(list)) return;
      const index = list.findIndex(
        (e) => e && typeof e === "object" && "id" in e && (e as { id?: string }).id === agent.id,
      );
      if (index < 0) return;
      const basePath = ["agents", "list", index, "model"];
      const entry = list[index] as { model?: unknown };
      const current = modelFallbacks ?? [];
      const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
      const normalized = next.map((n) => n.trim()).filter(Boolean);
      const existing = entry.model;
      const resolvePrimary = () => {
        if (typeof existing === "string") return existing.trim() || null;
        if (existing && typeof existing === "object" && !Array.isArray(existing)) {
          const p = (existing as { primary?: unknown }).primary;
          if (typeof p === "string") return p.trim() || null;
        }
        return null;
      };
      const primary = resolvePrimary();
      if (normalized.length === 0) {
        if (primary) updateConfigFormValue(rs as never, basePath, primary);
        else removeConfigFormValue(rs as never, basePath);
        return;
      }
      const obj = primary ? { primary, fallbacks: normalized } : { fallbacks: normalized };
      updateConfigFormValue(rs as never, basePath, obj);
    },
    [agent, modelFallbacks],
  );

  // No renderizar si no hay portal container o no hay agent seleccionado
  if (!portalEl || !agent || activePanel !== "overview") return null;

  const disabled = !configForm || configLoading || configSaving;

  const primaryPlaceholder = isDefault
    ? (t("agentsView.noConfiguredModels") ?? "无可用模型")
    : defaultPrimary
      ? (t("agentsView.inheritDefaultWith", { model: defaultPrimary }) ?? `继承默认 (${defaultPrimary})`)
      : (t("agentsView.inheritDefault") ?? "继承默认");

  const fallbackGroups = modelGroups
    .map((g) => ({
      label: g.providerId,
      items: g.models.filter((m) => m.value !== effectivePrimary),
    }))
    .filter((g) => g.items.length > 0);

  return createPortal(
    <div className="agent-model-select" style={{ marginTop: 20 }}>
      <div className="label">{t("agentsView.modelSelection") ?? "模型选择"}</div>
      <div className="row" style={{ gap: 12, flexWrap: "wrap" }}>
        <div style={{ minWidth: 260, flex: 1 }}>
          <div className="label" style={{ marginBottom: 6 }}>
            {isDefault
              ? (t("agentsView.primaryModelDefault") ?? "主模型（默认）")
              : (t("agentsView.primaryModel") ?? "主模型")}
          </div>
          <Dropdown
            value={effectivePrimary}
            placeholder={primaryPlaceholder}
            groups={modelGroups.map((g) => ({ label: g.providerId, items: g.models }))}
            disabled={disabled}
            onSelect={handleModelChange}
          />
        </div>
        <div style={{ minWidth: 260, flex: 1 }}>
          <div className="label" style={{ marginBottom: 6 }}>
            {t("agentsView.fallbacks") ?? "备选模型（逗号分隔）"}
          </div>
          <MultiDropdown
            values={modelFallbacks ?? []}
            placeholder={t("agentsView.fallbacksPlaceholder") ?? "选择备选模型"}
            groups={fallbackGroups}
            disabled={disabled}
            onToggleItem={handleFallbackToggle}
          />
        </div>
      </div>
      <div className="row" style={{ justifyContent: "flex-end", gap: 8 }}>
        <button
          className="btn btn--sm"
          disabled={configLoading}
          onClick={() => void loadConfig(getReactiveState() as never)}
        >
          {t("agentsView.reloadConfig") ?? "重新加载配置"}
        </button>
        <button
          className="btn btn--sm primary"
          disabled={configSaving || !configFormDirty}
          onClick={() => void saveConfig(getReactiveState() as never)}
        >
          {configSaving ? (t("shared.saving") ?? "保存中…") : (t("shared.save") ?? "保存")}
        </button>
      </div>
    </div>,
    portalEl,
  );
}

