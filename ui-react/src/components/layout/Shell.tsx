import React from "react";
import { NavSidebar } from "./NavSidebar.tsx";
import { Topbar } from "./Topbar.tsx";
import { MainContent } from "./MainContent.tsx";
import { useAppStore } from "../../store/appStore.ts";

export function Shell() {
  const tab = useAppStore((s) => s.tab);
  const onboarding = useAppStore((s) => s.onboarding);
  const navCollapsed = useAppStore((s) => s.settings.navCollapsed);
  const chatFocusMode = useAppStore((s) => s.settings.chatFocusMode);

  const isChat = tab === "chat";
  const chatFocus = isChat && (chatFocusMode || onboarding);

  const shellClass = [
    "shell",
    isChat ? "shell--chat" : "",
    chatFocus ? "shell--chat-focus" : "",
    navCollapsed ? "shell--nav-collapsed" : "",
    onboarding ? "shell--onboarding" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={shellClass}>
      <Topbar />
      <NavSidebar />
      <MainContent />
    </div>
  );
}
