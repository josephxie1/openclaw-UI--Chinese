import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import { formatRelativeTimestamp, formatDurationHuman } from "../format.ts";
import type { WhatsAppStatus } from "../types.ts";
import { renderChannelConfigSection } from "./channels.config.ts";
import type { ChannelsProps } from "./channels.types.ts";

export function renderWhatsAppCard(params: {
  props: ChannelsProps;
  whatsapp?: WhatsAppStatus;
  accountCountLabel: unknown;
}) {
  const { props, whatsapp, accountCountLabel } = params;

  return html`
    <div class="card">
      <div class="card-title">${t("channelsView.whatsApp")}</div>
      <div class="card-sub">${t("channelsView.whatsAppSub")}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${t("channelsView.configured")}</span>
          <span>${whatsapp?.configured ? t("shared.yes") : t("shared.no")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.linked")}</span>
          <span>${whatsapp?.linked ? t("shared.yes") : t("shared.no")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.running")}</span>
          <span>${whatsapp?.running ? t("shared.yes") : t("shared.no")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.connected")}</span>
          <span>${whatsapp?.connected ? t("shared.yes") : t("shared.no")}</span>
        </div>
        <div>
          <span class="label">${t("channelsView.lastConnect")}</span>
          <span>
            ${whatsapp?.lastConnectedAt ? formatRelativeTimestamp(whatsapp.lastConnectedAt) : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">${t("channelsView.lastMessage")}</span>
          <span>
            ${whatsapp?.lastMessageAt ? formatRelativeTimestamp(whatsapp.lastMessageAt) : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">${t("channelsView.authAge")}</span>
          <span>
            ${whatsapp?.authAgeMs != null ? formatDurationHuman(whatsapp.authAgeMs) : "n/a"}
          </span>
        </div>
      </div>

      ${
        whatsapp?.lastError
          ? html`<div class="callout danger" style="margin-top: 12px;">
            ${whatsapp.lastError}
          </div>`
          : nothing
      }

      ${
        props.whatsappMessage
          ? html`<div class="callout" style="margin-top: 12px;">
            ${props.whatsappMessage}
          </div>`
          : nothing
      }

      ${
        props.whatsappQrDataUrl
          ? html`<div class="qr-wrap">
            <img src=${props.whatsappQrDataUrl} alt="WhatsApp QR" />
          </div>`
          : nothing
      }

      ${renderChannelConfigSection({
        channelId: "whatsapp",
        props,
        extraButtons: html`
          <button
            class="btn primary"
            ?disabled=${props.whatsappBusy}
            @click=${() => props.onWhatsAppStart(false)}
          >
            ${props.whatsappBusy ? t("channelsView.working") : t("channelsView.showQR")}
          </button>
          <button
            class="btn"
            ?disabled=${props.whatsappBusy}
            @click=${() => props.onWhatsAppStart(true)}
          >
            ${t("channelsView.relink")}
          </button>
          <button
            class="btn"
            ?disabled=${props.whatsappBusy}
            @click=${() => props.onWhatsAppWait()}
          >
            ${t("channelsView.waitForScan")}
          </button>
          <button
            class="btn danger"
            ?disabled=${props.whatsappBusy}
            @click=${() => props.onWhatsAppLogout()}
          >
            ${t("channelsView.logout")}
          </button>
          <button class="btn" @click=${() => props.onRefresh(true)}>
            ${t("shared.refresh")}
          </button>
        `,
      })}
    </div>
  `;
}
