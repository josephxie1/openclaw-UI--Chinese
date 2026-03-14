import React, { useState } from "react";
import { t } from "../../i18n/index.ts";
import { toSanitizedMarkdownHtml } from "../../lib/markdown.ts";
import { resolveToolDisplay, formatToolDetail } from "../../lib/tool-display.ts";
import type { ToolCard as ToolCardType } from "../../lib/types/chat-types.ts";

// ─── Types ───────────────────────────────────────────────────

type StepStatus = "done" | "loading" | "error";

interface ChainOfThoughtProps {
  toolCards: ToolCardType[];
  isStreaming: boolean;
  reasoning?: string | null;
}

// ─── Status detection ────────────────────────────────────────

function detectStatus(card: ToolCardType, isStreaming: boolean): StepStatus {
  if (card.kind === "call" && !card.text && isStreaming) {
    return "loading";
  }
  if (card.text?.trim()) {
    const txt = card.text.trim();
    if (txt.startsWith("{")) {
      try {
        const parsed = JSON.parse(txt);
        if (parsed.status === "error" || parsed.error || parsed.Error) {
          return "error";
        }
      } catch {
        /* no-op */
      }
    }
  }
  return "done";
}

// ─── Search badge extraction ─────────────────────────────────
// Extrae URLs o dominios de los argumentos para mostrar como badges

