import React, { useCallback } from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { t } from "../i18n/index.ts";
import { loadPresence } from "../lib/controllers/presence.ts";
import { formatPresenceAge, formatPresenceSummary } from "../lib/presenter.ts";
import type { PresenceEntry } from "../lib/types.ts";

export function InstancesView() {
  const loading = useAppStore((s) => s.presenceLoading);
  const entries = useAppStore((s) => s.presenceEntries);
  const lastError = useAppStore((s) => s.presenceError);
  const statusMessage = useAppStore((s) => s.presenceStatus);

  const onRefresh = useCallback(() => {
    void loadPresence(getReactiveState() as never);
  }, []);

  return (
    <section className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="card-title">{t("instancesView.title")}</div>
          <div className="card-sub">{t("instancesView.subtitle")}</div>
        </div>
        <button className="btn" disabled={loading} onClick={onRefresh}>
          {loading ? t("shared.loading") : t("shared.refresh")}
        </button>
      </div>
      {lastError && (
        <div className="callout danger" style={{ marginTop: 12 }}>{lastError}</div>
      )}
      {statusMessage && (
        <div className="callout" style={{ marginTop: 12 }}>{statusMessage}</div>
      )}
      <div className="list" style={{ marginTop: 16 }}>
        {entries.length === 0 ? (
          <div className="muted">{t("instancesView.noInstances")}</div>
        ) : (
          entries.map((entry, i) => <InstanceEntry key={i} entry={entry} />)
        )}
      </div>
    </section>
  );
}

function InstanceEntry({ entry }: { entry: PresenceEntry }) {
  const lastInput =
    entry.lastInputSeconds != null
      ? `${entry.lastInputSeconds}s ${t("instancesView.ago")}`
      : t("channelsView.na");
  const mode = entry.mode ?? t("instancesView.unknown");
  const roles = Array.isArray(entry.roles) ? entry.roles.filter(Boolean) : [];
  const scopes = Array.isArray(entry.scopes) ? entry.scopes.filter(Boolean) : [];
  const scopesLabel =
    scopes.length > 0
      ? scopes.length > 3
        ? `${scopes.length} ${t("instancesView.scopesCount")}`
        : `${t("instancesView.scopesLabel")} ${scopes.join(", ")}`
      : null;

  return (
    <div className="list-item">
      <div className="list-main">
        <div className="list-title">{entry.host ?? t("instancesView.unknownHost")}</div>
        <div className="list-sub">{formatPresenceSummary(entry)}</div>
        <div className="chip-row">
          <span className="chip">{mode}</span>
          {roles.map((role, i) => (
            <span key={i} className="chip">{role}</span>
          ))}
          {scopesLabel && <span className="chip">{scopesLabel}</span>}
          {entry.platform && <span className="chip">{entry.platform}</span>}
          {entry.deviceFamily && <span className="chip">{entry.deviceFamily}</span>}
          {entry.modelIdentifier && <span className="chip">{entry.modelIdentifier}</span>}
          {entry.version && <span className="chip">{entry.version}</span>}
        </div>
      </div>
      <div className="list-meta">
        <div>{formatPresenceAge(entry)}</div>
        <div className="muted">{t("instancesView.lastInput")} {lastInput}</div>
        <div className="muted">{t("instancesView.reason")} {entry.reason ?? ""}</div>
      </div>
    </div>
  );
}
