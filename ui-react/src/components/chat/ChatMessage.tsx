import React from "react";
import type { AssistantIdentity } from "../../lib/assistant-identity.ts";
import {
  extractTextCached,
  extractThinkingCached,
  formatReasoningMarkdown,
} from "../../lib/chat/message-extract.ts";
import {
  isToolResultMessage,
  normalizeRoleForGrouping,
} from "../../lib/chat/message-normalizer.ts";
import { extractToolCards, pairToolCards } from "../../lib/chat/tool-cards.ts";
import { avatarFromName } from "../../lib/helpers/multiavatar.ts";
import { toSanitizedMarkdownHtml, toSanitizedMarkdownHtmlBlocks } from "../../lib/markdown.ts";
import { openExternalUrlSafe } from "../../lib/open-external-url.ts";
import { detectTextDirection } from "../../lib/text-direction.ts";
import type { MessageGroup } from "../../lib/types/chat-types.ts";
import { ChainOfThought } from "./ChainOfThought.tsx";
import { CopyButton } from "./CopyButton.tsx";
import { TaskStepList } from "./TaskStepList.tsx";

// ─── Image extraction ────────────────────────────────────────

type ImageBlock = { url: string; alt?: string };

function extractImages(message: unknown): ImageBlock[] {
  const m = message as Record<string, unknown>;
  const content = m.content;
  const images: ImageBlock[] = [];
  if (!Array.isArray(content)) {
    return images;
  }

  for (const block of content) {
    if (typeof block !== "object" || block === null) {
      continue;
    }
    const b = block as Record<string, unknown>;
    if (b.type === "image") {
      const source = b.source as Record<string, unknown> | undefined;
      if (source?.type === "base64" && typeof source.data === "string") {
        const data = source.data;
        const mediaType = (source.media_type as string) || "image/png";
        const url = data.startsWith("data:") ? data : `data:${mediaType};base64,${data}`;
        images.push({ url });
      } else if (typeof b.url === "string") {
        images.push({ url: b.url });
      }
    } else if (b.type === "image_url") {
      const imageUrl = b.image_url as Record<string, unknown> | undefined;
      if (typeof imageUrl?.url === "string") {
        images.push({ url: imageUrl.url });
      }
    }
  }
  return images;
}

function isAvatarUrl(value: string): boolean {
  return /^https?:\/\//i.test(value) || /^data:image\//i.test(value) || value.startsWith("/");
}

// ─── Avatar ──────────────────────────────────────────────────

function Avatar({
  role,
  assistant,
}: {
  role: string;
  assistant?: Pick<AssistantIdentity, "name" | "avatar">;
}) {
  const normalized = normalizeRoleForGrouping(role);
  const assistantName = assistant?.name?.trim() || "Assistant";
  const assistantAvatar = assistant?.avatar?.trim() || "";
  const initial =
    normalized === "user"
      ? "U"
      : normalized === "assistant"
        ? assistantName.charAt(0).toUpperCase() || "A"
        : "?";
  const className =
    normalized === "user" ? "user" : normalized === "assistant" ? "assistant" : "other";

  if (assistantAvatar && normalized === "assistant" && isAvatarUrl(assistantAvatar)) {
    return <img className={`chat-avatar ${className}`} src={assistantAvatar} alt={assistantName} />;
  }

  if (normalized === "assistant") {
    const defaultAvatar = avatarFromName(assistantName);
    return <img className={`chat-avatar ${className}`} src={defaultAvatar} alt={assistantName} />;
  }

  return <div className={`chat-avatar ${className}`}>{initial}</div>;
}

// ─── Message Images ──────────────────────────────────────────

function MessageImages({ images }: { images: ImageBlock[] }) {
  if (images.length === 0) {
    return null;
  }
  return (
    <div className="chat-message-images">
      {images.map((img, i) => (
        <img
          key={i}
          src={img.url}
          alt={img.alt ?? "Attached image"}
          className="chat-message-image"
          onClick={() => openExternalUrlSafe(img.url, { allowDataImage: true })}
        />
      ))}
    </div>
  );
}

// ─── Thinking Panel ──────────────────────────────────────────