function extractSearchBadges(card: ToolCardType): string[] {
  const badges: string[] = [];
  if (!card.args) {
    return badges;
  }

  const args = typeof card.args === "string" ? tryParseJson(card.args) : card.args;

  if (!args || typeof args !== "object") {
    return badges;
  }

  const a = args as Record<string, unknown>;

  // Común: query, url, urls, domain, domains, site
  const urlFields = ["url", "site", "domain"];
  const listFields = ["urls", "domains", "sites"];

  for (const field of urlFields) {
    const val = a[field];
    if (typeof val === "string" && val.trim()) {
      badges.push(extractDomain(val));
    }
  }

  for (const field of listFields) {
    const val = a[field];
    if (Array.isArray(val)) {
      for (const item of val.slice(0, 4)) {
        if (typeof item === "string" && item.trim()) {
          badges.push(extractDomain(item));
        }
      }
    }
  }

  // Para herramientas de búsqueda: extraer dominios del resultado si hay
  if (badges.length === 0 && card.text?.trim()) {
    const urlRegex = /https?:\/\/([^/\s"]+)/g;
    let match;
    const seen = new Set<string>();
    let count = 0;
    while ((match = urlRegex.exec(card.text)) !== null && count < 3) {
      const domain = match[1].replace(/^www\./, "");
      if (!seen.has(domain)) {
        seen.add(domain);
        badges.push(domain);
        count++;
      }
    }
  }

  return badges;
}

function extractDomain(input: string): string {
  try {
    const url = new URL(input.startsWith("http") ? input : `https://${input}`);
    return url.hostname.replace(/^www\./, "");
  } catch {
    return input;
  }
}

function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// ─── Format tool result ─────────────────────────────────────

function formatResultPreview(text: string | undefined): string | null {
  if (!text?.trim()) {
    return null;
  }
  const trimmed = text.trim();
  // Mostrar solo las primeras líneas significativas como preview
  const lines = trimmed.split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) {
    return null;
  }
  const preview = lines.slice(0, 3).join("\n");
  return preview.length > 200 ? preview.slice(0, 197) + "..." : preview;
}

// ─── Icons ───────────────────────────────────────────────────

const BrainIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ─── Status dot icons ────────────────────────────────────────

function StatusDot({ status }: { status: StepStatus }) {
  if (status === "loading") {
    return <span className="cot-step__dot cot-step__dot--loading" />;
  }
  if (status === "error") {
    return (
      <span className="cot-step__dot cot-step__dot--error">
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </span>
    );
  }
  return (
    <span className="cot-step__dot cot-step__dot--done">
      <svg
        width="10"
        height="10"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 6 9 17l-5-5" />
      </svg>
    </span>
  );
}

// ─── Component ───────────────────────────────────────────────

export function ChainOfThought({ toolCards, isStreaming, reasoning }: ChainOfThoughtProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);

  if (toolCards.length === 0 && !reasoning) {
    return null;
  }

  // Contar herramientas activas para el header
  const activeCount = toolCards.filter((c) => detectStatus(c, isStreaming) === "loading").length;
  const totalSteps = toolCards.length;

  const headerLabel =
    activeCount > 0 ? t("chatView.chainOfThoughtActive") : t("chatView.chainOfThought");

  return (
    <div className="cot">
      {/* Header con toggle */}
      <button
        className="cot__header"
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="cot__header-icon">
          <BrainIcon />
        </span>
        <span className="cot__header-label">{headerLabel}</span>
        {totalSteps > 0 && <span className="cot__header-count">{totalSteps}</span>}
        <span className={`cot__header-chevron ${isOpen ? "cot__header-chevron--open" : ""}`}>
          <ChevronIcon />
        </span>
      </button>

      {/* Contenido colapsable */}
      {isOpen && (
        <div className="cot__steps">
          {/* Reasoning integrado dentro del contenedor */}
          {reasoning && (
            <div className="cot-reasoning">
              <button
                className="cot-reasoning__toggle"
                type="button"
                onClick={() => setShowReasoning(!showReasoning)}
              >
                <span className="cot-reasoning__icon">
                  <BrainIcon />
                </span>
                <span className="cot-reasoning__label">
                  {showReasoning ? t("chatView.hideReasoning") : t("chatView.showReasoning")}
                </span>
              </button>
              {showReasoning && (
                <div
                  className="cot-reasoning__content"
                  dangerouslySetInnerHTML={{ __html: toSanitizedMarkdownHtml(reasoning) }}
                />
              )}
            </div>
          )}

          {/* Timeline de herramientas */}
          {toolCards.map((card, index) => (
            <ChainOfThoughtStep
              key={index}
              card={card}
              isStreaming={isStreaming && index === toolCards.length - 1}
              isLast={index === toolCards.length - 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Single Step ─────────────────────────────────────────────

function ChainOfThoughtStep({
  card,
  isStreaming,
  isLast,
}: {
  card: ToolCardType;
  isStreaming: boolean;
  isLast: boolean;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const display = resolveToolDisplay({ name: card.name, args: card.args });
  const status = detectStatus(card, isStreaming);
  // Formato: "label: detail" sin el prefijo "with"
  const detail = formatToolDetail(display);
  const summary = detail ? `${display.label}: ${detail.replace(/^with /, "")}` : display.label;
  const badges = extractSearchBadges(card);
  const resultPreview = formatResultPreview(card.text);
  const isError = status === "error";

  return (
    <div className={`cot-step ${isError ? "cot-step--error" : ""}`}>
      {/* Timeline dot + vertical line */}
      <div className="cot-step__timeline">
        <StatusDot status={status} />
        {!isLast && <div className="cot-step__line" />}
      </div>

      {/* Step content */}
      <div className="cot-step__content">
        <button
          className="cot-step__label"
          type="button"
          onClick={() => setShowDetails(!showDetails)}
        >
          <span className="cot-step__text">{summary}</span>
          {status === "loading" && <span className="cot-step__loading-text">...</span>}
        </button>

        {/* Search badges */}
        {badges.length > 0 && (
          <div className="cot-step__badges">
            {badges.map((badge, i) => (
              <span key={i} className="cot-step__badge">
                {badge}
              </span>
            ))}
          </div>
        )}

        {/* Expandable details */}
        {showDetails && resultPreview && <pre className="cot-step__result">{resultPreview}</pre>}
      </div>
    </div>
  );
}
