import React, { type ReactNode } from "react";
import { t } from "../../i18n/index.ts";
import { resolveToolDisplay } from "../../lib/tool-display.ts";
import type { ToolCard as ToolCardType } from "../../lib/types/chat-types.ts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./primitives/Collapsible.tsx";
import { ToolCard } from "./ToolCard.tsx";

// ─── Types ───────────────────────────────────────────────────

export interface ToolCallGroupProps {
  cards: ToolCardType[];
  isStreaming?: boolean;
  defaultOpen?: boolean;
}

// ─── Component ───────────────────────────────────────────────
// Grupo colapsable de tool cards, mostrando un resumen con iconos
// cuando está cerrado y los tool cards individuales cuando está abierto.

export function ToolCallGroup({
  cards,
  isStreaming = false,
  defaultOpen = false,
}: ToolCallGroupProps) {
  if (cards.length === 0) {
    return null;
  }

  // Si solo hay 1 tool card, renderizarla directamente
  if (cards.length === 1) {
    return <ToolCard card={cards[0]} isStreaming={isStreaming} />;
  }

  const count = cards.length;
  const iconElements: ReactNode[] = [];
  const maxIcons = 4;

  for (let i = 0; i < Math.min(count, maxIcons); i++) {
    const display = resolveToolDisplay({ name: cards[i].name, args: cards[i].args });
    iconElements.push(
      <span key={i} className="chat-tool-group__icon">
        {display.title.charAt(0)}
      </span>,
    );
  }

  return (
    <Collapsible className="chat-tool-group" defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="chat-tool-group__summary">
        <span className="chat-tool-group__icons">{iconElements}</span>
        <span className="chat-tool-group__label">
          {t("chatView.toolCallCount", { count: String(count) })}
        </span>
        <span className="chat-tool-group__chevron">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="chat-tool-group__content">
        {cards.map((card, i) => (
          <ToolCard key={i} card={card} isStreaming={isStreaming} />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}
