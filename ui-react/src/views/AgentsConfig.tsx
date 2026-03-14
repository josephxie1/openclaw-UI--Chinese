import React, { useCallback, useEffect, useState } from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import {
  applyConfig,
  loadConfig,
  loadConfigSchema,
  runUpdate,
  saveConfig,
  updateConfigFormValue,
} from "../lib/controllers/config.ts";
import { analyzeConfigSchema } from "../lib/views/config-form.ts";
import {
  schemaType,
  humanize,
  type JsonSchema,
} from "../lib/views/config-form.shared.ts";
import type { ConfigUiHints } from "../lib/types.ts";
import { t } from "../i18n/index.ts";
import { SchemaField, SchemaIcons, getFieldMeta } from "../components/SchemaFieldReact.tsx";
import "../styles/agents-config.css";

// Alias para compatibilidad con el código existente
const Icons = SchemaIcons;

// ── Agent Summary Card (estilo channel-summary-card) ──
function AgentCard({
  agent,
  index,
  onClick,
}: {
  agent: Record<string, unknown>;
  index: number;
  onClick: () => void;
}) {
  const identity = (agent.identity ?? {}) as Record<string, unknown>;
  const name = String(identity.name ?? agent.id ?? `Agent ${index + 1}`);
  const emoji = String(identity.emoji ?? "");
  const model = String(agent.model ?? "");
  const id = String(agent.id ?? "");
  const enabled = agent.enabled !== false;

  return (
    <div
      className={`channel-summary-card${!enabled ? " channel-summary-card--disabled" : ""}`}
      onClick={onClick}
    >
      <div className="channel-summary-card__header">
        <span className="channel-summary-card__name">
          {emoji ? `${emoji} ${name}` : name}
        </span>
        <span className={`channel-summary-card__badge ${enabled ? "channel-summary-card__badge--active" : "channel-summary-card__badge--inactive"}`}>
          {enabled ? t("agentsConfig.enabled") : t("agentsConfig.notEnabled")}
        </span>
      </div>
      <div className="channel-summary-card__accounts">
        {id && (
          <div className="channel-summary-card__account">
            <span className={`channel-summary-card__dot channel-summary-card__dot--${enabled ? "green" : "gray"}`} />
            <span className="channel-summary-card__account-name">{id}</span>
            <span style={{ marginLeft: "auto", opacity: 0.7 }}>{model || t("agentsConfig.defaultModel")}</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Agent Config Drawer (右侧滑出面板) ──
export function AgentConfigDrawer({
  open,
  agent,
  agentIndex,
  itemSchema,
  uiHints,
  onPatch,
  onClose,
  configSaving,
  configFormDirty,
  onSave,
  onReload,
}: {
  open: boolean;
  agent: Record<string, unknown> | null;
  agentIndex: number;
  itemSchema: JsonSchema | undefined;
  uiHints: ConfigUiHints;
  onPatch: (path: Array<string | number>, value: unknown) => void;
  onClose: () => void;
  configSaving: boolean;
  configFormDirty: boolean;
  onSave: () => void;
  onReload: () => void;
}) {
  // Cierra con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Bloquea scroll del body cuando está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const identity = (agent?.identity ?? {}) as Record<string, unknown>;
  const name = String(identity.name ?? agent?.id ?? "");
  const emoji = String(identity.emoji ?? "");

  return (
    <>
      {/* Overlay oscuro */}
      <div
        className={`channel-drawer-overlay${open ? " open" : ""}`}
        onClick={onClose}
      />

      {/* Panel lateral */}
      <div className={`channel-drawer${open ? " open" : ""}`}>
        <div className="channel-drawer__header">
          <div>
            <div className="channel-drawer__title">
              {emoji ? `${emoji} ${name}` : name} {t("agentsConfig.config")}
            </div>
            <div className="channel-drawer__sub">{t("agentsConfig.drawerAgentSub")}</div>
          </div>
          <div className="channel-drawer__header-actions">
            <button
              className="btn btn--sm primary"
              disabled={configSaving || !configFormDirty}
              onClick={onSave}
            >
              {configSaving ? t("agentsConfig.saving") : t("agentsConfig.save")}
            </button>
            <button
              className="btn btn--sm"
              disabled={configSaving}
              onClick={onReload}
            >
              {t("agentsConfig.reload")}
            </button>
            <button
              className="channel-drawer__close"
              onClick={onClose}
              title="关闭"
            >
              {Icons.close}
            </button>
          </div>
        </div>

        <div className="channel-drawer__body">
          {open && agent && (
            <>
              {itemSchema?.properties
                ? Object.entries(itemSchema.properties).map(([key, subSchema]) => (
                    <SchemaField
                      key={key}
                      path={["agents", "list", agentIndex, key]}
                      fieldSchema={subSchema}
                      value={agent[key]}
                      uiHints={uiHints}
                      onPatch={onPatch}
                      depth={0}
                    />
                  ))
                : Object.entries(agent).map(([key, val]) => (
                    <div key={key} className="ac-field">
                      <div className="ac-field__label">{humanize(key)}</div>
                      <div className="ac-field__input">
                        <input
                          className="ac-input"
                          value={typeof val === "object" ? JSON.stringify(val) : String(val ?? "")}
                          onChange={(e) => {
                            let parsed: unknown = e.target.value;
                            try { parsed = JSON.parse(e.target.value); } catch { /* keep string */ }
                            onPatch(["agents", "list", agentIndex, key], parsed);
                          }}
                        />
                      </div>
                    </div>
                  ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Defaults Config Drawer (右侧滑出面板) ──
export function DefaultsConfigDrawer({
  open,
  defaultsSchema,
  defaults,
  uiHints,
  onPatch,
  onClose,
  configSaving,
  configFormDirty,
  onSave,
  onReload,
}: {
  open: boolean;
  defaultsSchema: JsonSchema | undefined;
  defaults: Record<string, unknown>;
  uiHints: ConfigUiHints;
  onPatch: (path: Array<string | number>, value: unknown) => void;
  onClose: () => void;
  configSaving: boolean;
  configFormDirty: boolean;
  onSave: () => void;
  onReload: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const defaultsProps = defaultsSchema?.properties ?? {};

  return (
    <>
      <div
        className={`channel-drawer-overlay${open ? " open" : ""}`}
        onClick={onClose}
      />
      <div className={`channel-drawer${open ? " open" : ""}`}>
        <div className="channel-drawer__header">
          <div>
            <div className="channel-drawer__title">{t("agentsConfig.drawerDefaultsTitle")}</div>
            <div className="channel-drawer__sub">{t("agentsConfig.drawerDefaultsSub")}</div>
          </div>
          <div className="channel-drawer__header-actions">
            <button
              className="btn btn--sm primary"
              disabled={configSaving || !configFormDirty}
              onClick={onSave}
            >
              {configSaving ? t("agentsConfig.saving") : t("agentsConfig.save")}
            </button>
            <button className="btn btn--sm" disabled={configSaving} onClick={onReload}>
              {t("agentsConfig.reload")}
            </button>
            <button className="channel-drawer__close" onClick={onClose} title="关闭">
              {Icons.close}
            </button>
          </div>
        </div>
        <div className="channel-drawer__body">
          {open && (
            <>
              {Object.entries(defaultsProps).map(([key, subSchema]) => (
                <SchemaField
                  key={key}
                  path={["agents", "defaults", key]}
                  fieldSchema={subSchema}
                  value={defaults[key]}
                  uiHints={uiHints}
                  onPatch={onPatch}
                  depth={0}
                />
              ))}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Página principal ──
export function AgentsConfigView() {
  const configForm = useAppStore((s) => s.configForm);
  const configSchema = useAppStore((s) => s.configSchema);
  const configSchemaLoading = useAppStore((s) => s.configSchemaLoading);
  const configSaving = useAppStore((s) => s.configSaving);
  const configApplying = useAppStore((s) => s.configApplying);
  const configFormDirty = useAppStore((s) => s.configFormDirty);
  const configLoading = useAppStore((s) => s.configLoading);
  const connected = useAppStore((s) => s.connected);
  const uiHints = useAppStore((s) => s.configUiHints);

  // Drawer state
  const [drawerAgent, setDrawerAgent] = useState<number | null>(null);
  const [defaultsOpen, setDefaultsOpen] = useState(false);

  // Asegurar schema y config cargados
  useEffect(() => {
    const rs = getReactiveState();
    if (!configSchema && !configSchemaLoading && rs.connected) {
      void loadConfigSchema(rs as never);
    }
    if (!configForm && !configLoading && rs.connected) {
      void loadConfig(rs as never);
    }
  }, [configSchema, configSchemaLoading, configForm, configLoading, connected]);

  const onPatch = useCallback((path: Array<string | number>, value: unknown) => {
    updateConfigFormValue(getReactiveState() as never, path, value);
  }, []);

  const handleSave = useCallback(() => void saveConfig(getReactiveState() as never), []);
  const handleApply = useCallback(() => void applyConfig(getReactiveState() as never), []);
  const handleReload = useCallback(() => void loadConfig(getReactiveState() as never), []);
  const handleUpdate = useCallback(() => void runUpdate(getReactiveState() as never), []);

  // Extraer schema de la sección "agents"
  const analysis = analyzeConfigSchema(configSchema);
  const agentsSchema = analysis.schema?.properties?.agents as JsonSchema | undefined;
  const defaultsSchema = agentsSchema?.properties?.defaults as JsonSchema | undefined;
  const listSchema = agentsSchema?.properties?.list as JsonSchema | undefined;
  const itemSchema = listSchema?.items && !Array.isArray(listSchema.items)
    ? listSchema.items
    : undefined;

  // Datos actuales
  const agentsForm = configForm?.agents as Record<string, unknown> | undefined;
  const defaults = (agentsForm?.defaults ?? {}) as Record<string, unknown>;
  const list = (agentsForm?.list ?? []) as unknown[];

  // Agent seleccionado para el drawer
  const selectedAgent = drawerAgent != null
    ? (list[drawerAgent] ?? null) as Record<string, unknown> | null
    : null;

  if (configSchemaLoading || configLoading) {
    return (
      <div className="ac-page">
        <div className="ac-loading">{t("agentsConfig.loadingConfig")}</div>
      </div>
    );
  }

  if (!agentsSchema) {
    return (
      <div className="ac-page">
        <div className="ac-loading muted">{t("agentsConfig.schemaUnavailable")}</div>
      </div>
    );
  }

  return (
    <div className="ac-page">

      {/* Defaults 卡片 */}
      <div className="channels-grid">
        <div
          className="channel-summary-card"
          onClick={() => setDefaultsOpen(true)}
        >
          <div className="channel-summary-card__header">
            <span className="channel-summary-card__name">{t("agentsConfig.defaultsTitle")}</span>
            <span className="channel-summary-card__badge channel-summary-card__badge--active">
              {t("agentsConfig.defaultsBadge")}
            </span>
          </div>
          <div className="channel-summary-card__accounts">
            <div className="channel-summary-card__account">
              <span className="channel-summary-card__dot channel-summary-card__dot--green" />
              <span className="channel-summary-card__account-name">{t("agentsConfig.defaultsInherited")}</span>
              <span style={{ marginLeft: "auto", opacity: 0.7 }}>
                {t("agentsConfig.configItems", { count: String(Object.keys(defaultsSchema?.properties ?? {}).length) })}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Agent 列表标题 */}
      <div style={{ margin: "20px 0 10px", fontWeight: 600, fontSize: 14, color: "var(--text-strong)" }} id="agent-list-title">
        {t("agentsConfig.agentListTitle")} ({list.length})
      </div>

      {/* Agent 卡片网格 */}
      {list.length === 0 ? (
        <div className="muted" style={{ padding: "12px 0" }}>{t("agentsConfig.noAgentsConfigured")}</div>
      ) : (
        <div className="channels-grid">
          {list.map((agent, i) => (
            <AgentCard
              key={String((agent as Record<string, unknown>)?.id ?? i)}
              agent={(agent ?? {}) as Record<string, unknown>}
              index={i}
              onClick={() => setDrawerAgent(i)}
            />
          ))}
        </div>
      )}

      {/* Agent Config Drawer */}
      <AgentConfigDrawer
        open={drawerAgent != null}
        agent={selectedAgent}
        agentIndex={drawerAgent ?? 0}
        itemSchema={itemSchema}
        uiHints={uiHints}
        onPatch={onPatch}
        onClose={() => setDrawerAgent(null)}
        configSaving={configSaving}
        configFormDirty={configFormDirty}
        onSave={handleSave}
        onReload={handleReload}
      />

      {/* Defaults Config Drawer */}
      <DefaultsConfigDrawer
        open={defaultsOpen}
        defaultsSchema={defaultsSchema}
        defaults={defaults}
        uiHints={uiHints}
        onPatch={onPatch}
        onClose={() => setDefaultsOpen(false)}
        configSaving={configSaving}
        configFormDirty={configFormDirty}
        onSave={handleSave}
        onReload={handleReload}
      />
    </div>
  );
}
