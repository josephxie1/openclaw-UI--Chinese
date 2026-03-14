import { html, nothing } from "lit";
import { ConnectErrorDetailCodes } from "../gateway-protocol.ts";
import { t, i18n, SUPPORTED_LOCALES, type Locale } from "../../i18n/index.ts";
import { buildExternalLinkRel, EXTERNAL_LINK_TARGET } from "../external-link.ts";
import { formatRelativeTimestamp, formatDurationHuman } from "../format.ts";
import type { GatewayHelloOk } from "../gateway.ts";
import { avatarFromName } from "../helpers/multiavatar.ts";
import type { UiSettings } from "../storage.ts";
import type {
  GatewayAgentRow,
  SessionActivityResult,
  CostUsageSummary,
  SessionsUsageResult,
} from "../types.ts";
import { resolveAgentAvatarSrc } from "./agents-utils.ts";
import { shouldShowPairingHint } from "./overview-hints.ts";
import { renderRanch } from "./overview-ranch.ts";

// Module-level cache for async system stats (Electron IPC)
let _cachedCpu = 0;
let _cachedMem = 0;
let _systemStatsPending = false;

// Module-level state for usage chart mode toggle
let _usageChartMode: "1d" | "7d" | "ctx" = "7d";
let _ctxTimeRange: "1d" | "7d" = "1d";
let _usageAgentFilter = ""; // "" = all agents
let _usageChartInstance: import("chart.js").Chart | null = null;
let _usageChartCanvas: HTMLCanvasElement | null = null;

