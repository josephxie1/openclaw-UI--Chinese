import React from "react";
import { useAppStore, getReactiveState } from "../../store/appStore.ts";
import { t } from "../../i18n/index.ts";
import { normalizeBasePath, titleForTab, iconForTab, type Tab } from "../../lib/navigation.ts";
import { setTab as setTabLib } from "../../lib/app-settings.ts";
import { icons } from "../../lib/icons.ts";
import type { ThemeMode } from "../../lib/theme.ts";

const THEME_ORDER: ThemeMode[] = ["system", "light", "dark"];

const TOPBAR_TABS: Tab[] = ["models", "channels", "cron"];

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

export function Topbar() {
  const connected = useAppStore((s) => s.connected);
  const hello = useAppStore((s) => s.hello);
  const settings = useAppStore((s) => s.settings);
  const theme = useAppStore((s) => s.theme);
  const basePath = useAppStore((s) => s.basePath);
  const tab = useAppStore((s) => s.tab);
  const set = useAppStore((s) => s.set);
  const applySettings = useAppStore((s) => s.applySettings);

  const version =
    (typeof hello?.server?.version === "string" && hello.server.version.trim()) ||
    t("common.na");
  const versionStatusClass = "ok";
  const themeIndex = Math.max(0, THEME_ORDER.indexOf(theme));
  const base = normalizeBasePath(basePath ?? "");
  const faviconSrc = base ? `${base}/favicon.svg` : "/favicon.svg";

  function cycleTheme(next: ThemeMode) {
    set({ theme: next });
    applySettings({ ...settings, theme: next });
  }

  function setTab(next: Tab) {
    setTabLib(getReactiveState() as never, next);
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
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
        <div className="brand">
          <div className="brand-logo">
            <img src={faviconSrc} alt="OpenClaw" />
          </div>
          <div className="brand-text">
            <div className="brand-title">OPENCLAW</div>
            <div className="brand-sub">{t("global.brandSub")}</div>
          </div>
        </div>
      </div>
      <div className="topbar-nav">
        {TOPBAR_TABS.map((t_) => (
          <button
            key={t_}
            className={`topbar-nav__btn${tab === t_ ? " topbar-nav__btn--active" : ""}`}
            onClick={() => setTab(t_)}
            title={titleForTab(t_)}
          >
            <span
              className="topbar-nav__icon"
              dangerouslySetInnerHTML={{ __html: litIconToHtml(icons[iconForTab(t_)]) }}
            />
            <span className="topbar-nav__text">{titleForTab(t_)}</span>
          </button>
        ))}
      </div>
      <div className="topbar-status">
        <div className="pill">
          <span className={`statusDot ${versionStatusClass}`} />
          <span>{t("common.version")}</span>
          <span className="mono">{version}</span>
        </div>
        <div className="pill">
          <span className={`statusDot${connected ? " ok" : ""}`} />
          <span>{t("common.health")}</span>
          <span className="mono">{connected ? t("common.ok") : t("common.offline")}</span>
        </div>
        {/* 3-state theme toggle */}
        <div className="theme-toggle" style={{ "--theme-index": themeIndex } as React.CSSProperties}>
          <div className="theme-toggle__track" role="group" aria-label={t("theme.label")}>
            <span className="theme-toggle__indicator" />
            <button
              className={`theme-toggle__button${theme === "system" ? " active" : ""}`}
              onClick={() => cycleTheme("system")}
              aria-pressed={theme === "system"}
              title={t("theme.system")}
            >
              <svg className="theme-icon" viewBox="0 0 24 24"><rect width="20" height="14" x="2" y="3" rx="2" /><line x1="8" x2="16" y1="21" y2="21" /><line x1="12" x2="12" y1="17" y2="21" /></svg>
            </button>
            <button
              className={`theme-toggle__button${theme === "light" ? " active" : ""}`}
              onClick={() => cycleTheme("light")}
              aria-pressed={theme === "light"}
              title={t("theme.light")}
            >
              <svg className="theme-icon" viewBox="0 0 24 24"><circle cx="12" cy="12" r="4" /><path d="M12 2v2" /><path d="M12 20v2" /><path d="m4.93 4.93 1.41 1.41" /><path d="m17.66 17.66 1.41 1.41" /><path d="M2 12h2" /><path d="M20 12h2" /><path d="m6.34 17.66-1.41 1.41" /><path d="m19.07 4.93-1.41 1.41" /></svg>
            </button>
            <button
              className={`theme-toggle__button${theme === "dark" ? " active" : ""}`}
              onClick={() => cycleTheme("dark")}
              aria-pressed={theme === "dark"}
              title={t("theme.dark")}
            >
              <svg className="theme-icon" viewBox="0 0 24 24"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401" /></svg>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
