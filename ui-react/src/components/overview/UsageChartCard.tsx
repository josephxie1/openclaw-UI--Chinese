import React, { useCallback, useEffect, useRef, useState } from "react";
import type { CostUsageSummary, SessionsUsageResult } from "../../lib/types.ts";
import { DragHandle } from "./AccessCard.tsx";

// ─── Helpers ─────────────────────────────────────────────────

type ChartMode = "1d" | "7d" | "ctx";
type CtxRange = "1d" | "7d";
const CTP = 4; // chars-per-token estimate

function fmtT(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function formatTick(val: number | string): string {
  const n = typeof val === "string" ? Number(val) : val;
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
  return String(n);
}

function buildHourlyFromSessions(result: SessionsUsageResult): Array<{ hour: number; tokens: number }> {
  const hours = Array.from({ length: 24 }, (_, i) => ({ hour: i, tokens: 0 }));
  for (const s of result.sessions) {
    if (!s.updatedAt || !s.usage) continue;
    const h = new Date(s.updatedAt).getHours();
    hours[h].tokens += s.usage.totalTokens ?? 0;
  }
  return hours;
}

// ─── Chart.js instance management ────────────────────────────

let _usageChartInstance: import("chart.js").Chart | null = null;
let _usageChartCanvas: HTMLCanvasElement | null = null;
let _ctxChartInstance: import("chart.js").Chart | null = null;
let _ctxChartCanvas: HTMLCanvasElement | null = null;

async function initOrUpdateUsageChart(canvas: HTMLCanvasElement, labels: string[], data: number[], mode: "1d" | "7d") {
  const { Chart, registerables } = await import("chart.js");
  Chart.register(...registerables);
  const isDark = document.documentElement.dataset.theme === "dark";
  const textColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  if (_usageChartInstance && _usageChartCanvas !== canvas) {
    _usageChartInstance.destroy();
    _usageChartInstance = null;
    _usageChartCanvas = null;
  }

  if (_usageChartInstance) {
    _usageChartInstance.data.labels = labels;
    _usageChartInstance.data.datasets[0].data = data;
    const xA = _usageChartInstance.options.scales?.x as Record<string, unknown> | undefined;
    const yA = _usageChartInstance.options.scales?.y as Record<string, unknown> | undefined;
    if (xA && "ticks" in xA) { (xA.ticks as Record<string, unknown>).color = textColor; (xA as Record<string, unknown>).maxTicksLimit = mode === "1d" ? 8 : undefined; }
    if (yA && "ticks" in yA) { (yA.ticks as Record<string, unknown>).color = textColor; (yA as Record<string, unknown>).grid = { color: gridColor }; }
    const tt = _usageChartInstance.options.plugins?.tooltip;
    if (tt) Object.assign(tt, { backgroundColor: isDark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)", titleColor: isDark ? "#fff" : "#333", bodyColor: isDark ? "rgba(255,255,255,0.8)" : "#555", borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)" });
    (_usageChartInstance.data.datasets[0] as unknown as Record<string, unknown>).pointBorderColor = isDark ? "#1a1a2e" : "#fff";
    _usageChartInstance.update("none");
    return;
  }

  _usageChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [{
        data,
        borderColor: "#818cf8",
        backgroundColor: (ctx) => {
          const { ctx: c, chartArea } = ctx.chart;
          if (!chartArea) return "rgba(129,140,248,0.1)";
          const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          grad.addColorStop(0, "rgba(129,140,248,0.35)");
          grad.addColorStop(1, "rgba(129,140,248,0.02)");
          return grad;
        },
        fill: true, tension: 0.3, borderWidth: 2, pointRadius: 3,
        pointBackgroundColor: "#818cf8", pointBorderColor: isDark ? "#1a1a2e" : "#fff",
        pointBorderWidth: 1.5, pointHoverRadius: 5,
      }],
    },
    options: {
      responsive: true, maintainAspectRatio: false, interaction: { mode: "index", intersect: false },
      plugins: { legend: { display: false }, tooltip: { backgroundColor: isDark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)", titleColor: isDark ? "#fff" : "#333", bodyColor: isDark ? "rgba(255,255,255,0.8)" : "#555", borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)", borderWidth: 1, padding: 10, cornerRadius: 6, displayColors: false, callbacks: { label: (ctx) => `${(ctx.parsed.y ?? 0).toLocaleString()} tokens` } } },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor, font: { size: 11 }, maxTicksLimit: mode === "1d" ? 8 : undefined }, border: { display: false } },
        y: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, callback: (val) => formatTick(val), maxTicksLimit: 5 }, border: { display: false }, beginAtZero: true },
      },
    },
  });
  _usageChartCanvas = canvas;
}

