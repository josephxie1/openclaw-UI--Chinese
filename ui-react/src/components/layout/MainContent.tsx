import React, { useState, useCallback, useRef, useEffect } from "react";
import { useAppStore, getReactiveState } from "../../store/appStore.ts";
import { titleForTab, subtitleForTab } from "../../lib/navigation.ts";
import { translateError } from "../../lib/helpers/translate-error.ts";
import { SetupWizard } from "../onboarding/SetupWizard.tsx";
import { patchSession, deleteSessionAndRefresh } from "../../lib/controllers/sessions.ts";
import { loadChatHistory, type ChatState } from "../../lib/controllers/chat.ts";
import { syncUrlWithSessionKey } from "../../lib/app-settings.ts";

// View stub components — each will be replaced with full implementations
import { ChatView } from "../../views/Chat.tsx";
import { OverviewView } from "../../views/Overview.tsx";
import { AgentsView } from "../../views/Agents.tsx";
import { ConfigPageView } from "../../views/ConfigPage.tsx";
import { ChannelsView } from "../../views/Channels.tsx";
import { SessionsView } from "../../views/Sessions.tsx";
import { UsageView } from "../../views/Usage.tsx";
import { CronView } from "../../views/Cron.tsx";
import { SkillsView } from "../../views/Skills.tsx";
import { DebugView } from "../../views/Debug.tsx";
import { LogsView } from "../../views/Logs.tsx";
import { NodesView } from "../../views/Nodes.tsx";
import { InstancesView } from "../../views/Instances.tsx";
import { ModelsView } from "../../views/Models.tsx";
import { ClawHubView } from "../../views/ClawHub.tsx";
import { JsonEditView } from "../../views/JsonEdit.tsx";

const VIEW_MAP: Record<string, React.ComponentType> = {
  chat: ChatView,
  overview: OverviewView,
  agents: AgentsView,
  config: ConfigPageView,
  "json-edit": JsonEditView,
  channels: ChannelsView,
  sessions: SessionsView,
  usage: UsageView,
  cron: CronView,
  skills: SkillsView,
  debug: DebugView,
  logs: LogsView,
  nodes: NodesView,
  instances: InstancesView,
  models: ModelsView,
  clawhub: ClawHubView,
};

// ─── Componente de título de sesión con menú desplegable ─────
function ChatSessionTitle() {
  const sessionKey = useAppStore((s) => s.sessionKey);
  const sessionsResult = useAppStore((s) => s.sessionsResult);
  const [menuOpen, setMenuOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Buscar nombre de la sesión activa
  const sessions = (sessionsResult as { sessions?: { key: string; label?: string }[] })?.sessions;
  const activeSession = sessions?.find((s) => s.key === sessionKey);
  const displayName = activeSession?.label || sessionKey || "新会话";

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!menuOpen) return;
    function onOutsideClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!menuRef.current?.contains(t) && !triggerRef.current?.contains(t)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onOutsideClick);
    return () => document.removeEventListener("mousedown", onOutsideClick);
  }, [menuOpen]);

  const handleRename = useCallback(() => {
    setMenuOpen(false);
    setRenameValue(displayName);
    setRenaming(true);
  }, [displayName]);

  const handleRenameSave = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== displayName) {
      const rs = getReactiveState();
      void patchSession(rs as never, sessionKey, { label: trimmed });
    }
    setRenaming(false);
  }, [renameValue, displayName, sessionKey]);

  const handleDelete = useCallback(() => {
    setMenuOpen(false);
    const rs = getReactiveState();
    void deleteSessionAndRefresh(rs as never, sessionKey).then(() => {
      const newKey = `web:${Date.now()}`;
      rs.sessionKey = newKey;
      rs.applySettings({
        ...useAppStore.getState().settings,
        sessionKey: newKey,
        lastActiveSessionKey: newKey,
      });
      syncUrlWithSessionKey(rs as never, newKey, true);
      void loadChatHistory(rs as unknown as ChatState);
    });
  }, [sessionKey]);

  if (renaming) {
    return (
      <div className="chat-session-title">
        <input
          className="chat-session-title__rename"
          value={renameValue}
          autoFocus
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRenameSave}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRenameSave();
            if (e.key === "Escape") setRenaming(false);
          }}
        />
      </div>
    );
  }

  return (
    <div className="chat-session-title">
      <button
        ref={triggerRef}
        className="chat-session-title__trigger"
        onClick={() => setMenuOpen(!menuOpen)}
      >
        <span className="chat-session-title__name">{displayName}</span>
        <svg className="chat-session-title__chevron" viewBox="0 0 24 24" width="16" height="16">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {menuOpen && (
        <div ref={menuRef} className="chat-session-title__menu">
          <button type="button" onClick={handleRename}>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
              <path d="m15 5 4 4" />
            </svg>
            <span>重命名</span>
          </button>
          <div className="chat-session-title__divider" />
          <button type="button" className="chat-session-title__danger" onClick={handleDelete}>
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
            <span>删除</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function MainContent() {
  const tab = useAppStore((s) => s.tab);
  const lastError = useAppStore((s) => s.lastError);
  const onboarding = useAppStore((s) => s.onboarding);
  const isChat = tab === "chat";

  const ViewComponent = VIEW_MAP[tab] ?? ChatView;

  // Skip header for overview and usage (they have their own headers)
  const hideHeader = tab === "overview" || tab === "usage";

  return (
    <main className={`content${isChat ? " content--chat" : ""}`}>
      {/* Setup wizard overlay durante onboarding */}
      {onboarding && <SetupWizard />}

      {/* Content header — same structure as original */}
      {!onboarding && (
        <section className="content-header">
          <div>
            {!hideHeader && isChat && <ChatSessionTitle />}
            {!hideHeader && !isChat && <div className="page-title">{titleForTab(tab)}</div>}
            {!hideHeader && !isChat && <div className="page-sub">{subtitleForTab(tab)}</div>}
          </div>
          <div className="page-meta">
            {lastError && <div className="pill danger">{translateError(lastError)}</div>}
          </div>
        </section>
      )}

      {/* View content */}
      {!onboarding && <ViewComponent />}
    </main>
  );
}
