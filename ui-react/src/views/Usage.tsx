import React, { useMemo } from "react";
import { t } from "../i18n/index.ts";
import { useUsageStore } from "../components/usage/useUsageStore.ts";
import { UsageFilterBar } from "../components/usage/UsageFilterBar.tsx";
import { UsageOverview } from "../components/usage/UsageOverview.tsx";
import { UsageDailyChart, CostBreakdownCompact } from "../components/usage/UsageDailyChart.tsx";
import { UsageMosaic } from "../components/usage/UsageMosaic.tsx";
import { UsageSessionList } from "../components/usage/UsageSessionList.tsx";
import { UsageSessionDetail } from "../components/usage/UsageSessionDetail.tsx";
import { extractQueryTerms, filterSessionsByQuery } from "../lib/usage-helpers.ts";
import {
  buildAggregatesFromSessions,
  getZonedHour,
  setToHourEnd,
} from "../lib/views/usage-metrics.ts";
import type { UsageSessionEntry, UsageTotals } from "../lib/views/usageTypes.ts";

// ─── Helpers de cálculo ──────────────────────────────────
function computeSessionTotals(sessions: UsageSessionEntry[]): UsageTotals {
  return sessions.reduce<UsageTotals>(
    (acc, s) => {
      if (s.usage) {
        acc.input += s.usage.input;
        acc.output += s.usage.output;
        acc.cacheRead += s.usage.cacheRead;
        acc.cacheWrite += s.usage.cacheWrite;
        acc.totalTokens += s.usage.totalTokens;
        acc.totalCost += s.usage.totalCost;
        acc.inputCost += s.usage.inputCost ?? 0;
        acc.outputCost += s.usage.outputCost ?? 0;
        acc.cacheReadCost += s.usage.cacheReadCost ?? 0;
        acc.cacheWriteCost += s.usage.cacheWriteCost ?? 0;
        acc.missingCostEntries += s.usage.missingCostEntries ?? 0;
      }
      return acc;
    },
    { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, totalCost: 0, inputCost: 0, outputCost: 0, cacheReadCost: 0, cacheWriteCost: 0, missingCostEntries: 0 },
  );
}

function sessionTouchesHours(session: UsageSessionEntry, hours: number[], timeZone: "local" | "utc"): boolean {
  if (hours.length === 0) return true;
  const usage = session.usage;
  const start = usage?.firstActivity ?? session.updatedAt;
  const end = usage?.lastActivity ?? session.updatedAt;
  if (!start || !end) return false;
  const startMs = Math.min(start, end);
  const endMs = Math.max(start, end);
  let cursor = startMs;
  while (cursor <= endMs) {
    const date = new Date(cursor);
    if (hours.includes(getZonedHour(date, timeZone))) return true;
    cursor = Math.min(setToHourEnd(date, timeZone).getTime(), endMs) + 1;
  }
  return false;
}