async function initOrUpdateUsageChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  data: number[],
  mode: "1d" | "7d",
) {
  const { Chart, registerables } = await import("chart.js");
  Chart.register(...registerables);

  const isDark = document.documentElement.dataset.theme === "dark";
  const textColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.45)";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const formatTick = (val: number | string) => {
    const n = typeof val === "string" ? Number(val) : val;
    if (n >= 1_000_000) {
      return `${(n / 1_000_000).toFixed(1)}M`;
    }
    if (n >= 1_000) {
      return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1)}K`;
    }
    return String(n);
  };

  // If canvas changed (e.g. user navigated away and back), destroy the old chart
  if (_usageChartInstance && _usageChartCanvas !== canvas) {
    _usageChartInstance.destroy();
    _usageChartInstance = null;
    _usageChartCanvas = null;
  }

  if (_usageChartInstance) {
    _usageChartInstance.data.labels = labels;
    _usageChartInstance.data.datasets[0].data = data;
    // Refresh theme colors
    const xAxis = _usageChartInstance.options.scales?.x as Record<string, unknown> | undefined;
    const yAxis = _usageChartInstance.options.scales?.y as Record<string, unknown> | undefined;
    if (xAxis && "ticks" in xAxis) {
      (xAxis.ticks as Record<string, unknown>).color = textColor;
      (xAxis as Record<string, unknown>).maxTicksLimit = mode === "1d" ? 8 : undefined;
    }
    if (yAxis && "ticks" in yAxis) {
      (yAxis.ticks as Record<string, unknown>).color = textColor;
      (yAxis as Record<string, unknown>).grid = { color: gridColor };
    }
    const tt = _usageChartInstance.options.plugins?.tooltip;
    if (tt) {
      Object.assign(tt, {
        backgroundColor: isDark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)",
        titleColor: isDark ? "#fff" : "#333",
        bodyColor: isDark ? "rgba(255,255,255,0.8)" : "#555",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
      });
    }
    (_usageChartInstance.data.datasets[0] as unknown as Record<string, unknown>).pointBorderColor = isDark ? "#1a1a2e" : "#fff";
    _usageChartInstance.update("none");
    return;
  }

  _usageChartInstance = new Chart(canvas, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          data,
          borderColor: "#818cf8",
          backgroundColor: (ctx) => {
            const chart = ctx.chart;
            const { ctx: c, chartArea } = chart;
            if (!chartArea) {
              return "rgba(129,140,248,0.1)";
            }
            const grad = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
            grad.addColorStop(0, "rgba(129,140,248,0.35)");
            grad.addColorStop(1, "rgba(129,140,248,0.02)");
            return grad;
          },
          fill: true,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 3,
          pointBackgroundColor: "#818cf8",
          pointBorderColor: isDark ? "#1a1a2e" : "#fff",
          pointBorderWidth: 1.5,
          pointHoverRadius: 5,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { mode: "index", intersect: false },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)",
          titleColor: isDark ? "#fff" : "#333",
          bodyColor: isDark ? "rgba(255,255,255,0.8)" : "#555",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          displayColors: false,
          callbacks: {
            label: (ctx) => `${(ctx.parsed.y ?? 0).toLocaleString()} tokens`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: textColor,
            font: { size: 11 },
            maxTicksLimit: mode === "1d" ? 8 : undefined,
          },
          border: { display: false },
        },
        y: {
          grid: { color: gridColor },
          ticks: {
            color: textColor,
            font: { size: 11 },
            callback: (val) => formatTick(val),
            maxTicksLimit: 5,
          },
          border: { display: false },
          beginAtZero: true,
        },
      },
    },
  });
  _usageChartCanvas = canvas;
}

let _ctxChartInstance: import("chart.js").Chart | null = null;
let _ctxChartCanvas: HTMLCanvasElement | null = null;

async function initOrUpdateCtxChart(
  canvas: HTMLCanvasElement,
  rows: Array<{ label: string; tokens: number; color: string }>,
  sessionCount: number,
) {
  const { Chart, registerables } = await import("chart.js");
  Chart.register(...registerables);

  const isDark = document.documentElement.dataset.theme === "dark";
  const textColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)";
  const gridColor = isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)";

  const formatTick = (val: number | string) => {
    const n = typeof val === "string" ? Number(val) : val;
    if (n >= 1e6) {
      return `${(n / 1e6).toFixed(1)}M`;
    }
    if (n >= 1e3) {
      return `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K`;
    }
    return String(n);
  };

  const labels = rows.map((r) => r.label);
  const data = rows.map((r) => r.tokens);
  const colors = rows.map((r) => r.color);

  // Destroy stale chart if canvas changed after tab navigation
  if (_ctxChartInstance && _ctxChartCanvas !== canvas) {
    _ctxChartInstance.destroy();
    _ctxChartInstance = null;
    _ctxChartCanvas = null;
  }

  if (_ctxChartInstance) {
    _ctxChartInstance.data.labels = labels;
    _ctxChartInstance.data.datasets[0].data = data;
    _ctxChartInstance.data.datasets[0].backgroundColor = colors;
    // Refresh theme colors
    const xAxis = _ctxChartInstance.options.scales?.x as Record<string, unknown> | undefined;
    const yAxis = _ctxChartInstance.options.scales?.y as Record<string, unknown> | undefined;
    if (xAxis && "ticks" in xAxis) { (xAxis.ticks as Record<string, unknown>).color = textColor; xAxis.grid = { color: gridColor }; }
    if (yAxis && "ticks" in yAxis) { (yAxis.ticks as Record<string, unknown>).color = textColor; }
    const tt = _ctxChartInstance.options.plugins?.tooltip;
    if (tt) {
      Object.assign(tt, {
        backgroundColor: isDark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)",
        titleColor: isDark ? "#fff" : "#333",
        bodyColor: isDark ? "rgba(255,255,255,0.8)" : "#555",
        borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
      });
    }
    _ctxChartInstance.update("none");
    return;
  }

  _ctxChartInstance = new Chart(canvas, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: colors,
          borderRadius: 4,
          barThickness: 24,
        },
      ],
    },
    options: {
      indexAxis: "y",
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: isDark ? "rgba(20,20,40,0.95)" : "rgba(255,255,255,0.95)",
          titleColor: isDark ? "#fff" : "#333",
          bodyColor: isDark ? "rgba(255,255,255,0.8)" : "#555",
          borderColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 6,
          displayColors: true,
          callbacks: {
            label: (ctx) => {
              const total = (ctx.dataset.data as number[]).reduce((a, b) => a + (b ?? 0), 0);
              const val = ctx.parsed.x ?? 0;
              const pct = total > 0 ? ((val / total) * 100).toFixed(1) : "0";
              return `${formatTick(val)} tokens (${pct}%)`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 }, callback: (val) => formatTick(val) },
          border: { display: false },
          beginAtZero: true,
          title:
            sessionCount > 1
              ? {
                  display: true,
                  text: `avg ${sessionCount} sessions`,
                  color: textColor,
                  font: { size: 10 },
                }
              : undefined,
        },
        y: {
          grid: { display: false },
          ticks: { color: textColor, font: { size: 12, weight: "bold" } },
          border: { display: false },
        },
      },
    },
  });
  _ctxChartCanvas = canvas;
}

function buildHourlyFromSessions(
  result: SessionsUsageResult,
): Array<{ hour: number; tokens: number }> {
  const hourTotals = Array.from({ length: 24 }, () => 0);
  for (const session of result.sessions) {
    const usage = session.usage;
    if (!usage || !usage.totalTokens || usage.totalTokens <= 0) {
      continue;
    }
    const start = usage.firstActivity ?? session.updatedAt;
    const end = usage.lastActivity ?? session.updatedAt;
    if (!start || !end) {
      continue;
    }
    const startMs = Math.min(start, end);
    const endMs = Math.max(start, end);
    const durationMs = Math.max(endMs - startMs, 1);
    const totalMinutes = durationMs / 60000;
    let cursor = startMs;
    while (cursor < endMs) {
      const date = new Date(cursor);
      const hour = date.getHours();
      const nextHour = new Date(date);
      nextHour.setMinutes(59, 59, 999);
      const nextMs = Math.min(nextHour.getTime(), endMs);
      const minutes = Math.max((nextMs - cursor) / 60000, 0);
      const share = minutes / totalMinutes;
      hourTotals[hour] += usage.totalTokens * share;
      cursor = nextMs + 1;
    }
  }
  return hourTotals.map((tokens, hour) => ({ hour, tokens: Math.round(tokens) }));
}

export type OverviewProps = {
  connected: boolean;
  hello: GatewayHelloOk | null;
  settings: UiSettings;
  password: string;
  lastError: string | null;
  lastErrorCode: string | null;
  presenceCount: number;
  sessionsCount: number | null;
  cronEnabled: boolean | null;
  cronJobsCount: number | null;
  cronNext: number | null;
  lastChannelsRefresh: number | null;
  onSettingsChange: (next: UiSettings) => void;
  onPasswordChange: (next: string) => void;
  onSessionKeyChange: (next: string) => void;
  onConnect: () => void;
  onRefresh: () => void;
  sessionActivity: SessionActivityResult | null;
  agents: GatewayAgentRow[];
  costDaily: CostUsageSummary | null;
  usageResult: SessionsUsageResult | null;
  weekUsageResult: SessionsUsageResult | null;
};

export function renderOverview(props: OverviewProps) {
  const snapshot = props.hello?.snapshot as
    | {
        uptimeMs?: number;
        policy?: { tickIntervalMs?: number };
        authMode?: "none" | "token" | "password" | "trusted-proxy";
      }
    | undefined;
  const uptime = snapshot?.uptimeMs ? formatDurationHuman(snapshot.uptimeMs) : t("common.na");
  const _tick = snapshot?.policy?.tickIntervalMs
    ? `${snapshot.policy.tickIntervalMs}ms`
    : t("common.na");
  const authMode = snapshot?.authMode;
  const isTrustedProxy = authMode === "trusted-proxy";

  const pairingHint = (() => {
    if (!shouldShowPairingHint(props.connected, props.lastError, props.lastErrorCode)) {
      return null;
    }
    return html`
      <div class="muted" style="margin-top: 8px">
        ${t("overview.pairing.hint")}
        <div style="margin-top: 6px">
          <span class="mono">openclaw devices list</span><br />
          <span class="mono">openclaw devices approve &lt;requestId&gt;</span>
        </div>
        <div style="margin-top: 6px; font-size: 12px;">
          ${t("overview.pairing.mobileHint")}
        </div>
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/control-ui#device-pairing-first-connection"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Device pairing docs (opens in new tab)"
            >Docs: Device pairing</a
          >
        </div>
      </div>
    `;
  })();

  const authHint = (() => {
    if (props.connected || !props.lastError) {
      return null;
    }
    const lower = props.lastError.toLowerCase();
    const authRequiredCodes = new Set<string>([
      ConnectErrorDetailCodes.AUTH_REQUIRED,
      ConnectErrorDetailCodes.AUTH_TOKEN_MISSING,
      ConnectErrorDetailCodes.AUTH_PASSWORD_MISSING,
      ConnectErrorDetailCodes.AUTH_TOKEN_NOT_CONFIGURED,
      ConnectErrorDetailCodes.AUTH_PASSWORD_NOT_CONFIGURED,
    ]);
    const authFailureCodes = new Set<string>([
      ...authRequiredCodes,
      ConnectErrorDetailCodes.AUTH_UNAUTHORIZED,
      ConnectErrorDetailCodes.AUTH_TOKEN_MISMATCH,
      ConnectErrorDetailCodes.AUTH_PASSWORD_MISMATCH,
      ConnectErrorDetailCodes.AUTH_DEVICE_TOKEN_MISMATCH,
      ConnectErrorDetailCodes.AUTH_RATE_LIMITED,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISSING,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_PROXY_MISSING,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_WHOIS_FAILED,
      ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISMATCH,
    ]);
    const authFailed = props.lastErrorCode
      ? authFailureCodes.has(props.lastErrorCode)
      : lower.includes("unauthorized") || lower.includes("connect failed");
    if (!authFailed) {
      return null;
    }
    const hasToken = Boolean(props.settings.token.trim());
    const hasPassword = Boolean(props.password.trim());
    const isAuthRequired = props.lastErrorCode
      ? authRequiredCodes.has(props.lastErrorCode)
      : !hasToken && !hasPassword;
    if (isAuthRequired) {
      return html`
        <div class="muted" style="margin-top: 8px">
          ${t("overview.auth.required")}
          <div style="margin-top: 6px">
            <span class="mono">openclaw dashboard --no-open</span> → tokenized URL<br />
            <span class="mono">openclaw doctor --generate-gateway-token</span> → set token
          </div>
          <div style="margin-top: 6px">
            <a
              class="session-link"
              href="https://docs.openclaw.ai/web/dashboard"
              target=${EXTERNAL_LINK_TARGET}
              rel=${buildExternalLinkRel()}
              title="Control UI auth docs (opens in new tab)"
              >Docs: Control UI auth</a
            >
          </div>
        </div>
      `;
    }
    return html`
      <div class="muted" style="margin-top: 8px">
        ${t("overview.auth.failed", { command: "openclaw dashboard --no-open" })}
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/dashboard"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Control UI auth docs (opens in new tab)"
            >Docs: Control UI auth</a
          >
        </div>
      </div>
    `;
  })();

  const insecureContextHint = (() => {
    if (props.connected || !props.lastError) {
      return null;
    }
    const isSecureContext = typeof window !== "undefined" ? window.isSecureContext : true;
    if (isSecureContext) {
      return null;
    }
    const lower = props.lastError.toLowerCase();
    const insecureContextCode =
      props.lastErrorCode === ConnectErrorDetailCodes.CONTROL_UI_DEVICE_IDENTITY_REQUIRED ||
      props.lastErrorCode === ConnectErrorDetailCodes.DEVICE_IDENTITY_REQUIRED;
    if (
      !insecureContextCode &&
      !lower.includes("secure context") &&
      !lower.includes("device identity required")
    ) {
      return null;
    }
    return html`
      <div class="muted" style="margin-top: 8px">
        ${t("overview.insecure.hint", { url: "http://127.0.0.1:18789" })}
        <div style="margin-top: 6px">
          ${t("overview.insecure.stayHttp", { config: "gateway.controlUi.allowInsecureAuth: true" })}
        </div>
        <div style="margin-top: 6px">
          <a
            class="session-link"
            href="https://docs.openclaw.ai/gateway/tailscale"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Tailscale Serve docs (opens in new tab)"
            >Docs: Tailscale Serve</a
          >
          <span class="muted"> · </span>
          <a
            class="session-link"
            href="https://docs.openclaw.ai/web/control-ui#insecure-http"
            target=${EXTERNAL_LINK_TARGET}
            rel=${buildExternalLinkRel()}
            title="Insecure HTTP docs (opens in new tab)"
            >Docs: Insecure HTTP</a
          >
        </div>
      </div>
    `;
  })();

  const currentLocale = i18n.getLocale();

  // --- Inline SVG icons (replaces emoji in UI) ---
  const icon = {
    wheat: (s = 16) => html`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><path d="M12 22V12M12 12C12 12 7 9 7 5a5 5 0 0 1 10 0c0 4-5 7-5 7Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M12 12c0 0-2-3-2-6M12 12c0 0 2-3 2-6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    fire: (s = 16) => html`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><path d="M12 2c0 0 3 4 3 8 0 2-1.5 3.5-3 4 0-2-2-3-2-5 0-2 2-7 2-7Z" fill="currentColor" opacity="0.7"/><path d="M12 22a7 7 0 0 0 7-7c0-3-2-5-3-7-1 2-1 3-3 4-2-1-3-3-3-5-2 2-3 5-1 8-1 0-2-1-2-2a7 7 0 0 0 5 9Z" fill="currentColor"/></svg>`,
    running: (s = 14) => html`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><circle cx="14" cy="4" r="2" fill="currentColor"/><path d="M6 20l3-6 2 3 3-4 4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M9 8l2 4-4 2" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M13 12l3-1 2 3" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    hourglass: (s = 14) => html`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><path d="M5 3h14M5 21h14M6 3l6 8-6 10M18 3l-6 8 6 10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    moon: (s = 14) => html`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor"/></svg>`,
    cow: (s = 18) => html`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><ellipse cx="12" cy="13" rx="7" ry="6" fill="currentColor" opacity="0.15" stroke="currentColor" stroke-width="2"/><path d="M8 13v3M16 13v3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="10" cy="12" r="1" fill="currentColor"/><circle cx="14" cy="12" r="1" fill="currentColor"/><path d="M7 7c-1-2-3-3-3-3s1 3 2 4M17 7c1-2 3-3 3-3s-1 3-2 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><path d="M10 15.5c.6.3 1.4.3 2 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
    snowflake: (s = 18) => html`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg>`,
    gate: (s = 18) => html`<svg width="${s}" height="${s}" viewBox="0 0 24 24" fill="none" style="vertical-align:middle;flex-shrink:0" xmlns="http://www.w3.org/2000/svg"><rect x="2" y="3" width="20" height="18" rx="1" stroke="currentColor" stroke-width="2"/><path d="M2 9h20M9 9v12M15 9v12" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M9 14h6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  };

  // --- Donut chart helper (pixel RPG gauge) ---
  const renderDonutChart = (
    percent: number,
    label: string,
    valueText: string,
    colorOverride?: string,
  ) => {
    const radius = 38;
    const circumference = 2 * Math.PI * radius;
    const dashOffset = circumference * (1 - Math.min(percent, 100) / 100);
    const strokeColor =
      colorOverride ?? (percent > 80 ? "#ff6b6b" : percent > 50 ? "#fbbf24" : "#34d399");
    return html`
      <div class="donut-chart">
        <div class="donut-chart__label">${label}</div>
        <svg viewBox="0 0 100 100" width="100" height="100">
          <circle cx="50" cy="50" r="46" fill="var(--donut-bg-outer, rgba(0,0,0,0.1))"/>
          <circle cx="50" cy="50" r="${radius}" fill="none" stroke="currentColor" stroke-width="10" opacity="0.1"/>
          <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${strokeColor}" stroke-width="10"
            stroke-linecap="butt"
            stroke-dasharray="${circumference}"
            stroke-dashoffset="${dashOffset}"
            transform="rotate(-90 50 50)"
            style="transition: stroke-dashoffset 0.6s ease;"/>
          <circle cx="50" cy="50" r="30" fill="var(--donut-bg-inner, rgba(0,0,0,0.25))"/>
          <text x="50" y="52" text-anchor="middle" dominant-baseline="middle"
            fill="${strokeColor}" font-size="16" font-weight="900"
            font-family="var(--mono, monospace)">${valueText}</text>
        </svg>
      </div>
    `;
  };

  // --- System stats (real data from gateway RPC or Electron IPC) ---
  type SystemStats = { cpuPercent: number; memPercent: number };
  const desktop = (
    globalThis as unknown as { desktop?: { getSystemStats?: () => Promise<SystemStats> } }
  ).desktop;
  if (!_systemStatsPending) {
    _systemStatsPending = true;
    // Derive HTTP base URL from WebSocket URL (ws:// -> http://, wss:// -> https://)
    const gwHttpBase = props.settings.gatewayUrl
      .replace(/^wss:\/\//, "https://")
      .replace(/^ws:\/\//, "http://")
      .replace(/\/+$/, "");
    const statsPromise: Promise<SystemStats | null> = desktop?.getSystemStats
      ? desktop.getSystemStats()
      : fetch(`${gwHttpBase}/api/system-stats`)
          .then((r) => (r.ok ? (r.json() as Promise<SystemStats>) : null))
          .catch(() => null);
    statsPromise
      .then((stats) => {
        if (stats) {
          _cachedCpu = stats.cpuPercent;
          _cachedMem = stats.memPercent;
        }
        _systemStatsPending = false;
      })
      .catch(() => {
        _systemStatsPending = false;
      });
  }
  const cpuPercent = _cachedCpu;
  const memPercent = _cachedMem;

  const handleSvg = html`
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="9" cy="5" r="1" />
      <circle cx="9" cy="12" r="1" />
      <circle cx="9" cy="19" r="1" />
      <circle cx="15" cy="5" r="1" />
      <circle cx="15" cy="12" r="1" />
      <circle cx="15" cy="19" r="1" />
    </svg>
  `;
  /** Cards with inputs — drag only via handle */
  const dragHandleOnly = html`<button class="swapy-handle" data-swapy-handle title="${t("overview.drag.hint") ?? "拖拽交换位置"}">${handleSvg}</button>`;
  /** Display-only cards — entire card is draggable, icon is decorative */
  const dragHandleFree = html`<button class="swapy-handle" title="${t("overview.drag.hint") ?? "拖拽交换位置"}">${handleSvg}</button>`;

  // --- Build each card as a keyed template ---
  const cards: Record<string, ReturnType<typeof html>> = {
    snapshot: html`
            <div class="card ov-card--snapshot" style="height: 100%;">
              <div class="card-header-row">
                <div><div class="card-title" style="display:flex;align-items:center;gap:6px">${icon.snowflake()} 牧场实况（Snapshot）</div>
                <div class="card-sub">最新的牛马握手信息。</div></div>
              </div>
              <div class="snapshot-charts">
                ${renderDonutChart(props.connected ? 100 : 0, "精神状态", props.connected ? "亢奋" : "摆烂", props.connected ? "#34d399" : "#ff6b6b")}
                ${renderDonutChart(100, "连续打工", uptime, "#38bdf8")}
                ${renderDonutChart(cpuPercent, "脑力负载", `${cpuPercent}%`)}
                ${renderDonutChart(memPercent, "体力消耗", `${memPercent}%`)}
                ${renderDonutChart(props.presenceCount * 10, "在线牛马", `${props.presenceCount}`, "#818cf8")}
                ${renderDonutChart(props.sessionsCount != null ? Math.min(props.sessionsCount * 10, 100) : 0, "正在接客", `${props.sessionsCount ?? 0}`, "#38bdf8")}
                ${renderDonutChart(props.cronJobsCount != null ? (props.cronJobsCount > 0 ? 100 : 0) : 0, "待办鞭策", `${props.cronJobsCount ?? 0}`, "#fbbf24")}
              </div>
              ${
                props.lastError
                  ? html`<div class="callout danger" style="margin-top: 14px;">
                    <div>${props.lastError}</div>
                    ${pairingHint ?? ""}
                    ${authHint ?? ""}
                    ${insecureContextHint ?? ""}
                  </div>`
                  : ""
              }
            </div>`,
    access: html`
        <div data-swapy-slot="access">
          <div data-swapy-item="access">
            <div class="card ov-card--access">
              <div class="card-header-row">${dragHandleOnly}
                <div><div class="card-title">牧场大门</div>
                <div class="card-sub">${t("overview.access.subtitle")}</div></div>
              </div>
              <div class="access-grid" style="margin-top: 14px;">
                <label class="field">
                  <span>WebSocket URL</span>
                  <input
                    type="text"
                    .value=${props.settings.gatewayUrl}
                    @change=${(e: Event) => {
                      const v = (e.target as HTMLInputElement).value;
                      props.onSettingsChange({ ...props.settings, gatewayUrl: v });
                    }}
                  />
                </label>
                <label class="field">
                  <span>${t("overview.access.gatewayToken")}</span>
                  <input
                    type="text"
                    .value=${props.settings.token}
                    @change=${(e: Event) => {
                      const v = (e.target as HTMLInputElement).value;
                      props.onSettingsChange({ ...props.settings, token: v });
                    }}
                  />
                </label>
                <label class="field">
                  <span>${t("overview.access.password")} (${t("overview.access.notStored")})</span>
                  <input
                    type="password"
                    placeholder="system or shared password"
                    .value=${props.password}
                    @change=${(e: Event) => {
                      const v = (e.target as HTMLInputElement).value;
                      props.onPasswordChange(v);
                    }}
                  />
                </label>
                <label class="field">
                  <span>${t("overview.access.defaultSessionKey")}</span>
                  <input
                    type="text"
                    .value=${props.settings.sessionKey ?? ""}
                    @change=${(e: Event) => {
                      const v = (e.target as HTMLInputElement).value;
                      props.onSessionKeyChange(v);
                    }}
                  />
                </label>
              </div>
              <div class="row" style="margin-top: 14px; gap: 10px; align-items: center;">
                <label class="field" style="margin: 0; flex: 0 0 auto;">
                  <select
                    .value=${currentLocale}
                    @change=${(e: Event) => {
                      const v = (e.target as HTMLSelectElement).value as Locale;
                      void i18n.setLocale(v);
                      props.onSettingsChange({ ...props.settings, locale: v });
                    }}
                  >
                    ${SUPPORTED_LOCALES.map((loc) => {
                      const key = loc.replace(/-([a-zA-Z])/g, (_, c) => c.toUpperCase());
                      return html`<option value=${loc}>${t(`languages.${key}`)}</option>`;
                    })}
                  </select>
                </label>
                <button class="btn" @click=${() => props.onConnect()}>${t("common.connect")}</button>
                <button class="btn" @click=${() => props.onRefresh()}>${t("common.refresh")}</button>
                <span class="muted">${
                  isTrustedProxy
                    ? t("overview.access.trustedProxy")
                    : t("overview.access.connectHint")
                }</span>
              </div>
            </div>
          </div>
        </div>`,
    agents: html`
        <div data-swapy-slot="agents">
          <div data-swapy-item="agents">
            <div class="card">
              <div class="card-header-row">${dragHandleFree}
                <div><div class="card-title" style="display:flex;align-items:center;gap:6px">${icon.cow()} 牛马档案</div>
                <div class="card-sub" style="display:flex;align-items:center;gap:4px">${props.agents.length} 头牛马已就位${props.sessionActivity ? html` · ${icon.running()} ${props.sessionActivity.processing} ${icon.hourglass()} ${props.sessionActivity.waiting} ${icon.moon()} ${props.sessionActivity.idle}` : ""}</div></div>
              </div>
              <div class="ov-agent-grid">
                ${props.agents.map((agent) => {
                  const avatarSrc = resolveAgentAvatarSrc(agent);
                  const displayName = agent.identity?.name ?? agent.name ?? agent.id;
                  // Find this agent's sessions
                  const agentSessions = props.sessionActivity?.sessions.filter(
                    (s) => (s.key.split(":")[1] ?? s.key) === agent.id
                  ) ?? [];
                  // Determine overall state for this agent
                  const agentState = agentSessions.find((s) => s.state === "processing")
                    ? "processing"
                    : agentSessions.find((s) => s.state === "waiting")
                      ? "waiting"
                      : "idle";
                  const stateLabelHtml = agentState === "processing" ? html`${icon.running(12)} 奔跑中`
                    : agentState === "waiting" ? html`${icon.hourglass(12)} 等活中`
                    : html`${icon.moon(12)} 摸鱼中`;
                  const stateClass = agentState;
                  // Get the primary session for token display
                  const primarySession = agentSessions[0];
                  return html`
                    <div class="agent-card-pixel agent-card-pixel--${stateClass}">
                      <!-- Avatar is now the full background -->
                      ${avatarSrc ? html`<img class="agent-card-pixel__bg" src="${avatarSrc}" alt="" />` : html`<div class="agent-card-pixel__bg"></div>`}
                      
                      <!-- Top Info Area (Gradient overlay) -->
                      <div class="agent-card-pixel__header">
                        <div class="agent-card-pixel__name-row">
                          <span class="agent-card-pixel__name">${displayName}</span>
                          <span class="agent-card-pixel__label" style="display:flex;align-items:center;gap:3px">${stateLabelHtml}</span>
                        </div>
                        <div class="agent-card-pixel__id">${agent.id}</div>
                      </div>

                      <!-- Bottom Sessions Area (Gradient overlay) -->
                      <div class="agent-card-pixel__footer">
                      ${agentSessions.length > 0 ? html`
                        <div class="agent-card-pixel__sessions">
                          ${agentSessions.map((s) => {
                            const sLabel = s.state === "processing" ? icon.running(11) : s.state === "waiting" ? icon.hourglass(11) : icon.moon(11);
                            return html`
                              <div class="agent-card-pixel__session">
                                <div class="agent-card-pixel__session-header">
                                  <span>${sLabel}</span>
                                  <span class="agent-card-pixel__session-time">${
                                    s.lastActivityAgo < 5000 ? "刚刚" : formatRelativeTimestamp(Date.now() - s.lastActivityAgo)
                                  }</span>
                                  ${s.queueDepth > 0 ? html`<span class="agent-card-pixel__session-queue">队列${s.queueDepth}</span>` : nothing}
                                </div>
                                ${s.totalTokens != null && s.contextTokens ? html`
                                  <div class="agent-card-pixel__token-bar">
                                    <div class="agent-card-pixel__token-fill" style="width:${Math.min((s.totalTokens / s.contextTokens) * 100, 100)}%"></div>
                                  </div>
                                  <div class="agent-card-pixel__token-label" style="display:flex;align-items:center;gap:3px">${icon.wheat(11)} ${s.totalTokens.toLocaleString()} 养料</div>
                                ` : nothing}
                              </div>
                            `;
                          })}
                        </div>
                      ` : nothing}
                      </div> <!-- close footer -->
                    </div> <!-- close card -->
                  `;
                })}
              </div>
            </div>
          </div>
        </div>`,
    usage: (() => {
      const daily = props.costDaily?.daily ?? [];
      const hourly = props.usageResult ? buildHourlyFromSessions(props.usageResult) : [];
      const hasWeekData = daily.length > 0;
      const hasDayData = hourly.some((h) => h.tokens > 0);
      const hasCtxData =
        props.usageResult?.sessions?.some((s: Record<string, unknown>) => s.contextWeight) ?? false;
      if (!hasWeekData && !hasDayData && !hasCtxData) {
        return html`
          <div data-swapy-slot="usage"><div data-swapy-item="usage"></div></div>
        `;
      }

      // Collect unique agents from both results
      const agentSet = new Set<string>();
      for (const s of props.usageResult?.sessions ?? []) {
        if (s.agentId) {
          agentSet.add(s.agentId);
        }
      }
      for (const s of props.weekUsageResult?.sessions ?? []) {
        if (s.agentId) {
          agentSet.add(s.agentId);
        }
      }
      const agentList = Array.from(agentSet).toSorted();
      const filterAgent = _usageAgentFilter;
      const hasFilter = filterAgent !== "" && agentSet.has(filterAgent);

      // Filter helper
      const filterSessions = (sessions: SessionsUsageResult["sessions"]) =>
        hasFilter ? sessions.filter((s) => s.agentId === filterAgent) : sessions;

      const mode = _usageChartMode;
      let labels: string[] = [];
      let data: number[] = [];
      let subtitle = "";
      const isChartMode = mode !== "ctx";
      const fmtT = (n: number) =>
        n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n);

      if (mode === "7d" && hasWeekData) {
        if (hasFilter && props.weekUsageResult) {
          // Recompute daily from filtered sessions
          const now = new Date();
          const dayMap = new Map<string, number>();
          for (let i = 0; i < 7; i++) {
            const d = new Date(now.getTime() - (6 - i) * 86400000);
            dayMap.set(d.toISOString().slice(0, 10), 0);
          }
          for (const s of filterSessions(props.weekUsageResult.sessions)) {
            if (!s.updatedAt || !s.usage) {
              continue;
            }
            const dateStr = new Date(s.updatedAt).toISOString().slice(0, 10);
            if (dayMap.has(dateStr)) {
              dayMap.set(dateStr, (dayMap.get(dateStr) ?? 0) + (s.usage.totalTokens ?? 0));
            }
          }
          labels = Array.from(dayMap.keys()).map((d) => {
            const dt = new Date(d + "T00:00:00");
            return `${dt.getMonth() + 1}/${dt.getDate()}`;
          });
          data = Array.from(dayMap.values());
        } else {
          labels = daily.map((d) => {
            const dt = new Date(d.date + "T00:00:00");
            return `${dt.getMonth() + 1}/${dt.getDate()}`;
          });
          data = daily.map((d) => d.totalTokens ?? 0);
        }
        const total = data.reduce((a, b) => a + b, 0);
        subtitle = `最近 ${daily.length} 天 · ${fmtT(total)} tokens`;
      } else if (mode === "1d") {
        if (hasFilter && props.usageResult) {
          const hrs = Array.from({ length: 24 }, (_, i) => ({ hour: i, tokens: 0 }));
          for (const s of filterSessions(props.usageResult.sessions)) {
            if (!s.updatedAt || !s.usage) {
              continue;
            }
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
      } else if (mode === "ctx") {
        subtitle = _ctxTimeRange === "7d" ? "上下文构成（7天）" : "上下文构成（今日）";
      }

      if (isChartMode && data.length === 0) {
        return html`
          <div data-swapy-slot="usage"><div data-swapy-item="usage"></div></div>
        `;
      }

      const onToggle = (next: "1d" | "7d" | "ctx") => {
        if (next === "ctx" && _usageChartInstance) {
          _usageChartInstance.destroy();
          _usageChartInstance = null;
        }
        _usageChartMode = next;
        const host = document.querySelector("openclaw-app");
        if (host) {
          (host as HTMLElement & { requestUpdate?: () => void }).requestUpdate?.();
        }
      };

      if (isChartMode && data.length > 0) {
        requestAnimationFrame(() => {
          const canvas = document.getElementById("ov-usage-canvas") as HTMLCanvasElement | null;
          if (!canvas) {
            return;
          }
          void initOrUpdateUsageChart(canvas, labels, data, mode);
        });
      }

      // Context breakdown for ctx mode
      const CTP = 4;
      let ctxHtml = html``;
      if (mode === "ctx") {
        let sC = 0,
          kC = 0,
          tC = 0,
          fC = 0,
          cnt = 0;
        const ctxSource =
          _ctxTimeRange === "7d"
            ? (props.weekUsageResult?.sessions ?? [])
            : (props.usageResult?.sessions ?? []);
        const ctxSessions = hasFilter
          ? ctxSource.filter((s) => s.agentId === filterAgent)
          : ctxSource;
        for (const s of ctxSessions) {
          const cw = (s as Record<string, unknown>).contextWeight as
            | Record<string, Record<string, number>>
            | undefined;
          if (!cw) {
            continue;
          }
          sC += cw.systemPrompt?.chars ?? 0;
          kC += cw.skills?.promptChars ?? 0;
          tC += (cw.tools?.listChars ?? 0) + (cw.tools?.schemaChars ?? 0);
          const wf = (cw as Record<string, unknown>).injectedWorkspaceFiles as
            | Array<{ injectedChars: number }>
            | undefined;
          fC += (wf ?? []).reduce((a, f) => a + f.injectedChars, 0);
          cnt++;
        }
        if (cnt > 1) {
          sC = Math.round(sC / cnt);
          kC = Math.round(kC / cnt);
          tC = Math.round(tC / cnt);
          fC = Math.round(fC / cnt);
        }
        const sy = Math.round(sC / CTP),
          sk = Math.round(kC / CTP),
          tl = Math.round(tC / CTP),
          fl = Math.round(fC / CTP);
        const tot = sy + sk + tl + fl;
        const rows = [
          { label: "System", tokens: sy, color: "#ff4d4d" },
          { label: "Tools", tokens: tl, color: "#ffa64d" },
          { label: "Skills", tokens: sk, color: "#4da6ff" },
          { label: "Files", tokens: fl, color: "#4dff88" },
        ];
        if (tot > 0) {
          requestAnimationFrame(() => {
            const canvas = document.getElementById("ov-ctx-canvas") as HTMLCanvasElement | null;
            if (!canvas) {
              return;
            }
            void initOrUpdateCtxChart(canvas, rows, cnt);
          });
          const onCtxRange = (r: "1d" | "7d") => {
            if (_ctxChartInstance) {
              _ctxChartInstance.destroy();
              _ctxChartInstance = null;
            }
            _ctxTimeRange = r;
            const host = document.querySelector("openclaw-app");
            if (host) {
              (host as HTMLElement & { requestUpdate?: () => void }).requestUpdate?.();
            }
          };
          ctxHtml = html`
            <div style="display:flex;justify-content:flex-end;margin-bottom:4px">
              <div class="usage-chart-toggle" style="font-size:11px">
                <button class="${_ctxTimeRange === "1d" ? "active" : ""}" @click=${() => onCtxRange("1d")}>1d</button>
                <button class="${_ctxTimeRange === "7d" ? "active" : ""}" @click=${() => onCtxRange("7d")}>7d</button>
              </div>
            </div>
            <div style="position:relative;height:165px">
              <canvas id="ov-ctx-canvas"></canvas>
            </div>`;
        } else {
          ctxHtml = html`
            <div class="muted" style="padding: 20px; text-align: center">无上下文数据</div>
          `;
        }
      }

      return html`
        <div data-swapy-slot="usage">
          <div data-swapy-item="usage">
            <div class="card ov-card--usage">
              <div class="card-header-row">${dragHandleOnly}
                <div style="flex:1"><div class="card-title">草料消耗趋势</div>
                <div class="card-sub">${subtitle}</div></div>
                ${
                  agentList.length > 1
                    ? html`
                  <div class="ov-agent-dropdown">
                    <button class="ov-agent-btn" @click=${(e: Event) => {
                      const menu = (e.currentTarget as HTMLElement)
                        .nextElementSibling as HTMLElement;
                      const isOpen = menu.classList.toggle("open");
                      if (isOpen) {
                        const close = (ev: MouseEvent) => {
                          if (
                            !(e.currentTarget as HTMLElement)?.parentElement?.contains(
                              ev.target as Node,
                            )
                          ) {
                            menu.classList.remove("open");
                            document.removeEventListener("click", close);
                          }
                        };
                        requestAnimationFrame(() => document.addEventListener("click", close));
                      }
                    }}>
                      ${filterAgent || "全部 Agent"}
                      <span class="ov-agent-arrow">▾</span>
                    </button>
                    <div class="ov-agent-menu">
                      ${[
                        { value: "", label: "全部 Agent" },
                        ...agentList.map((a) => ({ value: a, label: a })),
                      ].map(
                        (opt) => html`
                        <div class="ov-agent-option ${opt.value === filterAgent ? "selected" : ""}" @click=${() => {
                          _usageAgentFilter = opt.value;
                          if (_usageChartInstance) {
                            _usageChartInstance.destroy();
                            _usageChartInstance = null;
                          }
                          if (_ctxChartInstance) {
                            _ctxChartInstance.destroy();
                            _ctxChartInstance = null;
                          }
                          const host = document.querySelector("openclaw-app");
                          if (host) {
                            (
                              host as HTMLElement & { requestUpdate?: () => void }
                            ).requestUpdate?.();
                          }
                        }}>${opt.value === filterAgent ? "✓ " : ""}${opt.label}</div>
                      `,
                      )}
                    </div>
                  </div>
                `
                    : nothing
                }
                <div class="usage-chart-toggle">
                  <button class="${mode === "1d" ? "active" : ""}" @click=${() => onToggle("1d")}>1d</button>
                  <button class="${mode === "7d" ? "active" : ""}" @click=${() => onToggle("7d")}>7d</button>
                  <button class="${mode === "ctx" ? "active" : ""}" @click=${() => onToggle("ctx")}>ctx</button>
                </div>
              </div>
              ${
                isChartMode
                  ? html`
                      <div class="usage-line-chart" style="margin-top: 12px; position: relative; height: 200px">
                        <canvas id="ov-usage-canvas"></canvas>
                      </div>
                    `
                  : html`<div style="margin-top:12px;padding:0 4px 4px">${ctxHtml}</div>`
              }
            </div>
          </div>
        </div>`;
    })(),
  };

  // Render cards in saved order (from localStorage), falling back to default
  const defaultOrder = ["usage", "access", "agents"];
  let cardOrder = defaultOrder;
  try {
    const saved = localStorage.getItem("oc-overview-card-order-v3");
    if (saved) {
      const parsed = JSON.parse(saved) as Array<{ slot: string; item: string }>;
      const order = parsed.map((e) => e.item).filter((s) => s in cards);
      if (order.length === defaultOrder.length) {
        cardOrder = order;
      }
    }
  } catch {
    /* use default */
  }

  // Token stats row (computed from usage data, displayed above cards)
  const fmtTokens = (n: number) =>
    n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(n);
  const todayTokens = (props.usageResult?.sessions ?? [])
    .reduce((sum, s) => sum + (s.usage?.totalTokens ?? 0), 0);
  const allTokens = props.costDaily?.totals?.totalTokens ?? 0;
  const tokenStatsRow = (todayTokens > 0 || allTokens > 0) ? html`
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
      <div class="card" style="padding: 16px 20px;">
        <div class="muted" style="font-size: 12px; font-weight: 600; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; display:flex; align-items:center; gap:5px">${icon.wheat(13)} 今日消耗草料（Tokens）</div>
        <div style="font-family: var(--mono, monospace); font-size: 32px; font-weight: 800; letter-spacing: -0.03em; color: var(--text-strong); line-height: 1.1;">${fmtTokens(todayTokens)}</div>
        <div class="muted" style="font-size: 11px; margin-top: 4px;">${todayTokens.toLocaleString()} 棵草</div>
      </div>
      <div class="card" style="padding: 16px 20px;">
        <div class="muted" style="font-size: 12px; font-weight: 600; margin-bottom: 6px; text-transform: uppercase; letter-spacing: 0.05em; display:flex; align-items:center; gap:5px">${icon.fire(13)} 累计消耗草料（Tokens）</div>
        <div style="font-family: var(--mono, monospace); font-size: 32px; font-weight: 800; letter-spacing: -0.03em; color: var(--text-strong); line-height: 1.1;">${fmtTokens(allTokens)}</div>
        <div class="muted" style="font-size: 11px; margin-top: 4px;">${allTokens.toLocaleString()} 棵草</div>
      </div>
    </div>
  ` : nothing;

  const ranchScene = renderRanch({
    agents: props.agents,
    sessionActivity: props.sessionActivity,
  });

  return html`
    <oc-overview-layout>
      <div class="ov-ranch-snapshot-row">
        <div class="ov-ranch-col">${ranchScene}</div>
        <div class="ov-snapshot-col">
          ${cards.snapshot}
          ${tokenStatsRow}
        </div>
      </div>
      <div class="overview-swapy">
        ${cardOrder.map((slot) => cards[slot])}
      </div>
    </oc-overview-layout>
  `;
}
