import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { t } from "../../i18n/index.ts";
import { resolveSessionDisplayName, isCronSessionKey } from "../../lib/app-render.helpers.ts";
import { setTab as setTabLib, syncUrlWithSessionKey } from "../../lib/app-settings.ts";
import { getSessionPreview } from "../../lib/chat/session-preview.ts";
import { loadChatHistory, type ChatState } from "../../lib/controllers/chat.ts";
import { deleteSessionAndRefresh, patchSession } from "../../lib/controllers/sessions.ts";
import { buildExternalLinkRel, EXTERNAL_LINK_TARGET } from "../../lib/external-link.ts";
import { icons } from "../../lib/icons.ts";
import { TAB_GROUPS, titleForTab, iconForTab, pathForTab, normalizeBasePath, type Tab } from "../../lib/navigation.ts";
import { useAppStore, getReactiveState } from "../../store/appStore.ts";
import { UserProfileBar } from "./UserProfileBar.tsx";

const MAX_SIDEBAR_SESSIONS = 20;

/** Render a Lit TemplateResult icon to raw HTML string */
function litIconToHtml(icon: unknown): string {
  if (!icon || typeof icon !== "object") {
    return "";
  }
  const tmpl = icon as { strings?: readonly string[]; values?: unknown[] };
  if (!tmpl.strings) {
    return "";
  }
  let result = "";
  for (let i = 0; i < tmpl.strings.length; i++) {
    result += tmpl.strings[i];
    if (tmpl.values && i < tmpl.values.length) {
      const val = tmpl.values[i] ?? "";
      result += typeof val === "string" ? val : JSON.stringify(val);
    }
  }
  return result;
}

