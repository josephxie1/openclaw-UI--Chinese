import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import { icons } from "../icons.ts";
import { resolveToolDisplay } from "../tool-display.ts";
import type { ToolCard } from "../types/chat-types.ts";
import { extractTextCached } from "./message-extract.ts";
import { isToolResultMessage } from "./message-normalizer.ts";

export function extractToolCards(message: unknown): ToolCard[] {
  const m = message as Record<string, unknown>;
  const content = normalizeContent(m.content);
  const cards: ToolCard[] = [];

  for (const item of content) {
    const kind = (typeof item.type === "string" ? item.type : "").toLowerCase();
    const isToolCall =
      ["toolcall", "tool_call", "tooluse", "tool_use"].includes(kind) ||
      (typeof item.name === "string" && item.arguments != null);
    if (isToolCall) {
      cards.push({
        kind: "call",
        name: (item.name as string) ?? "tool",
        args: coerceArgs(item.arguments ?? item.args),
      });
    }
  }

  for (const item of content) {
    const kind = (typeof item.type === "string" ? item.type : "").toLowerCase();
    if (kind !== "toolresult" && kind !== "tool_result") {
      continue;
    }
    const text = extractToolText(item);
    const name = typeof item.name === "string" ? item.name : "tool";
    cards.push({ kind: "result", name, text });
  }

  if (isToolResultMessage(message) && !cards.some((card) => card.kind === "result")) {
    const name =
      (typeof m.toolName === "string" && m.toolName) ||
      (typeof m.tool_name === "string" && m.tool_name) ||
      "tool";
    const text = extractTextCached(message) ?? undefined;
    cards.push({ kind: "result", name, text });
  }

  return cards;
}

/**
 * Pair tool call cards with their result cards by name.
 * Returns merged entries with both args and text when available.
 */
export function pairToolCards(cards: ToolCard[]): ToolCard[] {
  const calls = cards.filter((c) => c.kind === "call");
  const results = cards.filter((c) => c.kind === "result");

  if (calls.length === 0 && results.length === 0) {
    return [];
  }

  // Merge call + result by matching name
  const merged: ToolCard[] = [];
  const usedResults = new Set<number>();

  for (const call of calls) {
    const resultIdx = results.findIndex((r, i) => !usedResults.has(i) && r.name === call.name);
    if (resultIdx >= 0) {
      usedResults.add(resultIdx);
      merged.push({
        kind: "call",
        name: call.name,
        args: call.args,
        text: results[resultIdx].text,
      });
    } else {
      merged.push(call);
    }
  }

  // Add any unmatched results
  for (let i = 0; i < results.length; i++) {
    if (!usedResults.has(i)) {
      merged.push(results[i]);
    }
  }

  return merged;
}

function formatArgsJson(args: unknown): string {
  if (args == null) {
    return "";
  }
  try {
    return typeof args === "string" ? args : JSON.stringify(args, null, 2);
  } catch {
    return typeof args === "string" ? args : JSON.stringify(args);
  }
}

function formatResultJson(text: string | undefined): string {
  if (!text?.trim()) {
    return "";
  }
  const trimmed = text.trim();
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      return JSON.stringify(JSON.parse(trimmed), null, 2);
    } catch {
      return text;
    }
  }
  return text;
}

type ToolStatus = "loading" | "done" | "error";

function detectToolStatus(card: ToolCard, isStreaming = false): ToolStatus {
  // Call without result while actively streaming → loading
  if (card.kind === "call" && !card.text && isStreaming) {
    return "loading";
  }
  // Check for error in result text
  if (card.text?.trim()) {
    const t = card.text.trim();
    if (t.startsWith("{")) {
      try {
        const parsed = JSON.parse(t);
        if (parsed.status === "error" || parsed.error || parsed.Error) {
          return "error";
        }
      } catch {
        // not JSON, not an error
      }
    }
  }
  return "done";
}

function statusIcon(status: ToolStatus) {
  switch (status) {
    case "loading":
      return icons.loadingPyramid;
    case "error":
      return icons.circleAlert;
    default:
      return icons.circleCheckBig;
  }
}