async function initOrUpdateCtxChart(canvas: HTMLCanvasElement, rows: Array<{ label: string; tokens: number; color: string }>, sessionCount: number) {
  const { Chart, registerables } = await import("chart.js");
  Chart.register(...registerables);
  const isDark = document.documentElement.dataset.theme === "dark";
  const textColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";
  const labels = rows.map((r) => r.label);
  const data = rows.map((r) => r.tokens);
  const colors = rows.map((r) => r.color);

  if (_ctxChartInstance && _ctxChartCanvas !== canvas) { _ctxChartInstance.destroy(); _ctxChartInstance = null; _ctxChartCanvas = null; }
  if (_ctxChartInstance) {
    _ctxChartInstance.data.labels = labels;
    _ctxChartInstance.data.datasets[0].data = data;
    _ctxChartInstance.data.datasets[0].backgroundColor = colors;
    _ctxChartInstance.update("none");
    return;
  }

  _ctxChartInstance = new Chart(canvas, {
    type: "bar",
    data: { labels, datasets: [{ data, backgroundColor: colors, borderRadius: 4, barThickness: 24 }] },
    options: {
      indexAxis: "y", responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)",
          titleColor: isDark ? "#fff" : "#333", bodyColor: isDark ? "rgba(255,255,255,0.8)" : "#555",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          borderWidth: 1, padding: 10, cornerRadius: 6, displayColors: true,
          callbacks: { label: (ctx) => { const total = (ctx.dataset.data as number[]).reduce((a, b) => a + (b ?? 0), 0); const val = ctx.parsed.x ?? 0; const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0"; return `${formatTick(val)} tokens (${pct}%)`; } },
        },
      },
      scales: {
        x: { grid: { color: gridColor }, ticks: { color: textColor, font: { size: 11 }, callback: (val) => formatTick(val) }, border: { display: false }, beginAtZero: true, title: sessionCount > 1 ? { display: true, text: `avg ${sessionCount} sessions`, color: textColor, font: { size: 10 } } : undefined },
        y: { grid: { display: false }, ticks: { color: textColor, font: { size: 12, weight: "bold" } }, border: { display: false } },
      },
    },
  });
  _ctxChartCanvas = canvas;
}

// ─── Agent Filter Dropdown ───────────────────────────────────

