import React from "react";
import { resolveToolDisplay } from "../../lib/tool-display.ts";
import type { ToolCard as ToolCardType } from "../../lib/types/chat-types.ts";

// ─── Helpers ─────────────────────────────────────────────────

function formatArgsJson(args: unknown): string {
  if (args == null) return "";
  try {
    return typeof args === "string" ? args : JSON.stringify(args, null, 2);
  } catch {
    return typeof args === "string" ? args : JSON.stringify(args);
  }
}

function formatResultJson(text: string | undefined): string {
  if (!text?.trim()) return "";
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try { return JSON.stringify(JSON.parse(trimmed), null, 2); } catch { return text; }
  }
  return text;
}

type ToolStatus = "loading" | "done" | "error";

function detectToolStatus(card: ToolCardType, isStreaming = false): ToolStatus {
  if (card.kind === "call" && !card.text && isStreaming) return "loading";
  if (card.text?.trim()) {
    const t = card.text.trim();
    if (t.startsWith("{")) {
      try {
        const parsed = JSON.parse(t);
        if (parsed.status === "error" || parsed.error || parsed.Error) return "error";
      } catch { /* not JSON */ }
    }
  }
  return "done";
}

// ─── Status Icons ────────────────────────────────────────────

const LoadingIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    className="chat-tool-card__spin">
    <path d="M12 2v4" /><path d="m16.2 7.8 2.9-2.9" /><path d="M18 12h4" />
    <path d="m16.2 16.2 2.9 2.9" /><path d="M12 18v4" /><path d="m4.9 19.1 2.9-2.9" />
    <path d="M2 12h4" /><path d="m4.9 4.9 2.9 2.9" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" />
  </svg>
);

const AlertIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" /><line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

function StatusIcon({ status }: { status: ToolStatus }) {
  switch (status) {
    case "loading": return <LoadingIcon />;
    case "error": return <AlertIcon />;
    default: return <CheckIcon />;
  }
}

// ─── Component ───────────────────────────────────────────────

export function ToolCard({
  card,
  isStreaming = false,
}: {
  card: ToolCardType;
  isStreaming?: boolean;
}) {
  const display = resolveToolDisplay({ name: card.name, args: card.args });
  const argsJson = formatArgsJson(card.args);
  const resultJson = formatResultJson(card.text);
  const hasArgs = Boolean(argsJson.trim());
  const hasResult = Boolean(resultJson.trim());
  const hasDetails = hasArgs || hasResult;
  const status = detectToolStatus(card, isStreaming);
  const isError = status === "error";

  return (
    <div className={`chat-tool-card${isError ? " chat-tool-card--error" : ""}`}>
      <div className="chat-tool-card__header">
        <div className="chat-tool-card__title">
          <span className={`chat-tool-card__status chat-tool-card__status--${status}`}>
            <StatusIcon status={status} />
          </span>
          <span className={isError ? "chat-tool-card__name--error" : ""}>
            {display.label}
          </span>
        </div>
      </div>
      {hasDetails && (
        <details className="chat-tool-card__details" open={isError}>
          <summary className="chat-tool-card__summary">
            <span className="chat-tool-card__summary-label">Tool Details</span>
            <span className="chat-tool-card__summary-toggle" />
          </summary>
          <div className="chat-tool-card__body">
            {hasArgs && (
              <div className="chat-tool-card__section">
                <div className="chat-tool-card__section-label">ARGUMENTS</div>
                <pre className="chat-tool-card__code-block">{argsJson}</pre>
              </div>
            )}
            {hasResult && (
              <div className="chat-tool-card__section">
                <div className="chat-tool-card__section-label">RESULT</div>
                <pre className="chat-tool-card__code-block">{resultJson}</pre>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