function formatRelativeTime(ts: number | null): string {
  if (!ts) {
    return "";
  }
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) {
    return "just now";
  }
  if (mins < 60) {
    return `${mins}m`;
  }
  const hours = Math.floor(mins / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NavSidebar() {
  const tab = useAppStore((s) => s.tab);
  const settings = useAppStore((s) => s.settings);
  const sessionsResult = useAppStore((s) => s.sessionsResult);
  const basePath = useAppStore((s) => s.basePath);
  const sessionKey = useAppStore((s) => s.sessionKey);
  const applySettings = useAppStore((s) => s.applySettings);

  const base = normalizeBasePath(basePath ?? "");
  const faviconSrc = base ? `${base}/favicon.svg` : "/favicon.svg";

  const setTab = useCallback((next: Tab) => {
    // Use the lib setTab which triggers refreshActiveTab to load data
    setTabLib(getReactiveState() as never, next);
  }, []);

  const switchSession = useCallback((newKey: string) => {
    // All mutations through the reactive proxy (single source of truth)
    const rs = getReactiveState();
    rs.sessionKey = newKey;
    (rs as Record<string, unknown>).chatMessage = "";
    (rs as Record<string, unknown>).chatMessages = [];
    (rs as Record<string, unknown>).chatStream = null;
    (rs as Record<string, unknown>).chatStreamStartedAt = null;
    (rs as Record<string, unknown>).chatRunId = null;
    (rs as Record<string, unknown>).chatQueue = [];
    // Apply settings & sync URL
    void import("../../lib/app-settings.ts").then(({ applySettings: applySettingsLib }) => {
      applySettingsLib(rs as never, {
        ...useAppStore.getState().settings,
        sessionKey: newKey,
        lastActiveSessionKey: newKey,
      });
    });
    syncUrlWithSessionKey(rs as never, newKey, true);
    // Load identity, history, and avatar for the new session
    void import("../../lib/controllers/assistant-identity.ts").then(({ loadAssistantIdentity }) => {
      void loadAssistantIdentity(rs as never);
    });
    void loadChatHistory(rs as unknown as ChatState);
    void import("../../lib/app-chat.ts").then(({ refreshChatAvatar }) => {
      void refreshChatAvatar(rs as never);
    });
  }, []);

  // Session list
  const sessions = sessionsResult?.sessions ?? [];
  const hideCron = (settings as { sessionsHideCron?: boolean }).sessionsHideCron ?? true;
  const filtered = sessions
    .filter((s) => !hideCron || !isCronSessionKey(s.key))
    .slice(0, MAX_SIDEBAR_SESSIONS);

  const navClass = `nav${settings.navCollapsed ? " nav--collapsed" : ""}`;

  return (
    <aside className={navClass}>
      {/* Brand / Logo */}
      <div className="nav-brand">
        <div className="brand">
          <div className="brand-logo">
            <img src={faviconSrc} alt="OpenClaw" />
          </div>
          <div className="brand-text">
            <div className="brand-title">OPENCLAW</div>
            <div className="brand-sub">{t("global.brandSub")}</div>
          </div>
        </div>
        <button
          className="nav-collapse-toggle"
          onClick={() => applySettings({ ...settings, navCollapsed: !settings.navCollapsed })}
          title={settings.navCollapsed ? t("nav.expand") : t("nav.collapse")}
          aria-label={settings.navCollapsed ? t("nav.expand") : t("nav.collapse")}
        >
          <span className="nav-collapse-toggle__icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="6" x2="20" y2="6" />
              <line x1="4" y1="12" x2="20" y2="12" />
              <line x1="4" y1="18" x2="20" y2="18" />
            </svg>
          </span>
        </button>
      </div>

      {(TAB_GROUPS as ReadonlyArray<{ label: string; tabs: readonly string[] }>).filter((g) => g.label !== "settings" && g.label !== "agent" && g.label !== "control").map((group) => {
        const isGroupCollapsed = settings.navGroupsCollapsed?.[group.label] ?? false;

        // Overview — standalone nav item, no group wrapper
        if (group.label === "overview") {
          const href = pathForTab("overview", basePath);
          return (
            <a
              key="overview"
              href={href}
              className={`nav-item nav-item--standalone${tab === "overview" ? " active" : ""}`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                  return;
                }
                e.preventDefault();
                setTab("overview");
              }}
              title={titleForTab("overview")}
            >
              <span
                className="nav-item__icon"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: litIconToHtml(icons[iconForTab("overview")]) }}
              />
              <span className="nav-item__text">{titleForTab("overview")}</span>
            </a>
          );
        }

        // Chat group — uses nav-label, shows session list
        if (group.label === "chat") {
          return (
            <div
              key={group.label}
              className={`nav-group${isGroupCollapsed ? " nav-group--collapsed" : ""}`}
            >
              <button
                className={`nav-label${tab === "chat" ? " nav-label--active" : ""}`}
                onClick={() => {
                  if (tab === "chat") {
                    const next = {
                      ...settings.navGroupsCollapsed,
                      [group.label]: !isGroupCollapsed,
                    };
                    applySettings({ ...settings, navGroupsCollapsed: next });
                  } else {
                    const next = { ...settings.navGroupsCollapsed, [group.label]: false };
                    applySettings({ ...settings, navGroupsCollapsed: next });
                    setTab("chat");
                  }
                }}
                aria-expanded={!isGroupCollapsed}
              >
                <span className="nav-label__text">{t(`nav.${group.label}`)}</span>
                <span className="nav-label__chevron">{isGroupCollapsed ? "+" : "−"}</span>
              </button>
              {!isGroupCollapsed && (
                <div className="session-list">
                  <button
                    className="session-item session-item--new"
                    onClick={() => {
                      const newKey = `web:${Date.now()}`;
                      switchSession(newKey);
                      setTab("chat");
                    }}
                    title={t("chatView.newSession")}
                  >
                    <span className="session-item__icon">+</span>
                    <span className="session-item__name">{t("chatView.newSession")}</span>
                  </button>
                  {filtered.map((session) => {
                    const isActive = session.key === sessionKey;
                    const baseName = resolveSessionDisplayName(session.key, session);
                    const preview = getSessionPreview(session.key);
                    const name = preview || baseName;
                    const time = formatRelativeTime(session.updatedAt);
                    return (
                      <SessionItem
                        key={session.key}
                        sessionKey={session.key}
                        name={name}
                        time={time}
                        isActive={isActive}
                        onSwitch={() => {
                          if (!isActive) {
                            switchSession(session.key);
                            setTab("chat");
                          }
                        }}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Regular tab groups
        return (
          <div
            key={group.label}
            className={`nav-group${isGroupCollapsed ? " nav-group--collapsed" : ""}`}
          >
            <button
              className="nav-label"
              onClick={() => {
                const next = { ...settings.navGroupsCollapsed, [group.label]: !isGroupCollapsed };
                applySettings({ ...settings, navGroupsCollapsed: next });
              }}
              aria-expanded={!isGroupCollapsed}
            >
              <span className="nav-label__text">{t(`nav.${group.label}`)}</span>
              <span className="nav-label__chevron">{isGroupCollapsed ? "+" : "−"}</span>
            </button>
            <div className="nav-group__items">
              {(group.tabs as readonly Tab[]).filter((t_) => t_ !== "skills" && t_ !== "nodes" && t_ !== "usage").map((t_) => {
                const href = pathForTab(t_, basePath);
                return (
                  <a
                    key={t_}
                    href={href}
                    className={`nav-item${tab === t_ ? " active" : ""}`}
                    onClick={(e) => {
                      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
                        return;
                      }
                      e.preventDefault();
                      setTab(t_);
                    }}
                    title={titleForTab(t_)}
                  >
                    <span
                      className="nav-item__icon"
                      aria-hidden="true"
                      dangerouslySetInnerHTML={{ __html: litIconToHtml(icons[iconForTab(t_)]) }}
                    />
                    <span className="nav-item__text">{titleForTab(t_)}</span>
                  </a>
                );
              })}
            </div>
          </div>
        );
      })}


      {/* Spacer para empujar los items de abajo */}
      <div style={{ flex: 1 }} />

      {/* Items de configuración — antes en topbar */}
      <div className="nav-group__items nav-bottom-items">
        {(["models", "channels", "cron"] as const).map((t_) => {
          const href = pathForTab(t_, basePath);
          return (
            <a
              key={t_}
              href={href}
              className={`nav-item${tab === t_ ? " active" : ""}`}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
                e.preventDefault();
                setTab(t_);
              }}
              title={titleForTab(t_)}
            >
              <span
                className="nav-item__icon"
                aria-hidden="true"
                dangerouslySetInnerHTML={{ __html: litIconToHtml(icons[iconForTab(t_)]) }}
              />
              <span className="nav-item__text">{titleForTab(t_)}</span>
            </a>
          );
        })}
      </div>

      {/* User Profile Bar */}
      <UserProfileBar />
    </aside>
  );
}

/* ─── SessionItem — session with ⋯ context menu ─── */

type SessionItemProps = {
  sessionKey: string;
  name: string;
  time: string;
  isActive: boolean;
  onSwitch: () => void;
};

function SessionItem({ sessionKey, name, time, isActive, onSwitch }: SessionItemProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0 });
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(name);
  const dotsRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (
        !menuRef.current?.contains(target) &&
        !dotsRef.current?.contains(target)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const openMenu = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (dotsRef.current) {
      const rect = dotsRef.current.getBoundingClientRect();
      setMenuPos({ top: rect.bottom + 4, left: rect.left });
    }
    setMenuOpen(true);
  }, []);

  const handleRename = useCallback(() => {
    setMenuOpen(false);
    setRenameValue(name);
    setRenaming(true);
  }, [name]);

  const handleRenameSave = useCallback(() => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== name) {
      const rs = getReactiveState();
      void patchSession(rs as never, sessionKey, { label: trimmed });
    }
    setRenaming(false);
  }, [renameValue, name, sessionKey]);

  const handleDelete = useCallback(() => {
    setMenuOpen(false);
    const rs = getReactiveState();
    void deleteSessionAndRefresh(rs as never, sessionKey);
  }, [sessionKey]);

  if (renaming) {
    return (
      <div className="session-item session-item--renaming">
        <input
          className="session-item__rename-input"
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
    <>
      <div
        className={`session-item${isActive ? " session-item--active" : ""}`}
        onClick={onSwitch}
        title={name}
        role="button"
        tabIndex={0}
      >
        <span className="session-item__name">{name}</span>
        {time && <span className="session-item__time">{time}</span>}
        <button
          ref={dotsRef}
          className="session-item__dots"
          onClick={openMenu}
          title="更多操作"
        >
          ⋯
        </button>
      </div>

      {menuOpen &&
        createPortal(
          <div
            ref={menuRef}
            className="session-context-menu"
            style={{ top: menuPos.top, left: menuPos.left }}
          >
            <button className="session-context-menu__item" onClick={handleRename}>
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                <path d="m15 5 4 4" />
              </svg>
              <span>重命名</span>
            </button>
            <div className="session-context-menu__divider" />
            <button className="session-context-menu__item session-context-menu__item--danger" onClick={handleDelete}>
              <svg viewBox="0 0 24 24" width="14" height="14">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
              <span>删除</span>
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
