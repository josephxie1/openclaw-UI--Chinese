import React from "react";
import { t } from "../../i18n/index.ts";
import {
  formatCost,
  formatDayLabel,
  formatFullDate,
  formatTokens,
} from "../../lib/views/usage-metrics.ts";
import type { CostDailyEntry, UsageTotals } from "../../lib/views/usageTypes.ts";

function pct(part: number, total: number): number {
  return total === 0 ? 0 : (part / total) * 100;
}

// ─── Daily Chart ─────────────────────────────────────────
interface UsageDailyChartProps {
  daily: CostDailyEntry[];
  selectedDays: string[];
  chartMode: "tokens" | "cost";
  dailyChartMode: "total" | "by-type";
  onDailyChartModeChange: (mode: "total" | "by-type") => void;
  onSelectDay: (day: string, shiftKey: boolean) => void;
}

export function UsageDailyChart({ daily, selectedDays, chartMode, dailyChartMode, onDailyChartModeChange, onSelectDay }: UsageDailyChartProps) {
  const isTokenMode = chartMode === "tokens";

  if (!daily.length) {
    return (
      <div className="daily-chart-compact">
        <div className="sessions-panel-title">{t("usageView.dailyUsage")}</div>
        <div className="muted" style={{ padding: 20, textAlign: "center" }}>{t("usageView.noData")}</div>
      </div>
    );
  }

  const values = daily.map((d) => (isTokenMode ? d.totalTokens : d.totalCost));
  const maxValue = Math.max(...values, isTokenMode ? 1 : 0.0001);
  const barMaxWidth = daily.length > 30 ? 12 : daily.length > 20 ? 18 : daily.length > 14 ? 24 : 32;
  const showTotals = daily.length <= 14;

  return (
    <div className="daily-chart-compact">
      <div className="daily-chart-header">
        <div className="chart-toggle small sessions-toggle">
          <button className={`toggle-btn ${dailyChartMode === "total" ? "active" : ""}`} onClick={() => onDailyChartModeChange("total")}>{t("usageView.total")}</button>
          <button className={`toggle-btn ${dailyChartMode === "by-type" ? "active" : ""}`} onClick={() => onDailyChartModeChange("by-type")}>{t("usageView.byType")}</button>
        </div>
        <div className="card-title">{isTokenMode ? t("usageView.dailyTokenUsage") : t("usageView.dailyCostUsage")}</div>
      </div>
      <div className="daily-chart">
        <div className="daily-chart-bars" style={{ "--bar-max-width": `${barMaxWidth}px` } as React.CSSProperties}>
          {daily.map((d, idx) => {
            const value = values[idx];
            const heightPct = (value / maxValue) * 100;
            const isSelected = selectedDays.includes(d.date);
            const label = formatDayLabel(d.date);
            const shortLabel = daily.length > 20 ? String(parseInt(d.date.slice(8), 10)) : label;
            const labelStyle = daily.length > 20 ? { fontSize: "8px" } : {};
            const totalLabel = isTokenMode ? formatTokens(d.totalTokens) : formatCost(d.totalCost);

            const segments = dailyChartMode === "by-type"
              ? (isTokenMode
                ? [{ value: d.output, cls: "output" }, { value: d.input, cls: "input" }, { value: d.cacheWrite, cls: "cache-write" }, { value: d.cacheRead, cls: "cache-read" }]
                : [{ value: d.outputCost ?? 0, cls: "output" }, { value: d.inputCost ?? 0, cls: "input" }, { value: d.cacheWriteCost ?? 0, cls: "cache-write" }, { value: d.cacheReadCost ?? 0, cls: "cache-read" }])
              : [];

            return (
              <div key={d.date} className={`daily-bar-wrapper ${isSelected ? "selected" : ""}`}
                onClick={(e) => onSelectDay(d.date, e.shiftKey)}>
                {dailyChartMode === "by-type" ? (
                  <div className="daily-bar" style={{ height: `${heightPct.toFixed(1)}%`, display: "flex", flexDirection: "column" }}>
                    {(() => {
                      const total = segments.reduce((sum, seg) => sum + seg.value, 0) || 1;
                      return segments.map((seg) => (
                        <div key={seg.cls} className={`cost-segment ${seg.cls}`} style={{ height: `${(seg.value / total) * 100}%` }} />
                      ));
                    })()}
                  </div>
                ) : (
                  <div className="daily-bar" style={{ height: `${heightPct.toFixed(1)}%` }} />
                )}
                {showTotals && <div className="daily-bar-total">{totalLabel}</div>}
                <div className="daily-bar-label" style={labelStyle}>{shortLabel}</div>
                <div className="daily-bar-tooltip">
                  <strong>{formatFullDate(d.date)}</strong><br />
                  {formatTokens(d.totalTokens)} tokens<br />
                  {formatCost(d.totalCost)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Cost Breakdown Bar ──────────────────────────────────
interface CostBreakdownProps {
  totals: UsageTotals;
  mode: "tokens" | "cost";
}

export function CostBreakdownCompact({ totals, mode }: CostBreakdownProps) {
  const isTokenMode = mode === "tokens";
  const totalCost = totals.totalCost || 0;
  const totalTokens = totals.totalTokens || 1;

  const breakdown = {
    output: { tokens: totals.output, cost: totals.outputCost || 0, pct: pct(totals.outputCost || 0, totalCost) },
    input: { tokens: totals.input, cost: totals.inputCost || 0, pct: pct(totals.inputCost || 0, totalCost) },
    cacheWrite: { tokens: totals.cacheWrite, cost: totals.cacheWriteCost || 0, pct: pct(totals.cacheWriteCost || 0, totalCost) },
    cacheRead: { tokens: totals.cacheRead, cost: totals.cacheReadCost || 0, pct: pct(totals.cacheReadCost || 0, totalCost) },
  };

  const tokenPcts = {
    output: pct(totals.output, totalTokens),
    input: pct(totals.input, totalTokens),
    cacheWrite: pct(totals.cacheWrite, totalTokens),
    cacheRead: pct(totals.cacheRead, totalTokens),
  };

  const items = [
    { key: "output", label: t("usageView.output"), pctVal: isTokenMode ? tokenPcts.output : breakdown.output.pct, display: isTokenMode ? formatTokens(totals.output) : formatCost(breakdown.output.cost) },
    { key: "input", label: t("usageView.input"), pctVal: isTokenMode ? tokenPcts.input : breakdown.input.pct, display: isTokenMode ? formatTokens(totals.input) : formatCost(breakdown.input.cost) },
    { key: "cache-write", label: t("usageView.cacheWrite"), pctVal: isTokenMode ? tokenPcts.cacheWrite : breakdown.cacheWrite.pct, display: isTokenMode ? formatTokens(totals.cacheWrite) : formatCost(breakdown.cacheWrite.cost) },
    { key: "cache-read", label: t("usageView.cacheRead"), pctVal: isTokenMode ? tokenPcts.cacheRead : breakdown.cacheRead.pct, display: isTokenMode ? formatTokens(totals.cacheRead) : formatCost(breakdown.cacheRead.cost) },
  ];

  return (
    <div className="cost-breakdown cost-breakdown-compact">
      <div className="cost-breakdown-header">{isTokenMode ? t("usageView.tokensByType") : t("usageView.costByType")}</div>
      <div className="cost-breakdown-bar">
        {items.map((item) => (
          <div key={item.key} className={`cost-segment ${item.key}`}
            style={{ width: `${item.pctVal.toFixed(1)}%` }}
            title={`${item.label}: ${item.display}`} />
        ))}
      </div>
      <div className="cost-breakdown-legend">
        {items.map((item) => (
          <span key={item.key} className="legend-item">
            <span className={`legend-dot ${item.key}`} />
            {item.label} {item.display}
          </span>
        ))}
      </div>
      <div className="cost-breakdown-total">
        {t("usageView.total")}: {isTokenMode ? formatTokens(totals.totalTokens) : formatCost(totals.totalCost)}
      </div>
    </div>
  );
}
