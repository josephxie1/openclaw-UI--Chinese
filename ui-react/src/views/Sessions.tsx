import React, { useCallback, useState } from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { t } from "../i18n/index.ts";
import { formatRelativeTimestamp } from "../lib/format.ts";
import { pathForTab } from "../lib/navigation.ts";
import { formatSessionTokens } from "../lib/presenter.ts";
import { deleteSessionAndRefresh, loadSessions, patchSession } from "../lib/controllers/sessions.ts";
import type { GatewaySessionRow } from "../lib/types.ts";
import { InlineSelect } from "../components/InlineSelect.tsx";
import { ConfirmDialog } from "../components/ConfirmDialog.tsx";

const THINK_LEVELS = ["", "off", "minimal", "low", "medium", "high", "xhigh"] as const;
const BINARY_THINK_LEVELS = ["", "off", "on"] as const;
const VERBOSE_LEVELS = [
  { value: "", label: "inherit" },
  { value: "off", label: "off (explicit)" },
  { value: "on", label: "on" },
  { value: "full", label: "full" },
] as const;
const REASONING_LEVELS = ["", "off", "on", "stream"] as const;

function normalizeProviderId(provider?: string | null): string {
  if (!provider) return "";
  const normalized = provider.trim().toLowerCase();
  if (normalized === "z.ai" || normalized === "z-ai") return "zai";
  return normalized;
}

function isBinaryThinkingProvider(provider?: string | null): boolean {
  return normalizeProviderId(provider) === "zai";
}

function resolveThinkLevelOptions(provider?: string | null): readonly string[] {
  return isBinaryThinkingProvider(provider) ? BINARY_THINK_LEVELS : THINK_LEVELS;
}

function withCurrentOption(options: readonly string[], current: string): string[] {
  if (!current) return [...options];
  if (options.includes(current)) return [...options];
  return [...options, current];
}

function withCurrentLabeledOption(
  options: readonly { value: string; label: string }[],
  current: string,
): Array<{ value: string; label: string }> {
  if (!current) return [...options];
  if (options.some((o) => o.value === current)) return [...options];
  return [...options, { value: current, label: `${current} (custom)` }];
}

function resolveThinkLevelDisplay(value: string, isBinary: boolean): string {
  if (!isBinary) return value;
  if (!value || value === "off") return value;
  return "on";
}

function resolveThinkLevelPatchValue(value: string, isBinary: boolean): string | null {
  if (!value) return null;
  if (!isBinary) return value;
  if (value === "on") return "low";
  return value;
}

export function SessionsView() {
  const loading = useAppStore((s) => s.sessionsLoading);
  const result = useAppStore((s) => s.sessionsResult);
  const error = useAppStore((s) => s.sessionsError);
  const activeMinutes = useAppStore((s) => s.sessionsFilterActive);
  const limit = useAppStore((s) => s.sessionsFilterLimit);
  const includeGlobal = useAppStore((s) => s.sessionsIncludeGlobal);
  const includeUnknown = useAppStore((s) => s.sessionsIncludeUnknown);
  const basePath = useAppStore((s) => s.basePath);
  const set = useAppStore((s) => s.set);

  // Estado para diálogo de confirmación de eliminación
  const [pendingDeleteKey, setPendingDeleteKey] = useState<string | null>(null);

  const onRefresh = useCallback(() => {
    void loadSessions(getReactiveState() as never);
  }, []);

  const onPatch = useCallback(
    (key: string, patch: Record<string, unknown>) => {
      void patchSession(getReactiveState() as never, key, patch);
    },
    [],
  );

  const onDeleteRequest = useCallback((key: string) => {
    setPendingDeleteKey(key);
  }, []);

  const onDeleteConfirm = useCallback(() => {
    if (pendingDeleteKey) {
      void deleteSessionAndRefresh(getReactiveState() as never, pendingDeleteKey);
    }
    setPendingDeleteKey(null);
  }, [pendingDeleteKey]);

  const onDeleteCancel = useCallback(() => {
    setPendingDeleteKey(null);
  }, []);

  const rows = result?.sessions ?? [];

  return (
    <section className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div>
          <div className="card-title">{t("sessionsView.title")}</div>
          <div className="card-sub">{t("sessionsView.subtitle")}</div>
        </div>
        <button className="btn" disabled={loading} onClick={onRefresh}>
          {loading ? t("shared.loading") : t("shared.refresh")}
        </button>
      </div>

      <div className="filters" style={{ marginTop: 14 }}>
        <label className="field">
          <span>{t("sessionsView.activeWithin")}</span>
          <input
            value={activeMinutes}
            onChange={(e) => set({ sessionsFilterActive: e.target.value })}
          />
        </label>
        <label className="field">
          <span>{t("sessionsView.limit")}</span>
          <input value={limit} onChange={(e) => set({ sessionsFilterLimit: e.target.value })} />
        </label>
        <label className="field checkbox">
          <span>{t("sessionsView.includeGlobal")}</span>
          <input
            type="checkbox"
            checked={includeGlobal}
            onChange={(e) => set({ sessionsIncludeGlobal: e.target.checked })}
          />
        </label>
        <label className="field checkbox">
          <span>{t("sessionsView.includeUnknown")}</span>
          <input
            type="checkbox"
            checked={includeUnknown}
            onChange={(e) => set({ sessionsIncludeUnknown: e.target.checked })}
          />
        </label>
      </div>

      {error && (
        <div className="callout danger" style={{ marginTop: 12 }}>{error}</div>
      )}

      <div className="muted" style={{ marginTop: 12 }}>
        {result ? `${t("sessionsView.store")} ${result.path}` : ""}
      </div>

      <div className="table" style={{ marginTop: 16 }}>
        <div className="table-head">
          <div>{t("sessionsView.key")}</div>
          <div>{t("sessionsView.label")}</div>
          <div>{t("sessionsView.kind")}</div>
          <div>{t("sessionsView.updated")}</div>
          <div>{t("sessionsView.tokens")}</div>
          <div>{t("sessionsView.thinking")}</div>
          <div>{t("sessionsView.verbose")}</div>
          <div>{t("sessionsView.reasoning")}</div>
          <div>{t("sessionsView.actions")}</div>
        </div>
        {rows.length === 0 ? (
          <div className="muted">{t("sessionsView.noSessions")}</div>
        ) : (
          rows.map((row) => (
            <SessionRow
              key={row.key}
              row={row}
              basePath={basePath}
              onPatch={onPatch}
              onDelete={onDeleteRequest}
              disabled={loading}
            />
          ))
        )}
      </div>

      <ConfirmDialog
        open={pendingDeleteKey !== null}
        title={t("sessionsView.delete")}
        message={`${t("sessionsView.deleteConfirm", { key: pendingDeleteKey ?? "" })}`}
        confirmLabel={t("sessionsView.delete")}
        danger
        onConfirm={onDeleteConfirm}
        onCancel={onDeleteCancel}
      />
    </section>
  );
}

