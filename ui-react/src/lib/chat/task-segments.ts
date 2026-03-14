/**
 * Task segment extraction from assistant message groups.
 *
 * Splits a group of assistant messages into "task segments" where each
 * text block (or task_progress tool call) acts as a task header and
 * subsequent tool calls are its children.
 *
 * Supports two modes:
 * 1. Explicit: agent calls task_progress tool → uses step/status args directly
 * 2. Implicit: detects text-then-tools pattern → extracts label from text
 */

import type { ToolCard } from "../types/chat-types.ts";
import type { MessageGroup } from "../types/chat-types.ts";
import { extractTextCached } from "./message-extract.ts";
import { extractToolCards, pairToolCards } from "./tool-cards.ts";

export type TaskSegment = {
  label: string;
  text: string;
  toolCards: ToolCard[];
  status: "done" | "loading" | "error";
  timestamp: number;
  textMessage: unknown;
  /** Si true, el segmento fue creado por un task_progress tool call explícito */
  explicit: boolean;
};

// Prefijos conversacionales que se eliminan al extraer la etiqueta
const STRIP_PREFIXES = [
  /^让我/,
  /^首先[，,]?\s*/,
  /^接下来[，,]?\s*/,
  /^然后[，,]?\s*/,
  /^现在[，,]?\s*/,
  /^我来/,
  /^我先/,
  /^我需要/,
  /^好[的，,]?\s*/,
  /^下一步[，,]?\s*/,
  /^Let me\s+/i,
  /^Now\s+/i,
  /^Next[,]?\s+/i,
  /^First[,]?\s+/i,
  /^I'll\s+/i,
  /^I will\s+/i,
];

const MAX_LABEL_LENGTH = 50;