function ThinkingPanel({ markdown }: { markdown: string }) {
  const firstLine =
    markdown
      .trim()
      .split("\n")
      .find((l) => l.trim().length > 0)
      ?.trim() ?? "Thinking";
  const label = firstLine.length > 60 ? firstLine.slice(0, 57) + "..." : firstLine;
  const htmlContent = toSanitizedMarkdownHtml(markdown);

  return (
    <details className="chat-thinking-panel">
      <summary className="chat-thinking-panel__trigger">
        <span className="chat-thinking-panel__icon">
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
        </span>
        <span className="chat-thinking-panel__label">{label}</span>
        <span className="chat-thinking-panel__toggle" />
      </summary>
      <div
        className="chat-thinking-panel__content"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </details>
  );
}

// ─── Single Message Bubble ───────────────────────────────────

function MessageBubble({
  message,
  isStreaming,
  showReasoning,
  onOpenSidebar: _onOpenSidebar,
  skipToolCards = false,
  skipThinking = false,
}: {
  message: unknown;
  isStreaming: boolean;
  showReasoning: boolean;
  onOpenSidebar?: (content: string) => void;
  skipToolCards?: boolean;
  skipThinking?: boolean;
}) {
  const m = message as Record<string, unknown>;
  const role = typeof m.role === "string" ? m.role : "unknown";
  const isToolResult =
    isToolResultMessage(message) ||
    role.toLowerCase() === "toolresult" ||
    role.toLowerCase() === "tool_result" ||
    typeof m.toolCallId === "string" ||
    typeof m.tool_call_id === "string";

  const toolCards = extractToolCards(message);
  const hasToolCards = toolCards.length > 0;
  const images = extractImages(message);
  const hasImages = images.length > 0;

  const extractedText = extractTextCached(message);
  const extractedThinking =
    showReasoning && role === "assistant" && !skipThinking ? extractThinkingCached(message) : null;
  const markdown = extractedText?.trim() ? extractedText : null;
  const reasoningMarkdown = extractedThinking ? formatReasoningMarkdown(extractedThinking) : null;
  const canCopyMarkdown = role === "assistant" && Boolean(markdown?.trim());

  const bubbleClasses = [
    "chat-bubble",
    canCopyMarkdown ? "has-copy" : "",
    isStreaming ? "streaming" : "",
    "fade-in",
  ]
    .filter(Boolean)
    .join(" ");

  // Cuando el padre maneja las tool cards, los mensajes de solo tools se omiten
  if (skipToolCards && hasToolCards && isToolResult) {
    return null;
  }

  // Mensajes de solo tool_use sin texto: omitir si padre las maneja
  if (skipToolCards && hasToolCards && !markdown && !hasImages) {
    return null;
  }

  // Si NO se omiten tools, renderizar como ChainOfThought individual (fallback)
  if (!skipToolCards && hasToolCards && isToolResult) {
    const paired = pairToolCards(toolCards);
    return <ChainOfThought toolCards={paired} isStreaming={isStreaming} />;
  }

  if (!skipToolCards && hasToolCards && !markdown && !hasImages) {
    return <ChainOfThought toolCards={pairToolCards(toolCards)} isStreaming={isStreaming} />;
  }

  if (!markdown && !hasToolCards && !hasImages) {
    return null;
  }

  return (
    <div className={bubbleClasses}>
      <MessageImages images={images} />
      {reasoningMarkdown && <ThinkingPanel markdown={reasoningMarkdown} />}
      {markdown && (
        <div
          className={`chat-text${canCopyMarkdown ? " has-copy" : ""}`}
          dir={detectTextDirection(markdown)}
        >
          {canCopyMarkdown && <CopyButton text={markdown} />}
          <div dangerouslySetInnerHTML={{ __html: toSanitizedMarkdownHtmlBlocks(markdown) }} />
        </div>
      )}
      {!skipToolCards && pairToolCards(toolCards).length > 0 && (
        <ChainOfThought toolCards={pairToolCards(toolCards)} isStreaming={isStreaming} />
      )}
    </div>
  );
}

// ─── Reading Indicator ───────────────────────────────────────

export function ReadingIndicator({ assistant }: { assistant?: AssistantIdentity }) {
  return (
    <div className="chat-group assistant">
      <Avatar role="assistant" assistant={assistant} />
      <div className="chat-group-messages">
        <div className="chat-bubble chat-reading-indicator" aria-hidden="true">
          <span className="chat-reading-indicator__dots">
            <span />
            <span />
            <span />
          </span>
        </div>
      </div>
    </div>
  );
}

// ─── Streaming Group ─────────────────────────────────────────

