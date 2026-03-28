import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { i18n, t, type Locale } from "../../i18n/index.ts";
import { SUPPORTED_LOCALES } from "../../i18n/lib/registry.ts";
import { avatarFromName } from "../../lib/helpers/multiavatar.ts";
import { setTab as setTabLib } from "../../lib/app-settings.ts";
import { titleForTab, iconForTab, type Tab } from "../../lib/navigation.ts";
import { icons } from "../../lib/icons.ts";
import type { ThemeMode } from "../../lib/theme.ts";
import {
  getUserProfile,
  removeUserAvatar,
  resizeImageToDataUri,
  setUserAvatar,
  setUserName,
  type UserProfile,
} from "../../lib/user-profile.ts";
import { useAppStore, getReactiveState } from "../../store/appStore.ts";

const THEME_ORDER: ThemeMode[] = ["system", "light", "dark"];
const THEME_ICONS: Record<ThemeMode, string> = {
  system: `<svg viewBox="0 0 24 24" width="16" height="16"><rect width="20" height="14" x="2" y="3" rx="2"/><line x1="8" x2="16" y1="21" y2="21"/><line x1="12" x2="12" y1="17" y2="21"/></svg>`,
  light: `<svg viewBox="0 0 24 24" width="16" height="16"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>`,
  dark: `<svg viewBox="0 0 24 24" width="16" height="16"><path d="M20.985 12.486a9 9 0 1 1-9.473-9.472c.405-.022.617.46.402.803a6 6 0 0 0 8.268 8.268c.344-.215.825-.004.803.401"/></svg>`,
};
const THEME_LABELS: Record<ThemeMode, string> = {
  system: "跟随系统",
  light: "浅色",
  dark: "深色",
};

const SETTINGS_TABS: Tab[] = ["config", "json-edit", "skills", "nodes", "instances", "debug", "logs"];

// Tabs directos en el menú de perfil (sin submenu)
const DIRECT_TABS: Tab[] = ["agents", "clawhub", "sessions", "usage"];

// Títulos personalizados para tabs directos
const DIRECT_TAB_LABELS: Partial<Record<Tab, string>> = {
  sessions: "会话管理",
};

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  "pt-BR": "Português",
  de: "Deutsch",
};

/** Convertir icono Lit TemplateResult a HTML string */
function litIconToHtml(icon: unknown): string {
  if (!icon || typeof icon !== "object") {return "";}
  const tmpl = icon as { strings?: readonly string[]; values?: unknown[] };
  if (!tmpl.strings) {return "";}
  let result = "";
  for (let i = 0; i < tmpl.strings.length; i++) {
    result += tmpl.strings[i];
    if (tmpl.values && i < tmpl.values.length) {
      result += String(tmpl.values[i] ?? "");
    }
  }
  return result;
}

// Posición fija calculada desde un elemento trigger
type PortalPos = { bottom: number; left: number };