export function extractTaskLabel(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) {
    return "";
  }

  // 1. Heading markdown
  const headingMatch = trimmed.match(/^#{1,3}\s+(.+)/m);
  if (headingMatch) {
    return headingMatch[1].trim().slice(0, MAX_LABEL_LENGTH);
  }

  // 2. Texto en negrita al inicio
  const boldMatch = trimmed.match(/^\*\*(.+?)\*\*/);
  if (boldMatch) {
    return boldMatch[1].trim().slice(0, MAX_LABEL_LENGTH);
  }

  // 3. Primera línea significativa
  const firstLine = trimmed
    .split("\n")
    .map((l) => l.trim())
    .find((l) => l.length > 0);
  if (!firstLine) {
    return "";
  }

  let label = firstLine;
  for (const re of STRIP_PREFIXES) {
    label = label.replace(re, "");
  }
  label = label.trim();

  // Limpiar markdown residual
  label = label.replace(/^[#*`]+\s*/, "").replace(/[*`]+$/, "");
  label = label.replace(/[…。：:，,]+$/, "").trim();

  if (label.length > MAX_LABEL_LENGTH) {
    label = label.slice(0, MAX_LABEL_LENGTH - 1) + "…";
  }

  return label;
}

function messageTimestamp(message: unknown): number {
  const m = message as Record<string, unknown>;
  return typeof m.timestamp === "number" ? m.timestamp : Date.now();
}

/**
 * Detectar task_progress tool calls en los content items de un mensaje.
 * Retorna la info del step si se encuentra, o null.
 */
function detectTaskProgressCall(message: unknown): { step: string; status: string } | null {
  const m = message as Record<string, unknown>;
  const content = m.content;
  if (!Array.isArray(content)) {
    return null;
  }

  for (const item of content) {
    const block = item as Record<string, unknown>;
    const type = (typeof block.type === "string" ? block.type : "").toLowerCase();

    // Detectar tool_use/tool_call con name=task_progress
    const isToolUse = ["toolcall", "tool_call", "tooluse", "tool_use"].includes(type);
    const name = typeof block.name === "string" ? block.name : "";
    if (isToolUse && name === "task_progress") {
      const args = (block.arguments ?? block.args ?? {}) as Record<string, unknown>;
      const step = typeof args.step === "string" ? args.step : "";
      const status = typeof args.status === "string" ? args.status : "in_progress";
      if (step) {
        return { step, status };
      }
    }
  }

  return null;
}

/**
 * Extraer segmentos de tarea de un grupo de mensajes del asistente.
 * Retorna null si el grupo no tiene el patrón de task steps.
 */
export function extractTaskSegments(group: MessageGroup): TaskSegment[] | null {
  if (group.messages.length < 2) {
    return null;
  }

  const segments: TaskSegment[] = [];
  let currentSegment: TaskSegment | null = null;

  for (const item of group.messages) {
    const text = extractTextCached(item.message)?.trim() ?? "";
    const toolCards = extractToolCards(item.message);
    const hasTools = toolCards.length > 0;
    const hasText = text.length > 0;

    // Detectar task_progress como fuente explícita de segmentos
    const taskProgress = detectTaskProgressCall(item.message);

    if (taskProgress) {
      // task_progress tool call → nuevo segmento explícito
      if (currentSegment) {
        segments.push(currentSegment);
      }
      // Filtrar el task_progress de los tool cards (no mostrarlo como tool card normal)
      const filteredCards = pairToolCards(toolCards.filter((c) => c.name !== "task_progress"));
      currentSegment = {
        label: taskProgress.step,
        text: "",
        toolCards: filteredCards,
        status:
          taskProgress.status === "error"
            ? "error"
            : taskProgress.status === "done"
              ? "done"
              : "loading",
        timestamp: messageTimestamp(item.message),
        textMessage: null,
        explicit: true,
      };
    } else if (hasText && !hasTools) {
      // Bloque de texto puro → nuevo segmento implícito
      if (currentSegment) {
        segments.push(currentSegment);
      }
      currentSegment = {
        label: extractTaskLabel(text),
        text,
        toolCards: [],
        status: "done",
        timestamp: messageTimestamp(item.message),
        textMessage: item.message,
        explicit: false,
      };
    } else if (hasTools) {
      // Bloque con tool calls
      const paired = pairToolCards(toolCards.filter((c) => c.name !== "task_progress"));

      if (!currentSegment) {
        currentSegment = {
          label: "",
          text: hasText ? text : "",
          toolCards: paired,
          status: "done",
          timestamp: messageTimestamp(item.message),
          textMessage: hasText ? item.message : null,
          explicit: false,
        };
      } else {
        currentSegment.toolCards.push(...paired);
        if (hasText && !currentSegment.text) {
          currentSegment.text = text;
        }
      }
    }
  }

  if (currentSegment) {
    segments.push(currentSegment);
  }

  // Solo crear task UI cuando hay segmentos con tool calls
  const segmentsWithTools = segments.filter((s) => s.toolCards.length > 0);
  if (segmentsWithTools.length < 1) {
    return null;
  }

  // Calcular estado de segmentos implícitos basándose en tool cards
  for (const seg of segments) {
    // Segmentos explícitos ya tienen status del task_progress call
    if (seg.explicit) {
      continue;
    }

    if (seg.toolCards.length === 0) {
      seg.status = "done";
      continue;
    }
    const hasError = seg.toolCards.some((c) => {
      const t = c.text?.trim();
      if (!t) {
        return false;
      }
      if (t.startsWith("{")) {
        try {
          const parsed = JSON.parse(t);
          return parsed.status === "error" || parsed.error || parsed.Error;
        } catch {
          return false;
        }
      }
      return false;
    });
    const allHaveResults = seg.toolCards.every(
      (c) => c.kind === "result" || (c.kind === "call" && c.text != null),
    );
    if (hasError) {
      seg.status = "error";
    } else if (!allHaveResults) {
      seg.status = "loading";
    } else {
      seg.status = "done";
    }
  }

  return segments;
}
