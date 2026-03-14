import React, { useCallback, useRef, useEffect } from "react";
import { t } from "../../i18n/index.ts";
import {
  formatCost,
  formatIsoDate,
  formatTokens,
} from "../../lib/views/usage-metrics.ts";
import {
  addQueryToken,
  applySuggestionToQuery,
  buildDailyCsv,
  buildQuerySuggestions,
  buildSessionsCsv,
  downloadTextFile,
  normalizeQueryText,
  removeQueryToken,
  setQueryTokensForKey,
} from "../../lib/views/usage-query.ts";
import { extractQueryTerms, filterSessionsByQuery } from "../../lib/usage-helpers.ts";
import type { UsageSessionEntry, UsageTotals, UsageAggregates, CostDailyEntry } from "../../lib/views/usageTypes.ts";

// ─── Tipos ────────────────────────────────────────────────
interface FilterSelectProps {
  filterKey: string;
  label: string;
  options: string[];
  queryDraft: string;
  query: string;
  onQueryDraftChange: (q: string) => void;
}

interface UsageFilterBarProps {
  loading: boolean;
  error: string | null;
  startDate: string;
  endDate: string;
  sessions: UsageSessionEntry[];
  totals: UsageTotals | null;
  aggregates: UsageAggregates | null;
  costDaily: CostDailyEntry[];
  displayTotals: UsageTotals | null;
  displaySessionCount: number;
  totalSessions: number;
  filteredSessions: UsageSessionEntry[];
  filteredDaily: CostDailyEntry[];
  selectedDays: string[];
  selectedHours: number[];
  selectedSessions: string[];
  chartMode: "tokens" | "cost";
  headerPinned: boolean;
  sessionsLimitReached: boolean;
  query: string;
  queryDraft: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  onRefresh: () => void;
  onChartModeChange: (mode: "tokens" | "cost") => void;
  onTimeZoneChange: (zone: "local" | "utc") => void;
  onToggleHeaderPinned: () => void;
  onQueryDraftChange: (q: string) => void;
  onApplyQuery: () => void;
  onClearQuery: () => void;
  onClearDays: () => void;
  onClearHours: () => void;
  onClearSessions: () => void;
  onClearFilters: () => void;
  timeZone: "local" | "utc";
}

// ─── Sub-componente: Dropdown de filtro ──────────────────
function FilterSelect({ filterKey, label, options, queryDraft, query, onQueryDraftChange }: FilterSelectProps) {
  if (options.length === 0) return null;

  const detailsRef = useRef<HTMLDetailsElement>(null);
  const queryTerms = extractQueryTerms(query);
  const selectedValues = queryTerms
    .filter((term) => normalizeQueryText(term.key ?? "") === normalizeQueryText(filterKey))
    .map((term) => term.value)
    .filter(Boolean);
  const selectedSet = new Set(selectedValues.map((v) => normalizeQueryText(v)));
  const allSelected = options.length > 0 && options.every((v) => selectedSet.has(normalizeQueryText(v)));
  const selectedCount = selectedValues.length;

  // Cerrar el dropdown al hacer clic fuera
  useEffect(() => {
    const el = detailsRef.current;
    if (!el) return;
    const handler = (ev: Event) => {
      const toggle = ev as ToggleEvent;
      if (toggle.newState !== "open") return;
      const onClick = (e: MouseEvent) => {
        if (!el.contains(e.target as Node)) {
          el.open = false;
          window.removeEventListener("click", onClick, true);
        }
      };
      window.addEventListener("click", onClick, true);
    };
    el.addEventListener("toggle", handler);
    return () => el.removeEventListener("toggle", handler);
  }, []);

  return (
    <details ref={detailsRef} className="usage-filter-select">
      <summary>
        <span>{label}</span>
        {selectedCount > 0
          ? <span className="usage-filter-badge">{selectedCount}</span>
          : <span className="usage-filter-badge">{t("usageView.all")}</span>}
      </summary>
      <div className="usage-filter-popover">
        <div className="usage-filter-actions">
          <button
            className="btn btn-sm"
            disabled={allSelected}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQueryDraftChange(setQueryTokensForKey(queryDraft, filterKey, options)); }}
          >{t("usageView.selectAll")}</button>
          <button
            className="btn btn-sm"
            disabled={selectedCount === 0}
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onQueryDraftChange(setQueryTokensForKey(queryDraft, filterKey, [])); }}
          >{t("usageView.clear")}</button>
        </div>
        <div className="usage-filter-options">
          {options.map((value) => {
            const checked = selectedSet.has(normalizeQueryText(value));
            return (
              <label key={value} className="usage-filter-option">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    const token = `${filterKey}:${value}`;
                    onQueryDraftChange(
                      e.target.checked
                        ? addQueryToken(queryDraft, token)
                        : removeQueryToken(queryDraft, token),
                    );
                  }}
                />
                <span>{value}</span>
              </label>
            );
          })}
        </div>
      </div>
    </details>
  );
}

