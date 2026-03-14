import React, { useCallback } from "react";
import { useAppStore, getReactiveState } from "../../store/appStore.ts";
import { t } from "../../i18n/index.ts";
import { TAB_GROUPS, titleForTab, iconForTab, pathForTab, type Tab } from "../../lib/navigation.ts";
import { icons } from "../../lib/icons.ts";
import { resolveSessionDisplayName, isCronSessionKey } from "../../lib/app-render.helpers.ts";
import { setTab as setTabLib, syncUrlWithSessionKey } from "../../lib/app-settings.ts";
import { loadChatHistory, type ChatState } from "../../lib/controllers/chat.ts";
import { buildExternalLinkRel, EXTERNAL_LINK_TARGET } from "../../lib/external-link.ts";

const MAX_SIDEBAR_SESSIONS = 20;

/** Render a Lit TemplateResult icon to raw HTML string */
function litIconToHtml(icon: unknown): string {
  if (!icon || typeof icon !== "object") return "";
  const tmpl = icon as { strings?: readonly string[]; values?: unknown[] };
  if (!tmpl.strings) return "";
  let result = "";
  for (let i = 0; i < tmpl.strings.length; i++) {
    result += tmpl.strings[i];
    if (tmpl.values && i < tmpl.values.length) {
      result += String(tmpl.values[i] ?? "");
    }
  }
  return result;
}

function formatRelativeTime(ts: number | null): string {
  if (!ts) return "";
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export function NavSidebar() {
  const tab = useAppStore((s) => s.tab);
  const settings = useAppStore((s) => s.settings);
  const sessionsResult = useAppStore((s) => s.sessionsResult);
  const basePath = useAppStore((s) => s.basePath);
  const connected = useAppStore((s) => s.connected);
  const sessionKey = useAppStore((s) => s.sessionKey);
  const set = useAppStore((s) => s.set);
  const applySettings = useAppStore((s) => s.applySettings);

  const setTab = useCallback(
    (next: Tab) => {
      // Use the lib setTab which triggers refreshActiveTab to load data
      setTabLib(getReactiveState() as never, next);
    },
    [],
  );

  const switchSession = useCallback(
    (newKey: string) => {
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
      import("../../lib/app-settings.ts").then(({ applySettings: applySettingsLib }) => {
        applySettingsLib(rs as never, {
          ...useAppStore.getState().settings,
          sessionKey: newKey,
          lastActiveSessionKey: newKey,
        });
      });
      syncUrlWithSessionKey(rs as never, newKey, true);
      // Load identity, history, and avatar for the new session
      import("../../lib/controllers/assistant-identity.ts").then(({ loadAssistantIdentity }) => {
        void loadAssistantIdentity(rs as never);
      });
      void loadChatHistory(rs as unknown as ChatState);
      import("../../lib/app-chat.ts").then(({ refreshChatAvatar }) => {
        void refreshChatAvatar(rs as never);
      });
    },
    [],
  );

  // Session list
  const sessions = sessionsResult?.sessions ?? [];
  const hideCron = (settings as { sessionsHideCron?: boolean }).sessionsHideCron ?? true;
  const filtered = sessions
    .filter((s) => !hideCron || !isCronSessionKey(s.key))
    .slice(0, MAX_SIDEBAR_SESSIONS);

  const navClass = `nav${settings.navCollapsed ? " nav--collapsed" : ""}`;

  return (
    <aside className={navClass}>
      {TAB_GROUPS.map((group) => {
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
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
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
            <div key={group.label} className={`nav-group${isGroupCollapsed ? " nav-group--collapsed" : ""}`}>
              <button
                className={`nav-label${tab === "chat" ? " nav-label--active" : ""}`}
                onClick={() => {
                  if (tab === "chat") {
                    const next = { ...settings.navGroupsCollapsed, [group.label]: !isGroupCollapsed };
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
                    const name = resolveSessionDisplayName(session.key, session);
                    const time = formatRelativeTime(session.updatedAt);
                    return (
                      <button
                        key={session.key}
                        className={`session-item${isActive ? " session-item--active" : ""}`}
                        onClick={() => {
                          if (isActive) return;
                          switchSession(session.key);
                          setTab("chat");
                        }}
                        title={name}
                      >
                        <span className="session-item__name">{name}</span>
                        {time && <span className="session-item__time">{time}</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        // Regular tab groups
        return (
          <div key={group.label} className={`nav-group${isGroupCollapsed ? " nav-group--collapsed" : ""}`}>
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
              {(group.tabs as readonly Tab[]).map((t_) => {
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
          </div>
        );
      })}

      {/* Resources links */}
      <div className="nav-group nav-group--links">
        <div className="nav-label nav-label--static">
          <span className="nav-label__text">{t("common.resources")}</span>
        </div>
        <div className="nav-group__items">
          <a
            className="nav-item nav-item--external"
            href="https://docs.openclaw.ai"
            target={EXTERNAL_LINK_TARGET}
            rel={buildExternalLinkRel()}
            title={`${t("common.docs")} (opens in new tab)`}
          >
            <span
              className="nav-item__icon"
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: litIconToHtml(icons.book) }}
            />
            <span className="nav-item__text">{t("common.docs")}</span>
          </a>
        </div>
      </div>
    </aside>
  );
}
