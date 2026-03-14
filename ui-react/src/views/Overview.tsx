import React, { useMemo } from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { loadOverview } from "../lib/app-settings.ts";
import type { SessionActivityResult, GatewayAgentRow, CostUsageSummary, SessionsUsageResult, ChannelsStatusSnapshot } from "../lib/types.ts";

// Pure React overview components
import { SnapshotCard, OverviewIcons } from "../components/overview/SnapshotCard.tsx";
import { AccessCard } from "../components/overview/AccessCard.tsx";
import { AgentsCard } from "../components/overview/AgentsCard.tsx";
import { UsageChartCard } from "../components/overview/UsageChartCard.tsx";
import { SwapyLayout, getSavedCardOrder } from "../components/overview/SwapyLayout.tsx";
import { RanchScene } from "../components/overview/RanchScene.tsx";
import { OrchestrationCard } from "../components/overview/OrchestrationCard.tsx";

// ─── Token Stats Row ─────────────────────────────────────────

function fmtTokens(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
  if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return String(n);
}

function TokenStatsRow({
  todayTokens,
  allTokens,
}: {
  todayTokens: number;
  allTokens: number;
}) {
  if (todayTokens <= 0 && allTokens <= 0) return null;
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
      <div className="card" style={{ padding: "16px 20px" }}>
        <div className="muted" style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 5 }}>
          {OverviewIcons.wheat(13)} 今日消耗草料（Tokens）
        </div>
        <div style={{ fontFamily: "var(--mono, monospace)", fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-strong)", lineHeight: 1.1 }}>
          {fmtTokens(todayTokens)}
        </div>
        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{todayTokens.toLocaleString()} 棵草</div>
      </div>
      <div className="card" style={{ padding: "16px 20px" }}>
        <div className="muted" style={{ fontSize: 12, fontWeight: 600, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 5 }}>
          {OverviewIcons.fire(13)} 累计消耗草料（Tokens）
        </div>
        <div style={{ fontFamily: "var(--mono, monospace)", fontSize: 32, fontWeight: 800, letterSpacing: "-0.03em", color: "var(--text-strong)", lineHeight: 1.1 }}>
          {fmtTokens(allTokens)}
        </div>
        <div className="muted" style={{ fontSize: 11, marginTop: 4 }}>{allTokens.toLocaleString()} 棵草</div>
      </div>
    </div>
  );
}

// ─── Main View ───────────────────────────────────────────────

const DEFAULT_CARD_ORDER = ["usage", "access", "agents"];