// ─── Loading skeleton ────────────────────────────────────
function LoadingSkeleton({ startDate, endDate }: { startDate: string; endDate: string }) {
  return (
    <section className="card">
      <div className="row" style={{ justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 250 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
            <div className="card-title" style={{ margin: 0 }}>{t("usageView.title")}</div>
            <span className="usage-refresh-indicator">{t("usageView.loading")}</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input type="date" value={startDate} disabled style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", color: "var(--text)", fontSize: 13, opacity: 0.6 }} />
            <span style={{ color: "var(--muted)" }}>{t("usageView.to")}</span>
            <input type="date" value={endDate} disabled style={{ padding: "6px 10px", border: "1px solid var(--border)", borderRadius: 6, background: "var(--bg)", color: "var(--text)", fontSize: 13, opacity: 0.6 }} />
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Componente principal ────────────────────────────────
export function UsageView() {
  const store = useUsageStore();
  const {
    loading, sessions, totals, aggregates, costDaily, sessionsLimitReached,
    selectedSessions, selectedDays, selectedHours,
    chartMode, query, timeZone,
  } = store;

  const isTokenMode = chartMode === "tokens";
  const hasQuery = query.trim().length > 0;

  // Todos los hooks deben estar ANTES de cualquier return condicional
  const sortedSessions = useMemo(() =>
    [...sessions].toSorted((a, b) => {
      const valA = isTokenMode ? (a.usage?.totalTokens ?? 0) : (a.usage?.totalCost ?? 0);
      const valB = isTokenMode ? (b.usage?.totalTokens ?? 0) : (b.usage?.totalCost ?? 0);
      return valB - valA;
    }),
  [sessions, isTokenMode]);

  const dayFilteredSessions = useMemo(() => {
    if (selectedDays.length === 0) return sortedSessions;
    return sortedSessions.filter((s) => {
      if (s.usage?.activityDates?.length) return s.usage.activityDates.some((d) => selectedDays.includes(d));
      if (!s.updatedAt) return false;
      const d = new Date(s.updatedAt);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return selectedDays.includes(dateStr);
    });
  }, [sortedSessions, selectedDays]);

  const hourFilteredSessions = useMemo(() => {
    if (selectedHours.length === 0) return dayFilteredSessions;
    return dayFilteredSessions.filter((s) => sessionTouchesHours(s, selectedHours, timeZone));
  }, [dayFilteredSessions, selectedHours, timeZone]);

  const { filteredSessions } = useMemo(() => {
    const result = filterSessionsByQuery(hourFilteredSessions, query);
    return { filteredSessions: result.sessions, queryWarnings: result.warnings };
  }, [hourFilteredSessions, query]);

  const { displayTotals, displaySessionCount, activeAggregates, filteredDaily, aggregateSessions } = useMemo(() => {
    const totalSessions = sortedSessions.length;
    let dt: UsageTotals | null;
    let dsc: number;

    if (selectedSessions.length > 0) {
      const sel = filteredSessions.filter((s) => selectedSessions.includes(s.key));
      dt = computeSessionTotals(sel);
      dsc = sel.length;
    } else if (selectedDays.length > 0 && selectedHours.length === 0) {
      const matchingDays = costDaily.filter((d) => selectedDays.includes(d.date));
      dt = matchingDays.reduce<UsageTotals>((acc, d) => {
        acc.input += d.input; acc.output += d.output; acc.cacheRead += d.cacheRead; acc.cacheWrite += d.cacheWrite;
        acc.totalTokens += d.totalTokens; acc.totalCost += d.totalCost;
        acc.inputCost += d.inputCost ?? 0; acc.outputCost += d.outputCost ?? 0;
        acc.cacheReadCost += d.cacheReadCost ?? 0; acc.cacheWriteCost += d.cacheWriteCost ?? 0;
        return acc;
      }, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, totalTokens: 0, totalCost: 0, inputCost: 0, outputCost: 0, cacheReadCost: 0, cacheWriteCost: 0, missingCostEntries: 0 });
      dsc = filteredSessions.length;
    } else if (selectedHours.length > 0 || hasQuery) {
      dt = computeSessionTotals(filteredSessions);
      dsc = filteredSessions.length;
    } else {
      dt = totals;
      dsc = totalSessions;
    }

    const aggSessions = selectedSessions.length > 0
      ? filteredSessions.filter((s) => selectedSessions.includes(s.key))
      : hasQuery || selectedHours.length > 0
        ? filteredSessions
        : selectedDays.length > 0
          ? dayFilteredSessions
          : sortedSessions;

    const activeAgg = buildAggregatesFromSessions(aggSessions, aggregates);

    let fd = costDaily;
    if (selectedSessions.length > 0) {
      const sel = filteredSessions.filter((s) => selectedSessions.includes(s.key));
      const allDates = new Set<string>();
      for (const entry of sel) {
        for (const date of entry.usage?.activityDates ?? []) allDates.add(date);
      }
      if (allDates.size > 0) fd = costDaily.filter((d) => allDates.has(d.date));
    }

    return { displayTotals: dt, displaySessionCount: dsc, activeAggregates: activeAgg, filteredDaily: fd, aggregateSessions: aggSessions };
  }, [sortedSessions, filteredSessions, dayFilteredSessions, selectedSessions, selectedDays, selectedHours, costDaily, hasQuery, totals, aggregates]);

  const hasMissingCost = (displayTotals?.missingCostEntries ?? 0) > 0 ||
    (displayTotals ? displayTotals.totalTokens > 0 && displayTotals.totalCost === 0 && (displayTotals.input + displayTotals.output + displayTotals.cacheRead + displayTotals.cacheWrite) > 0 : false);

  // Loading skeleton - DESPUÉS de todos los hooks
  if (loading && !totals) {
    return <LoadingSkeleton startDate={store.startDate} endDate={store.endDate} />;
  }

  return (
    <>
      {/* Page header */}
      <section className="usage-page-header">
        <div className="usage-page-title">{t("usageView.title")}</div>
        <div className="usage-page-subtitle">{t("usageView.subtitle")}</div>
      </section>

      {/* Filter bar */}
      <UsageFilterBar
        loading={loading}
        error={store.error}
        startDate={store.startDate}
        endDate={store.endDate}
        sessions={sortedSessions}
        totals={totals}
        aggregates={aggregates}
        costDaily={costDaily}
        displayTotals={displayTotals}
        displaySessionCount={displaySessionCount}
        totalSessions={sortedSessions.length}
        filteredSessions={filteredSessions}
        filteredDaily={filteredDaily}
        selectedDays={selectedDays}
        selectedHours={selectedHours}
        selectedSessions={selectedSessions}
        chartMode={chartMode}
        headerPinned={store.headerPinned}
        sessionsLimitReached={sessionsLimitReached}
        query={query}
        queryDraft={store.queryDraft}
        timeZone={timeZone}
        onStartDateChange={store.onStartDateChange}
        onEndDateChange={store.onEndDateChange}
        onRefresh={store.onRefresh}
        onChartModeChange={store.onChartModeChange}
        onTimeZoneChange={store.onTimeZoneChange}
        onToggleHeaderPinned={store.onToggleHeaderPinned}
        onQueryDraftChange={store.onQueryDraftChange}
        onApplyQuery={store.onApplyQuery}
        onClearQuery={store.onClearQuery}
        onClearDays={store.onClearDays}
        onClearHours={store.onClearHours}
        onClearSessions={store.onClearSessions}
        onClearFilters={store.onClearFilters}
      />

      {/* Overview cards */}
      <UsageOverview
        totals={displayTotals}
        aggregates={activeAggregates}
        sessions={aggregateSessions}
        sessionCount={displaySessionCount}
        totalSessions={sortedSessions.length}
        timeZone={timeZone}
        showCostHint={hasMissingCost}
      />

      {/* Mosaic heatmap */}
      <UsageMosaic
        sessions={aggregateSessions}
        timeZone={timeZone}
        selectedHours={selectedHours}
        onSelectHour={store.onSelectHour}
      />

      {/* Two-column layout: Daily chart + Sessions */}
      <div className="usage-grid">
        <div className="usage-grid-left">
          <div className="card usage-left-card">
            <UsageDailyChart
              daily={filteredDaily}
              selectedDays={selectedDays}
              chartMode={chartMode}
              dailyChartMode={store.dailyChartMode}
              onDailyChartModeChange={store.onDailyChartModeChange}
              onSelectDay={store.onSelectDay}
            />
            {displayTotals && <CostBreakdownCompact totals={displayTotals} mode={chartMode} />}
          </div>
        </div>
        <div className="usage-grid-right">
          <UsageSessionList
            sessions={filteredSessions}
            selectedSessions={selectedSessions}
            selectedDays={selectedDays}
            isTokenMode={isTokenMode}
            sessionSort={store.sessionSort}
            sessionSortDir={store.sessionSortDir}
            recentSessions={store.recentSessions}
            sessionsTab={store.sessionsTab}
            visibleColumns={store.visibleColumns}
            totalSessions={sortedSessions.length}
            onSelectSession={store.onSelectSession}
            onSessionSortChange={store.onSessionSortChange}
            onSessionSortDirChange={store.onSessionSortDirChange}
            onSessionsTabChange={store.onSessionsTabChange}
            onClearSessions={store.onClearSessions}
          />
        </div>
      </div>

      {/* Session detail panel */}
      {selectedSessions.length === 1 && (() => {
        const sel = filteredSessions.find((s) => s.key === selectedSessions[0]);
        if (!sel) return null;
        return (
          <UsageSessionDetail
            session={sel}
            timeSeries={store.timeSeries}
            timeSeriesLoading={store.timeSeriesLoading}
            timeSeriesMode={store.timeSeriesMode}
            timeSeriesBreakdownMode={store.timeSeriesBreakdownMode}
            timeSeriesCursorStart={store.timeSeriesCursorStart}
            timeSeriesCursorEnd={store.timeSeriesCursorEnd}
            startDate={store.startDate}
            endDate={store.endDate}
            selectedDays={selectedDays}
            sessionLogs={store.sessionLogs}
            sessionLogsLoading={store.sessionLogsLoading}
            sessionLogsExpanded={store.sessionLogsExpanded}
            logFilterRoles={store.logFilterRoles}
            logFilterTools={store.logFilterTools}
            logFilterHasTools={store.logFilterHasTools}
            logFilterQuery={store.logFilterQuery}
            contextExpanded={store.contextExpanded}
            onTimeSeriesModeChange={store.onTimeSeriesModeChange}
            onTimeSeriesBreakdownChange={store.onTimeSeriesBreakdownChange}
            onTimeSeriesCursorRangeChange={store.onTimeSeriesCursorRangeChange}
            onToggleSessionLogsExpanded={store.onToggleSessionLogsExpanded}
            onLogFilterRolesChange={store.onLogFilterRolesChange}
            onLogFilterToolsChange={store.onLogFilterToolsChange}
            onLogFilterHasToolsChange={store.onLogFilterHasToolsChange}
            onLogFilterQueryChange={store.onLogFilterQueryChange}
            onLogFilterClear={store.onLogFilterClear}
            onToggleContextExpanded={store.onToggleContextExpanded}
            onClose={store.onClearSessions}
          />
        );
      })()}
    </>
  );
}