export function renderToolCardCollapsible(card: ToolCard, isStreaming = false) {
  const display = resolveToolDisplay({ name: card.name, args: card.args });
  const argsJson = formatArgsJson(card.args);
  const resultJson = formatResultJson(card.text);
  const hasArgs = Boolean(argsJson.trim());
  const hasResult = Boolean(resultJson.trim());
  const hasDetails = hasArgs || hasResult;
  const status = detectToolStatus(card, isStreaming);
  const isError = status === "error";
  const cardClass = `chat-tool-card ${isError ? "chat-tool-card--error" : ""}`;

  return html`
    <div class="${cardClass}">
      <div class="chat-tool-card__header">
        <div class="chat-tool-card__title">
          <span class="chat-tool-card__status chat-tool-card__status--${status}">${statusIcon(status)}</span>
          <span class="${isError ? "chat-tool-card__name--error" : ""}">${display.label}</span>
        </div>
      </div>
      ${
        hasDetails
          ? html`
          <details class="chat-tool-card__details" ?open=${isError}>
            <summary class="chat-tool-card__summary">
              <span class="chat-tool-card__summary-label">Tool Details</span>
              <span class="chat-tool-card__summary-toggle"></span>
            </summary>
            <div class="chat-tool-card__body">
              ${
                hasArgs
                  ? html`
                  <div class="chat-tool-card__section">
                    <div class="chat-tool-card__section-label">ARGUMENTS</div>
                    <pre class="chat-tool-card__code-block">${argsJson}</pre>
                  </div>
                `
                  : nothing
              }
              ${
                hasResult
                  ? html`
                  <div class="chat-tool-card__section">
                    <div class="chat-tool-card__section-label">RESULT</div>
                    <pre class="chat-tool-card__code-block">${resultJson}</pre>
                  </div>
                `
                  : nothing
              }
            </div>
          </details>
        `
          : nothing
      }
    </div>
  `;
}

function normalizeContent(content: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(content)) {
    return [];
  }
  return content.filter(Boolean) as Array<Record<string, unknown>>;
}

function coerceArgs(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }
  if (!trimmed.startsWith("{") && !trimmed.startsWith("[")) {
    return value;
  }
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function extractToolText(item: Record<string, unknown>): string | undefined {
  if (typeof item.text === "string") {
    return item.text;
  }
  if (typeof item.content === "string") {
    return item.content;
  }
  return undefined;
}

/**
 * Collapsible container para múltiples tool cards.
 * Colapsado: "调用 N 次工具" con iconos apilados.
 * Expandido: lista de tool cards individuales.
 */
export function renderToolCallGroup(cards: ToolCard[], isStreaming = false) {
  if (cards.length === 0) {
    return nothing;
  }

  // Para 1 sola tarjeta, no hace falta grupo
  if (cards.length === 1) {
    return renderToolCardCollapsible(cards[0], isStreaming);
  }

  const count = String(cards.length);
  const hasAnyLoading = cards.some((c) => detectToolStatus(c, isStreaming) === "loading");

  // Construir iconos apilados (máx 4 + "...")
  const MAX_STACKED = 4;
  const visibleCards = cards.slice(0, MAX_STACKED);
  const hasMore = cards.length > MAX_STACKED;

  return html`
    <details class="chat-tool-group">
      <summary class="chat-tool-group__summary">
        <span class="chat-tool-group__icon">
          ${hasAnyLoading ? icons.loadingPyramid : icons.wrench}
        </span>
        <span class="chat-tool-group__text">
          ${t("chatView.toolCallCount", { count })}
        </span>
        <span class="chat-tool-group__stack">
          ${visibleCards.map((card) => {
            const status = detectToolStatus(card, isStreaming);
            return html`
              <span class="chat-tool-group__dot chat-tool-group__dot--${status}">
                ${statusIcon(status)}
              </span>
            `;
          })}
          ${
            hasMore
              ? html`
                  <span class="chat-tool-group__dot chat-tool-group__dot--more">…</span>
                `
              : nothing
          }
        </span>
        <span class="chat-tool-group__toggle"></span>
      </summary>
      <div class="chat-tool-group__list">
        ${cards.map((card) => renderToolCardCollapsible(card, isStreaming))}
      </div>
    </details>
  `;
}
