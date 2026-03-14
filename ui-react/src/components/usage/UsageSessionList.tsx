import React, { useMemo } from "react";
import { t } from "../../i18n/index.ts";
import { formatDurationCompact } from "../../../../src/infra/format-time/format-duration.ts";
import { formatCost, formatTokens } from "../../lib/views/usage-metrics.ts";
import type { UsageColumnId, UsageSessionEntry } from "../../lib/views/usageTypes.ts";

interface UsageSessionListProps {
  sessions: UsageSessionEntry[];
  selectedSessions: string[];
  selectedDays: string[];
  isTokenMode: boolean;
  sessionSort: "tokens" | "cost" | "recent" | "messages" | "errors";
  sessionSortDir: "asc" | "desc";
  recentSessions: string[];
  sessionsTab: "all" | "recent";
  visibleColumns: UsageColumnId[];
  totalSessions: number;
  onSelectSession: (key: string, shiftKey: boolean) => void;
  onSessionSortChange: (sort: "tokens" | "cost" | "recent" | "messages" | "errors") => void;
  onSessionSortDirChange: (dir: "asc" | "desc") => void;
  onSessionsTabChange: (tab: "all" | "recent") => void;
  onClearSessions: () => void;
}

function formatSessionLabel(s: UsageSessionEntry): string {
  const raw = s.label || s.key;
  if (raw.startsWith("agent:") && raw.includes("?token=")) return raw.slice(0, raw.indexOf("?token="));
  return raw;
}