export function UserProfileBar() {
  const [profile, setProfile] = useState<UserProfile>(getUserProfile);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);

  // Submenús: language y settings
  const [langOpen, setLangOpen] = useState(false);
  const [langPos, setLangPos] = useState<PortalPos>({ bottom: 0, left: 0 });
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsPos, setSettingsPos] = useState<PortalPos>({ bottom: 0, left: 0 });

  const menuRef = useRef<HTMLDivElement>(null);
  const langTriggerRef = useRef<HTMLButtonElement>(null);
  const langPanelRef = useRef<HTMLDivElement>(null);
  const settingsTriggerRef = useRef<HTMLButtonElement>(null);
  const settingsPanelRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const theme = useAppStore((s) => s.theme);
  const settings = useAppStore((s) => s.settings);
  const set = useAppStore((s) => s.set);
  const applySettings = useAppStore((s) => s.applySettings);

  const currentLocale = i18n.getLocale();

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    if (!menuOpen) {return;}
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      const insideMenu = menuRef.current?.contains(target);
      const insideLang = langPanelRef.current?.contains(target);
      const insideSettings = settingsPanelRef.current?.contains(target);
      if (!insideMenu && !insideLang && !insideSettings) {
        setMenuOpen(false);
        setEditingName(false);
        setLangOpen(false);
        setSettingsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  // Abrir panel de idiomas al hover
  const openLangPanel = useCallback(() => {
    setSettingsOpen(false);
    if (langTriggerRef.current) {
      const rect = langTriggerRef.current.getBoundingClientRect();
      setLangPos({ bottom: window.innerHeight - rect.bottom, left: rect.right + 6 });
    }
    setLangOpen(true);
  }, []);

  // Abrir panel de settings al hover
  const openSettingsPanel = useCallback(() => {
    setLangOpen(false);
    if (settingsTriggerRef.current) {
      const rect = settingsTriggerRef.current.getBoundingClientRect();
      setSettingsPos({ bottom: window.innerHeight - rect.bottom, left: rect.right + 6 });
    }
    setSettingsOpen(true);
  }, []);

  const cycleTheme = useCallback(
    (next: ThemeMode) => {
      set({ theme: next });
      applySettings({ ...settings, theme: next });
    },
    [set, applySettings, settings],
  );

  const handleAvatarUpload = useCallback(async (file: File) => {
    try {
      const dataUri = await resizeImageToDataUri(file, 128);
      const updated = setUserAvatar(dataUri);
      setProfile(updated);
    } catch (err) {
      console.error("Avatar upload failed:", err);
    }
  }, []);

  const handleRemoveAvatar = useCallback(() => {
    const updated = removeUserAvatar();
    setProfile(updated);
  }, []);

  const handleNameSave = useCallback(() => {
    const updated = setUserName(nameInput);
    setProfile(updated);
    setEditingName(false);
  }, [nameInput]);

  const handleSetTab = useCallback((tab: Tab) => {
    setTabLib(getReactiveState() as never, tab);
    setMenuOpen(false);
    setLangOpen(false);
    setSettingsOpen(false);
  }, []);

  const handleSetLocale = useCallback((locale: Locale) => {
    void i18n.setLocale(locale);
    setLangOpen(false);
    setMenuOpen(false);
  }, []);

  const avatarSrc = profile.avatar || avatarFromName(profile.name);

  return (
    <div className="user-profile-wrapper" ref={menuRef}>
      {/* Popup Menu */}
      {menuOpen && (
        <div className="user-profile-menu">
          {/* Avatar + Name */}
          <div className="user-profile-menu__header">
            <div
              className="user-profile-menu__avatar"
              onClick={() => fileRef.current?.click()}
              title="上传头像"
            >
              <img src={avatarSrc} alt={profile.name} />
              <span className="user-profile-menu__avatar-overlay">
                <svg viewBox="0 0 24 24" width="14" height="14">
                  <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </span>
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {void handleAvatarUpload(file);}
                e.target.value = "";
              }}
            />
            {editingName ? (
              <input
                className="user-profile-menu__name-input"
                value={nameInput}
                autoFocus
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={handleNameSave}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {handleNameSave();}
                  if (e.key === "Escape") {
                    setNameInput(profile.name);
                    setEditingName(false);
                  }
                }}
              />
            ) : (
              <button
                className="user-profile-menu__name"
                onClick={() => {
                  setNameInput(profile.name);
                  setEditingName(true);
                }}
                title="修改名称"
              >
                {profile.name}
                <svg viewBox="0 0 24 24" width="12" height="12">
                  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                  <path d="m15 5 4 4" />
                </svg>
              </button>
            )}
          </div>

          <div className="user-profile-menu__divider" />

          {/* 直接导航项: Agent设置 / 技能市场 / 使用情况 */}
          {DIRECT_TABS.map((tab) => (
            <button key={tab} className="user-profile-menu__item" onClick={() => handleSetTab(tab)}>
              <span
                className="user-profile-menu__item-icon"
                dangerouslySetInnerHTML={{ __html: litIconToHtml(icons[iconForTab(tab)]) }}
              />
              <span>{DIRECT_TAB_LABELS[tab] || titleForTab(tab)}</span>
            </button>
          ))}

          <div className="user-profile-menu__divider" />

          {/* 高级设置 — hover flyout */}
          <button
            ref={settingsTriggerRef}
            className={`user-profile-menu__item${settingsOpen ? " user-profile-menu__item--highlight" : ""}`}
            onMouseEnter={openSettingsPanel}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            <span>高级设置</span>
            <span className="user-profile-menu__item-chevron">
              <svg viewBox="0 0 24 24" width="12" height="12"><path d="m9 18 6-6-6-6" /></svg>
            </span>
          </button>

          {/* Language — hover flyout */}
          <button
            ref={langTriggerRef}
            className={`user-profile-menu__item${langOpen ? " user-profile-menu__item--highlight" : ""}`}
            onMouseEnter={openLangPanel}
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
              <path d="M2 12h20" />
            </svg>
            <span>语言</span>
            <span className="user-profile-menu__item-chevron">
              <svg viewBox="0 0 24 24" width="12" height="12"><path d="m9 18 6-6-6-6" /></svg>
            </span>
          </button>

          {/* 文档 — external link */}
          <a
            className="user-profile-menu__item"
            href="https://docs.openclaw.ai"
            target="_blank"
            rel="noopener noreferrer"
          >
            <svg viewBox="0 0 24 24" width="16" height="16">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
            </svg>
            <span>文档</span>
            <span className="user-profile-menu__item-chevron">
              <svg viewBox="0 0 24 24" width="12" height="12">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" x2="21" y1="14" y2="3" />
              </svg>
            </span>
          </a>

          <div className="user-profile-menu__divider" />

          {/* Theme */}
          <div className="user-profile-menu__section-label">{t("theme.label") || "主题"}</div>
          <div className="user-profile-menu__theme-row">
            {THEME_ORDER.map((mode) => (
              <button
                key={mode}
                className={`user-profile-menu__theme-btn${theme === mode ? " active" : ""}`}
                onClick={() => cycleTheme(mode)}
                title={THEME_LABELS[mode]}
              >
                <span dangerouslySetInnerHTML={{ __html: THEME_ICONS[mode] }} />
                <span>{THEME_LABELS[mode]}</span>
              </button>
            ))}
          </div>

          {profile.avatar && (
            <>
              <div className="user-profile-menu__divider" />
              <button className="user-profile-menu__item user-profile-menu__item--danger" onClick={handleRemoveAvatar}>
                <svg viewBox="0 0 24 24" width="16" height="16">
                  <path d="M3 6h18" />
                  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                </svg>
                <span>移除头像</span>
              </button>
            </>
          )}
        </div>
      )}

      {/* Settings flyout — Portal */}
      {settingsOpen &&
        createPortal(
          <div
            ref={settingsPanelRef}
            className="user-profile-submenu-portal"
            style={{ bottom: settingsPos.bottom, left: settingsPos.left }}
            onMouseLeave={() => setSettingsOpen(false)}
          >
            {SETTINGS_TABS.map((tab) => (
              <button key={tab} className="user-profile-menu__item" onClick={() => handleSetTab(tab)}>
                <span
                  className="user-profile-menu__item-icon"
                  dangerouslySetInnerHTML={{ __html: litIconToHtml(icons[iconForTab(tab)]) }}
                />
                <span>{titleForTab(tab)}</span>
              </button>
            ))}
          </div>,
          document.body,
        )}

      {/* Language flyout — Portal */}
      {langOpen &&
        createPortal(
          <div
            ref={langPanelRef}
            className="user-profile-submenu-portal"
            style={{ bottom: langPos.bottom, left: langPos.left }}
            onMouseLeave={() => setLangOpen(false)}
          >
            {SUPPORTED_LOCALES.map((loc) => (
              <button
                key={loc}
                className={`user-profile-menu__item${loc === currentLocale ? " user-profile-menu__item--active" : ""}`}
                onClick={() => handleSetLocale(loc)}
              >
                <span>{LOCALE_LABELS[loc] || loc}</span>
                {loc === currentLocale && (
                  <svg className="user-profile-menu__check" viewBox="0 0 24 24" width="14" height="14">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </button>
            ))}
          </div>,
          document.body,
        )}

      {/* Profile Bar */}
      <button
        className="user-profile-bar"
        onClick={() => {
          setMenuOpen(!menuOpen);
          setLangOpen(false);
          setSettingsOpen(false);
        }}
        title="用户设置"
      >
        <div className="user-profile-bar__avatar">
          <img src={avatarSrc} alt={profile.name} />
        </div>
        <span className="user-profile-bar__name">{profile.name}</span>
        <svg className="user-profile-bar__chevron" viewBox="0 0 24 24" width="14" height="14">
          <path d="m18 15-6-6-6 6" />
        </svg>
      </button>
    </div>
  );
}