export function OverviewView() {
  const s = useAppStore;
  const connected = s((st) => st.connected);
  const hello = s((st) => st.hello);
  const settings = s((st) => st.settings);
  const password = s((st) => st.password);
  const lastError = s((st) => st.lastError);
  const lastErrorCode = s((st) => st.lastErrorCode);
  const cronStatus = s((st) => st.cronStatus);
  const presenceEntries = s((st) => st.presenceEntries);
  const sessionsResult = s((st) => st.sessionsResult);
  const sessionActivity = s((st) => st.sessionActivity);
  const agentsList = s((st) => st.agentsList);
  const overviewCostDaily = s((st) => st.overviewCostDaily);
  const overviewUsageResult = s((st) => st.overviewUsageResult);
  const overviewWeekUsageResult = s((st) => st.overviewWeekUsageResult);
  const applySettings = s((st) => st.applySettings);
  const set = s((st) => st.set);

  const presenceCount = presenceEntries.length;
  const sessionsCount = sessionsResult?.count ?? null;
  const agents = (agentsList?.agents ?? []) as unknown as GatewayAgentRow[];
  const configForm = s((st) => st.configForm) as Record<string, unknown> | null;
  const channelsSnapshot = s((st) => st.channelsSnapshot) as ChannelsStatusSnapshot | null;

  // Calcular qué canales están vinculados a cada agent
  const channelBindings = useMemo(() => {
    const map: Record<string, string[]> = {};
    // Fuente 1: routing.bindings
    const routing = (configForm?.routing ?? {}) as Record<string, unknown>;
    const bindings = routing.bindings;
    if (Array.isArray(bindings)) {
      for (const b of bindings) {
        if (b && typeof b === "object" && "agentId" in b && "match" in b) {
          const binding = b as { agentId?: string; match?: { channel?: string } };
          const aid = binding.agentId?.toLowerCase();
          const ch = binding.match?.channel;
          if (aid && ch) {
            (map[aid] ??= []).push(ch);
          }
        }
      }
    }
    // Fuente 2: channelAccounts
    if (channelsSnapshot?.channelAccounts) {
      for (const [channelId, accounts] of Object.entries(channelsSnapshot.channelAccounts)) {
        if (!Array.isArray(accounts)) continue;
        for (const acct of accounts) {
          const aid = acct.accountId?.toLowerCase();
          if (aid && !map[aid]?.includes(channelId)) {
            (map[aid] ??= []).push(channelId);
          }
        }
      }
    }
    // Deduplicar
    for (const k of Object.keys(map)) {
      map[k] = [...new Set(map[k])];
    }
    return map;
  }, [configForm, channelsSnapshot]);

  const snapshot = hello?.snapshot as { authMode?: string } | undefined;
  const isTrustedProxy = snapshot?.authMode === "trusted-proxy";

  const todayTokens = (overviewUsageResult as SessionsUsageResult | null)?.sessions?.reduce(
    (sum, s) => sum + (s.usage?.totalTokens ?? 0), 0,
  ) ?? 0;
  const allTokens = (overviewCostDaily as CostUsageSummary | null)?.totals?.totalTokens ?? 0;

  const cardOrder = useMemo(() => getSavedCardOrder(DEFAULT_CARD_ORDER), []);

  const cardMap: Record<string, React.ReactNode> = {
    usage: (
      <UsageChartCard
        key="usage"
        costDaily={overviewCostDaily as CostUsageSummary | null}
        usageResult={overviewUsageResult as SessionsUsageResult | null}
        weekUsageResult={overviewWeekUsageResult as SessionsUsageResult | null}
      />
    ),
    access: (
      <AccessCard
        key="access"
        settings={settings}
        password={password}
        isTrustedProxy={isTrustedProxy}
        onSettingsChange={(next) => applySettings(next)}
        onPasswordChange={(next) => set({ password: next })}
        onSessionKeyChange={(next) => {
          set({ sessionKey: next, chatMessage: "" });
          applySettings({ ...settings, sessionKey: next, lastActiveSessionKey: next });
        }}
        onConnect={() => {}}
        onRefresh={() => void loadOverview(getReactiveState() as never)}
      />
    ),
    agents: (
      <AgentsCard
        key="agents"
        agents={agents}
        sessionActivity={sessionActivity as SessionActivityResult | null}
        channelBindings={channelBindings}
      />
    ),
  };

  return (
    <SwapyLayout>
      <div className="ov-ranch-snapshot-row">
        <div className="ov-ranch-col">
          <RanchScene
            agents={agents}
            sessionActivity={sessionActivity as SessionActivityResult | null}
          />
        </div>
        <div className="ov-snapshot-col">
          <SnapshotCard
            connected={connected}
            hello={hello}
            lastError={lastError}
            lastErrorCode={lastErrorCode}
            presenceCount={presenceCount}
            sessionsCount={sessionsCount}
            cronJobsCount={cronStatus?.jobs ?? null}
            gatewayUrl={settings.gatewayUrl}
            hasToken={Boolean(settings.token.trim())}
            hasPassword={Boolean(password.trim())}
          />
          <TokenStatsRow todayTokens={todayTokens} allTokens={allTokens} />
        </div>
      </div>
      <div className="overview-swapy">
        {cardOrder.map((slot) => cardMap[slot])}
      </div>
      <OrchestrationCard sessionActivity={sessionActivity as SessionActivityResult | null} />
    </SwapyLayout>
  );
}
