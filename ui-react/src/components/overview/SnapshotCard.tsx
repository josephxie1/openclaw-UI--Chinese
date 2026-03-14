import React, { useEffect, useState } from "react";
import { ConnectErrorDetailCodes } from "../../lib/gateway-protocol.ts";
import { buildExternalLinkRel, EXTERNAL_LINK_TARGET } from "../../lib/external-link.ts";
import { formatDurationHuman } from "../../lib/format.ts";
import { shouldShowPairingHint } from "../../lib/views/overview-hints.ts";
import { t } from "../../i18n/index.ts";
import type { GatewayHelloOk } from "../../lib/gateway.ts";
import { openExternalUrlSafe } from "../../lib/open-external-url.ts";

// ─── Donut Chart ─────────────────────────────────────────────

function DonutChart({
  percent,
  label,
  valueText,
  colorOverride,
}: {
  percent: number;
  label: string;
  valueText: string;
  colorOverride?: string;
}) {
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - Math.min(percent, 100) / 100);
  const strokeColor =
    colorOverride ?? (percent > 80 ? "#ff6b6b" : percent > 50 ? "#fbbf24" : "#34d399");

  return (
    <div className="donut-chart">
      <div className="donut-chart__label">{label}</div>
      <svg viewBox="0 0 100 100" width="100" height="100">
        <circle cx="50" cy="50" r="46" fill="var(--donut-bg-outer, rgba(0,0,0,0.1))" />
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="10" opacity="0.1" />
        <circle
          cx="50" cy="50" r={radius} fill="none" stroke={strokeColor} strokeWidth="10"
          strokeLinecap="butt"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform="rotate(-90 50 50)"
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <circle cx="50" cy="50" r="30" fill="var(--donut-bg-inner, rgba(0,0,0,0.25))" />
        <text
          x="50" y="52" textAnchor="middle" dominantBaseline="middle"
          fill={strokeColor} fontSize="16" fontWeight="900"
          fontFamily="var(--mono, monospace)"
        >
          {valueText}
        </text>
      </svg>
    </div>
  );
}

// ─── System stats hook ───────────────────────────────────────

type SystemStats = { cpuPercent: number; memPercent: number };

