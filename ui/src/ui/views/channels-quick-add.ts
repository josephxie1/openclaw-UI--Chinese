import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";

export type ChannelType = "telegram" | "feishu";

export interface ChannelQuickAddForm {
  channelType: ChannelType;
  accountId: string;
  // Telegram fields
  botToken: string;
  // Feishu fields
  appId: string;
  appSecret: string;
  botName: string;
  // Agent binding
  createAgent: boolean;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  agentModel: string;
}

export interface ChannelsQuickAddProps {
  form: ChannelQuickAddForm;
  expanded: boolean;
  busy: boolean;
  error: string | null;
  availableModels: Array<{ value: string; label: string }>;
  availableAgents: Array<{ id: string; name: string }>;
  onToggle: () => void;
  onChannelTypeChange: (type: ChannelType) => void;
  onFieldChange: (field: keyof ChannelQuickAddForm, value: string | boolean) => void;
  onSubmit: () => void;
}

const EMOJI_OPTIONS = ["🤖", "🧠", "💻", "✍️", "💝", "🍌", "🦞", "🎨", "📊", "🔧", "🎯", "🚀"];

export function renderChannelsQuickAdd(props: ChannelsQuickAddProps) {
  const { form, expanded, busy, error, availableModels, availableAgents } = props;

  const isTelegram = form.channelType === "telegram";

  // Validate form
  const hasChannelInfo = isTelegram
    ? form.accountId.trim() !== "" && form.botToken.trim() !== ""
    : form.accountId.trim() !== "" && form.appId.trim() !== "" && form.appSecret.trim() !== "";
  const hasAgentInfo = !form.createAgent || (form.agentId.trim() !== "" && form.agentModel.trim() !== "");
  const canSubmit = !busy && hasChannelInfo && hasAgentInfo;

  return html`
    <section class="card channel-quick-add" style="margin-bottom: 18px;">
      <div class="channel-quick-add__header" @click=${props.onToggle}>
        <div>
          <div class="card-title">${t("channelsQuickAdd.title")}</div>
          <div class="card-sub">${t("channelsQuickAdd.subtitle")}</div>
        </div>
        <span class="channel-quick-add__toggle ${expanded ? "open" : ""}">
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </span>
      </div>

      ${expanded
        ? html`
            <div class="channel-quick-add__body">
              <!-- Channel type selector -->
              <div class="quick-add__presets" style="margin-top: 16px;">
                <button
                  class="quick-add__preset-chip ${isTelegram ? "active" : ""}"
                  @click=${() => props.onChannelTypeChange("telegram")}
                >
                  Telegram
                </button>
                <button
                  class="quick-add__preset-chip ${!isTelegram ? "active" : ""}"
                  @click=${() => props.onChannelTypeChange("feishu")}
                >
                  ${t("channelsQuickAdd.feishu")}
                </button>
              </div>

              ${error
                ? html`<div class="quick-add__error">${error}</div>`
                : nothing}

              <!-- Channel account fields -->
              <div class="quick-add__grid" style="margin-top: 16px;">
                <label class="quick-add__field">
                  <span class="quick-add__label">${t("channelsQuickAdd.accountId")}</span>
                  <input
                    class="quick-add__input"
                    type="text"
                    placeholder="brainstorm"
                    .value=${form.accountId}
                    @input=${(e: Event) =>
                      props.onFieldChange("accountId", (e.target as HTMLInputElement).value)}
                  />
                </label>

                ${isTelegram
                  ? html`
                      <label class="quick-add__field" style="grid-column: span 2;">
                        <span class="quick-add__label">Bot Token</span>
                        <input
                          class="quick-add__input"
                          type="password"
                          placeholder="123456:ABC-DEF..."
                          .value=${form.botToken}
                          @input=${(e: Event) =>
                            props.onFieldChange("botToken", (e.target as HTMLInputElement).value)}
                        />
                      </label>
                    `
                  : html`
                      <label class="quick-add__field">
                        <span class="quick-add__label">App ID</span>
                        <input
                          class="quick-add__input"
                          type="text"
                          placeholder="cli_a9xxx"
                          .value=${form.appId}
                          @input=${(e: Event) =>
                            props.onFieldChange("appId", (e.target as HTMLInputElement).value)}
                        />
                      </label>
                      <label class="quick-add__field">
                        <span class="quick-add__label">App Secret</span>
                        <input
                          class="quick-add__input"
                          type="password"
                          placeholder=""
                          .value=${form.appSecret}
                          @input=${(e: Event) =>
                            props.onFieldChange("appSecret", (e.target as HTMLInputElement).value)}
                        />
                      </label>
                      <label class="quick-add__field">
                        <span class="quick-add__label">${t("channelsQuickAdd.botName")}</span>
                        <input
                          class="quick-add__input"
                          type="text"
                          placeholder="${t("channelsQuickAdd.botNamePlaceholder")}"
                          .value=${form.botName}
                          @input=${(e: Event) =>
                            props.onFieldChange("botName", (e.target as HTMLInputElement).value)}
                        />
                      </label>
                    `}
              </div>

              <!-- Agent binding section -->
              <div class="channel-quick-add__agent-section">
                <div class="quick-add__models-header">
                  <label class="channel-quick-add__agent-toggle">
                    <input
                      type="checkbox"
                      .checked=${form.createAgent}
                      @change=${(e: Event) =>
                        props.onFieldChange("createAgent", (e.target as HTMLInputElement).checked)}
                    />
                    <span class="quick-add__label">${t("channelsQuickAdd.bindAgent")}</span>
                  </label>
                </div>

                ${form.createAgent
                  ? html`
                      <div class="channel-quick-add__agent-form">
                        <!-- Select existing or create new -->
                        <div class="quick-add__grid">
                          <label class="quick-add__field">
                            <span class="quick-add__label">${t("channelsQuickAdd.agentSelect")}</span>
                            <select
                              class="quick-add__select"
                              .value=${form.agentId}
                              @change=${(e: Event) => {
                                const val = (e.target as HTMLSelectElement).value;
                                props.onFieldChange("agentId", val);
                                // Auto-fill accountId from agent ID
                                if (val && form.accountId.trim() === "") {
                                  props.onFieldChange("accountId", val);
                                }
                              }}
                            >
                              <option value="">${t("channelsQuickAdd.newAgent")}</option>
                              ${availableAgents.map(
                                (agent) => html`
                                  <option value=${agent.id} ?selected=${form.agentId === agent.id}>
                                    ${agent.name} (${agent.id})
                                  </option>
                                `,
                              )}
                            </select>
                          </label>

                          ${form.agentId === ""
                            ? html`
                                <!-- New agent fields -->
                                <label class="quick-add__field">
                                  <span class="quick-add__label">${t("channelsQuickAdd.agentId")}</span>
                                  <input
                                    class="quick-add__input"
                                    type="text"
                                    placeholder="brainstorm"
                                    .value=${form.accountId}
                                    readonly
                                  />
                                </label>
                                <label class="quick-add__field">
                                  <span class="quick-add__label">${t("channelsQuickAdd.agentName")}</span>
                                  <input
                                    class="quick-add__input"
                                    type="text"
                                    placeholder="${t("channelsQuickAdd.agentNamePlaceholder")}"
                                    .value=${form.agentName}
                                    @input=${(e: Event) =>
                                      props.onFieldChange("agentName", (e.target as HTMLInputElement).value)}
                                  />
                                </label>
                                <label class="quick-add__field">
                                  <span class="quick-add__label">Emoji</span>
                                  <div class="channel-quick-add__emoji-picker">
                                    ${EMOJI_OPTIONS.map(
                                      (emoji) => html`
                                        <button
                                          type="button"
                                          class="channel-quick-add__emoji-btn ${form.agentEmoji === emoji ? "active" : ""}"
                                          @click=${() => props.onFieldChange("agentEmoji", emoji)}
                                        >
                                          ${emoji}
                                        </button>
                                      `,
                                    )}
                                  </div>
                                </label>
                                <label class="quick-add__field" style="grid-column: span 2;">
                                  <span class="quick-add__label">${t("channelsQuickAdd.agentModel")}</span>
                                  <select
                                    class="quick-add__select"
                                    .value=${form.agentModel}
                                    @change=${(e: Event) =>
                                      props.onFieldChange("agentModel", (e.target as HTMLSelectElement).value)}
                                  >
                                    <option value="">${t("channelsQuickAdd.selectModel")}</option>
                                    ${availableModels.map(
                                      (m) => html`
                                        <option value=${m.value} ?selected=${form.agentModel === m.value}>
                                          ${m.label}
                                        </option>
                                      `,
                                    )}
                                  </select>
                                </label>
                              `
                            : nothing}
                        </div>
                      </div>
                    `
                  : nothing}
              </div>

              <div class="quick-add__actions">
                <button
                  class="btn primary quick-add__submit"
                  ?disabled=${!canSubmit}
                  @click=${props.onSubmit}
                >
                  ${busy ? t("channelsQuickAdd.adding") : t("channelsQuickAdd.addAndApply")}
                </button>
              </div>
            </div>
          `
        : nothing}
    </section>
  `;
}
