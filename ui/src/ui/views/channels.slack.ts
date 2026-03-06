import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import { formatRelativeTimestamp } from "../format.ts";
import type { SlackStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderSlackCard(params: {
  props: ChannelsProps;
  slack?: SlackStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, slack, accountCountLabel } = params;

  return html`
    <div class="card">
      <div class="card-title">${t("channelsView.slack")}</div>
      <div class="card-sub">${t("channelsView.slackSub")}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${t("channelsView.configured")}</span>
          <span>${slack?.configured ? t("shared.yes") : t("shared.no")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.running")}</span>
          <span>${slack?.running ? t("shared.yes") : t("shared.no")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.lastStart")}</span>
          <span>${slack?.lastStartAt ? formatRelativeTimestamp(slack.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.lastProbe")}</span>
          <span>${slack?.lastProbeAt ? formatRelativeTimestamp(slack.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${
        slack?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${slack.lastError}
          </div>`
          : nothing
      }

      ${
        slack?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            ${t("channelsView.probe")} ${slack.probe.ok ? "ok" : "failed"} ·
            ${slack.probe.status ?? ""} ${slack.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({
        channelId: "slack",
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
