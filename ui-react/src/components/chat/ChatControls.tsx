import React, { useCallback } from "react";
import { useAppStore, getReactiveState } from "../../store/appStore.ts";
import { t } from "../../i18n/index.ts";
import { refreshChat } from "../../lib/app-chat.ts";
import { loadChatHistory, type ChatState } from "../../lib/controllers/chat.ts";
import { syncUrlWithSessionKey } from "../../lib/app-settings.ts";
import { loadAssistantIdentity } from "../../lib/controllers/assistant-identity.ts";
import {
  resolveMainSessionKey,
  resolveSessionOptions,
  countHiddenCronSessions,
} from "../../lib/app-render.helpers.ts";
import type { DropdownItem } from "./SessionDropdown.tsx";
import { SessionDropdown } from "./SessionDropdown.tsx";

// ─── Icons (inline SVGs matching original) ───────────────────

const RefreshIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
    <path d="M21 3v5h-5" />
  </svg>
);

const FocusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 7V4h3" /><path d="M20 7V4h-3" />
    <path d="M4 17v3h3" /><path d="M20 17v3h-3" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const BrainIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 5a3 3 0 1 0-5.997.125 4 4 0 0 0-2.526 5.77 4 4 0 0 0 .556 6.588A4 4 0 1 0 12 18Z" />
    <path d="M12 5a3 3 0 1 1 5.997.125 4 4 0 0 1 2.526 5.77 4 4 0 0 1-.556 6.588A4 4 0 1 1 12 18Z" />
    <path d="M15 13a4.5 4.5 0 0 1-3-4 4.5 4.5 0 0 1-3 4" />
    <path d="M17.599 6.5a3 3 0 0 0 .399-1.375" />
    <path d="M6.003 5.125A3 3 0 0 0 6.401 6.5" />
    <path d="M3.477 10.896a4 4 0 0 1 .585-.396" />
    <path d="M19.938 10.5a4 4 0 0 1 .585.396" />
    <path d="M6 18a4 4 0 0 1-1.967-.516" />
    <path d="M19.967 17.484A4 4 0 0 1 18 18" />
  </svg>
);

const ClockIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M12 6v6l4 2" />
  </svg>
);

// ─── Component ───────────────────────────────────────────────

export function ChatControls() {
  const sessionKey = useAppStore((s) => s.sessionKey);
  const sessionsResult = useAppStore((s) => s.sessionsResult);
  const connected = useAppStore((s) => s.connected);
  const settings = useAppStore((s) => s.settings);
  const onboarding = useAppStore((s) => s.onboarding);
  const chatLoading = useAppStore((s) => s.chatLoading);
  const sessionsHideCron = useAppStore((s) => s.sessionsHideCron);
  const hello = useAppStore((s) => s.hello);
  const applySettings = useAppStore((s) => s.applySettings);
  const set = useAppStore((s) => s.set);

  const mainSessionKey = resolveMainSessionKey(hello, sessionsResult);
  const hideCron = sessionsHideCron ?? true;
  const hiddenCronCount = hideCron
    ? countHiddenCronSessions(sessionKey, sessionsResult)
    : 0;
  const sessionOptions = resolveSessionOptions(
    sessionKey,
    sessionsResult,
    mainSessionKey,
    hideCron,
  );

  const disableThinkingToggle = onboarding;
  const disableFocusToggle = onboarding;
  const showThinking = onboarding ? false : settings.chatShowThinking;
  const focusActive = onboarding ? true : settings.chatFocusMode;

  const dropdownItems: DropdownItem[] = sessionOptions.map((entry) => ({
    value: entry.key,
    label: entry.displayName ?? entry.key,
  }));

  const handleSessionSelect = useCallback(
    (next: string) => {
      const rs = getReactiveState();
      rs.sessionKey = next;
      (rs as Record<string, unknown>).chatMessage = "";
      (rs as Record<string, unknown>).chatStream = null;
      (rs as Record<string, unknown>).chatStreamStartedAt = null;
      (rs as Record<string, unknown>).chatRunId = null;
      import("../../lib/app-tool-stream.ts").then(({ resetToolStream }) => {
        resetToolStream(rs as never);
      });
      import("../../lib/app-scroll.ts").then(({ resetChatScroll }) => {
        resetChatScroll(rs as never);
      });
      rs.applySettings({
        ...useAppStore.getState().settings,
        sessionKey: next,
        lastActiveSessionKey: next,
      });
      void loadAssistantIdentity(rs as never);
      syncUrlWithSessionKey(rs as never, next, true);
      void loadChatHistory(rs as unknown as ChatState);
    },
    [],
  );

  const handleRefresh = useCallback(async () => {
    const rs = getReactiveState();
    (rs as Record<string, unknown>).chatManualRefreshInFlight = true;
    (rs as Record<string, unknown>).chatNewMessagesBelow = false;
    const { resetToolStream } = await import("../../lib/app-tool-stream.ts");
    resetToolStream(rs as never);
    try {
      await refreshChat(rs as never, { scheduleScroll: false });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rs as any).scrollToBottom?.({ smooth: true });
    } finally {
      requestAnimationFrame(() => {
        (rs as Record<string, unknown>).chatManualRefreshInFlight = false;
        (rs as Record<string, unknown>).chatNewMessagesBelow = false;
      });
    }
  }, []);

  const handleToggleThinking = useCallback(() => {
    if (disableThinkingToggle) return;
    applySettings({
      ...settings,
      chatShowThinking: !settings.chatShowThinking,
    });
  }, [disableThinkingToggle, applySettings, settings]);

  const handleToggleFocus = useCallback(() => {
    if (disableFocusToggle) return;
    applySettings({
      ...settings,
      chatFocusMode: !settings.chatFocusMode,
    });
  }, [disableFocusToggle, applySettings, settings]);

  const handleToggleCronFilter = useCallback(() => {
    set({ sessionsHideCron: !hideCron } as never);
  }, [hideCron, set]);

  return (
    <div className="chat-controls">
      <SessionDropdown
        value={sessionKey}
        items={dropdownItems}
        disabled={!connected}
        onSelect={handleSessionSelect}
      />

      <button
        className="btn btn--sm btn--icon"
        disabled={chatLoading || !connected}
        onClick={handleRefresh}
        data-tooltip={t("chat.refreshTitle")}
      >
        <RefreshIcon />
      </button>

      <span className="chat-controls__separator">|</span>

      <button
        className={`btn btn--sm btn--icon${showThinking ? " active" : ""}`}
        disabled={disableThinkingToggle}
        onClick={handleToggleThinking}
        aria-pressed={showThinking}
        data-tooltip={
          disableThinkingToggle
            ? t("chat.onboardingDisabled")
            : t("chat.thinkingToggle")
        }
      >
        <BrainIcon />
      </button>

      <button
        className={`btn btn--sm btn--icon${focusActive ? " active" : ""}`}
        disabled={disableFocusToggle}
        onClick={handleToggleFocus}
        aria-pressed={focusActive}
        data-tooltip={
          disableFocusToggle
            ? t("chat.onboardingDisabled")
            : t("chat.focusToggle")
        }
      >
        <FocusIcon />
      </button>

      <button
        className={`btn btn--sm btn--icon${hideCron ? " active" : ""}`}
        onClick={handleToggleCronFilter}
        aria-pressed={hideCron}
        data-tooltip={
          hideCron
            ? hiddenCronCount > 0
              ? t("chat.showCronSessionsHidden", {
                  count: String(hiddenCronCount),
                })
              : t("chat.showCronSessions")
            : t("chat.hideCronSessions")
        }
      >
        <ClockIcon />
      </button>
    </div>
  );
}
