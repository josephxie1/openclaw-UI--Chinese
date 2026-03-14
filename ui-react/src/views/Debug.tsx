import React from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { t } from "../i18n/index.ts";
import { loadDebug, callDebugMethod } from "../lib/controllers/debug.ts";
import { formatEventPayload } from "../lib/presenter.ts";
import type { EventLogEntry } from "../lib/app-events.ts";

export function DebugView() {
  const loading = useAppStore((s) => s.debugLoading);
  const status = useAppStore((s) => s.debugStatus);
  const health = useAppStore((s) => s.debugHealth);
  const models = useAppStore((s) => s.debugModels);
  const heartbeat = useAppStore((s) => s.debugHeartbeat);
  const eventLog = (useAppStore((s) => s.eventLog) ?? []) as EventLogEntry[];
  const callMethod = useAppStore((s) => s.debugCallMethod);
  const callParams = useAppStore((s) => s.debugCallParams);
  const callResult = useAppStore((s) => s.debugCallResult);
  const callError = useAppStore((s) => s.debugCallError);
  const set = useAppStore((s) => s.set);

  const securityAudit =
    status && typeof status === "object"
      ? (status as { securityAudit?: { summary?: Record<string, number> } }).securityAudit
      : null;
  const securitySummary = securityAudit?.summary ?? null;
  const critical = securitySummary?.critical ?? 0;
  const warn = securitySummary?.warn ?? 0;
  const info = securitySummary?.info ?? 0;
  const securityTone = critical > 0 ? "danger" : warn > 0 ? "warn" : "success";
  const securityLabel =
    critical > 0 ? t("debugView.critical", { count: String(critical) }) : warn > 0 ? t("debugView.warnings", { count: String(warn) }) : t("debugView.noCritical");

  const onRefresh = () => void loadDebug(getReactiveState() as never);
  const onCall = () => void callDebugMethod(getReactiveState() as never);

  return (
    <>
      <section className="grid grid-cols-2">
        <div className="card">
          <div className="row" style={{ justifyContent: "space-between" }}>
            <div>
              <div className="card-title">Snapshots</div>
              <div className="card-sub">Status, health, and heartbeat data.</div>
            </div>
            <button className="btn" disabled={loading} onClick={onRefresh}>
              {loading ? t("shared.refreshing") : t("shared.refresh")}
            </button>
          </div>
          <div className="stack" style={{ marginTop: 12 }}>
            <div>
              <div className="muted">Status</div>
              {securitySummary && (
                <div className={`callout ${securityTone}`} style={{ marginTop: 8 }}>
                  Security audit: {securityLabel}{info > 0 ? ` · ${info} info` : ""}. Run{" "}
                  <span className="mono">openclaw security audit --deep</span> for details.
                </div>
              )}
              <pre className="code-block">{JSON.stringify(status ?? {}, null, 2)}</pre>
            </div>
            <div>
              <div className="muted">Health</div>
              <pre className="code-block">{JSON.stringify(health ?? {}, null, 2)}</pre>
            </div>
            <div>
              <div className="muted">Last heartbeat</div>
              <pre className="code-block">{JSON.stringify(heartbeat ?? {}, null, 2)}</pre>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-title">Manual RPC</div>
          <div className="card-sub">Send a raw gateway method with JSON params.</div>
          <div className="form-grid" style={{ marginTop: 16 }}>
            <label className="field">
              <span>Method</span>
              <input
                value={callMethod}
                onChange={(e) => set({ debugCallMethod: e.target.value })}
                placeholder="system-presence"
              />
            </label>
            <label className="field">
              <span>Params (JSON)</span>
              <textarea
                value={callParams}
                onChange={(e) => set({ debugCallParams: e.target.value })}
                rows={6}
              />
            </label>
          </div>
          <div className="row" style={{ marginTop: 12 }}>
            <button className="btn primary" onClick={onCall}>Call</button>
          </div>
          {callError && (
            <div className="callout danger" style={{ marginTop: 12 }}>{callError}</div>
          )}
          {callResult && (
            <pre className="code-block" style={{ marginTop: 12 }}>{callResult}</pre>
          )}
        </div>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-title">Models</div>
        <div className="card-sub">Catalog from models.list.</div>
        <pre className="code-block" style={{ marginTop: 12 }}>
          {JSON.stringify(models ?? [], null, 2)}
        </pre>
      </section>

      <section className="card" style={{ marginTop: 18 }}>
        <div className="card-title">Event Log</div>
        <div className="card-sub">Latest gateway events.</div>
        {eventLog.length === 0 ? (
          <div className="muted" style={{ marginTop: 12 }}>No events yet.</div>
        ) : (
          <div className="list debug-event-log" style={{ marginTop: 12 }}>
            {eventLog.map((evt, i) => (
              <div key={i} className="list-item debug-event-log__item">
                <div className="list-main">
                  <div className="list-title">{evt.event}</div>
                  <div className="list-sub">{new Date(evt.ts).toLocaleTimeString()}</div>
                </div>
                <div className="list-meta debug-event-log__meta">
                  <pre className="code-block debug-event-log__payload">
                    {formatEventPayload(evt.payload)}
                  </pre>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