function SessionRow({
  row,
  basePath,
  onPatch,
  onDelete,
  disabled,
}: {
  row: GatewaySessionRow;
  basePath: string;
  onPatch: (key: string, patch: Record<string, unknown>) => void;
  onDelete: (key: string) => void;
  disabled: boolean;
}) {
  const updated = row.updatedAt ? formatRelativeTimestamp(row.updatedAt) : "n/a";
  const rawThinking = row.thinkingLevel ?? "";
  const isBinaryThinking = isBinaryThinkingProvider(row.modelProvider);
  const thinking = resolveThinkLevelDisplay(rawThinking, isBinaryThinking);
  const thinkLevels = withCurrentOption(resolveThinkLevelOptions(row.modelProvider), thinking);
  const verbose = row.verboseLevel ?? "";
  const verboseLevels = withCurrentLabeledOption(VERBOSE_LEVELS, verbose);
  const reasoning = row.reasoningLevel ?? "";
  const reasoningLevels = withCurrentOption(REASONING_LEVELS, reasoning);
  const displayName =
    typeof row.displayName === "string" && row.displayName.trim().length > 0
      ? row.displayName.trim()
      : null;
  const label = typeof row.label === "string" ? row.label.trim() : "";
  const showDisplayName = Boolean(displayName && displayName !== row.key && displayName !== label);
  const canLink = row.kind !== "global";
  const chatUrl = canLink
    ? `${pathForTab("chat", basePath)}?session=${encodeURIComponent(row.key)}`
    : null;

  return (
    <div className="table-row">
      <div className="mono session-key-cell">
        {canLink ? (
          <a href={chatUrl!} className="session-link">{row.key}</a>
        ) : (
          row.key
        )}
        {showDisplayName && (
          <span className="muted session-key-display-name">{displayName}</span>
        )}
      </div>
      <div>
        <input
          defaultValue={row.label ?? ""}
          disabled={disabled}
          placeholder={t("sessionsView.optional")}
          onBlur={(e) => {
            const value = e.target.value.trim();
            onPatch(row.key, { label: value || null });
          }}
        />
      </div>
      <div>{row.kind}</div>
      <div>{updated}</div>
      <div>
        <TokenBar row={row} />
      </div>
      <div>
        <InlineSelect
          disabled={disabled}
          value={thinking}
          options={thinkLevels.map((level) => ({
            value: level,
            label: level || t("sessionsView.inherit"),
          }))}
          onChange={(val) =>
            onPatch(row.key, {
              thinkingLevel: resolveThinkLevelPatchValue(val, isBinaryThinking),
            })
          }
        />
      </div>
      <div>
        <InlineSelect
          disabled={disabled}
          value={verbose}
          options={verboseLevels.map((level) => ({
            value: level.value,
            label: level.label,
          }))}
          onChange={(val) => onPatch(row.key, { verboseLevel: val || null })}
        />
      </div>
      <div>
        <InlineSelect
          disabled={disabled}
          value={reasoning}
          options={reasoningLevels.map((level) => ({
            value: level,
            label: level || t("sessionsView.inherit"),
          }))}
          onChange={(val) => onPatch(row.key, { reasoningLevel: val || null })}
        />
      </div>
      <div>
        <button className="btn danger" disabled={disabled} onClick={() => onDelete(row.key)}>
          {t("sessionsView.delete")}
        </button>
      </div>
    </div>
  );
}

function formatTokensShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return String(n);
}

function TokenBar({ row }: { row: GatewaySessionRow }) {
  const total = row.totalTokens ?? 0;
  const ctx = row.contextTokens ?? 0;
  if (total === 0 && ctx === 0) return <span className="muted">n/a</span>;
  if (ctx === 0) return <span style={{ fontSize: 12 }}>{formatTokensShort(total)}</span>;

  const pct = Math.min((total / ctx) * 100, 100);
  // Color: verde → amarillo → rojo
  const color =
    pct < 50 ? "var(--color-ok, #22c55e)"
    : pct < 80 ? "var(--color-warn, #f59e0b)"
    : "var(--color-danger, #ef4444)";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ fontSize: 11, color: "var(--text)", whiteSpace: "nowrap" }}>
        {formatTokensShort(total)} / {formatTokensShort(ctx)}
      </div>
      <div
        style={{
          height: 4,
          borderRadius: 2,
          background: "var(--border)",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            borderRadius: 2,
            background: color,
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}
