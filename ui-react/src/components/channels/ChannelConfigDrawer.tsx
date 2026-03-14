import React, { useEffect, useMemo } from "react";
import { html } from "lit";
import { LitBridge } from "../LitBridge.tsx";
import { renderChannelConfigForm } from "../../lib/views/channels.config.ts";
import type { ConfigUiHints } from "../../lib/types.ts";

// ─── Types ───────────────────────────────────────────────────

export type ChannelConfigDrawerProps = {
  open: boolean;
  channelId: string | null;
  channelLabel: string;
  configSchema: unknown;
  configSchemaLoading: boolean;
  configForm: Record<string, unknown> | null;
  configUiHints: ConfigUiHints;
  configSaving: boolean;
  configFormDirty: boolean;
  onConfigPatch: (path: Array<string | number>, value: unknown) => void;
  onConfigSave: () => void;
  onConfigReload: () => void;
  onClose: () => void;
};

// ─── Component ───────────────────────────────────────────────

export function ChannelConfigDrawer(props: ChannelConfigDrawerProps) {
  const {
    open, channelId, channelLabel,
    configSchema, configSchemaLoading, configForm, configUiHints,
    configSaving, configFormDirty,
    onConfigPatch, onConfigSave, onConfigReload, onClose,
  } = props;

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

  const disabled = configSaving || configSchemaLoading;

  // Plantilla Lit para el formulario de configuración basado en schema
  const configTemplate = useMemo(() => {
    if (!channelId || !open) return html``;
    if (configSchemaLoading) {
      return html`<div class="muted">加载配置 Schema...</div>`;
    }
    return html`
      ${renderChannelConfigForm({
        channelId,
        configValue: configForm,
        schema: configSchema,
        uiHints: configUiHints,
        disabled,
        onPatch: onConfigPatch,
      })}
    `;
  }, [channelId, open, configSchemaLoading, configForm, configSchema, configUiHints, disabled, onConfigPatch]);

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
            <div className="channel-drawer__title">{channelLabel} 配置</div>
            <div className="channel-drawer__sub">编辑渠道配置，修改后点击保存。</div>
          </div>
          <button
            className="channel-drawer__close"
            onClick={onClose}
            title="关闭"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <div className="channel-drawer__body">
          {open && channelId && <LitBridge template={configTemplate} />}

          {/* Botones de guardar/recargar */}
          {open && channelId && (
            <div className="row" style={{ marginTop: 16, flexWrap: "wrap" }}>
              <button
                className="btn primary"
                disabled={disabled || !configFormDirty}
                onClick={onConfigSave}
              >
                {configSaving ? "保存中..." : "保存"}
              </button>
              <button
                className="btn"
                disabled={disabled}
                onClick={onConfigReload}
              >
                重新加载
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
