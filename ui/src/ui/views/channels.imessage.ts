import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import { formatRelativeTimestamp } from "../format.ts";
import type { IMessageStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderIMessageCard(params: {
  props: ChannelsProps;
  imessage?: IMessageStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, imessage, accountCountLabel } = params;

  return html`
    <div class="card">
      <div class="card-title">${t("channelsView.iMessage")}</div>
      <div class="card-sub">${t("channelsView.iMessageSub")}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${t("channelsView.configured")}</span>
          <span>${imessage?.configured ? t("shared.yes") : t("shared.no")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.running")}</span>
          <span>${imessage?.running ? t("shared.yes") : t("shared.no")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.lastStart")}</span>
          <span>${imessage?.lastStartAt ? formatRelativeTimestamp(imessage.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.lastProbe")}</span>
          <span>${imessage?.lastProbeAt ? formatRelativeTimestamp(imessage.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${
        imessage?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${imessage.lastError}
          </div>`
          : nothing
      }

      ${
        imessage?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            ${t("channelsView.probe")} ${imessage.probe.ok ? "ok" : "failed"} ·
            ${imessage.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({
        channelId: "imessage",
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
