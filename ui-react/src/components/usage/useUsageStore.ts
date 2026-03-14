import { useCallback, useRef } from "react";
import { useAppStore, getReactiveState } from "../../store/appStore.ts";
import { loadUsage, loadSessionTimeSeries, loadSessionLogs } from "../../lib/controllers/usage.ts";
import type { UsageState } from "../../lib/controllers/usage.ts";
import type { SessionsUsageResult, CostUsageSummary, SessionUsageTimeSeries } from "../../lib/types.ts";
import type { UsageColumnId, SessionLogEntry, SessionLogRole } from "../../lib/views/usageTypes.ts";

// Debounce para cambios de fecha
let usageDateDebounceTimeout: number | null = null;

/** Casteo para funciones del controlador que esperan UsageState */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const rs = () => getReactiveState() as any;

export function useUsageStore() {
  const s = useAppStore;

  const loading = s((st) => st.usageLoading);
  const error = s((st) => st.usageError);
  const startDate = s((st) => st.usageStartDate);
  const endDate = s((st) => st.usageEndDate);
  const usageResult = s((st) => st.usageResult) as SessionsUsageResult | null;
  const costSummary = s((st) => st.usageCostSummary) as CostUsageSummary | null;
  const selectedSessions = s((st) => st.usageSelectedSessions);
  const selectedDays = s((st) => st.usageSelectedDays);
  const selectedHours = s((st) => st.usageSelectedHours);
  const chartMode = s((st) => st.usageChartMode);
  const dailyChartMode = s((st) => st.usageDailyChartMode);
  const timeSeriesMode = s((st) => st.usageTimeSeriesMode);
  const timeSeriesBreakdownMode = s((st) => st.usageTimeSeriesBreakdownMode);
  const timeSeries = s((st) => st.usageTimeSeries) as SessionUsageTimeSeries | null;
  const timeSeriesLoading = s((st) => st.usageTimeSeriesLoading);
  const timeSeriesCursorStart = s((st) => st.usageTimeSeriesCursorStart);
  const timeSeriesCursorEnd = s((st) => st.usageTimeSeriesCursorEnd);
  const sessionLogs = s((st) => st.usageSessionLogs) as SessionLogEntry[] | null;
  const sessionLogsLoading = s((st) => st.usageSessionLogsLoading);
  const sessionLogsExpanded = s((st) => st.usageSessionLogsExpanded);
  const logFilterRoles = s((st) => st.usageLogFilterRoles) as SessionLogRole[];
  const logFilterTools = s((st) => st.usageLogFilterTools);
  const logFilterHasTools = s((st) => st.usageLogFilterHasTools);
  const logFilterQuery = s((st) => st.usageLogFilterQuery);
  const query = s((st) => st.usageQuery);
  const queryDraft = s((st) => st.usageQueryDraft);
  const sessionSort = s((st) => st.usageSessionSort);
  const sessionSortDir = s((st) => st.usageSessionSortDir);
  const recentSessions = s((st) => st.usageRecentSessions);
  const sessionsTab = s((st) => st.usageSessionsTab);
  const visibleColumns = s((st) => st.usageVisibleColumns) as UsageColumnId[];
  const timeZone = s((st) => st.usageTimeZone);
  const contextExpanded = s((st) => st.usageContextExpanded);
  const headerPinned = s((st) => st.usageHeaderPinned);
  const queryTimerRef = useRef<number | null>(null);

  const sessions = usageResult?.sessions ?? [];
  const totals = usageResult?.totals ?? null;
  const aggregates = usageResult?.aggregates ?? null;
  const costDaily = costSummary?.daily ?? [];
  const sessionsLimitReached = sessions.length >= 1000;

  const onRefresh = useCallback(() => { void loadUsage(rs()); }, []);

  const onStartDateChange = useCallback((date: string) => {
    const st = rs();
    st.usageStartDate = date;
    st.usageSelectedDays = [];
    st.usageSelectedHours = [];
    st.usageSelectedSessions = [];
    if (usageDateDebounceTimeout) clearTimeout(usageDateDebounceTimeout);
    usageDateDebounceTimeout = window.setTimeout(() => void loadUsage(rs()), 400);
  }, []);

  const onEndDateChange = useCallback((date: string) => {
    const st = rs();
    st.usageEndDate = date;
    st.usageSelectedDays = [];
    st.usageSelectedHours = [];
    st.usageSelectedSessions = [];
    if (usageDateDebounceTimeout) clearTimeout(usageDateDebounceTimeout);
    usageDateDebounceTimeout = window.setTimeout(() => void loadUsage(rs()), 400);
  }, []);

  const onTimeZoneChange = useCallback((zone: "local" | "utc") => {
    const st = rs();
    st.usageTimeZone = zone;
    st.usageSelectedDays = [];
    st.usageSelectedHours = [];
    st.usageSelectedSessions = [];
    void loadUsage(st);
  }, []);

  const onChartModeChange = useCallback((mode: "tokens" | "cost") => { rs().usageChartMode = mode; }, []);
  const onDailyChartModeChange = useCallback((mode: "total" | "by-type") => { rs().usageDailyChartMode = mode; }, []);
  const onToggleHeaderPinned = useCallback(() => { const st = rs(); st.usageHeaderPinned = !st.usageHeaderPinned; }, []);
  const onToggleContextExpanded = useCallback(() => { const st = rs(); st.usageContextExpanded = !st.usageContextExpanded; }, []);
  const onToggleSessionLogsExpanded = useCallback(() => { const st = rs(); st.usageSessionLogsExpanded = !st.usageSessionLogsExpanded; }, []);

  const onLogFilterRolesChange = useCallback((next: typeof logFilterRoles) => { rs().usageLogFilterRoles = next; }, []);
  const onLogFilterToolsChange = useCallback((next: string[]) => { rs().usageLogFilterTools = next; }, []);
  const onLogFilterHasToolsChange = useCallback((next: boolean) => { rs().usageLogFilterHasTools = next; }, []);
  const onLogFilterQueryChange = useCallback((next: string) => { rs().usageLogFilterQuery = next; }, []);
  const onLogFilterClear = useCallback(() => {
    const st = rs(); st.usageLogFilterRoles = []; st.usageLogFilterTools = [];
    st.usageLogFilterHasTools = false; st.usageLogFilterQuery = "";
  }, []);

  const onQueryDraftChange = useCallback((q: string) => {
    rs().usageQueryDraft = q;
    if (queryTimerRef.current) window.clearTimeout(queryTimerRef.current);
    queryTimerRef.current = window.setTimeout(() => { rs().usageQuery = rs().usageQueryDraft; queryTimerRef.current = null; }, 250);
  }, []);

  const onApplyQuery = useCallback(() => {
    if (queryTimerRef.current) { window.clearTimeout(queryTimerRef.current); queryTimerRef.current = null; }
    rs().usageQuery = rs().usageQueryDraft;
  }, []);

  const onClearQuery = useCallback(() => {
    if (queryTimerRef.current) { window.clearTimeout(queryTimerRef.current); queryTimerRef.current = null; }
    const st = rs(); st.usageQueryDraft = ""; st.usageQuery = "";
  }, []);

  const onSessionSortChange = useCallback((sort: typeof sessionSort) => { rs().usageSessionSort = sort; }, []);
  const onSessionSortDirChange = useCallback((dir: "asc" | "desc") => { rs().usageSessionSortDir = dir; }, []);
  const onSessionsTabChange = useCallback((tab: "all" | "recent") => { rs().usageSessionsTab = tab; }, []);

  const onSelectSession = useCallback((key: string, shiftKey: boolean) => {
    const st = rs();
    st.usageTimeSeries = null;
    st.usageSessionLogs = null;
    st.usageRecentSessions = [key, ...st.usageRecentSessions.filter((e: string) => e !== key)].slice(0, 8);

    if (shiftKey && st.usageSelectedSessions.length > 0) {
      const isTokenMode = st.usageChartMode === "tokens";
      const sorted = [...(st.usageResult?.sessions ?? [])].toSorted((a: any, b: any) => {
        const va = isTokenMode ? (a.usage?.totalTokens ?? 0) : (a.usage?.totalCost ?? 0);
        const vb = isTokenMode ? (b.usage?.totalTokens ?? 0) : (b.usage?.totalCost ?? 0);
        return vb - va;
      });
      const allKeys = sorted.map((ss: any) => ss.key);
      const last = st.usageSelectedSessions[st.usageSelectedSessions.length - 1];
      const li = allKeys.indexOf(last);
      const ti = allKeys.indexOf(key);
      if (li !== -1 && ti !== -1) {
        const [a, b] = li < ti ? [li, ti] : [ti, li];
        st.usageSelectedSessions = [...new Set([...st.usageSelectedSessions, ...allKeys.slice(a, b + 1)])];
      }
    } else {
      if (st.usageSelectedSessions.length === 1 && st.usageSelectedSessions[0] === key) {
        st.usageSelectedSessions = [];
      } else {
        st.usageSelectedSessions = [key];
      }
    }

    st.usageTimeSeriesCursorStart = null;
    st.usageTimeSeriesCursorEnd = null;

    if (st.usageSelectedSessions.length === 1) {
      void loadSessionTimeSeries(st, st.usageSelectedSessions[0]);
      void loadSessionLogs(st, st.usageSelectedSessions[0]);
    }
  }, []);

  const onSelectDay = useCallback((day: string, shiftKey: boolean) => {
    const st = rs();
    if (shiftKey && st.usageSelectedDays.length > 0) {
      const allDays = (st.usageCostSummary?.daily ?? []).map((d: any) => d.date);
      const last = st.usageSelectedDays[st.usageSelectedDays.length - 1];
      const li = allDays.indexOf(last);
      const ti = allDays.indexOf(day);
      if (li !== -1 && ti !== -1) {
        const [a, b] = li < ti ? [li, ti] : [ti, li];
        st.usageSelectedDays = [...new Set([...st.usageSelectedDays, ...allDays.slice(a, b + 1)])];
      }
    } else {
      st.usageSelectedDays = st.usageSelectedDays.includes(day)
        ? st.usageSelectedDays.filter((d: string) => d !== day)
        : [day];
    }
  }, []);

  const onSelectHour = useCallback((hour: number, shiftKey: boolean) => {
    const st = rs();
    if (shiftKey && st.usageSelectedHours.length > 0) {
      const allHours = Array.from({ length: 24 }, (_, i) => i);
      const last = st.usageSelectedHours[st.usageSelectedHours.length - 1];
      const li = allHours.indexOf(last);
      const ti = allHours.indexOf(hour);
      if (li !== -1 && ti !== -1) {
        const [a, b] = li < ti ? [li, ti] : [ti, li];
        st.usageSelectedHours = [...new Set([...st.usageSelectedHours, ...allHours.slice(a, b + 1)])];
      }
    } else {
      st.usageSelectedHours = st.usageSelectedHours.includes(hour)
        ? st.usageSelectedHours.filter((h: number) => h !== hour)
        : [...st.usageSelectedHours, hour];
    }
  }, []);

  const onClearDays = useCallback(() => { rs().usageSelectedDays = []; }, []);
  const onClearHours = useCallback(() => { rs().usageSelectedHours = []; }, []);
  const onClearSessions = useCallback(() => {
    const st = rs(); st.usageSelectedSessions = []; st.usageTimeSeries = null; st.usageSessionLogs = null;
  }, []);
  const onClearFilters = useCallback(() => {
    const st = rs();
    st.usageSelectedDays = []; st.usageSelectedHours = [];
    st.usageSelectedSessions = []; st.usageTimeSeries = null; st.usageSessionLogs = null;
  }, []);

  const onTimeSeriesModeChange = useCallback((mode: "cumulative" | "per-turn") => { rs().usageTimeSeriesMode = mode; }, []);
  const onTimeSeriesBreakdownChange = useCallback((mode: "total" | "by-type") => { rs().usageTimeSeriesBreakdownMode = mode; }, []);
  const onTimeSeriesCursorRangeChange = useCallback((start: number | null, end: number | null) => {
    const st = rs(); st.usageTimeSeriesCursorStart = start; st.usageTimeSeriesCursorEnd = end;
  }, []);

  const onToggleColumn = useCallback((column: UsageColumnId) => {
    const st = rs();
    st.usageVisibleColumns = st.usageVisibleColumns.includes(column)
      ? st.usageVisibleColumns.filter((e: string) => e !== column)
      : [...st.usageVisibleColumns, column];
  }, []);

  return {
    loading, error, startDate, endDate,
    sessions, totals, aggregates, costDaily, sessionsLimitReached,
    selectedSessions, selectedDays, selectedHours,
    chartMode, dailyChartMode,
    timeSeriesMode, timeSeriesBreakdownMode,
    timeSeries, timeSeriesLoading,
    timeSeriesCursorStart, timeSeriesCursorEnd,
    sessionLogs, sessionLogsLoading, sessionLogsExpanded,
    logFilterRoles, logFilterTools, logFilterHasTools, logFilterQuery,
    query, queryDraft,
    sessionSort, sessionSortDir,
    recentSessions, sessionsTab, visibleColumns,
    timeZone, contextExpanded, headerPinned,
    onRefresh, onStartDateChange, onEndDateChange,
    onTimeZoneChange, onChartModeChange, onDailyChartModeChange,
    onToggleHeaderPinned, onToggleContextExpanded, onToggleSessionLogsExpanded,
    onLogFilterRolesChange, onLogFilterToolsChange, onLogFilterHasToolsChange,
    onLogFilterQueryChange, onLogFilterClear,
    onQueryDraftChange, onApplyQuery, onClearQuery,
    onSessionSortChange, onSessionSortDirChange, onSessionsTabChange,
    onSelectSession, onSelectDay, onSelectHour,
    onClearDays, onClearHours, onClearSessions, onClearFilters,
    onTimeSeriesModeChange, onTimeSeriesBreakdownChange,
    onTimeSeriesCursorRangeChange, onToggleColumn,
  };
}
