import React, { useCallback } from "react";
import { t, i18n, SUPPORTED_LOCALES, type Locale } from "../../i18n/index.ts";
import { buildExternalLinkRel, EXTERNAL_LINK_TARGET } from "../../lib/external-link.ts";
import type { UiSettings } from "../../lib/storage.ts";

// ─── Drag Handle SVG ─────────────────────────────────────────

function DragHandle() {
  return (
    <button className="swapy-handle" data-swapy-handle title={t("overview.drag.hint") ?? "拖拽交换位置"}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" />
        <circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" />
      </svg>
    </button>
  );
}

export { DragHandle };

// ─── Main Component ──────────────────────────────────────────

export type AccessCardProps = {
  settings: UiSettings;
  password: string;
  isTrustedProxy: boolean;
  onSettingsChange: (next: UiSettings) => void;
  onPasswordChange: (next: string) => void;
  onSessionKeyChange: (next: string) => void;
  onConnect: () => void;
  onRefresh: () => void;
};

export function AccessCard(props: AccessCardProps) {
  const { settings, password, isTrustedProxy, onSettingsChange, onPasswordChange, onSessionKeyChange, onConnect, onRefresh } = props;
  const currentLocale = i18n.getLocale();

  const handleUrlChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, gatewayUrl: e.target.value });
  }, [settings, onSettingsChange]);

  const handleTokenChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSettingsChange({ ...settings, token: e.target.value });
  }, [settings, onSettingsChange]);

  const handlePasswordChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onPasswordChange(e.target.value);
  }, [onPasswordChange]);

  const handleSessionKeyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onSessionKeyChange(e.target.value);
  }, [onSessionKeyChange]);

  const handleLocaleChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const v = e.target.value as Locale;
    void i18n.setLocale(v);
    onSettingsChange({ ...settings, locale: v });
  }, [settings, onSettingsChange]);

  return (
    <div data-swapy-slot="access">
      <div data-swapy-item="access">
        <div className="card ov-card--access">
          <div className="card-header-row">
            <DragHandle />
            <div>
              <div className="card-title">牧场大门</div>
              <div className="card-sub">{t("overview.access.subtitle")}</div>
            </div>
          </div>
          <div className="access-grid" style={{ marginTop: 14 }}>
            <label className="field">
              <span>WebSocket URL</span>
              <input type="text" defaultValue={settings.gatewayUrl} onBlur={handleUrlChange} />
            </label>
            <label className="field">
              <span>{t("overview.access.gatewayToken")}</span>
              <input type="text" defaultValue={settings.token} onBlur={handleTokenChange} />
            </label>
            <label className="field">
              <span>{t("overview.access.password")} ({t("overview.access.notStored")})</span>
              <input type="password" placeholder="system or shared password" defaultValue={password} onBlur={handlePasswordChange} />
            </label>
            <label className="field">
              <span>{t("overview.access.defaultSessionKey")}</span>
              <input type="text" defaultValue={settings.sessionKey ?? ""} onBlur={handleSessionKeyChange} />
            </label>
          </div>
          <div className="row" style={{ marginTop: 14, gap: 10, alignItems: "center" }}>
            <label className="field" style={{ margin: 0, flex: "0 0 auto" }}>
              <select value={currentLocale} onChange={handleLocaleChange}>
                {SUPPORTED_LOCALES.map((loc) => {
                  const key = loc.replace(/-([a-zA-Z])/g, (_, c: string) => c.toUpperCase());
                  return <option key={loc} value={loc}>{t(`languages.${key}`)}</option>;
                })}
              </select>
            </label>
            <button className="btn" onClick={onConnect}>{t("common.connect")}</button>
            <button className="btn" onClick={onRefresh}>{t("common.refresh")}</button>
            <span className="muted">
              {isTrustedProxy ? t("overview.access.trustedProxy") : t("overview.access.connectHint")}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
