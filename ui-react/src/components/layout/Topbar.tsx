import React, { useCallback, useState } from "react";
import { useAppStore } from "../../store/appStore.ts";
import { t } from "../../i18n/index.ts";

export function Topbar() {
  const connected = useAppStore((s) => s.connected);
  const hello = useAppStore((s) => s.hello);
  const settings = useAppStore((s) => s.settings);
  const applySettings = useAppStore((s) => s.applySettings);
  const client = useAppStore((s) => s.client);

  const [restarting, setRestarting] = useState(false);

  const handleRestart = useCallback(async () => {
    if (!client || !connected || restarting) return;
    setRestarting(true);
    try {
      // Paso 1: obtener hash de la config actual (slim, sin RangeError)
      const snapshot = await client.request("config.get", {}) as { hash?: string } | null;
      const baseHash = snapshot?.hash;
      if (!baseHash) throw new Error("no hash");
      // Paso 2: enviar merge-patch vacío para disparar restart sin cambiar config
      await client.request("config.patch", {
        raw: "{}",
        baseHash,
      });
    } catch {
      // Esperado: la conexión se cierra durante el restart
    } finally {
      setTimeout(() => setRestarting(false), 5000);
    }
  }, [client, connected, restarting]);

  const version =
    (typeof hello?.server?.version === "string" && hello.server.version.trim()) ||
    t("common.na");
  const versionStatusClass = "ok";

  return (
    <header className="topbar">
      {/* Mostrar botón de expandir solo cuando la nav está colapsada */}
      {settings.navCollapsed && (
        <button
          className="nav-collapse-toggle"
          onClick={() => applySettings({ ...settings, navCollapsed: false })}
          title={t("nav.expand")}
          aria-label={t("nav.expand")}
        >
          <span className="nav-collapse-toggle__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </span>
        </button>
      )}
      <div style={{ flex: 1 }} />
      <div className="topbar-status">
        <button
          className="topbar-restart-btn"
          onClick={handleRestart}
          disabled={!connected || restarting}
          title="重启 Gateway"
          aria-label="重启 Gateway"
        >
          <svg
            className={restarting ? "topbar-restart-btn__icon--spinning" : ""}
            width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <polyline points="23 4 23 10 17 10" />
            <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
          </svg>
          <span className="topbar-restart-btn__label">重启</span>
        </button>
        <div className="pill">
          <span className={`statusDot ${versionStatusClass}`} />
          <span>{t("common.version")}</span>
          <span className="mono">{version}</span>
        </div>
        <div className="pill">
          <span className={`statusDot${connected ? " ok" : ""}`} />
          <span>{t("common.health")}</span>
          <span className="mono">{connected ? t("common.ok") : t("common.offline")}</span>
        </div>
      </div>
    </header>
  );
}
