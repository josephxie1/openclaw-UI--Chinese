import React, { useMemo, useCallback, useRef } from "react";
import { t } from "../../i18n/index.ts";
import { formatDurationCompact } from "../../../../src/infra/format-time/format-duration.ts";
import { parseToolSummary } from "../../lib/usage-helpers.ts";
import { charsToTokens, formatCost, formatTokens } from "../../lib/views/usage-metrics.ts";
import type {
  SessionLogEntry,
  SessionLogRole,
  TimeSeriesPoint,
  UsageSessionEntry,
} from "../../lib/views/usageTypes.ts";

// ─── Constantes SVG ──────────────────────────────────────
const CHART_BAR_WIDTH_RATIO = 0.75;
const CHART_MAX_BAR_WIDTH = 8;
const CHART_SELECTION_OPACITY = 0.06;
const HANDLE_WIDTH = 5;
const HANDLE_HEIGHT = 12;
const HANDLE_GRIP_OFFSET = 0.7;

function pct(part: number, total: number): number {
  return !total || total <= 0 ? 0 : (part / total) * 100;
}

function normalizeLogTimestamp(ts: number): number {
  return ts < 1e12 ? ts * 1000 : ts;
}

// ─── Props del componente principal ──────────────────────
interface UsageSessionDetailProps {
  session: UsageSessionEntry;
  timeSeries: { points: TimeSeriesPoint[] } | null;
  timeSeriesLoading: boolean;
  timeSeriesMode: "cumulative" | "per-turn";
  timeSeriesBreakdownMode: "total" | "by-type";
  timeSeriesCursorStart: number | null;
  timeSeriesCursorEnd: number | null;
  startDate: string;
  endDate: string;
  selectedDays: string[];
  sessionLogs: SessionLogEntry[] | null;
  sessionLogsLoading: boolean;
  sessionLogsExpanded: boolean;
  logFilterRoles: SessionLogRole[];
  logFilterTools: string[];
  logFilterHasTools: boolean;
  logFilterQuery: string;
  contextExpanded: boolean;
  onTimeSeriesModeChange: (mode: "cumulative" | "per-turn") => void;
  onTimeSeriesBreakdownChange: (mode: "total" | "by-type") => void;
  onTimeSeriesCursorRangeChange: (start: number | null, end: number | null) => void;
  onToggleSessionLogsExpanded: () => void;
  onLogFilterRolesChange: (next: SessionLogRole[]) => void;
  onLogFilterToolsChange: (next: string[]) => void;
  onLogFilterHasToolsChange: (next: boolean) => void;
  onLogFilterQueryChange: (next: string) => void;
  onLogFilterClear: () => void;
  onToggleContextExpanded: () => void;
  onClose: () => void;
}

// ─── Sub: Session Summary ────────────────────────────────
function SessionSummary({ session, filteredUsage, filteredLogs }: {
  session: UsageSessionEntry;
  filteredUsage?: UsageSessionEntry["usage"];
  filteredLogs?: SessionLogEntry[];
}) {
  const usage = filteredUsage || session.usage;
  if (!usage) return <div className="muted">{t("usageView.noUsageData")}</div>;

  const formatTs = (ts?: number) => ts ? new Date(ts).toLocaleString() : "—";
  const badges: string[] = [];
  if (session.channel) badges.push(`channel:${session.channel}`);
  if (session.agentId) badges.push(`agent:${session.agentId}`);
  if (session.modelProvider || session.providerOverride) badges.push(`provider:${session.modelProvider ?? session.providerOverride}`);
  if (session.model) badges.push(`model:${session.model}`);

  const baseTools = usage.toolUsage?.tools.slice(0, 6) ?? [];
  let toolCallCount: number, uniqueToolCount: number;
  let toolItems: Array<{ label: string; value: string; sub: string }>;

  if (filteredLogs) {
    const toolCounts = new Map<string, number>();
    for (const log of filteredLogs) {
      const { tools } = parseToolSummary(log.content);
      for (const [name] of tools) toolCounts.set(name, (toolCounts.get(name) || 0) + 1);
    }
    toolItems = baseTools.map((tool) => ({ label: tool.name, value: `${toolCounts.get(tool.name) ?? 0}`, sub: "calls" }));
    toolCallCount = [...toolCounts.values()].reduce((sum, c) => sum + c, 0);
    uniqueToolCount = toolCounts.size;
  } else {
    toolItems = baseTools.map((tool) => ({ label: tool.name, value: `${tool.count}`, sub: "calls" }));
    toolCallCount = usage.toolUsage?.totalCalls ?? 0;
    uniqueToolCount = usage.toolUsage?.uniqueTools ?? 0;
  }

  const modelItems = usage.modelUsage?.slice(0, 6).map((entry) => ({
    label: entry.model ?? "unknown", value: formatCost(entry.totals.totalCost), sub: formatTokens(entry.totals.totalTokens),
  })) ?? [];

  return (
    <>
      {badges.length > 0 && <div className="usage-badges">{badges.map((b) => <span key={b} className="usage-badge">{b}</span>)}</div>}
      <div className="session-summary-grid">
        <div className="session-summary-card">
          <div className="session-summary-title">{t("usageView.messages")}</div>
          <div className="session-summary-value">{usage.messageCounts?.total ?? 0}</div>
          <div className="session-summary-meta">{usage.messageCounts?.user ?? 0} {t("usageView.userLabel")} · {usage.messageCounts?.assistant ?? 0} {t("usageView.assistantLabel")}</div>
        </div>
        <div className="session-summary-card">
          <div className="session-summary-title">{t("usageView.toolCalls")}</div>
          <div className="session-summary-value">{toolCallCount}</div>
          <div className="session-summary-meta">{uniqueToolCount} {t("usageView.tools")}</div>
        </div>
        <div className="session-summary-card">
          <div className="session-summary-title">{t("usageView.errors")}</div>
          <div className="session-summary-value">{usage.messageCounts?.errors ?? 0}</div>
          <div className="session-summary-meta">{usage.messageCounts?.toolResults ?? 0} {t("usageView.toolResults")}</div>
        </div>
        <div className="session-summary-card">
          <div className="session-summary-title">{t("usageView.duration")}</div>
          <div className="session-summary-value">{formatDurationCompact(usage.durationMs, { spaced: true }) ?? "—"}</div>
          <div className="session-summary-meta">{formatTs(usage.firstActivity)} → {formatTs(usage.lastActivity)}</div>
        </div>
      </div>
      <div className="usage-insights-grid" style={{ marginTop: 12 }}>
        <InsightList title={t("usageView.topTools")} items={toolItems} emptyLabel={t("usageView.noToolCalls")} />
        <InsightList title={t("usageView.modelMix")} items={modelItems} emptyLabel={t("usageView.noModelData")} />
      </div>
    </>
  );
}

