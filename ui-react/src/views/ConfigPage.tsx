/**
 * ConfigPage — Página de configuración en React con tarjetas + drawer.
 * Reemplaza la vista Lit anterior de /config.
 * Cada sección del schema se muestra como una tarjeta. Al hacer clic se abre un drawer
 * con SchemaField renderizando recursivamente todos los campos.
 */
import React, { useCallback, useEffect, useState } from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import {
  applyConfig,
  loadConfig,
  loadConfigSchema,
  loadConfigRaw,
  runUpdate,
  saveConfig,
  updateConfigFormValue,
} from "../lib/controllers/config.ts";
import { analyzeConfigSchema } from "../lib/views/config-form.ts";
import {
  schemaType,
  hintForPath,
  type JsonSchema,
} from "../lib/views/config-form.shared.ts";
import type { ConfigUiHints } from "../lib/types.ts";
import { t } from "../i18n/index.ts";
import { SchemaField, SchemaIcons } from "../components/SchemaFieldReact.tsx";
import "../styles/agents-config.css";

// ── Section Icons (React JSX, migrados de config-form.render.ts) ──
const sectionIcons: Record<string, React.ReactNode> = {
  env: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4v.1a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 18.07a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 13.5H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 8a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  update: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  agents: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M12 2a2 2 0 0 1 2 2c0 .74-.4 1.39-1 1.73V7h1a7 7 0 0 1 7 7h1a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1h-1v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1H2a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1h1a7 7 0 0 1 7-7h1V5.73c-.6-.34-1-.99-1-1.73a2 2 0 0 1 2-2z" />
      <circle cx="8" cy="14" r="1" /><circle cx="16" cy="14" r="1" />
    </svg>
  ),
  auth: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  channels: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  ),
  messages: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  commands: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  hooks: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  skills: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  tools: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  gateway: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  models: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  logging: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  browser: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" />
      <line x1="21.17" y1="8" x2="12" y2="8" />
    </svg>
  ),
  ui: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" /><line x1="9" y1="21" x2="9" y2="9" />
    </svg>
  ),
  broadcast: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M4.9 19.1C1 15.2 1 8.8 4.9 4.9" />
      <path d="M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" />
      <circle cx="12" cy="12" r="2" />
      <path d="M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" />
      <path d="M19.1 4.9C23 8.8 23 15.1 19.1 19" />
    </svg>
  ),
  audio: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  session: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  cron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
  web: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  discovery: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  canvasHost: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" />
    </svg>
  ),
  talk: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
      <line x1="12" y1="19" x2="12" y2="23" /><line x1="8" y1="23" x2="16" y2="23" />
    </svg>
  ),
  plugins: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M12 2v6" /><path d="m4.93 10.93 4.24 4.24" />
      <path d="M2 12h6" /><path d="m4.93 13.07 4.24-4.24" />
      <path d="M12 22v-6" /><path d="m19.07 13.07-4.24-4.24" />
      <path d="M22 12h-6" /><path d="m19.07 10.93-4.24 4.24" />
    </svg>
  ),
  wizard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M15 4V2" /><path d="M15 16v-2" /><path d="M8 9h2" /><path d="M20 9h2" />
      <path d="M17.8 11.8 19 13" /><path d="M15 9h0" /><path d="M17.8 6.2 19 5" />
      <path d="m3 21 9-9" /><path d="M12.2 6.2 11 5" />
    </svg>
  ),
  meta: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  ),
  bindings: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
      <line x1="6" y1="6" x2="6.01" y2="6" /><line x1="6" y1="18" x2="6.01" y2="18" />
    </svg>
  ),
};

