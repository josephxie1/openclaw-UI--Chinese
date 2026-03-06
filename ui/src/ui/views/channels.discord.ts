import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import { formatRelativeTimestamp } from "../format.ts";
import type { DiscordStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderDiscordCard(params: {
  props: ChannelsProps;
  discord?: DiscordStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, discord, accountCountLabel } = params;

  return html`
    <div class="card">
      <div class="card-title">${t("channelsView.discord")}</div>
      <div class="card-sub">${t("channelsView.discordSub")}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${t("channelsView.configured")}</span>
          <span>${discord?.configured ? t("shared.yes") : t("shared.no")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.running")}</span>
          <span>${discord?.running ? t("shared.yes") : t("shared.no")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.lastStart")}</span>
          <span>${discord?.lastStartAt ? formatRelativeTimestamp(discord.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.lastProbe")}</span>
          <span>${discord?.lastProbeAt ? formatRelativeTimestamp(discord.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${
        discord?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${discord.lastError}
          </div>`
          : nothing
      }

      ${
        discord?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            ${t("channelsView.probe")} ${discord.probe.ok ? "ok" : "failed"} ·
            ${discord.probe.status ?? ""} ${discord.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({
        channelId: "discord",
        props,
        extraButtons: html`
          <button class="btn" @click=${() => props.onRefresh(true)}>
            ${t("channelsView.probe")}
          </button>
        `,
      })}
    </div>
  `;
}