// ─── Sub-componente: Chips de filtros activos ────────────
function FilterChips({
  selectedDays, selectedHours, selectedSessions, sessions,
  onClearDays, onClearHours, onClearSessions, onClearFilters,
}: {
  selectedDays: string[]; selectedHours: number[]; selectedSessions: string[];
  sessions: UsageSessionEntry[];
  onClearDays: () => void; onClearHours: () => void;
  onClearSessions: () => void; onClearFilters: () => void;
}) {
  const hasFilters = selectedDays.length > 0 || selectedHours.length > 0 || selectedSessions.length > 0;
  if (!hasFilters) return null;

  const selectedSession = selectedSessions.length === 1 ? sessions.find((s) => s.key === selectedSessions[0]) : null;
  const sessionsLabel = selectedSession
    ? (selectedSession.label || selectedSession.key).slice(0, 20) + ((selectedSession.label || selectedSession.key).length > 20 ? "…" : "")
    : selectedSessions.length === 1
      ? selectedSessions[0].slice(0, 8) + "…"
      : `${selectedSessions.length} sessions`;
  const daysLabel = selectedDays.length === 1 ? selectedDays[0] : `${selectedDays.length} days`;
  const hoursLabel = selectedHours.length === 1 ? `${selectedHours[0]}:00` : `${selectedHours.length} hours`;

  return (
    <div className="active-filters">
      {selectedDays.length > 0 && (
        <div className="filter-chip">
          <span className="filter-chip-label">{t("usageView.daysLabel")} {daysLabel}</span>
          <button className="filter-chip-remove" onClick={onClearDays}>×</button>
        </div>
      )}
      {selectedHours.length > 0 && (
        <div className="filter-chip">
          <span className="filter-chip-label">{t("usageView.hoursLabel")} {hoursLabel}</span>
          <button className="filter-chip-remove" onClick={onClearHours}>×</button>
        </div>
      )}
      {selectedSessions.length > 0 && (
        <div className="filter-chip" title={selectedSession ? (selectedSession.label || selectedSession.key) : selectedSessions.join(", ")}>
          <span className="filter-chip-label">{t("usageView.sessionLabel")} {sessionsLabel}</span>
          <button className="filter-chip-remove" onClick={onClearSessions}>×</button>
        </div>
      )}
      {(selectedDays.length > 0 || selectedHours.length > 0) && selectedSessions.length > 0 && (
        <button className="btn btn-sm filter-clear-btn" onClick={onClearFilters}>{t("usageView.clearAll")}</button>
      )}
    </div>
  );
}