// Icono por defecto
const defaultSectionIcon = (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="20" height="20">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

// ── Section Metadata (labels + descriptions, se sobreescriben con i18n de uiHints) ──
const SECTION_META: Record<string, { label: string; description: string }> = {
  env: { label: "Environment Variables", description: "Environment variables passed to the gateway process" },
  update: { label: "Updates", description: "Auto-update settings and release channel" },
  agents: { label: "Agents", description: "Agent configurations, models, and identities" },
  auth: { label: "Authentication", description: "API keys and authentication profiles" },
  channels: { label: "Channels", description: "Messaging channels (Telegram, Discord, Slack, etc.)" },
  messages: { label: "Messages", description: "Message handling and routing settings" },
  commands: { label: "Commands", description: "Custom slash commands" },
  hooks: { label: "Hooks", description: "Webhooks and event hooks" },
  skills: { label: "Skills", description: "Skill packs and capabilities" },
  tools: { label: "Tools", description: "Tool configurations (browser, search, etc.)" },
  gateway: { label: "Gateway", description: "Gateway server settings (port, auth, binding)" },
  wizard: { label: "Setup Wizard", description: "Setup wizard state and history" },
  meta: { label: "Metadata", description: "Gateway metadata and version information" },
  logging: { label: "Logging", description: "Log levels and output configuration" },
  browser: { label: "Browser", description: "Browser automation settings" },
  ui: { label: "UI", description: "User interface preferences" },
  models: { label: "Models", description: "AI model configurations and providers" },
  bindings: { label: "Bindings", description: "Key bindings and shortcuts" },
  broadcast: { label: "Broadcast", description: "Broadcast and notification settings" },
  audio: { label: "Audio", description: "Audio input/output settings" },
  session: { label: "Session", description: "Session management and persistence" },
  cron: { label: "Cron", description: "Scheduled tasks and automation" },
  web: { label: "Web", description: "Web server and API settings" },
  discovery: { label: "Discovery", description: "Service discovery and networking" },
  canvasHost: { label: "Canvas Host", description: "Canvas rendering and display" },
  talk: { label: "Talk", description: "Voice and speech settings" },
  plugins: { label: "Plugins", description: "Plugin management and extensions" },
};

// ── Section Card ──
function SectionCard({
  sectionKey,
  label,
  description,
  fieldCount,
  onClick,
}: {
  sectionKey: string;
  label: string;
  description: string;
  fieldCount: number;
  onClick: () => void;
}) {
  const icon = sectionIcons[sectionKey] ?? defaultSectionIcon;
  return (
    <div className="channel-summary-card" onClick={onClick}>
      <div className="channel-summary-card__header">
        <span className="channel-summary-card__name" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ display: "flex", alignItems: "center", opacity: 0.7 }}>{icon}</span>
          {label}
        </span>
        <span className="channel-summary-card__badge channel-summary-card__badge--active">
          {fieldCount}
        </span>
      </div>
      <div className="channel-summary-card__accounts">
        <div className="channel-summary-card__account">
          <span className="channel-summary-card__dot channel-summary-card__dot--green" />
          <span className="channel-summary-card__account-name" style={{ opacity: 0.7, fontSize: 12 }}>
            {description}
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Section Drawer ──
function SectionDrawer({
  open,
  sectionKey,
  sectionSchema,
  sectionValue,
  uiHints,
  onPatch,
  onClose,
  configSaving,
  configFormDirty,
  onSave,
  onReload,
}: {
  open: boolean;
  sectionKey: string;
  sectionSchema: JsonSchema;
  sectionValue: unknown;
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
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Obtener label y descripción con i18n
  const hint = hintForPath([sectionKey], uiHints);
  const meta = SECTION_META[sectionKey];
  const label = hint?.label ?? meta?.label ?? sectionKey;
  const desc = hint?.help ?? meta?.description ?? "";
  const icon = sectionIcons[sectionKey] ?? defaultSectionIcon;

  const obj = sectionValue != null && typeof sectionValue === "object" && !Array.isArray(sectionValue)
    ? (sectionValue as Record<string, unknown>)
    : {};

  const props = sectionSchema.properties ?? {};

  return (
    <>
      <div className={`channel-drawer-overlay${open ? " open" : ""}`} onClick={onClose} />
      <div className={`channel-drawer${open ? " open" : ""}`}>
        <div className="channel-drawer__header">
          <div>
            <div className="channel-drawer__title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ display: "flex", alignItems: "center", opacity: 0.7 }}>{icon}</span>
              {label}
            </div>
            <div className="channel-drawer__sub">{desc}</div>
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
            <button className="channel-drawer__close" onClick={onClose} title="关闭">
              {SchemaIcons.close}
            </button>
          </div>
        </div>

        <div className="channel-drawer__body">
          {open && (
            <>
              {Object.keys(props).length > 0 ? (
                Object.entries(props).map(([key, subSchema]) => (
                  <SchemaField
                    key={key}
                    path={[sectionKey, key]}
                    fieldSchema={subSchema}
                    value={obj[key]}
                    uiHints={uiHints}
                    onPatch={onPatch}
                    depth={0}
                  />
                ))
              ) : (
                /* Section sin properties (p.ej. array como "bindings") */
                <SchemaField
                  path={[sectionKey]}
                  fieldSchema={sectionSchema}
                  value={sectionValue}
                  uiHints={uiHints}
                  onPatch={onPatch}
                  depth={0}
                />
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ── Página principal ──
export function ConfigPageView() {
  const configForm = useAppStore((s) => s.configForm);
  const configSchema = useAppStore((s) => s.configSchema);
  const configSchemaLoading = useAppStore((s) => s.configSchemaLoading);
  const configSaving = useAppStore((s) => s.configSaving);
  const configFormDirty = useAppStore((s) => s.configFormDirty);
  const configLoading = useAppStore((s) => s.configLoading);
  const connected = useAppStore((s) => s.connected);
  const uiHints = useAppStore((s) => s.configUiHints);

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Cargar schema y config
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
  const handleReload = useCallback(() => void loadConfig(getReactiveState() as never), []);

  // Analizar schema
  const analysis = analyzeConfigSchema(configSchema);
  const rootSchema = analysis.schema;
  const rootProperties = rootSchema?.properties ?? {};
  const formValue = (configForm ?? {}) as Record<string, unknown>;

  // Ordenar secciones por hint order
  const entries = Object.entries(rootProperties).toSorted((a, b) => {
    const orderA = hintForPath([a[0]], uiHints)?.order ?? 50;
    const orderB = hintForPath([b[0]], uiHints)?.order ?? 50;
    if (orderA !== orderB) return orderA - orderB;
    return a[0].localeCompare(b[0]);
  });

  // Filtrar por búsqueda
  const filteredEntries = entries.filter(([key]) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    if (key.toLowerCase().includes(q)) return true;
    const meta = SECTION_META[key];
    if (meta?.label?.toLowerCase().includes(q)) return true;
    if (meta?.description?.toLowerCase().includes(q)) return true;
    const hint = hintForPath([key], uiHints);
    if (hint?.label?.toLowerCase().includes(q)) return true;
    if (hint?.help?.toLowerCase().includes(q)) return true;
    return false;
  });

  // Schema + valor de la sección activa
  const activeSectionSchema = activeSection ? rootProperties[activeSection] : undefined;

  if (configSchemaLoading || configLoading) {
    return (
      <div className="ac-page">
        <div className="ac-loading">{t("agentsConfig.loadingConfig")}</div>
      </div>
    );
  }

  if (!rootSchema) {
    return (
      <div className="ac-page">
        <div className="ac-loading muted">{t("agentsConfig.schemaUnavailable")}</div>
      </div>
    );
  }

  return (
    <div className="ac-page">
      {/* Barra de búsqueda */}
      <div style={{ marginBottom: 16 }}>
        <input
          className="ac-input"
          type="text"
          placeholder={t("configPage.searchPlaceholder") ?? "Search settings..."}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ maxWidth: 400 }}
        />
      </div>

      {/* Grid de tarjetas de secciones */}
      {filteredEntries.length === 0 ? (
        <div className="muted" style={{ padding: "12px 0" }}>
          {searchQuery
            ? (t("configPage.noMatch")?.replace("{query}", searchQuery) ?? `No settings match "${searchQuery}"`)
            : (t("configPage.noSettings") ?? "No settings available")}
        </div>
      ) : (
        <div className={`channels-grid${activeSection ? " channels-grid--drawer-open" : ""}`}>
          {filteredEntries.map(([key, node]) => {
            const hint = hintForPath([key], uiHints);
            const meta = SECTION_META[key];
            const sLabel = hint?.label ?? meta?.label ?? key.charAt(0).toUpperCase() + key.slice(1);
            const sDesc = hint?.help ?? meta?.description ?? node.description ?? "";
            const fieldCount = Object.keys(node.properties ?? {}).length;

            return (
              <SectionCard
                key={key}
                sectionKey={key}
                label={sLabel}
                description={sDesc}
                fieldCount={fieldCount}
                onClick={() => setActiveSection(key)}
              />
            );
          })}
        </div>
      )}

      {/* Section Drawer */}
      {activeSection && activeSectionSchema && (
        <SectionDrawer
          open={activeSection != null}
          sectionKey={activeSection}
          sectionSchema={activeSectionSchema}
          sectionValue={formValue[activeSection]}
          uiHints={uiHints}
          onPatch={onPatch}
          onClose={() => setActiveSection(null)}
          configSaving={configSaving}
          configFormDirty={configFormDirty}
          onSave={handleSave}
          onReload={handleReload}
        />
      )}
    </div>
  );
}