function useSystemStats(gatewayUrl: string) {
  const [cpu, setCpu] = useState(0);
  const [mem, setMem] = useState(0);

  useEffect(() => {
    const desktop = (
      globalThis as unknown as { desktop?: { getSystemStats?: () => Promise<SystemStats> } }
    ).desktop;

    const gwHttpBase = gatewayUrl
      .replace(/^wss:\/\//, "https://")
      .replace(/^ws:\/\//, "http://")
      .replace(/\/+$/, "");

    const promise: Promise<SystemStats | null> = desktop?.getSystemStats
      ? desktop.getSystemStats()
      : fetch(`${gwHttpBase}/api/system-stats`)
          .then((r) => (r.ok ? (r.json() as Promise<SystemStats>) : null))
          .catch(() => null);

    promise.then((stats) => {
      if (stats) {
        setCpu(stats.cpuPercent);
        setMem(stats.memPercent);
      }
    }).catch(() => {});
  }, [gatewayUrl]);

  return { cpuPercent: cpu, memPercent: mem };
}

// ─── Error Hints ─────────────────────────────────────────────

function PairingHint() {
  return (
    <div className="muted" style={{ marginTop: 8 }}>
      {t("overview.pairing.hint")}
      <div style={{ marginTop: 6 }}>
        <span className="mono">openclaw devices list</span><br />
        <span className="mono">openclaw devices approve &lt;requestId&gt;</span>
      </div>
      <div style={{ marginTop: 6, fontSize: 12 }}>
        {t("overview.pairing.mobileHint")}
      </div>
      <div style={{ marginTop: 6 }}>
        <a
          className="session-link"
          href="https://docs.openclaw.ai/web/control-ui#device-pairing-first-connection"
          target={EXTERNAL_LINK_TARGET}
          rel={buildExternalLinkRel()}
          title="Device pairing docs (opens in new tab)"
        >Docs: Device pairing</a>
      </div>
    </div>
  );
}

function AuthHint({
  connected,
  lastError,
  lastErrorCode,
  hasToken,
  hasPassword,
}: {
  connected: boolean;
  lastError: string | null;
  lastErrorCode: string | null;
  hasToken: boolean;
  hasPassword: boolean;
}) {
  if (connected || !lastError) return null;
  const lower = lastError.toLowerCase();
  const authRequiredCodes = new Set([
    ConnectErrorDetailCodes.AUTH_REQUIRED,
    ConnectErrorDetailCodes.AUTH_TOKEN_MISSING,
    ConnectErrorDetailCodes.AUTH_PASSWORD_MISSING,
    ConnectErrorDetailCodes.AUTH_TOKEN_NOT_CONFIGURED,
    ConnectErrorDetailCodes.AUTH_PASSWORD_NOT_CONFIGURED,
  ]);
  const authFailureCodes = new Set([
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
  const authFailed = lastErrorCode != null
    ? authFailureCodes.has(lastErrorCode as never)
    : lower.includes("unauthorized") || lower.includes("connect failed");
  if (!authFailed) return null;

  const isAuthRequired = lastErrorCode != null
    ? authRequiredCodes.has(lastErrorCode as never)
    : !hasToken && !hasPassword;

  if (isAuthRequired) {
    return (
      <div className="muted" style={{ marginTop: 8 }}>
        {t("overview.auth.required")}
        <div style={{ marginTop: 6 }}>
          <span className="mono">openclaw dashboard --no-open</span> → tokenized URL<br />
          <span className="mono">openclaw doctor --generate-gateway-token</span> → set token
        </div>
        <div style={{ marginTop: 6 }}>
          <a className="session-link" href="https://docs.openclaw.ai/web/dashboard"
            target={EXTERNAL_LINK_TARGET} rel={buildExternalLinkRel()}
            title="Control UI auth docs (opens in new tab)">Docs: Control UI auth</a>
        </div>
      </div>
    );
  }

  return (
    <div className="muted" style={{ marginTop: 8 }}>
      {t("overview.auth.failed", { command: "openclaw dashboard --no-open" })}
      <div style={{ marginTop: 6 }}>
        <a className="session-link" href="https://docs.openclaw.ai/web/dashboard"
          target={EXTERNAL_LINK_TARGET} rel={buildExternalLinkRel()}
          title="Control UI auth docs (opens in new tab)">Docs: Control UI auth</a>
      </div>
    </div>
  );
}

function InsecureContextHint({
  connected,
  lastError,
  lastErrorCode,
}: {
  connected: boolean;
  lastError: string | null;
  lastErrorCode: string | null;
}) {
  if (connected || !lastError) return null;
  const isSecureContext = typeof window !== "undefined" ? window.isSecureContext : true;
  if (isSecureContext) return null;
  const lower = lastError.toLowerCase();
  const insecureContextCode =
    lastErrorCode === ConnectErrorDetailCodes.CONTROL_UI_DEVICE_IDENTITY_REQUIRED ||
    lastErrorCode === ConnectErrorDetailCodes.DEVICE_IDENTITY_REQUIRED;
  if (!insecureContextCode && !lower.includes("secure context") && !lower.includes("device identity required")) {
    return null;
  }
  return (
    <div className="muted" style={{ marginTop: 8 }}>
      {t("overview.insecure.hint", { url: "http://127.0.0.1:18789" })}
      <div style={{ marginTop: 6 }}>
        {t("overview.insecure.stayHttp", { config: "gateway.controlUi.allowInsecureAuth: true" })}
      </div>
      <div style={{ marginTop: 6 }}>
        <a className="session-link" href="https://docs.openclaw.ai/gateway/tailscale"
          target={EXTERNAL_LINK_TARGET} rel={buildExternalLinkRel()}
          title="Tailscale Serve docs (opens in new tab)">Docs: Tailscale Serve</a>
        <span className="muted"> · </span>
        <a className="session-link" href="https://docs.openclaw.ai/web/control-ui#insecure-http"
          target={EXTERNAL_LINK_TARGET} rel={buildExternalLinkRel()}
          title="Insecure HTTP docs (opens in new tab)">Docs: Insecure HTTP</a>
      </div>
    </div>
  );
}

// ─── SVG Icons ───────────────────────────────────────────────

export const OverviewIcons = {
  snowflake: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle", flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2v20M2 12h20M5 5l14 14M19 5 5 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
    </svg>
  ),
  wheat: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle", flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 22V12M12 12C12 12 7 9 7 5a5 5 0 0 1 10 0c0 4-5 7-5 7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 12c0 0-2-3-2-6M12 12c0 0 2-3 2-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  fire: (s = 16) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle", flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2c0 0 3 4 3 8 0 2-1.5 3.5-3 4 0-2-2-3-2-5 0-2 2-7 2-7Z" fill="currentColor" opacity="0.7" />
      <path d="M12 22a7 7 0 0 0 7-7c0-3-2-5-3-7-1 2-1 3-3 4-2-1-3-3-3-5-2 2-3 5-1 8-1 0-2-1-2-2a7 7 0 0 0 5 9Z" fill="currentColor" />
    </svg>
  ),
  running: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle", flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
      <circle cx="14" cy="4" r="2" fill="currentColor" />
      <path d="M6 20l3-6 2 3 3-4 4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 8l2 4-4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M13 12l3-1 2 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  hourglass: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle", flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
      <path d="M5 3h14M5 21h14M6 3l6 8-6 10M18 3l-6 8 6 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  moon: (s = 14) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle", flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" fill="currentColor" />
    </svg>
  ),
  cow: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle", flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="12" cy="13" rx="7" ry="6" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2" />
      <path d="M8 13v3M16 13v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <circle cx="10" cy="12" r="1" fill="currentColor" />
      <circle cx="14" cy="12" r="1" fill="currentColor" />
      <path d="M7 7c-1-2-3-3-3-3s1 3 2 4M17 7c1-2 3-3 3-3s-1 3-2 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M10 15.5c.6.3 1.4.3 2 0" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  gate: (s = 18) => (
    <svg width={s} height={s} viewBox="0 0 24 24" fill="none" style={{ verticalAlign: "middle", flexShrink: 0 }} xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="3" width="20" height="18" rx="1" stroke="currentColor" strokeWidth="2" />
      <path d="M2 9h20M9 9v12M15 9v12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9 14h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
};

// ─── Main SnapshotCard ───────────────────────────────────────

export type SnapshotCardProps = {
  connected: boolean;
  hello: GatewayHelloOk | null;
  lastError: string | null;
  lastErrorCode: string | null;
  presenceCount: number;
  sessionsCount: number | null;
  cronJobsCount: number | null;
  gatewayUrl: string;
  hasToken: boolean;
  hasPassword: boolean;
};

export function SnapshotCard(props: SnapshotCardProps) {
  const { connected, hello, lastError, lastErrorCode, presenceCount, sessionsCount, cronJobsCount, gatewayUrl } = props;
  const { cpuPercent, memPercent } = useSystemStats(gatewayUrl);

  const snapshot = hello?.snapshot as
    | { uptimeMs?: number; policy?: { tickIntervalMs?: number }; authMode?: string }
    | undefined;
  const uptime = snapshot?.uptimeMs ? formatDurationHuman(snapshot.uptimeMs) : t("common.na");

  const showPairing = shouldShowPairingHint(connected, lastError, lastErrorCode);

  return (
    <div className="card ov-card--snapshot" style={{ height: "100%" }}>
      <div className="card-header-row">
        <div>
          <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {OverviewIcons.snowflake()} 牧场实况（Snapshot）
          </div>
          <div className="card-sub">最新的牛马握手信息。</div>
        </div>
      </div>
      <div className="snapshot-charts">
        <DonutChart percent={connected ? 100 : 0} label="精神状态" valueText={connected ? "亢奋" : "摆烂"} colorOverride={connected ? "#34d399" : "#ff6b6b"} />
        <DonutChart percent={100} label="连续打工" valueText={uptime} colorOverride="#38bdf8" />
        <DonutChart percent={cpuPercent} label="脑力负载" valueText={`${cpuPercent}%`} />
        <DonutChart percent={memPercent} label="体力消耗" valueText={`${memPercent}%`} />
        <DonutChart percent={presenceCount * 10} label="在线牛马" valueText={`${presenceCount}`} colorOverride="#818cf8" />
        <DonutChart percent={sessionsCount != null ? Math.min(sessionsCount * 10, 100) : 0} label="正在接客" valueText={`${sessionsCount ?? 0}`} colorOverride="#38bdf8" />
        <DonutChart percent={cronJobsCount != null ? (cronJobsCount > 0 ? 100 : 0) : 0} label="待办鞭策" valueText={`${cronJobsCount ?? 0}`} colorOverride="#fbbf24" />
      </div>
      {lastError && (
        <div className="callout danger" style={{ marginTop: 14 }}>
          <div>{lastError}</div>
          {showPairing && <PairingHint />}
          <AuthHint connected={connected} lastError={lastError} lastErrorCode={lastErrorCode} hasToken={props.hasToken} hasPassword={props.hasPassword} />
          <InsecureContextHint connected={connected} lastError={lastError} lastErrorCode={lastErrorCode} />
        </div>
      )}
    </div>
  );
}
