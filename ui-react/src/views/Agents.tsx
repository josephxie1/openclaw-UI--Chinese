import React, { useCallback, useEffect, useState } from "react";
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

  // Modelo desplegable
  const modelDropdownOpen = s((st) => st.modelDropdownOpen);
  const modelDropdownExpandedGroups = s((st) => st.modelDropdownExpandedGroups);
  const fallbackDropdownOpen = s((st) => st.fallbackDropdownOpen);
  const fallbackDropdownExpandedGroups = s((st) => st.fallbackDropdownExpandedGroups);

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
        // Modelo
        modelDropdownOpen,
        modelDropdownExpandedGroups,
        fallbackDropdownOpen,
        fallbackDropdownExpandedGroups,
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
        // Modelo callbacks
        onModelChange: (agentId: string, modelId: string | null) => {
          set({ modelDropdownOpen: false });
          const rs = getReactiveState();
          if (!rs.configForm) return;
          const list = (rs.configForm as { agents?: { list?: unknown[] } }).agents?.list;
          if (!Array.isArray(list)) return;
          const index = list.findIndex((e) => e && typeof e === "object" && "id" in e && (e as { id?: string }).id === agentId);
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
        onModelFallbacksChange: (agentId: string, fallbacks: string[]) => {
          const rs = getReactiveState();
          if (!rs.configForm) return;
          const list = (rs.configForm as { agents?: { list?: unknown[] } }).agents?.list;
          if (!Array.isArray(list)) return;
          const index = list.findIndex((e) => e && typeof e === "object" && "id" in e && (e as { id?: string }).id === agentId);
          if (index < 0) return;
          const basePath = ["agents", "list", index, "model"];
          const entry = list[index] as { model?: unknown };
          const normalized = fallbacks.map((n) => n.trim()).filter(Boolean);
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
            if (primary) { updateConfigFormValue(rs as never, basePath, primary); }
            else { removeConfigFormValue(rs as never, basePath); }
            return;
          }
          const next = primary ? { primary, fallbacks: normalized } : { fallbacks: normalized };
          updateConfigFormValue(rs as never, basePath, next);
        },
        onModelDropdownToggle: () => {
          const isOpen = !s.getState().modelDropdownOpen;
          set({ modelDropdownOpen: isOpen });
          if (isOpen) {
            const close = () => { set({ modelDropdownOpen: false }); document.removeEventListener("click", close); };
            requestAnimationFrame(() => document.addEventListener("click", close, { once: true }));
          }
        },
        onModelDropdownGroupToggle: (label: string) => {
          const next = new Set(s.getState().modelDropdownExpandedGroups);
          next.has(label) ? next.delete(label) : next.add(label);
          set({ modelDropdownExpandedGroups: next });
        },
        onFallbackDropdownToggle: () => {
          const isOpen = !s.getState().fallbackDropdownOpen;
          set({ fallbackDropdownOpen: isOpen });
          if (isOpen) {
            const close = () => { set({ fallbackDropdownOpen: false }); document.removeEventListener("click", close); };
            requestAnimationFrame(() => document.addEventListener("click", close, { once: true }));
          }
        },
        onFallbackDropdownGroupToggle: (label: string) => {
          const next = new Set(s.getState().fallbackDropdownExpandedGroups);
          next.has(label) ? next.delete(label) : next.add(label);
          set({ fallbackDropdownExpandedGroups: next });
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
     modelDropdownOpen, fallbackDropdownOpen,
     agentSkillsReport, agentSkillsLoading, agentSkillsError, agentSkillsAgentId, skillsFilter,
     channelsSnapshot, channelsLoading, channelsError, channelsLastSuccess,
     cronLoading, cronStatus, cronJobs, cronError],
  );

  return (
    <>
      <LitBridge template={template} />
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
