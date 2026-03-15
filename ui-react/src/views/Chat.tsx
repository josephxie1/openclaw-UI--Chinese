import { motion } from "framer-motion";
import React, { useEffect, useCallback, useRef, useState } from "react";
// Pure React chat components
import {
  ChatMessageGroup,
  StreamingMessage,
  ReadingIndicator,
} from "../components/chat/ChatMessage.tsx";
import { MarkdownSidebar } from "../components/chat/MarkdownSidebar.tsx";
import { Queue, QueueSection, QueueList, QueueItem } from "../components/chat/Queue.tsx";
import { t } from "../i18n/index.ts";
import { handleSendChat, type ChatHost } from "../lib/app-chat.ts";
import { resolveAssistantAvatarUrl } from "../lib/app-render.ts";
import { handleChatScroll, scheduleChatScroll } from "../lib/app-scroll.ts";
import { highlightCodeBlocks } from "../lib/chat/code-highlight.ts";
import { normalizeMessage } from "../lib/chat/message-normalizer.ts";
import { normalizeRoleForGrouping } from "../lib/chat/message-normalizer.ts";
import { abortChatRun, type ChatState } from "../lib/controllers/chat.ts";
import { loadSessions } from "../lib/controllers/sessions.ts";
import { detectTextDirection } from "../lib/text-direction.ts";
import type { ChatItem, MessageGroup } from "../lib/types/chat-types.ts";
import type { ChatAttachment } from "../lib/ui-types.ts";
import { useAppStore, getReactiveState } from "../store/appStore.ts";

const CloseIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

// ─── Constants ───────────────────────────────────────────────

const CHAT_HISTORY_RENDER_LIMIT = 200;
const COMPACTION_TOAST_DURATION_MS = 5000;
const FALLBACK_TOAST_DURATION_MS = 8000;

// ─── Chat item building (pure functions, no Lit) ─────────────

function messageKey(message: unknown, index: number): string {
  const m = message as Record<string, unknown>;
  const toolCallId = typeof m.toolCallId === "string" ? m.toolCallId : "";
  if (toolCallId) {
    return `tool:${toolCallId}`;
  }
  const id = typeof m.id === "string" ? m.id : "";
  if (id) {
    return `msg:${id}`;
  }
  const messageId = typeof m.messageId === "string" ? m.messageId : "";
  if (messageId) {
    return `msg:${messageId}`;
  }
  const timestamp = typeof m.timestamp === "number" ? m.timestamp : null;
  const role = typeof m.role === "string" ? m.role : "unknown";
  if (timestamp != null) {
    return `msg:${role}:${timestamp}:${index}`;
  }
  return `msg:${role}:${index}`;
}

function groupMessages(items: ChatItem[]): Array<ChatItem | MessageGroup> {
  const result: Array<ChatItem | MessageGroup> = [];
  let currentGroup: MessageGroup | null = null;

  for (const item of items) {
    if (item.kind !== "message") {
      if (currentGroup) {
        result.push(currentGroup);
        currentGroup = null;
      }
      result.push(item);
      continue;
    }
    const normalized = normalizeMessage(item.message);
    const role = normalizeRoleForGrouping(normalized.role);
    const timestamp = normalized.timestamp || Date.now();

    if (!currentGroup || currentGroup.role !== role) {
      if (currentGroup) {
        result.push(currentGroup);
      }
      currentGroup = {
        kind: "group",
        key: `group:${role}:${item.key}`,
        role,
        messages: [{ message: item.message, key: item.key }],
        timestamp,
        isStreaming: false,
      };
    } else {
      currentGroup.messages.push({ message: item.message, key: item.key });
    }
  }
  if (currentGroup) {
    result.push(currentGroup);
  }
  return result;
}

interface BuildChatItemsArgs {
  messages: unknown[];
  toolMessages: unknown[];
  showThinking: boolean;
  stream: string | null;
  streamStartedAt: number | null;
  sessionKey: string;
}

