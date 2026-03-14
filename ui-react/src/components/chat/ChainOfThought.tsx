import React, { useState } from "react";
import { t } from "../../i18n/index.ts";
import type { IconName } from "../../lib/icons.ts";
import { toSanitizedMarkdownHtml } from "../../lib/markdown.ts";
import { resolveToolDisplay, formatToolDetail } from "../../lib/tool-display.ts";
import type { ToolCard as ToolCardType } from "../../lib/types/chat-types.ts";
import { ApprovalCard, parseLobsterApproval } from "./ApprovalCard.tsx";

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

  // Extraer dominios del resultado si no hay URLs en args
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

// ─── Status dot ──────────────────────────────────────────────

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

// ─── Tool icon (React SVG) ───────────────────────────────────
// Mapa de IconName → SVG paths para React

const TOOL_ICON_PATHS: Record<string, React.ReactNode> = {
  wrench: (
    <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
      <path d="M2 12h20" />
    </>
  ),
  fileText: (
    <>
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
    </>
  ),
  edit: (
    <>
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </>
  ),
  penLine: (
    <>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </>
  ),
  paperclip: (
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </>
  ),
  monitor: (
    <>
      <rect width="20" height="14" x="2" y="3" rx="2" />
      <line x1="8" x2="16" y1="21" y2="21" />
      <line x1="12" x2="12" y1="17" y2="21" />
    </>
  ),
  messageSquare: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  plug: (
    <>
      <path d="M12 22v-5" />
      <path d="M9 8V2" />
      <path d="M15 8V2" />
      <path d="M18 8v5a4 4 0 0 1-4 4h-4a4 4 0 0 1-4-4V8Z" />
    </>
  ),
  settings: (
    <>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  brain: (
    <>
      <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
      <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
      <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    </>
  ),
  smartphone: (
    <>
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </>
  ),
  puzzle: (
    <path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.076.874.54 1.02 1.02a2.5 2.5 0 1 0 3.237-3.237c-.48-.146-.944-.505-1.02-1.02a.98.98 0 0 1 .303-.917l1.526-1.526A2.402 2.402 0 0 1 11.998 2c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.236 3.236c-.464.18-.894.527-.967 1.02Z" />
  ),
  book: <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />,
  barChart: (
    <>
      <line x1="12" x2="12" y1="20" y2="10" />
      <line x1="18" x2="18" y1="20" y2="4" />
      <line x1="6" x2="6" y1="20" y2="16" />
    </>
  ),
  folder: (
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
  ),
  image: (
    <>
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </>
  ),
  zap: <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />,
  circle: <circle cx="12" cy="12" r="10" />,
};

function ToolIcon({ name }: { name: IconName }) {
  const paths = TOOL_ICON_PATHS[name] ?? TOOL_ICON_PATHS.puzzle;
  return (
    <svg
      className="cot-step__tool-icon"
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths}
    </svg>
  );
}

// ─── Component ───────────────────────────────────────────────

export function ChainOfThought({ toolCards, isStreaming, reasoning }: ChainOfThoughtProps) {
  const [isOpen, setIsOpen] = useState(true);
  const [showReasoning, setShowReasoning] = useState(false);

  if (toolCards.length === 0 && !reasoning) {
    return null;
  }

  const activeCount = toolCards.filter((c) => detectStatus(c, isStreaming) === "loading").length;
  const totalSteps = toolCards.length;

  const headerLabel =
    activeCount > 0 ? t("chatView.chainOfThoughtActive") : t("chatView.chainOfThought");

  return (
    <div className="cot">
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

      {isOpen && (
        <div className="cot__steps">
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
  const detail = formatToolDetail(display);
  const summary = detail ? `${display.label}: ${detail.replace(/^with /, "")}` : display.label;
  const badges = extractSearchBadges(card);
  const resultPreview = formatResultPreview(card.text);
  const isError = status === "error";

  return (
    <div className={`cot-step ${isError ? "cot-step--error" : ""}`}>
      <div className="cot-step__timeline">
        <StatusDot status={status} />
        {!isLast && <div className="cot-step__line" />}
      </div>

      <div className="cot-step__content">
        <button
          className="cot-step__label"
          type="button"
          onClick={() => setShowDetails(!showDetails)}
        >
          <ToolIcon name={display.icon} />
          <span className="cot-step__text">{summary}</span>
          {status === "loading" && <span className="cot-step__loading-text">...</span>}
        </button>

        {badges.length > 0 && (
          <div className="cot-step__badges">
            {badges.map((badge, i) => (
              <span key={i} className="cot-step__badge">
                {badge}
              </span>
            ))}
          </div>
        )}

        {showDetails && resultPreview && <pre className="cot-step__result">{resultPreview}</pre>}

        {/* Lobster workflow approval UI */}
        {(() => {
          const approval = parseLobsterApproval(card.text);
          if (!approval) {
            return null;
          }
          return (
            <ApprovalCard
              state={approval.state}
              data={approval.data}
              onApprove={(token) => {
                // TODO: conectar con WebSocket para enviar lobster resume
                console.log("approve", token);
              }}
              onReject={(token) => {
                // TODO: conectar con WebSocket para enviar lobster resume deny
                console.log("reject", token);
              }}
            />
          );
        })()}
      </div>
    </div>
  );
}