function InsightList({ title, items, emptyLabel }: { title: string; items: Array<{ label: string; value: string; sub?: string }>; emptyLabel: string }) {
  return (
    <div className="usage-insight-card">
      <div className="usage-insight-title">{title}</div>
      {items.length === 0 ? <div className="muted">{emptyLabel}</div> : (
        <div className="usage-list">
          {items.map((item, i) => (
            <div key={i} className="usage-list-item">
              <span>{item.label}</span>
              <span className="usage-list-value"><span>{item.value}</span>{item.sub && <span className="usage-list-sub">{item.sub}</span>}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Sub: Time Series SVG Chart ──────────────────────────
function TimeSeriesChart({ timeSeries, loading, mode, onModeChange, breakdownMode, onBreakdownChange,
  startDate, endDate, selectedDays, cursorStart, cursorEnd, onCursorRangeChange,
}: {
  timeSeries: { points: TimeSeriesPoint[] } | null; loading: boolean;
  mode: "cumulative" | "per-turn"; onModeChange: (m: "cumulative" | "per-turn") => void;
  breakdownMode: "total" | "by-type"; onBreakdownChange: (m: "total" | "by-type") => void;
  startDate: string; endDate: string; selectedDays: string[];
  cursorStart: number | null; cursorEnd: number | null;
  onCursorRangeChange: (start: number | null, end: number | null) => void;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Procesar datos con useMemo para que los hooks se llamen siempre
  const chartData = useMemo(() => {
    if (loading || !timeSeries || timeSeries.points.length < 2) return null;

    let points = timeSeries.points;
    if (startDate || endDate || selectedDays.length > 0) {
      const startTs = startDate ? new Date(startDate + "T00:00:00").getTime() : 0;
      const endTs = endDate ? new Date(endDate + "T23:59:59").getTime() : Infinity;
      points = points.filter((p) => {
        if (p.timestamp < startTs || p.timestamp > endTs) return false;
        if (selectedDays.length > 0) {
          const d = new Date(p.timestamp);
          const ds = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          return selectedDays.includes(ds);
        }
        return true;
      });
    }
    if (points.length < 2) return null;

    let cumTokens = 0, cumCost = 0;
    points = points.map((p) => {
      cumTokens += p.totalTokens; cumCost += p.cost;
      return { ...p, cumulativeTokens: cumTokens, cumulativeCost: cumCost };
    });

    const hasSelection = cursorStart != null && cursorEnd != null;
    const rangeStartTs = hasSelection ? Math.min(cursorStart!, cursorEnd!) : 0;
    const rangeEndTs = hasSelection ? Math.max(cursorStart!, cursorEnd!) : Infinity;
    let rangeStartIdx = 0, rangeEndIdx = points.length;
    if (hasSelection) {
      rangeStartIdx = points.findIndex((p) => p.timestamp >= rangeStartTs);
      if (rangeStartIdx === -1) rangeStartIdx = points.length;
      const ei = points.findIndex((p) => p.timestamp > rangeEndTs);
      rangeEndIdx = ei === -1 ? points.length : ei;
    }

    const filteredPoints = hasSelection ? points.slice(rangeStartIdx, rangeEndIdx) : points;
    let filteredOutput = 0, filteredInput = 0, filteredCacheRead = 0, filteredCacheWrite = 0;
    for (const p of filteredPoints) { filteredOutput += p.output; filteredInput += p.input; filteredCacheRead += p.cacheRead; filteredCacheWrite += p.cacheWrite; }

    const width = 400, height = 100;
    const padding = { top: 8, right: 4, bottom: 14, left: 30 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const isCumulative = mode === "cumulative";
    const breakdownByType = mode === "per-turn" && breakdownMode === "by-type";
    const totalTypeTokens = filteredOutput + filteredInput + filteredCacheRead + filteredCacheWrite;

    const barTotals = points.map((p: any) =>
      isCumulative ? p.cumulativeTokens : breakdownByType ? p.input + p.output + p.cacheRead + p.cacheWrite : p.totalTokens,
    );
    const maxValue = Math.max(...barTotals, 1);
    const slotWidth = chartWidth / points.length;
    const barWidth = Math.min(CHART_MAX_BAR_WIDTH, Math.max(1, slotWidth * CHART_BAR_WIDTH_RATIO));
    const barGap = slotWidth - barWidth;

    const leftHandleX = padding.left + rangeStartIdx * (barWidth + barGap);
    const rightHandleX = rangeEndIdx >= points.length
      ? padding.left + (points.length - 1) * (barWidth + barGap) + barWidth
      : padding.left + (rangeEndIdx - 1) * (barWidth + barGap) + barWidth;

    return {
      points, cumTokens, cumCost, hasSelection, rangeStartTs, rangeEndTs, rangeStartIdx, rangeEndIdx,
      filteredPoints, filteredOutput, filteredInput, filteredCacheRead, filteredCacheWrite,
      width, height, padding, chartWidth, chartHeight, isCumulative, breakdownByType, totalTypeTokens,
      barTotals, maxValue, barWidth, barGap, leftHandleX, rightHandleX,
    };
  }, [timeSeries, loading, startDate, endDate, selectedDays, cursorStart, cursorEnd, mode, breakdownMode]);

  const makeDragHandler = useCallback((side: "left" | "right") => (e: React.MouseEvent) => {
    if (!chartData) return;
    e.preventDefault(); e.stopPropagation();
    const svgEl = wrapperRef.current?.querySelector("svg") as SVGSVGElement;
    if (!svgEl) return;
    const { points, leftHandleX, rightHandleX, width, padding } = chartData;
    const rect = svgEl.getBoundingClientRect();
    const svgWidth = rect.width;
    const chartLeftPx = (padding.left / width) * svgWidth;
    const chartRightPx = ((width - padding.right) / width) * svgWidth;
    const chartW = chartRightPx - chartLeftPx;
    const posToIdx = (clientX: number) => {
      const x = Math.max(0, Math.min(1, (clientX - rect.left - chartLeftPx) / chartW));
      return Math.min(Math.floor(x * points.length), points.length - 1);
    };
    const handleSvgX = side === "left" ? leftHandleX : rightHandleX;
    const handleClientX = rect.left + (handleSvgX / width) * svgWidth;
    const grabOffset = e.clientX - handleClientX;
    document.body.style.cursor = "col-resize";

    const handleMove = (me: MouseEvent) => {
      const idx = posToIdx(me.clientX - grabOffset);
      const pt = points[idx]; if (!pt) return;
      if (side === "left") {
        const endTs = cursorEnd ?? points[points.length - 1].timestamp;
        onCursorRangeChange(Math.min(pt.timestamp, endTs), endTs);
      } else {
        const startTs = cursorStart ?? points[0].timestamp;
        onCursorRangeChange(startTs, Math.max(pt.timestamp, startTs));
      }
    };
    const handleUp = () => { document.body.style.cursor = ""; document.removeEventListener("mousemove", handleMove); document.removeEventListener("mouseup", handleUp); };
    document.addEventListener("mousemove", handleMove);
    document.addEventListener("mouseup", handleUp);
  }, [chartData, cursorStart, cursorEnd, onCursorRangeChange]);

  // Renderizado condicional sin early returns (hooks ya están arriba)
  if (loading) return <div className="session-timeseries-compact"><div className="muted" style={{ padding: 20, textAlign: "center" }}>Loading...</div></div>;
  if (!chartData) {
    const hasRawPoints = timeSeries && timeSeries.points.length >= 2;
    return <div className="session-timeseries-compact"><div className="muted" style={{ padding: 20, textAlign: "center" }}>{hasRawPoints ? t("usageView.noDataInRange") : t("usageView.noTimelineData")}</div></div>;
  }

  const { points, cumTokens, cumCost, hasSelection, rangeStartTs, rangeEndTs, rangeStartIdx, rangeEndIdx,
    filteredPoints, filteredOutput, filteredInput, filteredCacheRead, filteredCacheWrite,
    width, height, padding, chartHeight, isCumulative, breakdownByType, totalTypeTokens,
    barTotals, maxValue, barWidth, barGap, leftHandleX, rightHandleX,
  } = chartData;

  const leftHandlePos = `${((leftHandleX / width) * 100).toFixed(1)}%`;
  const rightHandlePos = `${((rightHandleX / width) * 100).toFixed(1)}%`;

  return (
    <div className="session-timeseries-compact">
      <div className="timeseries-header-row">
        <div className="card-title" style={{ fontSize: 12, color: "var(--text)" }}>{t("usageView.usageOverTime")}</div>
        <div className="timeseries-controls">
          {hasSelection && <div className="chart-toggle small"><button className="toggle-btn active" onClick={() => onCursorRangeChange(null, null)}>{t("usageView.reset")}</button></div>}
          <div className="chart-toggle small">
            <button className={`toggle-btn ${!isCumulative ? "active" : ""}`} onClick={() => onModeChange("per-turn")}>{t("usageView.perTurn")}</button>
            <button className={`toggle-btn ${isCumulative ? "active" : ""}`} onClick={() => onModeChange("cumulative")}>{t("usageView.cumulative")}</button>
          </div>
          {!isCumulative && (
            <div className="chart-toggle small">
              <button className={`toggle-btn ${breakdownMode === "total" ? "active" : ""}`} onClick={() => onBreakdownChange("total")}>{t("usageView.total")}</button>
              <button className={`toggle-btn ${breakdownMode === "by-type" ? "active" : ""}`} onClick={() => onBreakdownChange("by-type")}>{t("usageView.byType")}</button>
            </div>
          )}
        </div>
      </div>
      <div ref={wrapperRef} className="timeseries-chart-wrapper" style={{ position: "relative", cursor: "crosshair" }}>
        <svg viewBox={`0 0 ${width} ${height + 18}`} className="timeseries-svg" style={{ width: "100%", height: "auto", display: "block" }}>
          <line x1={padding.left} y1={padding.top} x2={padding.left} y2={padding.top + chartHeight} stroke="var(--border)" />
          <line x1={padding.left} y1={padding.top + chartHeight} x2={width - padding.right} y2={padding.top + chartHeight} stroke="var(--border)" />
          <text x={padding.left - 4} y={padding.top + 5} textAnchor="end" className="ts-axis-label">{formatTokens(maxValue)}</text>
          <text x={padding.left - 4} y={padding.top + chartHeight} textAnchor="end" className="ts-axis-label">0</text>
          {points.length > 0 && (
            <>
              <text x={padding.left} y={padding.top + chartHeight + 10} textAnchor="start" className="ts-axis-label">{new Date(points[0].timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</text>
              <text x={width - padding.right} y={padding.top + chartHeight + 10} textAnchor="end" className="ts-axis-label">{new Date(points[points.length - 1].timestamp).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}</text>
            </>
          )}
          {points.map((p: any, i: number) => {
            const val = barTotals[i];
            const x = padding.left + i * (barWidth + barGap);
            const bh = (val / maxValue) * chartHeight;
            const y = padding.top + chartHeight - bh;
            const isOutside = hasSelection && (i < rangeStartIdx || i >= rangeEndIdx);
            if (!breakdownByType) {
              return <rect key={i} x={x} y={y} width={barWidth} height={bh} className={`ts-bar${isOutside ? " dimmed" : ""}`} rx={1}><title>{`${formatTokens(val)} tokens`}</title></rect>;
            }
            const segs = [{ value: p.output, cls: "output" }, { value: p.input, cls: "input" }, { value: p.cacheWrite, cls: "cache-write" }, { value: p.cacheRead, cls: "cache-read" }];
            let yC = padding.top + chartHeight;
            return <g key={i}>{segs.map((seg) => {
              if (seg.value <= 0 || val <= 0) return null;
              const sh = bh * (seg.value / val); yC -= sh;
              return <rect key={seg.cls} x={x} y={yC} width={barWidth} height={sh} className={`ts-bar ${seg.cls}${isOutside ? " dimmed" : ""}`} rx={1} />;
            })}</g>;
          })}
          <rect x={leftHandleX} y={padding.top} width={Math.max(1, rightHandleX - leftHandleX)} height={chartHeight} fill="var(--accent)" opacity={CHART_SELECTION_OPACITY} pointerEvents="none" />
          <line x1={leftHandleX} y1={padding.top} x2={leftHandleX} y2={padding.top + chartHeight} stroke="var(--accent)" strokeWidth={0.8} opacity={0.7} />
          <rect x={leftHandleX - HANDLE_WIDTH / 2} y={padding.top + chartHeight / 2 - HANDLE_HEIGHT / 2} width={HANDLE_WIDTH} height={HANDLE_HEIGHT} rx={1.5} fill="var(--accent)" className="cursor-handle" />
          <line x1={rightHandleX} y1={padding.top} x2={rightHandleX} y2={padding.top + chartHeight} stroke="var(--accent)" strokeWidth={0.8} opacity={0.7} />
          <rect x={rightHandleX - HANDLE_WIDTH / 2} y={padding.top + chartHeight / 2 - HANDLE_HEIGHT / 2} width={HANDLE_WIDTH} height={HANDLE_HEIGHT} rx={1.5} fill="var(--accent)" className="cursor-handle" />
        </svg>
        <div className="chart-handle-zone chart-handle-left" style={{ left: leftHandlePos }} onMouseDown={makeDragHandler("left")} />
        <div className="chart-handle-zone chart-handle-right" style={{ left: rightHandlePos }} onMouseDown={makeDragHandler("right")} />
      </div>
      <div className="timeseries-summary">
        {hasSelection
          ? <><span style={{ color: "var(--accent)" }}>▶ Turns {rangeStartIdx + 1}–{rangeEndIdx} of {points.length}</span> · {new Date(rangeStartTs).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}–{new Date(rangeEndTs).toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })} · {formatTokens(totalTypeTokens)} · {formatCost(filteredPoints.reduce((s, p) => s + (p.cost || 0), 0))}</>
          : <>{points.length} msgs · {formatTokens(cumTokens)} · {formatCost(cumCost)}</>}
      </div>
      {breakdownByType && (
        <div style={{ marginTop: 8 }}>
          <div className="card-title" style={{ fontSize: 12, marginBottom: 6, color: "var(--text)" }}>{t("usageView.tokensByType")}</div>
          <div className="cost-breakdown-bar" style={{ height: 18 }}>
            <div className="cost-segment output" style={{ width: `${pct(filteredOutput, totalTypeTokens).toFixed(1)}%` }} />
            <div className="cost-segment input" style={{ width: `${pct(filteredInput, totalTypeTokens).toFixed(1)}%` }} />
            <div className="cost-segment cache-write" style={{ width: `${pct(filteredCacheWrite, totalTypeTokens).toFixed(1)}%` }} />
            <div className="cost-segment cache-read" style={{ width: `${pct(filteredCacheRead, totalTypeTokens).toFixed(1)}%` }} />
          </div>
          <div className="cost-breakdown-legend">
            <div className="legend-item"><span className="legend-dot output" />{t("usageView.output")} {formatTokens(filteredOutput)}</div>
            <div className="legend-item"><span className="legend-dot input" />{t("usageView.input")} {formatTokens(filteredInput)}</div>
            <div className="legend-item"><span className="legend-dot cache-write" />{t("usageView.cacheWrite")} {formatTokens(filteredCacheWrite)}</div>
            <div className="legend-item"><span className="legend-dot cache-read" />{t("usageView.cacheRead")} {formatTokens(filteredCacheRead)}</div>
          </div>
          <div className="cost-breakdown-total">{t("usageView.total")}: {formatTokens(totalTypeTokens)}</div>
        </div>
      )}
    </div>
  );
}

// ─── Sub: Session Logs ───────────────────────────────────
function SessionLogs({ logs, loading, expandedAll, onToggleExpandedAll, filters, onFilterRolesChange, onFilterToolsChange, onFilterHasToolsChange, onFilterQueryChange, onFilterClear, cursorStart, cursorEnd }: {
  logs: SessionLogEntry[] | null; loading: boolean; expandedAll: boolean;
  onToggleExpandedAll: () => void;
  filters: { roles: SessionLogRole[]; tools: string[]; hasTools: boolean; query: string };
  onFilterRolesChange: (next: SessionLogRole[]) => void; onFilterToolsChange: (next: string[]) => void;
  onFilterHasToolsChange: (next: boolean) => void; onFilterQueryChange: (next: string) => void; onFilterClear: () => void;
  cursorStart: number | null; cursorEnd: number | null;
}) {
  if (loading) return <div className="session-logs-compact"><div className="session-logs-header">Conversation</div><div className="muted" style={{ padding: 20, textAlign: "center" }}>Loading...</div></div>;
  if (!logs || logs.length === 0) return <div className="session-logs-compact"><div className="session-logs-header">Conversation</div><div className="muted" style={{ padding: 20, textAlign: "center" }}>No messages</div></div>;

  const normalizedQuery = filters.query.trim().toLowerCase();
  const entries = logs.map((log) => { const toolInfo = parseToolSummary(log.content); return { log, toolInfo, cleanContent: toolInfo.cleanContent || log.content }; });
  const toolOptions = Array.from(new Set(entries.flatMap((e) => e.toolInfo.tools.map(([name]) => name)))).toSorted((a, b) => a.localeCompare(b));

  const filteredEntries = entries.filter((entry) => {
    if (cursorStart != null && cursorEnd != null && entry.log.timestamp > 0) {
      const lo = Math.min(cursorStart, cursorEnd), hi = Math.max(cursorStart, cursorEnd);
      if (normalizeLogTimestamp(entry.log.timestamp) < lo || normalizeLogTimestamp(entry.log.timestamp) > hi) return false;
    }
    if (filters.roles.length > 0 && !filters.roles.includes(entry.log.role)) return false;
    if (filters.hasTools && entry.toolInfo.tools.length === 0) return false;
    if (filters.tools.length > 0 && !entry.toolInfo.tools.some(([name]) => filters.tools.includes(name))) return false;
    if (normalizedQuery && !entry.cleanContent.toLowerCase().includes(normalizedQuery)) return false;
    return true;
  });

  const hasCursorFilter = cursorStart != null && cursorEnd != null;
  const hasActiveFilters = filters.roles.length > 0 || filters.tools.length > 0 || filters.hasTools || !!normalizedQuery;
  const displayedCount = hasActiveFilters || hasCursorFilter
    ? `${filteredEntries.length} of ${logs.length}${hasCursorFilter ? " (timeline filtered)" : ""}`
    : `${logs.length}`;

  return (
    <div className="session-logs-compact">
      <div className="session-logs-header">
        <span>Conversation <span style={{ fontWeight: "normal", color: "var(--muted)" }}>({displayedCount} messages)</span></span>
        <button className="btn btn-sm usage-action-btn usage-secondary-btn" onClick={onToggleExpandedAll}>{expandedAll ? t("usageView.collapseAll") : t("usageView.expandAllBtn")}</button>
      </div>
      <div className="usage-filters-inline" style={{ margin: "10px 12px" }}>
        <select multiple size={4} value={filters.roles} onChange={(e) => onFilterRolesChange(Array.from(e.target.selectedOptions).map((o) => o.value as SessionLogRole))}>
          <option value="user">{t("usageView.user")}</option>
          <option value="assistant">{t("usageView.assistant")}</option>
          <option value="tool">{t("usageView.toolRole")}</option>
          <option value="toolResult">{t("usageView.toolResult")}</option>
        </select>
        <select multiple size={4} value={filters.tools} onChange={(e) => onFilterToolsChange(Array.from(e.target.selectedOptions).map((o) => o.value))}>
          {toolOptions.map((tool) => <option key={tool} value={tool}>{tool}</option>)}
        </select>
        <label className="usage-filters-inline" style={{ gap: 6 }}>
          <input type="checkbox" checked={filters.hasTools} onChange={(e) => onFilterHasToolsChange(e.target.checked)} /> Has tools
        </label>
        <input type="text" placeholder={t("usageView.searchConversation")} value={filters.query} onChange={(e) => onFilterQueryChange(e.target.value)} />
        <button className="btn btn-sm usage-action-btn usage-secondary-btn" onClick={onFilterClear}>{t("usageView.clear")}</button>
      </div>
      <div className="session-logs-list">
        {filteredEntries.map((entry, i) => {
          const { log, toolInfo, cleanContent } = entry;
          const roleClass = log.role === "user" ? "user" : "assistant";
          const roleLabel = log.role === "user" ? t("usageView.you") : log.role === "assistant" ? t("usageView.assistant") : t("usageView.toolRole");
          return (
            <div key={i} className={`session-log-entry ${roleClass}`}>
              <div className="session-log-meta">
                <span className="session-log-role">{roleLabel}</span>
                <span>{new Date(log.timestamp).toLocaleString()}</span>
                {log.tokens ? <span>{formatTokens(log.tokens)}</span> : null}
              </div>
              <div className="session-log-content">{cleanContent}</div>
              {toolInfo.tools.length > 0 && (
                <details className="session-log-tools" open={expandedAll}>
                  <summary>{toolInfo.summary}</summary>
                  <div className="session-log-tools-list">
                    {toolInfo.tools.map(([name, count]) => <span key={name} className="session-log-tools-pill">{name} × {count}</span>)}
                  </div>
                </details>
              )}
            </div>
          );
        })}
        {filteredEntries.length === 0 && <div className="muted" style={{ padding: 12 }}>No messages match the filters.</div>}
      </div>
    </div>
  );
}

// ─── Sub: Context Weight Panel ───────────────────────────
function ContextPanel({ contextWeight, usage, expanded, onToggleExpanded }: {
  contextWeight: UsageSessionEntry["contextWeight"]; usage: UsageSessionEntry["usage"];
  expanded: boolean; onToggleExpanded: () => void;
}) {
  if (!contextWeight) return <div className="context-details-panel"><div className="muted" style={{ padding: 20, textAlign: "center" }}>{t("usageView.noContextData")}</div></div>;

  const systemTokens = charsToTokens(contextWeight.systemPrompt.chars);
  const skillsTokens = charsToTokens(contextWeight.skills.promptChars);
  const toolsTokens = charsToTokens(contextWeight.tools.listChars + contextWeight.tools.schemaChars);
  const filesTokens = charsToTokens(contextWeight.injectedWorkspaceFiles.reduce((sum, f) => sum + f.injectedChars, 0));
  const totalContextTokens = systemTokens + skillsTokens + toolsTokens + filesTokens;

  let contextPct = "";
  if (usage && usage.totalTokens > 0) {
    const inputTokens = usage.input + usage.cacheRead;
    if (inputTokens > 0) contextPct = `~${Math.min((totalContextTokens / inputTokens) * 100, 100).toFixed(0)}% of input`;
  }

  const defaultLimit = 4;
  const skillsList = contextWeight.skills.entries.toSorted((a, b) => b.blockChars - a.blockChars);
  const toolsList = contextWeight.tools.entries.toSorted((a, b) => (b.summaryChars + b.schemaChars) - (a.summaryChars + a.schemaChars));
  const filesList = contextWeight.injectedWorkspaceFiles.toSorted((a, b) => b.injectedChars - a.injectedChars);
  const showAll = expanded;
  const skillsTop = showAll ? skillsList : skillsList.slice(0, defaultLimit);
  const toolsTop = showAll ? toolsList : toolsList.slice(0, defaultLimit);
  const filesTop = showAll ? filesList : filesList.slice(0, defaultLimit);
  const hasMore = skillsList.length > defaultLimit || toolsList.length > defaultLimit || filesList.length > defaultLimit;

  return (
    <div className="context-details-panel">
      <div className="context-breakdown-header">
        <div className="card-title" style={{ fontSize: 12, color: "var(--text)" }}>{t("usageView.systemPromptBreakdown")}</div>
        {hasMore && <button className="context-expand-btn" onClick={onToggleExpanded}>{showAll ? t("usageView.collapse") : t("usageView.expandAll")}</button>}
      </div>
      <p className="context-weight-desc">{contextPct || t("usageView.baseContext")}</p>
      <div className="context-stacked-bar">
        <div className="context-segment system" style={{ width: `${pct(systemTokens, totalContextTokens).toFixed(1)}%` }} title={`System: ~${formatTokens(systemTokens)}`} />
        <div className="context-segment skills" style={{ width: `${pct(skillsTokens, totalContextTokens).toFixed(1)}%` }} title={`Skills: ~${formatTokens(skillsTokens)}`} />
        <div className="context-segment tools" style={{ width: `${pct(toolsTokens, totalContextTokens).toFixed(1)}%` }} title={`Tools: ~${formatTokens(toolsTokens)}`} />
        <div className="context-segment files" style={{ width: `${pct(filesTokens, totalContextTokens).toFixed(1)}%` }} title={`Files: ~${formatTokens(filesTokens)}`} />
      </div>
      <div className="context-legend">
        <span className="legend-item"><span className="legend-dot system" />Sys ~{formatTokens(systemTokens)}</span>
        <span className="legend-item"><span className="legend-dot skills" />Skills ~{formatTokens(skillsTokens)}</span>
        <span className="legend-item"><span className="legend-dot tools" />Tools ~{formatTokens(toolsTokens)}</span>
        <span className="legend-item"><span className="legend-dot files" />Files ~{formatTokens(filesTokens)}</span>
      </div>
      <div className="context-total">Total: ~{formatTokens(totalContextTokens)}</div>
      <div className="context-breakdown-grid">
        {skillsList.length > 0 && (
          <div className="context-breakdown-card">
            <div className="context-breakdown-title">Skills ({skillsList.length})</div>
            <div className="context-breakdown-list">{skillsTop.map((s) => <div key={s.name} className="context-breakdown-item"><span className="mono">{s.name}</span><span className="muted">~{formatTokens(charsToTokens(s.blockChars))}</span></div>)}</div>
            {skillsList.length > skillsTop.length && <div className="context-breakdown-more">+{skillsList.length - skillsTop.length} more</div>}
          </div>
        )}
        {toolsList.length > 0 && (
          <div className="context-breakdown-card">
            <div className="context-breakdown-title">Tools ({toolsList.length})</div>
            <div className="context-breakdown-list">{toolsTop.map((tt) => <div key={tt.name} className="context-breakdown-item"><span className="mono">{tt.name}</span><span className="muted">~{formatTokens(charsToTokens(tt.summaryChars + tt.schemaChars))}</span></div>)}</div>
            {toolsList.length > toolsTop.length && <div className="context-breakdown-more">+{toolsList.length - toolsTop.length} more</div>}
          </div>
        )}
        {filesList.length > 0 && (
          <div className="context-breakdown-card">
            <div className="context-breakdown-title">Files ({filesList.length})</div>
            <div className="context-breakdown-list">{filesTop.map((f) => <div key={f.name} className="context-breakdown-item"><span className="mono">{f.name}</span><span className="muted">~{formatTokens(charsToTokens(f.injectedChars))}</span></div>)}</div>
            {filesList.length > filesTop.length && <div className="context-breakdown-more">+{filesList.length - filesTop.length} more</div>}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Función auxiliar para calcular uso filtrado ─────────
function computeFilteredUsage(
  baseUsage: NonNullable<UsageSessionEntry["usage"]>,
  points: TimeSeriesPoint[],
  rangeStart: number, rangeEnd: number,
): UsageSessionEntry["usage"] | undefined {
  const lo = Math.min(rangeStart, rangeEnd), hi = Math.max(rangeStart, rangeEnd);
  const filtered = points.filter((p) => p.timestamp >= lo && p.timestamp <= hi);
  if (filtered.length === 0) return undefined;
  let totalTokens = 0, totalCost = 0, userMessages = 0, assistantMessages = 0, totalInput = 0, totalOutput = 0, totalCacheRead = 0, totalCacheWrite = 0;
  for (const p of filtered) {
    totalTokens += p.totalTokens || 0; totalCost += p.cost || 0; totalInput += p.input || 0; totalOutput += p.output || 0; totalCacheRead += p.cacheRead || 0; totalCacheWrite += p.cacheWrite || 0;
    if (p.output > 0) assistantMessages++; if (p.input > 0) userMessages++;
  }
  return { ...baseUsage, totalTokens, totalCost, input: totalInput, output: totalOutput, cacheRead: totalCacheRead, cacheWrite: totalCacheWrite,
    durationMs: filtered[filtered.length - 1].timestamp - filtered[0].timestamp,
    firstActivity: filtered[0].timestamp, lastActivity: filtered[filtered.length - 1].timestamp,
    messageCounts: { total: filtered.length, user: userMessages, assistant: assistantMessages, toolCalls: 0, toolResults: 0, errors: 0 },
  };
}

function filterLogsByRange(logs: SessionLogEntry[], rangeStart: number, rangeEnd: number): SessionLogEntry[] {
  const lo = Math.min(rangeStart, rangeEnd), hi = Math.max(rangeStart, rangeEnd);
  return logs.filter((log) => { if (log.timestamp <= 0) return true; const ts = normalizeLogTimestamp(log.timestamp); return ts >= lo && ts <= hi; });
}

// ─── Componente principal ────────────────────────────────
export function UsageSessionDetail(props: UsageSessionDetailProps) {
  const { session, timeSeries, timeSeriesLoading, timeSeriesMode, timeSeriesBreakdownMode,
    timeSeriesCursorStart, timeSeriesCursorEnd, startDate, endDate, selectedDays,
    sessionLogs, sessionLogsLoading, sessionLogsExpanded,
    logFilterRoles, logFilterTools, logFilterHasTools, logFilterQuery,
    contextExpanded, onTimeSeriesModeChange, onTimeSeriesBreakdownChange,
    onTimeSeriesCursorRangeChange, onToggleSessionLogsExpanded,
    onLogFilterRolesChange, onLogFilterToolsChange, onLogFilterHasToolsChange,
    onLogFilterQueryChange, onLogFilterClear, onToggleContextExpanded, onClose,
  } = props;

  const label = session.label || session.key;
  const displayLabel = label.length > 50 ? label.slice(0, 50) + "…" : label;
  const usage = session.usage;
  const hasRange = timeSeriesCursorStart !== null && timeSeriesCursorEnd !== null;
  const filteredUsage = hasRange && timeSeries?.points && usage
    ? computeFilteredUsage(usage, timeSeries.points, timeSeriesCursorStart!, timeSeriesCursorEnd!)
    : undefined;
  const headerStats = filteredUsage
    ? { totalTokens: filteredUsage.totalTokens, totalCost: filteredUsage.totalCost }
    : { totalTokens: usage?.totalTokens ?? 0, totalCost: usage?.totalCost ?? 0 };
  const cursorIndicator = filteredUsage ? ` (${t("usageView.filtered")})` : "";

  return (
    <div className="card session-detail-panel">
      <div className="session-detail-header">
        <div className="session-detail-header-left">
          <div className="session-detail-title">
            {displayLabel}
            {cursorIndicator && <span style={{ fontSize: 11, color: "var(--muted)", marginLeft: 8 }}>{t("usageView.filtered")}</span>}
          </div>
        </div>
        <div className="session-detail-stats">
          {usage && (
            <>
              <span><strong>{formatTokens(headerStats.totalTokens)}</strong> tokens{cursorIndicator}</span>
              <span><strong>{formatCost(headerStats.totalCost)}</strong>{cursorIndicator}</span>
            </>
          )}
        </div>
        <button className="session-close-btn" onClick={onClose} title={t("usageView.closeSessionDetails")}>×</button>
      </div>
      <div className="session-detail-content">
        <SessionSummary
          session={session} filteredUsage={filteredUsage}
          filteredLogs={hasRange && sessionLogs ? filterLogsByRange(sessionLogs, timeSeriesCursorStart!, timeSeriesCursorEnd!) : undefined}
        />
        <div className="session-detail-row">
          <TimeSeriesChart
            timeSeries={timeSeries} loading={timeSeriesLoading}
            mode={timeSeriesMode} onModeChange={onTimeSeriesModeChange}
            breakdownMode={timeSeriesBreakdownMode} onBreakdownChange={onTimeSeriesBreakdownChange}
            startDate={startDate} endDate={endDate} selectedDays={selectedDays}
            cursorStart={timeSeriesCursorStart} cursorEnd={timeSeriesCursorEnd}
            onCursorRangeChange={onTimeSeriesCursorRangeChange}
          />
        </div>
        <div className="session-detail-bottom">
          <SessionLogs
            logs={sessionLogs} loading={sessionLogsLoading} expandedAll={sessionLogsExpanded}
            onToggleExpandedAll={onToggleSessionLogsExpanded}
            filters={{ roles: logFilterRoles, tools: logFilterTools, hasTools: logFilterHasTools, query: logFilterQuery }}
            onFilterRolesChange={onLogFilterRolesChange} onFilterToolsChange={onLogFilterToolsChange}
            onFilterHasToolsChange={onLogFilterHasToolsChange} onFilterQueryChange={onLogFilterQueryChange}
            onFilterClear={onLogFilterClear}
            cursorStart={hasRange ? timeSeriesCursorStart : null} cursorEnd={hasRange ? timeSeriesCursorEnd : null}
          />
          <ContextPanel
            contextWeight={session.contextWeight} usage={usage}
            expanded={contextExpanded} onToggleExpanded={onToggleContextExpanded}
          />
        </div>
      </div>
    </div>
  );
}
