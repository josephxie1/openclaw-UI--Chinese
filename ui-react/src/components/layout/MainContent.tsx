import React from "react";
import { useAppStore } from "../../store/appStore.ts";
import { titleForTab, subtitleForTab } from "../../lib/navigation.ts";
import { translateError } from "../../lib/helpers/translate-error.ts";
import { ChatControls } from "../chat/ChatControls.tsx";
import { SetupWizard } from "../onboarding/SetupWizard.tsx";

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
            {!hideHeader && <div className="page-title">{titleForTab(tab)}</div>}
            {!hideHeader && <div className="page-sub">{subtitleForTab(tab)}</div>}
          </div>
          <div className="page-meta">
            {lastError && <div className="pill danger">{translateError(lastError)}</div>}
            {isChat && <ChatControls />}

          </div>
        </section>
      )}

      {/* View content */}
      {!onboarding && <ViewComponent />}
    </main>
  );
}