function buildChatItems(args: BuildChatItemsArgs): Array<ChatItem | MessageGroup> {
  const items: ChatItem[] = [];
  const history = Array.isArray(args.messages) ? args.messages : [];
  const tools = Array.isArray(args.toolMessages) ? args.toolMessages : [];
  const historyStart = Math.max(0, history.length - CHAT_HISTORY_RENDER_LIMIT);

  if (historyStart > 0) {
    items.push({
      kind: "message",
      key: "chat:history:notice",
      message: {
        role: "system",
        content: t("chatView.showingLast", {
          limit: String(CHAT_HISTORY_RENDER_LIMIT),
          hidden: String(historyStart),
        }),
        timestamp: Date.now(),
      },
    });
  }

  for (let i = historyStart; i < history.length; i++) {
    const msg = history[i];
    const normalized = normalizeMessage(msg);
    const raw = msg as Record<string, unknown>;
    const marker = raw.__openclaw as Record<string, unknown> | undefined;
    if (marker && marker.kind === "compaction") {
      items.push({
        kind: "divider",
        key:
          typeof marker.id === "string"
            ? `divider:compaction:${marker.id}`
            : `divider:compaction:${normalized.timestamp}:${i}`,
        label: t("chatView.compaction"),
        timestamp: normalized.timestamp ?? Date.now(),
      });
      continue;
    }
    if (!args.showThinking && normalized.role.toLowerCase() === "toolresult") {
      continue;
    }
    items.push({ kind: "message", key: messageKey(msg, i), message: msg });
  }

  // Las herramientas del turno actual van ANTES del texto streaming,
  // porque el agent ejecuta tools primero y luego genera la respuesta final.
  if (args.showThinking) {
    for (let i = 0; i < tools.length; i++) {
      items.push({
        kind: "message",
        key: messageKey(tools[i], i + history.length),
        message: tools[i],
      });
    }
  }

  if (args.stream !== null) {
    const key = `stream:${args.sessionKey}:${args.streamStartedAt ?? "live"}`;
    if (args.stream.trim().length > 0) {
      items.push({
        kind: "stream",
        key,
        text: args.stream,
        startedAt: args.streamStartedAt ?? Date.now(),
      });
    } else {
      items.push({ kind: "reading-indicator", key });
    }
  }

  return groupMessages(items);
}

// ─── Textarea auto-height (computed, drives motion.textarea) ─

const TEXTAREA_LINE_HEIGHT = 20.3;
const TEXTAREA_MAX_LINES = 8;
const TEXTAREA_MAX_HEIGHT = Math.round(TEXTAREA_LINE_HEIGHT * TEXTAREA_MAX_LINES) + 20;
const TEXTAREA_MIN_FOCUSED = 120;
const TEXTAREA_MIN_BLURRED = 40;

function measureTextareaHeight(el: HTMLTextAreaElement, focused: boolean): number {
  // Temporarily reset height to measure natural scroll height
  const prev = el.style.height;
  el.style.height = "auto";
  const scrollH = el.scrollHeight;
  el.style.height = prev;
  const minHeight = focused ? TEXTAREA_MIN_FOCUSED : TEXTAREA_MIN_BLURRED;
  return Math.max(minHeight, Math.min(scrollH, TEXTAREA_MAX_HEIGHT));
}

// ─── Paste handler ───────────────────────────────────────────

function handlePaste(
  e: React.ClipboardEvent<HTMLTextAreaElement>,
  attachments: ChatAttachment[],
  onAttachmentsChange?: (atts: ChatAttachment[]) => void,
) {
  const items = e.nativeEvent.clipboardData?.items;
  if (!items || !onAttachmentsChange) {
    return;
  }

  const imageItems: DataTransferItem[] = [];
  for (let i = 0; i < items.length; i++) {
    if (items[i].type.startsWith("image/")) {
      imageItems.push(items[i]);
    }
  }
  if (imageItems.length === 0) {
    return;
  }

  e.preventDefault();
  for (const item of imageItems) {
    const file = item.getAsFile();
    if (!file) {
      continue;
    }
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      const dataUrl = reader.result as string;
      const newAtt: ChatAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        dataUrl,
        mimeType: file.type,
      };
      onAttachmentsChange([...attachments, newAtt]);
    });
    reader.readAsDataURL(file);
  }
}

// ─── Sub-components ──────────────────────────────────────────

function CompactionIndicator({
  status,
}: {
  status: { active: boolean; completedAt: number | null } | null;
}) {
  if (!status) {
    return null;
  }
  if (status.active) {
    return (
      <div
        className="compaction-indicator compaction-indicator--active"
        role="status"
        aria-live="polite"
      >
        ⟳ {t("chatView.compacting")}
      </div>
    );
  }
  if (status.completedAt) {
    const elapsed = Date.now() - status.completedAt;
    if (elapsed < COMPACTION_TOAST_DURATION_MS) {
      return (
        <div
          className="compaction-indicator compaction-indicator--complete"
          role="status"
          aria-live="polite"
        >
          ✓ {t("chatView.compacted")}
        </div>
      );
    }
  }
  return null;
}

