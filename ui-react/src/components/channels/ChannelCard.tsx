import React from "react";
import { t } from "../../i18n/index.ts";
import { formatRelativeTimestamp } from "../../lib/format.ts";
import type { ChannelAccountSnapshot } from "../../lib/types.ts";

// ─── Types ───────────────────────────────────────────────────

export type ChannelCardData = {
  key: string;
  label: string;
  enabled: boolean;
  configured?: boolean;
  running?: boolean;
  connected?: boolean;
  lastError?: string | null;
  accounts: ChannelAccountSnapshot[];
};

export type ChannelCardProps = {
  channel: ChannelCardData;
  onClick: () => void;
};

// ─── Helpers ─────────────────────────────────────────────────

const RECENT_MS = 10 * 60 * 1000;

function accountDotColor(account: ChannelAccountSnapshot): string {
  if (account.running && account.connected) return "green";
  if (account.running || (account.lastInboundAt && Date.now() - account.lastInboundAt < RECENT_MS)) return "yellow";
  if (account.configured) return "gray";
  return "red";
}

function channelBadge(ch: ChannelCardData) {
  const isActive = ch.running || ch.connected || ch.accounts.some((a) => a.running || a.connected);
  return {
    class: isActive ? "channel-summary-card__badge--active" : "channel-summary-card__badge--inactive",
    label: isActive ? "运行中" : ch.configured ? "已配置" : "未配置",
  };
}

// ─── Component ───────────────────────────────────────────────

export function ChannelCard({ channel, onClick }: ChannelCardProps) {
  const badge = channelBadge(channel);
  const hasAccounts = channel.accounts.length > 0;

  return (
    <div
      className={`channel-summary-card${!channel.enabled ? " channel-summary-card--disabled" : ""}`}
      onClick={onClick}
    >
      {/* Header: nombre + badge */}
      <div className="channel-summary-card__header">
        <span className="channel-summary-card__name">{channel.label}</span>
        <span className={`channel-summary-card__badge ${badge.class}`}>
          {badge.label}
        </span>
      </div>

      {/* Lista de cuentas con indicador de estado */}
      {hasAccounts ? (
        <div className="channel-summary-card__accounts">
          {channel.accounts.slice(0, 3).map((account) => {
            const dot = accountDotColor(account);
            return (
              <div className="channel-summary-card__account" key={account.accountId}>
                <span className={`channel-summary-card__dot channel-summary-card__dot--${dot}`} />
                <span className="channel-summary-card__account-name">
                  {account.name || account.accountId}
                </span>
                <span style={{ marginLeft: "auto", opacity: 0.7 }}>
                  {account.lastInboundAt ? formatRelativeTimestamp(account.lastInboundAt) : t("channelsView.na")}
                </span>
              </div>
            );
          })}
          {channel.accounts.length > 3 && (
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", paddingLeft: 8 }}>
              +{channel.accounts.length - 3} 个账号
            </div>
          )}
        </div>
      ) : (
        <div className="channel-summary-card__stats">
          <span>
            <span className="channel-summary-card__stat-label">{t("channelsView.configured")}</span>
            {channel.configured == null ? t("channelsView.na") : channel.configured ? t("shared.yes") : t("shared.no")}
          </span>
          <span>
            <span className="channel-summary-card__stat-label">{t("channelsView.running")}</span>
            {channel.running == null ? t("channelsView.na") : channel.running ? t("shared.yes") : t("shared.no")}
          </span>
          <span>
            <span className="channel-summary-card__stat-label">{t("channelsView.connected")}</span>
            {channel.connected == null ? t("channelsView.na") : channel.connected ? t("shared.yes") : t("shared.no")}
          </span>
        </div>
      )}

      {/* Error */}
      {channel.lastError && (
        <div className="channel-summary-card__error">{channel.lastError}</div>
      )}
    </div>
  );
}
