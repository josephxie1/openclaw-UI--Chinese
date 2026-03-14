import React, { useCallback, useRef } from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { t } from "../i18n/index.ts";
import { loadLogs } from "../lib/controllers/logs.ts";
import type { LogEntry, LogLevel } from "../lib/types.ts";

const LEVELS: LogLevel[] = ["trace", "debug", "info", "warn", "error", "fatal"];

function formatTime(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString();
}

function matchesFilter(entry: LogEntry, needle: string) {
  if (!needle) return true;
  const haystack = [entry.message, entry.subsystem, entry.raw]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(needle);
}

export function LogsView() {
  const loading = useAppStore((s) => s.logsLoading);
  const error = useAppStore((s) => s.logsError);
  const file = useAppStore((s) => s.logsFile);
  const entries = useAppStore((s) => s.logsEntries);
  const filterText = useAppStore((s) => s.logsFilterText);
  const levelFilters = useAppStore((s) => s.logsLevelFilters);
  const autoFollow = useAppStore((s) => s.logsAutoFollow);
  const truncated = useAppStore((s) => s.logsTruncated);
  const set = useAppStore((s) => s.set);
  const logStreamRef = useRef<HTMLDivElement>(null);

  const needle = filterText.trim().toLowerCase();
  const levelFiltered = LEVELS.some((level) => !levelFilters[level]);
  const filtered = entries.filter((entry) => {
    if (entry.level && !levelFilters[entry.level]) return false;
    return matchesFilter(entry, needle);
  });
  const exportLabel = needle || levelFiltered ? "filtered" : "visible";

  const onRefresh = useCallback(() => {
    void loadLogs(getReactiveState() as never, { reset: true });
  }, []);

  const onExport = useCallback(() => {
    const lines = filtered.map((entry) => entry.raw);
    const blob = new Blob([lines.join("\n")], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openclaw-logs-${exportLabel}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filtered, exportLabel]);

  const onLevelToggle = useCallback(
    (level: LogLevel, enabled: boolean) => {
      set({ logsLevelFilters: { ...levelFilters, [level]: enabled } });
    },
    [set, levelFilters],
  );

  return (
    <section className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="card-title">Logs</div>
          <div className="card-sub">Gateway file logs (JSONL).</div>
        </div>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn" disabled={loading} onClick={onRefresh}>
            {loading ? t("shared.loading") : t("shared.refresh")}
          </button>
          <button className="btn" disabled={filtered.length === 0} onClick={onExport}>
            Export {exportLabel}
          </button>
        </div>
      </div>

      <div className="filters" style={{ marginTop: 14 }}>
        <label className="field" style={{ minWidth: 220 }}>
          <span>Filter</span>
          <input
            value={filterText}
            onChange={(e) => set({ logsFilterText: e.target.value })}
            placeholder={t("logsView.searchLogs")}
          />
        </label>
        <label className="field checkbox">
          <span>Auto-follow</span>
          <input
            type="checkbox"
            checked={autoFollow}
            onChange={(e) => set({ logsAutoFollow: e.target.checked })}
          />
        </label>
      </div>

      <div className="chip-row" style={{ marginTop: 12 }}>
        {LEVELS.map((level) => (
          <label key={level} className={`chip log-chip ${level}`}>
            <input
              type="checkbox"
              checked={levelFilters[level]}
              onChange={(e) => onLevelToggle(level, e.target.checked)}
            />
            <span>{level}</span>
          </label>
        ))}
      </div>

      {file && <div className="muted" style={{ marginTop: 10 }}>File: {file}</div>}
      {truncated && (
        <div className="callout" style={{ marginTop: 10 }}>
          Log output truncated; showing latest chunk.
        </div>
      )}
      {error && (
        <div className="callout danger" style={{ marginTop: 10 }}>{error}</div>
      )}

      <div className="log-stream" ref={logStreamRef} style={{ marginTop: 12 }}>
        {filtered.length === 0 ? (
          <div className="muted" style={{ padding: 12 }}>No log entries.</div>
        ) : (
          filtered.map((entry, i) => (
            <div key={i} className="log-row">
              <div className="log-time mono">{formatTime(entry.time)}</div>
              <div className={`log-level ${entry.level ?? ""}`}>{entry.level ?? ""}</div>
              <div className="log-subsystem mono">{entry.subsystem ?? ""}</div>
              <div className="log-message mono">{entry.message ?? entry.raw}</div>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