export function UsageSessionList(props: UsageSessionListProps) {
  const {
    sessions, selectedSessions, selectedDays, isTokenMode,
    sessionSort, sessionSortDir, recentSessions, sessionsTab,
    visibleColumns, totalSessions,
    onSelectSession, onSessionSortChange, onSessionSortDirChange, onSessionsTabChange, onClearSessions,
  } = props;

  const showColumn = (id: UsageColumnId) => visibleColumns.includes(id);

  const getSessionValue = (s: UsageSessionEntry): number => {
    const usage = s.usage;
    if (!usage) return 0;
    if (selectedDays.length > 0 && usage.dailyBreakdown?.length) {
      const filtered = usage.dailyBreakdown.filter((d) => selectedDays.includes(d.date));
      return isTokenMode ? filtered.reduce((sum, d) => sum + d.tokens, 0) : filtered.reduce((sum, d) => sum + d.cost, 0);
    }
    return isTokenMode ? (usage.totalTokens ?? 0) : (usage.totalCost ?? 0);
  };

  const sortedSessions = useMemo(() => {
    const sorted = [...sessions].toSorted((a, b) => {
      switch (sessionSort) {
        case "recent": return (b.updatedAt ?? 0) - (a.updatedAt ?? 0);
        case "messages": return (b.usage?.messageCounts?.total ?? 0) - (a.usage?.messageCounts?.total ?? 0);
        case "errors": return (b.usage?.messageCounts?.errors ?? 0) - (a.usage?.messageCounts?.errors ?? 0);
        default: return getSessionValue(b) - getSessionValue(a);
      }
    });
    return sessionSortDir === "asc" ? sorted.toReversed() : sorted;
  }, [sessions, sessionSort, sessionSortDir, selectedDays, isTokenMode]);

  const totalValue = sortedSessions.reduce((sum, s) => sum + getSessionValue(s), 0);
  const avgValue = sortedSessions.length ? totalValue / sortedSessions.length : 0;
  const totalErrors = sortedSessions.reduce((sum, s) => sum + (s.usage?.messageCounts?.errors ?? 0), 0);

  const selectedSet = new Set(selectedSessions);
  const selectedEntries = sortedSessions.filter((s) => selectedSet.has(s.key));
  const sessionMap = new Map(sortedSessions.map((s) => [s.key, s]));
  const recentEntries = recentSessions.map((key) => sessionMap.get(key)).filter(Boolean) as UsageSessionEntry[];

  const buildMeta = (s: UsageSessionEntry): string[] => {
    const parts: string[] = [];
    if (showColumn("channel") && s.channel) parts.push(`channel:${s.channel}`);
    if (showColumn("agent") && s.agentId) parts.push(`agent:${s.agentId}`);
    if (showColumn("provider") && (s.modelProvider || s.providerOverride)) parts.push(`provider:${s.modelProvider ?? s.providerOverride}`);
    if (showColumn("model") && s.model) parts.push(`model:${s.model}`);
    if (showColumn("messages") && s.usage?.messageCounts) parts.push(`msgs:${s.usage.messageCounts.total}`);
    if (showColumn("tools") && s.usage?.toolUsage) parts.push(`tools:${s.usage.toolUsage.totalCalls}`);
    if (showColumn("errors") && s.usage?.messageCounts) parts.push(`errors:${s.usage.messageCounts.errors}`);
    if (showColumn("duration") && s.usage?.durationMs) parts.push(`dur:${formatDurationCompact(s.usage.durationMs, { spaced: true }) ?? "—"}`);
    return parts;
  };

  const renderRow = (s: UsageSessionEntry, isSelected: boolean) => {
    const value = getSessionValue(s);
    const displayLabel = formatSessionLabel(s);
    const meta = buildMeta(s);
    return (
      <div key={s.key} className={`session-bar-row ${isSelected ? "selected" : ""}`}
        title={s.key} onClick={(e) => onSelectSession(s.key, e.shiftKey)}>
        <div className="session-bar-label">
          <div className="session-bar-title">{displayLabel}</div>
          {meta.length > 0 && <div className="session-bar-meta">{meta.join(" · ")}</div>}
        </div>
        <div className="session-bar-actions">
          <button className="session-copy-btn" title={t("usageView.copySessionName")}
            onClick={(e) => { e.stopPropagation(); void navigator.clipboard.writeText(displayLabel).catch(() => {}); }}>
            {t("usageView.copy")}
          </button>
          <div className="session-bar-value">{isTokenMode ? formatTokens(value) : formatCost(value)}</div>
        </div>
      </div>
    );
  };

  return (
    <div className="card sessions-card">
      <div className="sessions-card-header">
        <div className="card-title">{t("usageView.sessionsLabel")}</div>
        <div className="sessions-card-count">
          {sessions.length} {t("usageView.shown")}{totalSessions !== sessions.length ? ` · ${totalSessions} ${t("usageView.totalLabel")}` : ""}
        </div>
      </div>
      <div className="sessions-card-meta">
        <div className="sessions-card-stats">
          <span>{isTokenMode ? formatTokens(avgValue) : formatCost(avgValue)} {t("usageView.avg")}</span>
          <span>{totalErrors} {t("usageView.errors")}</span>
        </div>
        <div className="chart-toggle small">
          <button className={`toggle-btn ${sessionsTab === "all" ? "active" : ""}`} onClick={() => onSessionsTabChange("all")}>{t("usageView.allTab")}</button>
          <button className={`toggle-btn ${sessionsTab === "recent" ? "active" : ""}`} onClick={() => onSessionsTabChange("recent")}>{t("usageView.recentlyViewed")}</button>
        </div>
        <label className="sessions-sort">
          <span>{t("usageView.sort")}</span>
          <select value={sessionSort} onChange={(e) => onSessionSortChange(e.target.value as typeof sessionSort)}>
            <option value="cost">{t("usageView.costSort")}</option>
            <option value="errors">{t("usageView.errorsSort")}</option>
            <option value="messages">{t("usageView.messagesSort")}</option>
            <option value="recent">{t("usageView.recentSort")}</option>
            <option value="tokens">{t("usageView.tokensSort")}</option>
          </select>
        </label>
        <button className="btn btn-sm sessions-action-btn icon"
          onClick={() => onSessionSortDirChange(sessionSortDir === "desc" ? "asc" : "desc")}
          title={sessionSortDir === "desc" ? t("usageView.descending") : t("usageView.ascending")}>
          {sessionSortDir === "desc" ? "↓" : "↑"}
        </button>
        {selectedEntries.length > 0 && (
          <button className="btn btn-sm sessions-action-btn sessions-clear-btn" onClick={onClearSessions}>{t("usageView.clearSelection")}</button>
        )}
      </div>

      {sessionsTab === "recent" ? (
        recentEntries.length === 0
          ? <div className="muted" style={{ padding: 20, textAlign: "center" }}>{t("usageView.noRecentSessions")}</div>
          : <div className="session-bars" style={{ maxHeight: 220, marginTop: 6 }}>{recentEntries.map((s) => renderRow(s, selectedSet.has(s.key)))}</div>
      ) : (
        sessions.length === 0
          ? <div className="muted" style={{ padding: 20, textAlign: "center" }}>{t("usageView.noSessionsInRange")}</div>
          : (
            <div className="session-bars">
              {sortedSessions.slice(0, 50).map((s) => renderRow(s, selectedSet.has(s.key)))}
              {sessions.length > 50 && <div className="muted" style={{ padding: 8, textAlign: "center", fontSize: 11 }}>{t("usageView.more", { count: String(sessions.length - 50) })}</div>}
            </div>
          )
      )}

      {selectedEntries.length > 1 && (
        <div style={{ marginTop: 10 }}>
          <div className="sessions-card-count">{t("usageView.selectedCount", { count: String(selectedEntries.length) })}</div>
          <div className="session-bars" style={{ maxHeight: 160, marginTop: 6 }}>{selectedEntries.map((s) => renderRow(s, true))}</div>
        </div>
      )}
    </div>
  );
}
