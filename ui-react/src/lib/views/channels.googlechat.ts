import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import { formatRelativeTimestamp } from "../format.ts";
import type { GoogleChatStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderGoogleChatCard(params: {
  props: ChannelsProps;
  googleChat?: GoogleChatStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, googleChat, accountCountLabel } = params;

  return html`
    <div class="card">
      <div class="card-title">${t("channelsView.googleChat")}</div>
      <div class="card-sub">${t("channelsView.googleChatSub")}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${t("channelsView.configured")}</span>
          <span>${googleChat ? (googleChat.configured ? t("shared.yes") : t("shared.no")) : t("channelsView.na")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.running")}</span>
          <span>${googleChat ? (googleChat.running ? t("shared.yes") : t("shared.no")) : t("channelsView.na")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.credential")}</span>
          <span>${googleChat?.credentialSource ?? "n/a"}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.audience")}</span>
          <span>
            ${
              googleChat?.audienceType
                ? `${googleChat.audienceType}${googleChat.audience ? ` · ${googleChat.audience}` : ""}`
                : "n/a"
            }
          </span>
        </div>
        <div>
          <span class="label">${t("channelsView.lastStart")}</span>
          <span>${googleChat?.lastStartAt ? formatRelativeTimestamp(googleChat.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.lastProbe")}</span>
          <span>${googleChat?.lastProbeAt ? formatRelativeTimestamp(googleChat.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${
        googleChat?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${googleChat.lastError}
          </div>`
          : nothing
      }

      ${
        googleChat?.probe
          ? html`<div class="callout" style="margin-top: 12px;">
            ${t("channelsView.probe")} ${googleChat.probe.ok ? "ok" : "failed"} ·
            ${googleChat.probe.status ?? ""} ${googleChat.probe.error ?? ""}
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({
        channelId: "googlechat",
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