// ─── Componente principal ────────────────────────────────
export function UsageFilterBar(props: UsageFilterBarProps) {
  const {
    loading, error, startDate, endDate, sessions, totals,
    aggregates, displayTotals, displaySessionCount, totalSessions,
    filteredSessions, filteredDaily, costDaily,
    selectedDays, selectedHours, selectedSessions,
    chartMode, headerPinned, sessionsLimitReached,
    query, queryDraft,
    onStartDateChange, onEndDateChange, onRefresh,
    onChartModeChange, onTimeZoneChange, onToggleHeaderPinned,
    onQueryDraftChange, onApplyQuery, onClearQuery,
    onClearDays, onClearHours, onClearSessions, onClearFilters,
    timeZone,
  } = props;

  const isTokenMode = chartMode === "tokens";
  const hasQuery = query.trim().length > 0;
  const hasDraftQuery = queryDraft.trim().length > 0;
  const isEmpty = !loading && !totals && sessions.length === 0;
  const exportStamp = formatIsoDate(new Date());

  const queryTerms = extractQueryTerms(query);
  const querySuggestions = buildQuerySuggestions(queryDraft, sessions, aggregates);
  const queryResult = filterSessionsByQuery(sessions, query);
  const queryWarnings = queryResult.warnings;

  // Opciones de filtro
  const unique = (items: Array<string | undefined>) => [...new Set(items.filter(Boolean) as string[])];
  const sortedSessions = sessions; // Ya están ordenados desde el componente padre
  const agentOptions = unique(sortedSessions.map((s) => s.agentId)).slice(0, 12);
  const channelOptions = unique(sortedSessions.map((s) => s.channel)).slice(0, 12);
  const providerOptions = unique([
    ...sortedSessions.map((s) => s.modelProvider),
    ...sortedSessions.map((s) => s.providerOverride),
    ...(aggregates?.byProvider.map((e) => e.provider) ?? []),
  ]).slice(0, 12);
  const modelOptions = unique([
    ...sortedSessions.map((s) => s.model),
    ...(aggregates?.byModel.map((e) => e.model) ?? []),
  ]).slice(0, 12);
  const toolOptions = unique(aggregates?.tools.tools.map((tool) => tool.name) ?? []).slice(0, 12);

  const datePresets = [
    { label: t("usageView.today"), days: 1 },
    { label: "7d", days: 7 },
    { label: "30d", days: 30 },
  ];

  const applyPreset = useCallback((days: number) => {
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (days - 1));
    onStartDateChange(formatIsoDate(start));
    onEndDateChange(formatIsoDate(end));
  }, [onStartDateChange, onEndDateChange]);

  const exportRef = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const el = exportRef.current;
    if (!el) return;
    const handler = () => {
      if (!el.open) return;
      const onClick = (e: MouseEvent) => {
        if (!el.contains(e.target as Node)) {
          el.open = false;
          window.removeEventListener("click", onClick, true);
        }
      };
      window.addEventListener("click", onClick, true);
    };
    el.addEventListener("toggle", handler);
    return () => el.removeEventListener("toggle", handler);
  }, []);

  return (
    <section className={`card usage-header ${headerPinned ? "pinned" : ""}`}>
      {/* Primera fila: título + métricas + pin + export */}
      <div className="usage-header-row">
        <div className="usage-header-title">
          <div className="card-title" style={{ margin: 0 }}>{t("usageView.filters")}</div>
          {loading && <span className="usage-refresh-indicator">{t("usageView.loading")}</span>}
          {isEmpty && <span className="usage-query-hint">{t("usageView.selectDateHint")}</span>}
        </div>
        <div className="usage-header-metrics">
          {displayTotals && (
            <>
              <span className="usage-metric-badge"><strong>{formatTokens(displayTotals.totalTokens)}</strong> {t("usageView.tokens")}</span>
              <span className="usage-metric-badge"><strong>{formatCost(displayTotals.totalCost)}</strong> {t("usageView.cost")}</span>
              <span className="usage-metric-badge"><strong>{displaySessionCount}</strong> {displaySessionCount !== 1 ? t("usageView.sessions") : t("usageView.session")}</span>
            </>
          )}
          <button
            className={`usage-pin-btn ${headerPinned ? "active" : ""}`}
            title={headerPinned ? t("usageView.unpinFilters") : t("usageView.pinFilters")}
            onClick={onToggleHeaderPinned}
          >{headerPinned ? t("usageView.pinned") : t("usageView.pin")}</button>
          <details ref={exportRef} className="usage-export-menu">
            <summary className="usage-export-button">{t("usageView.export")}</summary>
            <div className="usage-export-popover">
              <div className="usage-export-list">
                <button className="usage-export-item" disabled={filteredSessions.length === 0}
                  onClick={() => downloadTextFile(`openclaw-usage-sessions-${exportStamp}.csv`, buildSessionsCsv(filteredSessions), "text/csv")}
                >{t("usageView.sessionsCsv")}</button>
                <button className="usage-export-item" disabled={filteredDaily.length === 0}
                  onClick={() => downloadTextFile(`openclaw-usage-daily-${exportStamp}.csv`, buildDailyCsv(filteredDaily), "text/csv")}
                >{t("usageView.dailyCsv")}</button>
                <button className="usage-export-item" disabled={filteredSessions.length === 0 && filteredDaily.length === 0}
                  onClick={() => downloadTextFile(`openclaw-usage-${exportStamp}.json`, JSON.stringify({ totals: displayTotals, sessions: filteredSessions, daily: filteredDaily }, null, 2), "application/json")}
                >JSON</button>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Segunda fila: presets + dates + mode + refresh */}
      <div className="usage-header-row">
        <div className="usage-controls">
          <FilterChips
            selectedDays={selectedDays} selectedHours={selectedHours}
            selectedSessions={selectedSessions} sessions={sessions}
            onClearDays={onClearDays} onClearHours={onClearHours}
            onClearSessions={onClearSessions} onClearFilters={onClearFilters}
          />
          <div className="usage-presets">
            {datePresets.map((preset) => (
              <button key={preset.days} className="btn btn-sm" onClick={() => applyPreset(preset.days)}>{preset.label}</button>
            ))}
          </div>
          <input type="date" value={startDate} title={t("usageView.startDate")}
            onChange={(e) => onStartDateChange(e.target.value)} />
          <span style={{ color: "var(--muted)" }}>to</span>
          <input type="date" value={endDate} title={t("usageView.endDate")}
            onChange={(e) => onEndDateChange(e.target.value)} />
          <select title={t("usageView.timeZone")} value={timeZone}
            onChange={(e) => onTimeZoneChange(e.target.value as "local" | "utc")}>
            <option value="local">{t("usageView.local")}</option>
            <option value="utc">UTC</option>
          </select>
          <div className="chart-toggle">
            <button className={`toggle-btn ${isTokenMode ? "active" : ""}`} onClick={() => onChartModeChange("tokens")}>{t("usageView.tokensLabel")}</button>
            <button className={`toggle-btn ${!isTokenMode ? "active" : ""}`} onClick={() => onChartModeChange("cost")}>{t("usageView.costLabel")}</button>
          </div>
          <button className="btn btn-sm usage-action-btn usage-primary-btn" onClick={onRefresh} disabled={loading}>{t("usageView.refresh")}</button>
        </div>
      </div>

      {/* Query bar */}
      <div style={{ marginTop: 12 }}>
        <div className="usage-query-bar">
          <input
            className="usage-query-input"
            type="text"
            value={queryDraft}
            placeholder={t("usageView.filterPlaceholder")}
            onChange={(e) => onQueryDraftChange(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onApplyQuery(); } }}
          />
          <div className="usage-query-actions">
            <button className="btn btn-sm usage-action-btn usage-secondary-btn" onClick={onApplyQuery}
              disabled={loading || (!hasDraftQuery && !hasQuery)}>{t("usageView.filterClientSide")}</button>
            {(hasDraftQuery || hasQuery) && (
              <button className="btn btn-sm usage-action-btn usage-secondary-btn" onClick={onClearQuery}>{t("usageView.clear")}</button>
            )}
            <span className="usage-query-hint">
              {hasQuery
                ? t("usageView.matchingSessions", { count: String(filteredSessions.length), total: String(totalSessions) })
                : t("usageView.sessionsInRange", { total: String(totalSessions) })}
            </span>
          </div>
        </div>

        {/* Filter dropdowns */}
        <div className="usage-filter-row">
          <FilterSelect filterKey="agent" label={t("usageView.agent")} options={agentOptions} queryDraft={queryDraft} query={query} onQueryDraftChange={onQueryDraftChange} />
          <FilterSelect filterKey="channel" label={t("usageView.channel")} options={channelOptions} queryDraft={queryDraft} query={query} onQueryDraftChange={onQueryDraftChange} />
          <FilterSelect filterKey="provider" label={t("usageView.provider")} options={providerOptions} queryDraft={queryDraft} query={query} onQueryDraftChange={onQueryDraftChange} />
          <FilterSelect filterKey="model" label={t("usageView.model")} options={modelOptions} queryDraft={queryDraft} query={query} onQueryDraftChange={onQueryDraftChange} />
          <FilterSelect filterKey="tool" label={t("usageView.tool")} options={toolOptions} queryDraft={queryDraft} query={query} onQueryDraftChange={onQueryDraftChange} />
          <span className="usage-query-hint">{t("usageView.filterTip")}</span>
        </div>

        {/* Query chips */}
        {queryTerms.length > 0 && (
          <div className="usage-query-chips">
            {queryTerms.map((term, i) => (
              <span key={i} className="usage-query-chip">
                {term.raw}
                <button title={t("usageView.removeFilter")} onClick={() => onQueryDraftChange(removeQueryToken(queryDraft, term.raw))}>×</button>
              </span>
            ))}
          </div>
        )}

        {/* Query suggestions */}
        {querySuggestions.length > 0 && (
          <div className="usage-query-suggestions">
            {querySuggestions.map((s, i) => (
              <button key={i} className="usage-query-suggestion" onClick={() => onQueryDraftChange(applySuggestionToQuery(queryDraft, s.value))}>{s.label}</button>
            ))}
          </div>
        )}

        {/* Query warnings */}
        {queryWarnings.length > 0 && (
          <div className="callout warning" style={{ marginTop: 8 }}>{queryWarnings.join(" · ")}</div>
        )}
      </div>

      {/* Error / limit warnings */}
      {error && <div className="callout danger" style={{ marginTop: 12 }}>{error}</div>}
      {sessionsLimitReached && (
        <div className="callout warning" style={{ marginTop: 12 }}>{t("usageView.limitWarning")}</div>
      )}
    </section>
  );
}
