import React from "react";
import { t } from "../../i18n/index.ts";
import { formatDurationCompact } from "../../../../src/infra/format-time/format-duration.ts";
import {
  buildAggregatesFromSessions,
  buildPeakErrorHours,
  buildUsageInsightStats,
  formatCost,
  formatDayLabel,
  formatTokens,
} from "../../lib/views/usage-metrics.ts";
import type { UsageAggregates, UsageSessionEntry, UsageTotals } from "../../lib/views/usageTypes.ts";

// ─── Helpers ─────────────────────────────────────────────
function pct(part: number, total: number): number {
  return total === 0 ? 0 : (part / total) * 100;
}

// ─── Sub-componentes ─────────────────────────────────────
function InsightList({ title, items, emptyLabel }: {
  title: string;
  items: Array<{ label: string; value: string; sub?: string }>;
  emptyLabel: string;
}) {
  return (
    <div className="usage-insight-card">
      <div className="usage-insight-title">{title}</div>
      {items.length === 0
        ? <div className="muted">{emptyLabel}</div>
        : (
          <div className="usage-list">
            {items.map((item, i) => (
              <div key={i} className="usage-list-item">
                <span>{item.label}</span>
                <span className="usage-list-value">
                  <span>{item.value}</span>
                  {item.sub && <span className="usage-list-sub">{item.sub}</span>}
                </span>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

function ErrorList({ title, items, emptyLabel }: {
  title: string;
  items: Array<{ label: string; value: string; sub?: string }>;
  emptyLabel: string;
}) {
  return (
    <div className="usage-insight-card">
      <div className="usage-insight-title">{title}</div>
      {items.length === 0
        ? <div className="muted">{emptyLabel}</div>
        : (
          <div className="usage-error-list">
            {items.map((item, i) => (
              <div key={i} className="usage-error-row">
                <div className="usage-error-date">{item.label}</div>
                <div className="usage-error-rate">{item.value}</div>
                {item.sub && <div className="usage-error-sub">{item.sub}</div>}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────
interface UsageOverviewProps {
  totals: UsageTotals | null;
  aggregates: UsageAggregates;
  sessions: UsageSessionEntry[];
  sessionCount: number;
  totalSessions: number;
  timeZone: "local" | "utc";
  showCostHint: boolean;
}

export function UsageOverview({
  totals, aggregates, sessions, sessionCount, totalSessions, timeZone, showCostHint,
}: UsageOverviewProps) {
  if (!totals) return null;

  const stats = buildUsageInsightStats(sessions, totals, aggregates);
  const errorHours = buildPeakErrorHours(sessions, timeZone);

  const avgTokens = aggregates.messages.total ? Math.round(totals.totalTokens / aggregates.messages.total) : 0;
  const avgCost = aggregates.messages.total ? totals.totalCost / aggregates.messages.total : 0;
  const cacheBase = totals.input + totals.cacheRead;
  const cacheHitRate = cacheBase > 0 ? totals.cacheRead / cacheBase : 0;
  const cacheHitLabel = cacheBase > 0 ? `${(cacheHitRate * 100).toFixed(1)}%` : "—";
  const errorRatePct = stats.errorRate * 100;
  const throughputLabel = stats.throughputTokensPerMin !== undefined
    ? `${formatTokens(Math.round(stats.throughputTokensPerMin))} tok/min` : "—";
  const throughputCostLabel = stats.throughputCostPerMin !== undefined
    ? `${formatCost(stats.throughputCostPerMin, 4)} / min` : "—";
  const avgDurationLabel = stats.durationCount > 0
    ? (formatDurationCompact(stats.avgDurationMs, { spaced: true }) ?? "—") : "—";

  const errorDays = aggregates.daily
    .filter((day) => day.messages > 0 && day.errors > 0)
    .map((day) => ({ label: formatDayLabel(day.date), value: `${((day.errors / day.messages) * 100).toFixed(2)}%`, sub: `${day.errors} errors · ${day.messages} msgs · ${formatTokens(day.tokens)}`, rate: day.errors / day.messages }))
    .toSorted((a, b) => b.rate - a.rate)
    .slice(0, 5)
    .map(({ rate: _r, ...rest }) => rest);

  const topModels = aggregates.byModel.slice(0, 5).map((e) => ({ label: e.model ?? "unknown", value: formatCost(e.totals.totalCost), sub: `${formatTokens(e.totals.totalTokens)} · ${e.count} msgs` }));
  const topProviders = aggregates.byProvider.slice(0, 5).map((e) => ({ label: e.provider ?? "unknown", value: formatCost(e.totals.totalCost), sub: `${formatTokens(e.totals.totalTokens)} · ${e.count} msgs` }));
  const topTools = aggregates.tools.tools.slice(0, 6).map((tool) => ({ label: tool.name, value: `${tool.count}`, sub: t("usageView.calls") }));
  const topAgents = aggregates.byAgent.slice(0, 5).map((e) => ({ label: e.agentId, value: formatCost(e.totals.totalCost), sub: formatTokens(e.totals.totalTokens) }));
  const topChannels = aggregates.byChannel.slice(0, 5).map((e) => ({ label: e.channel, value: formatCost(e.totals.totalCost), sub: formatTokens(e.totals.totalTokens) }));

  const costHint = showCostHint ? t("usageView.avgCostMissing") : t("usageView.avgCostNormal");

  // Tarjetas de resumen
  const summaryCards = [
    { title: t("usageView.messages"), hint: t("usageView.messagesHint"), value: String(aggregates.messages.total), sub: `${aggregates.messages.user} ${t("usageView.userLabel")} · ${aggregates.messages.assistant} ${t("usageView.assistantLabel")}` },
    { title: t("usageView.toolCalls"), hint: t("usageView.toolCallsHint"), value: String(aggregates.tools.totalCalls), sub: `${aggregates.tools.uniqueTools} ${t("usageView.toolsUsed")}` },
    { title: t("usageView.errors"), hint: t("usageView.errorsHint"), value: String(aggregates.messages.errors), sub: `${aggregates.messages.toolResults} ${t("usageView.toolResults")}` },
    { title: t("usageView.avgTokensMsg"), hint: t("usageView.tokensHint"), value: formatTokens(avgTokens), sub: t("usageView.acrossMessages", { count: String(aggregates.messages.total || 0) }) },
    { title: t("usageView.avgCostMsg"), hint: costHint, value: formatCost(avgCost, 4), sub: `${formatCost(totals.totalCost)} ${t("usageView.totalLabel")}` },
    { title: t("usageView.sessionsLabel"), hint: t("usageView.sessionsHint"), value: String(sessionCount), sub: t("usageView.ofInRange", { total: String(totalSessions) }) },
    { title: t("usageView.throughput"), hint: t("usageView.throughputHint"), value: throughputLabel, sub: throughputCostLabel },
    { title: t("usageView.errorRate"), hint: t("usageView.errorRateHint"), value: `${errorRatePct.toFixed(2)}%`, valueClass: errorRatePct > 5 ? "bad" : errorRatePct > 1 ? "warn" : "good", sub: t("usageView.errorsAvgSession", { errors: String(aggregates.messages.errors), duration: avgDurationLabel }) },
    { title: t("usageView.cacheHitRate"), hint: t("usageView.cacheHitHint"), value: cacheHitLabel, valueClass: cacheHitRate > 0.6 ? "good" : cacheHitRate > 0.3 ? "warn" : "bad", sub: t("usageView.cachedPrompt", { cached: formatTokens(totals.cacheRead), prompt: formatTokens(cacheBase) }) },
  ];

  return (
    <section className="card" style={{ marginTop: 16 }}>
      <div className="card-title">{t("usageView.usageOverview")}</div>
      <div className="usage-summary-grid">
        {summaryCards.map((card, i) => (
          <div key={i} className="usage-summary-card">
            <div className="usage-summary-title">
              {card.title}
              <span className="usage-summary-hint" title={card.hint}>?</span>
            </div>
            <div className={`usage-summary-value ${(card as { valueClass?: string }).valueClass ?? ""}`}>{card.value}</div>
            <div className="usage-summary-sub">{card.sub}</div>
          </div>
        ))}
      </div>
      <div className="usage-insights-grid">
        <InsightList title={t("usageView.topModels")} items={topModels} emptyLabel={t("usageView.noModelData")} />
        <InsightList title={t("usageView.topProviders")} items={topProviders} emptyLabel={t("usageView.noProviderData")} />
        <InsightList title={t("usageView.topTools")} items={topTools} emptyLabel={t("usageView.noToolCalls")} />
        <InsightList title={t("usageView.topAgents")} items={topAgents} emptyLabel={t("usageView.noAgentData")} />
        <InsightList title={t("usageView.topChannels")} items={topChannels} emptyLabel={t("usageView.noChannelData")} />
        <ErrorList title={t("usageView.peakErrorDays")} items={errorDays} emptyLabel={t("usageView.noErrorData")} />
        <ErrorList title={t("usageView.peakErrorHours")} items={errorHours} emptyLabel={t("usageView.noErrorData")} />
      </div>
    </section>
  );
}