export function StreamingMessage({
  text,
  startedAt,
  onOpenSidebar,
  assistant,
}: {
  text: string;
  startedAt: number;
  onOpenSidebar?: (content: string) => void;
  assistant?: AssistantIdentity;
}) {
  const timestamp = new Date(startedAt).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
  const name = assistant?.name ?? "Assistant";

  return (
    <div className="chat-group assistant">
      <Avatar role="assistant" assistant={assistant} />
      <div className="chat-group-messages">
        <div className="chat-group-header">
          <span className="chat-sender-name">{name}</span>
          <span className="chat-group-timestamp">{timestamp}</span>
        </div>
        <MessageBubble
          message={{ role: "assistant", content: [{ type: "text", text }], timestamp: startedAt }}
          isStreaming={true}
          showReasoning={false}
          onOpenSidebar={onOpenSidebar}
        />
      </div>
    </div>
  );
}

// ─── Message Group ───────────────────────────────────────────

export function ChatMessageGroup({
  group,
  showReasoning,
  assistantName = "Assistant",
  assistantAvatar,
  onOpenSidebar,
}: {
  group: MessageGroup;
  showReasoning: boolean;
  assistantName?: string;
  assistantAvatar?: string | null;
  onOpenSidebar?: (content: string) => void;
}) {
  const normalizedRole = normalizeRoleForGrouping(group.role);
  const who =
    normalizedRole === "user"
      ? "You"
      : normalizedRole === "assistant"
        ? assistantName
        : normalizedRole;
  const roleClass =
    normalizedRole === "user" ? "user" : normalizedRole === "assistant" ? "assistant" : "other";
  const timestamp = new Date(group.timestamp).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });

  // Detectar si el grupo tiene task segments para renderizar TaskStepList
  const hasTaskSegments = normalizedRole === "assistant" && groupHasTaskProgress(group);

  // Recopilar TODAS las tool cards del grupo para un único ChainOfThought
  const isAssistant = normalizedRole === "assistant";
  const allToolCards = isAssistant ? collectGroupToolCards(group) : [];
  const hasGroupToolCards = allToolCards.length > 0;

  // Recopilar reasoning de todos los mensajes del grupo para ChainOfThought
  const groupReasoning = isAssistant && hasGroupToolCards ? collectGroupReasoning(group) : null;

  return (
    <div className={`chat-group ${roleClass}`}>
      <Avatar
        role={group.role}
        assistant={{ name: assistantName, avatar: assistantAvatar ?? null }}
      />
      <div className="chat-group-messages">
        <div className="chat-group-header">
          <span className="chat-sender-name">{who}</span>
          <span className="chat-group-timestamp">{timestamp}</span>
        </div>
        {hasTaskSegments ? (
          <TaskStepList group={group} isStreaming={group.isStreaming} />
        ) : (
          <>
            {group.messages.map((item, index) => (
              <MessageBubble
                key={index}
                message={item.message}
                isStreaming={group.isStreaming && index === group.messages.length - 1}
                showReasoning={showReasoning}
                onOpenSidebar={onOpenSidebar}
                skipToolCards={hasGroupToolCards}
                skipThinking={hasGroupToolCards}
              />
            ))}
            {/* Un único ChainOfThought para TODAS las tool cards + reasoning del grupo */}
            {hasGroupToolCards && (
              <ChainOfThought
                toolCards={allToolCards}
                isStreaming={group.isStreaming}
                reasoning={groupReasoning}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function groupHasTaskProgress(group: MessageGroup): boolean {
  for (const item of group.messages) {
    const m = item.message as Record<string, unknown>;
    const content = m.content;
    if (!Array.isArray(content)) {
      continue;
    }
    for (const block of content) {
      if (typeof block !== "object" || block === null) {
        continue;
      }
      const b = block as Record<string, unknown>;
      if (b.type === "tool_use" && b.name === "task_progress") {
        return true;
      }
    }
  }
  return false;
}

// Recopilar y emparejar tool cards de todos los mensajes del grupo
function collectGroupToolCards(group: MessageGroup) {
  const allCards = [];
  for (const item of group.messages) {
    const cards = extractToolCards(item.message);
    allCards.push(...cards);
  }
  return pairToolCards(allCards);
}

// Recopilar reasoning de todos los mensajes del grupo
function collectGroupReasoning(group: MessageGroup): string | null {
  const parts: string[] = [];
  for (const item of group.messages) {
    const thinking = extractThinkingCached(item.message);
    if (thinking) {
      parts.push(formatReasoningMarkdown(thinking));
    }
  }
  return parts.length > 0 ? parts.join("\n\n") : null;
}
