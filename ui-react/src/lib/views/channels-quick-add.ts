import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import { renderDropdown } from "../components/dropdown.ts";
import type { DropdownGroup } from "../components/dropdown.ts";
import { generateRandomAvatars } from "../helpers/multiavatar.ts";

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
  modelGroups?: DropdownGroup[];
  availableAgents: Array<{ id: string; name: string }>;
  onToggle: () => void;
  onChannelTypeChange: (type: ChannelType) => void;
  onFieldChange: (field: keyof ChannelQuickAddForm, value: string | boolean) => void;
  onSubmit: () => void;
  agentDropdownOpen: boolean;
  onAgentDropdownToggle: () => void;
  modelDropdownOpen: boolean;
  modelDropdownExpandedGroups: Set<string>;
  onModelDropdownToggle: () => void;
  onModelDropdownGroupToggle: (label: string) => void;
}

// Generate initial random avatars
let randomAvatarOptions = generateRandomAvatars(8);

export function renderChannelsQuickAdd(props: ChannelsQuickAddProps) {
  const { form, expanded, busy, error, availableModels, availableAgents } = props;

  const isTelegram = form.channelType === "telegram";

  // Validate form
  const hasChannelInfo = isTelegram
    ? form.accountId.trim() !== "" && form.botToken.trim() !== ""
    : form.accountId.trim() !== "" && form.appId.trim() !== "" && form.appSecret.trim() !== "";
  const hasAgentInfo =
    !form.createAgent ||
    ((form.agentId.trim() !== "" || form.accountId.trim() !== "") && form.agentModel.trim() !== "");
  const canSubmit = !busy && hasChannelInfo && hasAgentInfo;

  return html`
    <section class="card channel-quick-add">
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

      ${
        expanded
          ? html`
            <div class="channel-quick-add__body">
              <!-- Channel type selector -->
              <div class="quick-add__presets" style="margin-top: 10px;">
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

              ${error ? html`<div class="quick-add__error">${error}</div>` : nothing}

              <!-- Channel account fields -->
              <div class="quick-add__grid" style="margin-top: 10px;">
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
                  <span class="quick-add__hint">${t("channelsQuickAdd.accountIdHint")}</span>
                </label>

                ${
                  isTelegram
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
                        <span class="quick-add__hint">${t("channelsQuickAdd.botTokenHint")}</span>
                      </label>
                      <div class="quick-add__tutorial-link" style="grid-column: span 2;">
                        <a href="https://xdclab-ai.feishu.cn/docx/VVvfdRizno06j3x9z3cc5Tc9nkh?from=from_copylink" target="_blank" rel="noopener noreferrer">
                          📖 Telegram 配置教程
                        </a>
                      </div>
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
                        <span class="quick-add__hint">${t("channelsQuickAdd.appIdHint")} <a href="https://open.feishu.cn/app?lang=zh-CN" target="_blank" rel="noopener noreferrer">${t("channelsQuickAdd.feishuConsoleLink")}</a></span>
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
                        <span class="quick-add__hint">${t("channelsQuickAdd.appSecretHint")}</span>
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
                        <span class="quick-add__hint">${t("channelsQuickAdd.botNameHint")}</span>
                      </label>
                      <div class="quick-add__tutorial-link" style="grid-column: span 2;">
                        <a href="https://xdclab-ai.feishu.cn/docx/TZScdTdmpoO7DPxzpGCcvAH8nRc?from=from_copylink" target="_blank" rel="noopener noreferrer">
                          📖 飞书配置教程
                        </a>
                      </div>
                    `
                }
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

                ${
                  form.createAgent
                    ? html`
                      <div class="channel-quick-add__agent-form">
                        <!-- Select existing or create new -->
                        <div class="quick-add__grid">
                          <div class="quick-add__field">
                            <span class="quick-add__label">${t("channelsQuickAdd.agentSelect")}</span>
                            ${renderDropdown({
                              value: form.agentId || null,
                              placeholder: t("channelsQuickAdd.newAgent") ?? "— 新建Agent —",
                              items: [
                                {
                                  value: "",
                                  label: t("channelsQuickAdd.newAgent") ?? "— 新建Agent —",
                                },
                                ...availableAgents.map((a) => ({
                                  value: a.id,
                                  label: `${a.name} (${a.id})`,
                                })),
                              ],
                              open: props.agentDropdownOpen,
                              onSelect: (val) => {
                                props.onFieldChange("agentId", val);
                                if (val && form.accountId.trim() === "") {
                                  props.onFieldChange("accountId", val);
                                }
                              },
                              onToggle: props.onAgentDropdownToggle,
                            })}
                          </div>

                          ${
                            form.agentId === ""
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
                                  <span class="quick-add__hint">${t("channelsQuickAdd.agentIdHint")}</span>
                                </label>
                                <label class="quick-add__field">
                                  <span class="quick-add__label">${t("channelsQuickAdd.agentName")}</span>
                                  <input
                                    class="quick-add__input"
                                    type="text"
                                    placeholder="${t("channelsQuickAdd.agentNamePlaceholder")}"
                                    .value=${form.agentName}
                                    @input=${(e: Event) =>
                                      props.onFieldChange(
                                        "agentName",
                                        (e.target as HTMLInputElement).value,
                                      )}
                                  />
                                  <span class="quick-add__hint">${t("channelsQuickAdd.agentNameHint")}</span>
                                </label>
                                 <label class="quick-add__field" style="grid-column: span 2;">
                                  <span class="quick-add__label">${t("channelsQuickAdd.avatar") ?? "头像"}</span>
                                  <div class="channel-quick-add__avatar-grid">
                                    ${randomAvatarOptions.map(
                                      (opt) => html`
                                        <button
                                          type="button"
                                          class="channel-quick-add__avatar-btn ${form.agentEmoji === opt.dataUri ? "active" : ""}"
                                          @click=${() => props.onFieldChange("agentEmoji", opt.dataUri)}
                                        >
                                          <img src=${opt.dataUri} alt="avatar" width="36" height="36" />
                                        </button>
                                      `,
                                    )}
                                    <!-- Custom image preview (shown when a file has been picked) -->
                                    ${form.agentEmoji && /^data:image\//i.test(form.agentEmoji) && !randomAvatarOptions.find(o => o.dataUri === form.agentEmoji)
                                      ? html`
                                        <button
                                          type="button"
                                          class="channel-quick-add__avatar-btn active"
                                          title="已选择本地图片"
                                        >
                                          <img src=${form.agentEmoji} alt="custom avatar" width="36" height="36" style="object-fit:cover;border-radius:4px;" />
                                        </button>
                                      `
                                      : ""}
                                    <button
                                      type="button"
                                      class="channel-quick-add__avatar-btn channel-quick-add__avatar-refresh"
                                      title="${t("channelsQuickAdd.refreshAvatars") ?? "换一批"}"
                                      @click=${() => {
                                        randomAvatarOptions = generateRandomAvatars(8);
                                        props.onFieldChange("agentEmoji", form.agentEmoji || "🤖");
                                      }}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                                    </button>
                                    <!-- File picker button -->
                                    <button
                                      type="button"
                                      class="channel-quick-add__avatar-btn channel-quick-add__avatar-upload"
                                      title="从本地文件选择"
                                      @click=${() => {
                                        const input = document.createElement("input");
                                        input.type = "file";
                                        input.accept = "image/*";
                                        input.onchange = () => {
                                          const file = input.files?.[0];
                                          if (!file) return;
                                          const reader = new FileReader();
                                          reader.onload = () => {
                                            if (typeof reader.result === "string") {
                                              props.onFieldChange("agentEmoji", reader.result);
                                            }
                                          };
                                          reader.readAsDataURL(file);
                                        };
                                        input.click();
                                      }}
                                    >
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                    </button>
                                  </div>
                                  <span class="quick-add__hint" style="margin-top:6px;">点击图片选择，
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" style="vertical-align:middle"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                                    换一批，
                                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" style="vertical-align:middle"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                                    上传本地图片</span>
                                </label>
                                <div class="quick-add__field" style="grid-column: span 2;">
                                  <span class="quick-add__label">${t("channelsQuickAdd.agentModel")}</span>
                                  ${renderDropdown({
                                    value: form.agentModel || null,
                                    placeholder: t("channelsQuickAdd.selectModel") ?? "选择模型",
                                    groups: props.modelGroups,
                                    items: props.modelGroups
                                      ? undefined
                                      : availableModels.map((m) => ({
                                          value: m.value,
                                          label: m.label,
                                        })),
                                    open: props.modelDropdownOpen,
                                    expandedGroups: props.modelDropdownExpandedGroups,
                                    onSelect: (val) => props.onFieldChange("agentModel", val),
                                    onToggle: props.onModelDropdownToggle,
                                    onGroupToggle: props.onModelDropdownGroupToggle,
                                  })}
                                </div>
                              `
                              : nothing
                          }
                        </div>
                      </div>
                    `
                    : nothing
                }
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
          : nothing
      }
    </section>
  `;
}