function AgentFilterDropdown({
  agents,
  selected,
  onChange,
}: {
  agents: string[];
  selected: string;
  onChange: (agent: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    requestAnimationFrame(() => document.addEventListener("click", close));
    return () => document.removeEventListener("click", close);
  }, [open]);

  if (agents.length <= 1) return null;

  return (
    <div className="ov-agent-dropdown" ref={ref}>
      <button className="ov-agent-btn" onClick={() => setOpen(!open)}>
        {selected || "全部 Agent"}
        <span className="ov-agent-arrow">▾</span>
      </button>
      {open && (
        <div className="ov-agent-menu open">
          {[{ value: "", label: "全部 Agent" }, ...agents.map((a) => ({ value: a, label: a }))].map((opt) => (
            <div
              key={opt.value}
              className={`ov-agent-option ${opt.value === selected ? "selected" : ""}`}
              onClick={() => { onChange(opt.value); setOpen(false); }}
            >
              {opt.value === selected ? "✓ " : ""}{opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────

export type UsageChartCardProps = {
  costDaily: CostUsageSummary | null;
  usageResult: SessionsUsageResult | null;
  weekUsageResult: SessionsUsageResult | null;
};

export function UsageChartCard({ costDaily, usageResult, weekUsageResult }: UsageChartCardProps) {
  const [mode, setMode] = useState<ChartMode>("7d");
  const [ctxRange, setCtxRange] = useState<CtxRange>("1d");
  const [agentFilter, setAgentFilter] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ctxCanvasRef = useRef<HTMLCanvasElement>(null);

  const daily = costDaily?.daily ?? [];
  const hourly = usageResult ? buildHourlyFromSessions(usageResult) : [];
  const hasWeekData = daily.length > 0;
  const hasDayData = hourly.some((h) => h.tokens > 0);
  const hasCtxData = usageResult?.sessions?.some((s: Record<string, unknown>) => s.contextWeight) ?? false;

  // Collect unique agents
  const agentSet = new Set<string>();
  for (const s of usageResult?.sessions ?? []) { if (s.agentId) agentSet.add(s.agentId); }
  for (const s of weekUsageResult?.sessions ?? []) { if (s.agentId) agentSet.add(s.agentId); }
  const agentList = Array.from(agentSet).sort();
  const hasFilter = agentFilter !== "" && agentSet.has(agentFilter);
  const filterSessions = useCallback(
    (sessions: SessionsUsageResult["sessions"]) => hasFilter ? sessions.filter((s) => s.agentId === agentFilter) : sessions,
    [hasFilter, agentFilter],
  );

  // Compute chart data
  const isChartMode = mode !== "ctx";
  let labels: string[] = [];
  let data: number[] = [];
  let subtitle = "";

  if (mode === "7d" && hasWeekData) {
    if (hasFilter && weekUsageResult) {
      const now = new Date();
      const dayMap = new Map<string, number>();
      for (let i = 0; i < 7; i++) { const d = new Date(now.getTime() - (6 - i) * 86400000); dayMap.set(d.toISOString().slice(0, 10), 0); }
      for (const s of filterSessions(weekUsageResult.sessions)) {
        if (!s.updatedAt || !s.usage) continue;
        const dateStr = new Date(s.updatedAt).toISOString().slice(0, 10);
        if (dayMap.has(dateStr)) dayMap.set(dateStr, (dayMap.get(dateStr) ?? 0) + (s.usage.totalTokens ?? 0));
      }
      labels = Array.from(dayMap.keys()).map((d) => { const dt = new Date(d + "T00:00:00"); return `${dt.getMonth() + 1}/${dt.getDate()}`; });
      data = Array.from(dayMap.values());
    } else {
      labels = daily.map((d) => { const dt = new Date(d.date + "T00:00:00"); return `${dt.getMonth() + 1}/${dt.getDate()}`; });
      data = daily.map((d) => d.totalTokens ?? 0);
    }
    const total = data.reduce((a, b) => a + b, 0);
    subtitle = `最近 ${daily.length} 天 · ${fmtT(total)} tokens`;
  } else if (mode === "1d") {
    if (hasFilter && usageResult) {
      const hrs = Array.from({ length: 24 }, (_, i) => ({ hour: i, tokens: 0 }));
      for (const s of filterSessions(usageResult.sessions)) {
        if (!s.updatedAt || !s.usage) continue;
        const h = new Date(s.updatedAt).getHours();
        hrs[h].tokens += s.usage.totalTokens ?? 0;
      }
      labels = hrs.map((h) => `${h.hour}:00`);
      data = hrs.map((h) => h.tokens);
    } else {
      labels = hourly.map((h) => `${h.hour}:00`);
      data = hourly.map((h) => h.tokens);
    }
    const total = data.reduce((a, b) => a + b, 0);
    subtitle = `今日（按小时）· ${fmtT(total)} tokens`;
  } else {
    subtitle = ctxRange === "7d" ? "上下文构成（7天）" : "上下文构成（今日）";
  }

  // Compute context breakdown
  let ctxRows: Array<{ label: string; tokens: number; color: string }> = [];
  let ctxSessionCount = 0;
  if (mode === "ctx") {
    let sC = 0, kC = 0, tC = 0, fC = 0, cnt = 0;
    const ctxSource = ctxRange === "7d" ? (weekUsageResult?.sessions ?? []) : (usageResult?.sessions ?? []);
    const ctxSessions = hasFilter ? ctxSource.filter((s) => s.agentId === agentFilter) : ctxSource;
    for (const s of ctxSessions) {
      const cw = (s as Record<string, unknown>).contextWeight as Record<string, Record<string, number>> | undefined;
      if (!cw) continue;
      sC += cw.systemPrompt?.chars ?? 0;
      kC += cw.skills?.promptChars ?? 0;
      tC += (cw.tools?.listChars ?? 0) + (cw.tools?.schemaChars ?? 0);
      const wf = (cw as Record<string, unknown>).injectedWorkspaceFiles as Array<{ injectedChars: number }> | undefined;
      fC += (wf ?? []).reduce((a, f) => a + f.injectedChars, 0);
      cnt++;
    }
    if (cnt > 1) { sC = Math.round(sC / cnt); kC = Math.round(kC / cnt); tC = Math.round(tC / cnt); fC = Math.round(fC / cnt); }
    const sy = Math.round(sC / CTP), sk = Math.round(kC / CTP), tl = Math.round(tC / CTP), fl = Math.round(fC / CTP);
    ctxRows = [
      { label: "System", tokens: sy, color: "#ff4d4d" },
      { label: "Tools", tokens: tl, color: "#ffa64d" },
      { label: "Skills", tokens: sk, color: "#4da6ff" },
      { label: "Files", tokens: fl, color: "#4dff88" },
    ];
    ctxSessionCount = cnt;
  }
  const hasCtxContent = ctxRows.reduce((a, r) => a + r.tokens, 0) > 0;

  // Chart.js rendering
  useEffect(() => {
    if (isChartMode && data.length > 0 && canvasRef.current) {
      void initOrUpdateUsageChart(canvasRef.current, labels, data, mode as "1d" | "7d");
    }
  }, [isChartMode, labels, data, mode]);

  useEffect(() => {
    if (mode === "ctx" && hasCtxContent && ctxCanvasRef.current) {
      void initOrUpdateCtxChart(ctxCanvasRef.current, ctxRows, ctxSessionCount);
    }
  }, [mode, ctxRange, hasCtxContent, ctxRows, ctxSessionCount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      _usageChartInstance?.destroy(); _usageChartInstance = null; _usageChartCanvas = null;
      _ctxChartInstance?.destroy(); _ctxChartInstance = null; _ctxChartCanvas = null;
    };
  }, []);

  // All hooks MUST be above early returns (React rules of hooks)
  const handleToggle = useCallback((next: ChartMode) => {
    if (_usageChartInstance) { _usageChartInstance.destroy(); _usageChartInstance = null; }
    if (_ctxChartInstance) { _ctxChartInstance.destroy(); _ctxChartInstance = null; }
    setMode(next);
  }, []);

  const handleCtxRange = useCallback((r: CtxRange) => {
    if (_ctxChartInstance) { _ctxChartInstance.destroy(); _ctxChartInstance = null; }
    setCtxRange(r);
  }, []);

  const handleAgentChange = useCallback((agent: string) => {
    if (_usageChartInstance) { _usageChartInstance.destroy(); _usageChartInstance = null; }
    if (_ctxChartInstance) { _ctxChartInstance.destroy(); _ctxChartInstance = null; }
    setAgentFilter(agent);
  }, []);

  if (!hasWeekData && !hasDayData && !hasCtxData) {
    return <div data-swapy-slot="usage"><div data-swapy-item="usage" /></div>;
  }
  if (isChartMode && data.length === 0) {
    return <div data-swapy-slot="usage"><div data-swapy-item="usage" /></div>;
  }

  return (
    <div data-swapy-slot="usage">
      <div data-swapy-item="usage">
        <div className="card ov-card--usage">
          <div className="card-header-row">
            <DragHandle />
            <div style={{ flex: 1 }}>
              <div className="card-title">草料消耗趋势</div>
              <div className="card-sub">{subtitle}</div>
            </div>
            <AgentFilterDropdown agents={agentList} selected={agentFilter} onChange={handleAgentChange} />
            <div className="usage-chart-toggle">
              <button className={mode === "1d" ? "active" : ""} onClick={() => handleToggle("1d")}>1d</button>
              <button className={mode === "7d" ? "active" : ""} onClick={() => handleToggle("7d")}>7d</button>
              <button className={mode === "ctx" ? "active" : ""} onClick={() => handleToggle("ctx")}>ctx</button>
            </div>
          </div>
          {isChartMode ? (
            <div className="usage-line-chart" style={{ marginTop: 12, position: "relative", height: 200 }}>
              <canvas ref={canvasRef} />
            </div>
          ) : (
            <div style={{ marginTop: 12, padding: "0 4px 4px" }}>
              {hasCtxContent ? (
                <>
                  <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 4 }}>
                    <div className="usage-chart-toggle" style={{ fontSize: 11 }}>
                      <button className={ctxRange === "1d" ? "active" : ""} onClick={() => handleCtxRange("1d")}>1d</button>
                      <button className={ctxRange === "7d" ? "active" : ""} onClick={() => handleCtxRange("7d")}>7d</button>
                    </div>
                  </div>
                  <div style={{ position: "relative", height: 165 }}>
                    <canvas ref={ctxCanvasRef} />
                  </div>
                </>
              ) : (
                <div className="muted" style={{ padding: 20, textAlign: "center" }}>无上下文数据</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
