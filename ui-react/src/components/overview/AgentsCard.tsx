import React from "react";
import { formatRelativeTimestamp } from "../../lib/format.ts";
import { resolveAgentAvatarSrc } from "../../lib/views/agents-utils.ts";
import type { GatewayAgentRow, SessionActivityResult } from "../../lib/types.ts";
import { OverviewIcons } from "./SnapshotCard.tsx";

// ─── Free Drag Handle (no data-swapy-handle — entire card is draggable) ──

function DragHandleFree() {
  return (
    <button className="swapy-handle" title="拖拽交换位置">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
        strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="9" cy="5" r="1" /><circle cx="9" cy="12" r="1" /><circle cx="9" cy="19" r="1" />
        <circle cx="15" cy="5" r="1" /><circle cx="15" cy="12" r="1" /><circle cx="15" cy="19" r="1" />
      </svg>
    </button>
  );
}

// ─── State helpers ───────────────────────────────────────────

function AgentStateLabel({ state }: { state: "processing" | "waiting" | "idle" }) {
  if (state === "processing") return <>{OverviewIcons.running(12)} 奔跑中</>;
  if (state === "waiting") return <>{OverviewIcons.hourglass(12)} 等活中</>;
  return <>{OverviewIcons.moon(12)} 摸鱼中</>;
}

function SessionStateIcon({ state }: { state: string }) {
  if (state === "processing") return OverviewIcons.running(11);
  if (state === "waiting") return OverviewIcons.hourglass(11);
  return OverviewIcons.moon(11);
}

// ─── Channel icon map ────────────────────────────────────────

const CHANNEL_ICON_MAP: Record<string, string> = {
  telegram: "/Telegram_(software)-Logo.wine.svg",
  whatsapp: "/whatsapp-color-svgrepo-com.svg",
  discord: "/discord-svgrepo-com.svg",
  feishu: "/feishu-logo.svg",
};

// ─── Types ───────────────────────────────────────────────────

export type AgentsCardProps = {
  agents: GatewayAgentRow[];
  sessionActivity: SessionActivityResult | null;
  channelBindings?: Record<string, string[]>;
};

// ─── Main Component ──────────────────────────────────────────

export function AgentsCard({ agents, sessionActivity, channelBindings }: AgentsCardProps) {
  return (
    <div data-swapy-slot="agents">
      <div data-swapy-item="agents">
        <div className="card">
          <div className="card-header-row">
            <DragHandleFree />
            <div>
              <div className="card-title" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                {OverviewIcons.cow()} 牛马档案
              </div>
              <div className="card-sub" style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {agents.length} 头牛马已就位
                {sessionActivity && (
                  <>
                    {" · "}
                    {OverviewIcons.running()} {sessionActivity.processing}{" "}
                    {OverviewIcons.hourglass()} {sessionActivity.waiting}{" "}
                    {OverviewIcons.moon()} {sessionActivity.idle}
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="ov-agent-grid">
            {agents.map((agent) => {
              const avatarSrc = resolveAgentAvatarSrc(agent);
              const displayName = agent.identity?.name ?? agent.name ?? agent.id;
              const agentSessions = sessionActivity?.sessions.filter(
                (s) => (s.key.split(":")[1] ?? s.key) === agent.id,
              ) ?? [];
              const agentState: "processing" | "waiting" | "idle" = agentSessions.find((s) => s.state === "processing")
                ? "processing"
                : agentSessions.find((s) => s.state === "waiting")
                  ? "waiting"
                  : "idle";
              const channels = channelBindings?.[agent.id] ?? [];

              return (
                <div key={agent.id} className={`agent-card-pixel agent-card-pixel--${agentState}`}>

                  {/* ── Card Header: Name + State ── */}
                  <div className="agent-card-pixel__header">
                    <div className="agent-card-pixel__name-row">
                      <span className="agent-card-pixel__name">{displayName}</span>
                      <span className={`agent-card-pixel__badge agent-card-pixel__badge--${agentState}`}>
                        <AgentStateLabel state={agentState} />
                      </span>
                    </div>
                    <div className="agent-card-pixel__id">{agent.id}</div>
                  </div>

                  {/* ── Portrait: Circular Avatar ── */}
                  <div className="agent-card-pixel__portrait">
                    <div className={`agent-card-pixel__avatar-ring agent-card-pixel__avatar-ring--${agentState}`}>
                      {avatarSrc
                        ? <img className="agent-card-pixel__avatar-img" src={avatarSrc} alt={displayName} />
                        : <div className="agent-card-pixel__avatar-fallback">{displayName.slice(0, 1)}</div>
                      }
                    </div>
                  </div>

                  {/* ── Stats Panel: Sessions + Channels ── */}
                  <div className="agent-card-pixel__stats">
                    {/* Sessions */}
                    {agentSessions.length > 0 && (
                      <>
                        <div className="agent-card-pixel__stat-title">会话</div>
                        <div className="agent-card-pixel__sessions">
                        {agentSessions.map((s, i) => (
                          <div key={i} className="agent-card-pixel__session">
                            <div className="agent-card-pixel__session-row">
                              <span className="agent-card-pixel__session-icon"><SessionStateIcon state={s.state} /></span>
                              <span className="agent-card-pixel__session-time">
                                {s.lastActivityAgo < 5000 ? "刚刚" : formatRelativeTimestamp(Date.now() - s.lastActivityAgo)}
                              </span>
                              {s.queueDepth > 0 && (
                                <span className="agent-card-pixel__session-queue">队列{s.queueDepth}</span>
                              )}
                            </div>
                            {s.totalTokens != null && s.contextTokens ? (
                              <div className="agent-card-pixel__bar-row">
                                <div className="agent-card-pixel__token-bar">
                                  <div
                                    className="agent-card-pixel__token-fill"
                                    style={{ width: `${Math.min((s.totalTokens / s.contextTokens) * 100, 100)}%` }}
                                  />
                                </div>
                                <span className="agent-card-pixel__token-val">
                                  {OverviewIcons.wheat(9)} {s.totalTokens.toLocaleString()}
                                </span>
                              </div>
                            ) : null}
                          </div>
                        ))}
                      </div>
                      </>
                    )}

                    {/* Channel icons */}
                    {channels.length > 0 && (
                      <>
                        <div className="agent-card-pixel__stat-title">渠道</div>
                        <div className="agent-card-pixel__channels">
                        {channels.map((ch) => {
                          const iconSrc = CHANNEL_ICON_MAP[ch];
                          return iconSrc
                            ? <img key={ch} className="agent-card-pixel__channel-icon" src={iconSrc} alt={ch} title={ch} />
                            : <span key={ch} className="agent-card-pixel__channel-text" title={ch}>{ch}</span>;
                        })}
                      </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