function FallbackIndicator({
  status,
}: {
  status: {
    phase?: "active" | "cleared";
    selected: string;
    active: string;
    previous?: string;
    reason?: string;
    attempts: string[];
    occurredAt: number;
  } | null;
}) {
  if (!status) {
    return null;
  }
  const phase = status.phase ?? "active";
  const elapsed = Date.now() - status.occurredAt;
  if (elapsed >= FALLBACK_TOAST_DURATION_MS) {
    return null;
  }

  const message =
    phase === "cleared"
      ? `${t("chatView.fallbackCleared")} ${status.selected}`
      : `${t("chatView.fallbackActive")} ${status.active}`;
  const className =
    phase === "cleared"
      ? "compaction-indicator compaction-indicator--fallback-cleared"
      : "compaction-indicator compaction-indicator--fallback";

  return (
    <div className={className} role="status" aria-live="polite">
      {message}
    </div>
  );
}

function AttachmentPreview({
  attachments,
  onRemove,
}: {
  attachments: ChatAttachment[];
  onRemove: (id: string) => void;
}) {
  if (attachments.length === 0) {
    return null;
  }
  return (
    <div className="chat-attachments">
      {attachments.map((att) => (
        <div key={att.id} className="chat-attachment">
          <img
            src={att.dataUrl}
            alt={t("chatView.attachmentAlt")}
            className="chat-attachment__img"
          />
          <button
            className="chat-attachment__remove"
            type="button"
            aria-label="Remove attachment"
            onClick={() => onRemove(att.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════
// Main ChatView component — 100% pure React
// ═════════════════════════════════════════════════════════════

export function ChatView() {
  const s = useAppStore;

  // --- Core chat state ---
  const sessionKey = s((st) => st.sessionKey);
  const loading = s((st) => st.chatLoading);
  const sending = s((st) => st.chatSending);
  const chatMessage = s((st) => st.chatMessage);
  const chatMessages = s((st) => st.chatMessages);
  const chatStream = s((st) => st.chatStream);
  const chatStreamStartedAt = s((st) => st.chatStreamStartedAt);
  const chatRunId = s((st) => st.chatRunId);
  const compactionStatus = s((st) => st.compactionStatus);
  const fallbackStatus = s((st) => st.fallbackStatus);
  const chatAvatarUrl = s((st) => st.chatAvatarUrl);
  const chatQueue = s((st) => st.chatQueue);
  const chatAttachments = s((st) => st.chatAttachments);
  const chatNewMessagesBelow = s((st) => st.chatNewMessagesBelow);
  const connected = s((st) => st.connected);
  const settings = s((st) => st.settings);
  const lastError = s((st) => st.lastError);

  // --- Sidebar ---
  const sidebarOpen = s((st) => st.sidebarOpen);
  const sidebarContent = s((st) => st.sidebarContent);
  const sidebarError = s((st) => st.sidebarError);
  const splitRatio = s((st) => st.splitRatio) ?? 0.6;

  // --- Tool stream ---
  const toolStreamById = s((st) => st.toolStreamById);
  const toolStreamOrder = s((st) => st.toolStreamOrder);

  // --- Focus mode ---
  const focusMode = settings.chatFocusMode;

  // --- Assistant identity ---
  const assistantName = s((st) => st.assistantName) ?? "Assistant";
  const assistantAvatar = s((st) => st.assistantAvatar);

  // --- Actions ---
  const applySettings = s((st) => st.applySettings);
  const set = s((st) => st.set);

  const showThinking = settings.chatShowThinking;
  const canAbort = Boolean(chatRunId);
  const isBusy = sending || chatStream !== null;
  const canCompose = connected;

  // --- Resolved avatar ---
  const agentsList = s((st) => st.agentsList);
  const resolvedAvatarUrl = React.useMemo(() => {
    const rs = getReactiveState();
    return chatAvatarUrl ?? resolveAssistantAvatarUrl(rs as never) ?? null;
  }, [chatAvatarUrl, sessionKey, agentsList]);

  // --- Tool messages ---
  const toolMessages = React.useMemo(() => {
    if (!toolStreamOrder || toolStreamOrder.length === 0) {
      return [];
    }
    return toolStreamOrder
      .map((id: string) => (toolStreamById as unknown as Record<string, unknown>)?.[id])
      .filter(Boolean);
  }, [toolStreamById, toolStreamOrder]);

  // --- Build chat items ---
  const chatItems = React.useMemo(
    () =>
      buildChatItems({
        messages: chatMessages,
        toolMessages: toolMessages,
        showThinking,
        stream: chatStream,
        streamStartedAt: chatStreamStartedAt,
        sessionKey,
      }),
    [chatMessages, toolMessages, showThinking, chatStream, chatStreamStartedAt, sessionKey],
  );

  // --- Refs ---
  const threadRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- Textarea height (state-driven for motion) ---
  const [textareaHeight, setTextareaHeight] = useState(TEXTAREA_MIN_BLURRED);
  const [textareaFocused, setTextareaFocused] = useState(false);

  // --- Auto-scroll ---
  useEffect(() => {
    scheduleChatScroll(getReactiveState() as never, false, false);
  }, [chatMessages, chatStream]);

  // --- Highlight code blocks ---
  const themeResolved = s((st) => st.themeResolved);
  useEffect(() => {
    if (threadRef.current) {
      requestAnimationFrame(() => highlightCodeBlocks(threadRef.current));
    }
  }, [chatItems, themeResolved]);

  // --- Assistant identity ---
  const assistantIdentity = React.useMemo(
    () => ({
      name: assistantName,
      avatar: assistantAvatar ?? resolvedAvatarUrl ?? null,
    }),
    [assistantName, assistantAvatar, resolvedAvatarUrl],
  );

  // --- Handlers ---
  const handleSend = useCallback(() => {
    void handleSendChat(getReactiveState() as unknown as ChatHost);
  }, []);

  const handleAbort = useCallback(() => {
    void abortChatRun(getReactiveState() as unknown as ChatState);
  }, []);

  const handleNewSession = useCallback(() => {
    const newKey = `session-${Date.now()}`;
    set({ sessionKey: newKey, chatMessage: "", chatMessages: [], chatStream: null });
    applySettings({ ...settings, sessionKey: newKey, lastActiveSessionKey: newKey });
    void loadSessions(getReactiveState() as never);
  }, [set, applySettings, settings]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key !== "Enter") {
        return;
      }
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return;
      }
      if (e.shiftKey) {
        return;
      }
      if (!connected) {
        return;
      }
      e.preventDefault();
      if (canCompose) {
        handleSend();
      }
    },
    [connected, canCompose, handleSend],
  );

  const handleInput = useCallback(
    (e: React.FormEvent<HTMLTextAreaElement>) => {
      const target = e.target as HTMLTextAreaElement;
      set({ chatMessage: target.value });
      // Recalculate height after value update
      requestAnimationFrame(() => {
        if (target.isConnected) {
          setTextareaHeight(measureTextareaHeight(target, textareaFocused));
        }
      });
    },
    [set, textareaFocused],
  );

  const handleQueueRemove = useCallback(
    (id: string) => {
      const queue = s.getState().chatQueue.filter((q) => q.id !== id);
      set({ chatQueue: queue });
    },
    [set],
  );

  const handleOpenSidebar = useCallback(
    (content: string) => set({ sidebarOpen: true, sidebarContent: content }),
    [set],
  );

  const handleCloseSidebar = useCallback(
    () => set({ sidebarOpen: false, sidebarContent: null }),
    [set],
  );

  const handleToggleFocusMode = useCallback(() => {
    const next = !s.getState().settings.chatFocusMode;
    applySettings({ ...settings, chatFocusMode: next });
  }, [applySettings, settings]);

  const handleScrollToBottom = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (s.getState() as any).scrollToBottom?.({ smooth: true });
  }, []);

  const hasAttachments = (chatAttachments?.length ?? 0) > 0;
  const composePlaceholder = connected
    ? hasAttachments
      ? t("chatView.composePlaceholderAttach")
      : t("chatView.composePlaceholder")
    : t("chatView.composeDisconnected");

  const showSidebar = Boolean(sidebarOpen && handleCloseSidebar);

  return (
    <section className="card chat">
      {/* Disabled / error banners */}
      {!connected && <div className="callout">{t("chat.disconnected")}</div>}
      {lastError && <div className="callout danger">{lastError}</div>}

      {/* Focus mode exit button */}
      {focusMode && (
        <button
          className="chat-focus-exit"
          type="button"
          onClick={handleToggleFocusMode}
          aria-label={t("chatView.exitFocusMode")}
          title={t("chatView.exitFocusMode")}
        >
          ✕
        </button>
      )}

      {/* Main split container */}
      <div className={`chat-split-container${showSidebar ? " chat-split-container--open" : ""}`}>
        <div
          className="chat-main"
          style={{ flex: showSidebar ? `0 0 ${splitRatio * 100}%` : "1 1 100%" }}
          ref={threadRef}
          onScroll={(e) => handleChatScroll(getReactiveState() as never, e.nativeEvent)}
        >
          {/* Message thread */}
          <div className="chat-thread" role="log" aria-live="polite">
            {loading && <div className="muted">{t("chatView.loadingChat")}</div>}

            {chatItems.map((item) => {
              if (item.kind === "divider") {
                return (
                  <div
                    key={item.key}
                    className="chat-divider"
                    role="separator"
                    data-ts={String(item.timestamp)}
                  >
                    <span className="chat-divider__line" />
                    <span className="chat-divider__label">{item.label}</span>
                    <span className="chat-divider__line" />
                  </div>
                );
              }

              if (item.kind === "reading-indicator") {
                return <ReadingIndicator key={item.key} assistant={assistantIdentity} />;
              }

              if (item.kind === "stream") {
                return (
                  <StreamingMessage
                    key={item.key}
                    text={item.text}
                    startedAt={item.startedAt}
                    onOpenSidebar={handleOpenSidebar}
                    assistant={assistantIdentity}
                  />
                );
              }

              if (item.kind === "group") {
                return (
                  <ChatMessageGroup
                    key={item.key}
                    group={item}
                    showReasoning={showThinking}
                    assistantName={assistantName}
                    assistantAvatar={assistantIdentity.avatar}
                    onOpenSidebar={handleOpenSidebar}
                  />
                );
              }

              return null;
            })}
          </div>
        </div>

        {/* Sidebar */}
        {showSidebar && (
          <div className="chat-sidebar">
            <MarkdownSidebar
              content={sidebarContent ?? null}
              error={sidebarError ?? null}
              onClose={handleCloseSidebar}
              onViewRawText={() => {
                if (sidebarContent) {
                  handleOpenSidebar(`\`\`\`\n${sidebarContent}\n\`\`\``);
                }
              }}
            />
          </div>
        )}
      </div>

      {/* Indicators */}
      <FallbackIndicator status={fallbackStatus as never} />
      <CompactionIndicator status={compactionStatus as never} />

      {/* New messages */}
      {chatNewMessagesBelow && (
        <button className="btn chat-new-messages" type="button" onClick={handleScrollToBottom}>
          New messages ↓
        </button>
      )}

      {/* Compose area */}
      <div className="chat-compose">
        {/* Queue (dentro de compose para alinear ancho) */}
        {chatQueue.length > 0 && (
          <Queue>
            <QueueSection label={t("shared.queued")} count={chatQueue.length}>
              <QueueList>
                {chatQueue.map((item) => (
                  <QueueItem
                    key={item.id}
                    actions={
                      <button
                        type="button"
                        aria-label={t("chatView.removeQueued")}
                        onClick={() => handleQueueRemove(item.id)}
                      >
                        <CloseIcon />
                      </button>
                    }
                  >
                    {item.text ||
                      (item.attachments?.length
                        ? `${t("shared.image")} (${item.attachments.length})`
                        : "")}
                  </QueueItem>
                ))}
              </QueueList>
            </QueueSection>
          </Queue>
        )}
        <AttachmentPreview
          attachments={chatAttachments ?? []}
          onRemove={(id) => {
            const next = (chatAttachments ?? []).filter((a) => a.id !== id);
            set({ chatAttachments: next });
          }}
        />
        <div className="chat-compose__row">
          <label className="field chat-compose__field">
            <span>{t("chatView.message")}</span>
            <motion.textarea
              ref={textareaRef}
              value={chatMessage}
              dir={detectTextDirection(chatMessage)}
              disabled={!connected}
              onKeyDown={handleKeyDown}
              onInput={handleInput}
              onFocus={() => {
                setTextareaFocused(true);
                if (textareaRef.current) {
                  setTextareaHeight(measureTextareaHeight(textareaRef.current, true));
                }
              }}
              onBlur={() => {
                setTextareaFocused(false);
                if (textareaRef.current) {
                  setTextareaHeight(measureTextareaHeight(textareaRef.current, false));
                }
              }}
              onPaste={(e) =>
                handlePaste(e, chatAttachments ?? [], (next) => set({ chatAttachments: next }))
              }
              placeholder={composePlaceholder}
              animate={{ height: textareaHeight }}
              transition={{ type: "tween", duration: 0.2, ease: "easeOut" }}
              style={{ overflow: textareaHeight >= TEXTAREA_MAX_HEIGHT ? "auto" : "hidden" }}
            />
          </label>
          <div className="chat-compose__actions">
            <button
              className="btn"
              disabled={!connected || (!canAbort && sending)}
              onClick={canAbort ? handleAbort : handleNewSession}
            >
              {canAbort ? t("chatView.stop") : t("chatView.newSession")}
            </button>
            <button className="btn primary" disabled={!connected} onClick={handleSend}>
              {isBusy ? t("chatView.queue") : t("chatView.send")}
              <kbd className="btn-kbd">↵</kbd>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
