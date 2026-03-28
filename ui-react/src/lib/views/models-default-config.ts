import { LitElement, html, nothing } from "lit";
import { customElement, property, state } from "lit/decorators.js";
import { t } from "../../i18n/index.ts";
import { renderDropdown } from "../components/dropdown.ts";
import type { DropdownGroup, DropdownItem } from "../components/dropdown.ts";

export interface AllowlistModel {
  value: string;  // "provider/modelId"
  label: string;  // nombre para mostrar
  provider: string;
}

/**
 * Self-contained LitElement for default model configuration.
 * Manages its own dropdown open/close + expandedGroups state so
 * toggles only re-render this card, not the whole models page.
 *
 * Usage:
 *   <oc-default-model-config
 *     .modelGroups=${groups}
 *     .visionModelGroups=${vGroups}
 *     .currentDefaultModel=${"prov/id"}
 *     .currentImageModel=${"prov/id"}
 *     .allModels=${allModels}
 *     .allowedModels=${allowedSet}
 *     ?saving=${false}
 *     @default-model-change=${handler}
 *     @image-model-change=${handler}
 *     @allowlist-change=${handler}
 *   ></oc-default-model-config>
 */
@customElement("oc-default-model-config")
export class OcDefaultModelConfig extends LitElement {
  // ── External props (set by parent) ──
  @property({ type: Array }) modelGroups: DropdownGroup[] = [];
  @property({ type: Array }) visionModelGroups: DropdownGroup[] = [];
  @property({ type: String }) currentDefaultModel = "";
  @property({ type: String }) currentImageModel = "";
  @property({ type: Boolean }) saving = false;
  @property({ type: Boolean }) hasVisionModels = false;
  @property({ type: Array }) allModels: AllowlistModel[] = [];
  @property({ attribute: false }) allowedModels: Set<string> = new Set();
  @property({ type: String }) modelsMode = "merge";

  // ── Internal state (managed here → no parent re-render) ──
  @state() private _defOpen = false;
  @state() private _defExpanded = new Set<string>();
  @state() private _imgOpen = false;
  @state() private _imgExpanded = new Set<string>();

  createRenderRoot() {
    return this;
  }

  private _onAllowlistToggle(modelValue: string) {
    const next = new Set(this.allowedModels);
    if (next.has(modelValue)) {
      next.delete(modelValue);
    } else {
      next.add(modelValue);
    }
    this.dispatchEvent(
      new CustomEvent("allowlist-change", {
        detail: { allowed: [...next] },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onSelectAll() {
    const all = this.allModels.map((m) => m.value);
    this.dispatchEvent(
      new CustomEvent("allowlist-change", {
        detail: { allowed: all },
        bubbles: true,
        composed: true,
      }),
    );
  }

  private _onDeselectAll() {
    this.dispatchEvent(
      new CustomEvent("allowlist-change", {
        detail: { allowed: [] },
        bubbles: true,
        composed: true,
      }),
    );
  }

  render() {
    const disabledItem: DropdownItem = {
      value: "",
      label: t("defaultModelConfig.disabled") ?? "— 关闭 —",
    };

    // Agrupar modelos por provider para la sección de allowlist
    const byProvider = new Map<string, AllowlistModel[]>();
    for (const m of this.allModels) {
      const list = byProvider.get(m.provider) ?? [];
      list.push(m);
      byProvider.set(m.provider, list);
    }
    const allCount = this.allModels.length;
    const checkedCount = this.allowedModels.size;

    return html`
      <section class="card">
        <div>
          <div class="card-title">${t("defaultModelConfig.title") ?? "模型配置"}</div>
          <div class="card-sub">
            ${t("defaultModelConfig.subtitle") ?? "选择默认使用的主模型和图像理解模型"}
          </div>
        </div>
        <div style="display: grid; grid-template-columns: 1fr; gap: 16px; margin-top: 16px;">
          <!-- Selector de modo: merge / replace -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <span style="font-size: 13px; font-weight: 500;">
              ${t("defaultModelConfig.modeLabel") ?? "模型目录模式"}
            </span>
            <select
              class="model-allowlist__mode-select"
              .value=${this.modelsMode}
              ?disabled=${this.saving}
              @change=${(e: Event) => {
                const val = (e.target as HTMLSelectElement).value;
                this.dispatchEvent(
                  new CustomEvent("models-mode-change", {
                    detail: { mode: val },
                    bubbles: true,
                    composed: true,
                  }),
                );
              }}
            >
              <option value="merge" ?selected=${this.modelsMode === "merge"}>合并 (merge)</option>
              <option value="replace" ?selected=${this.modelsMode === "replace"}>替换 (replace)</option>
            </select>
            <span class="muted" style="font-size: 11px;">
              ${this.modelsMode === "merge"
                ? (t("defaultModelConfig.modeHintMerge") ?? "保留内置模型目录，追加自定义提供商")
                : (t("defaultModelConfig.modeHintReplace") ?? "仅使用自定义提供商，不加载内置模型")}
            </span>
          </div>
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <span style="font-size: 13px; font-weight: 500;">
              ${t("defaultModelConfig.primaryModel") ?? "主模型"}
            </span>
            ${renderDropdown({
              value: this.currentDefaultModel || null,
              placeholder: t("defaultModelConfig.notSet") ?? "— 未设置 —",
              groups: this.modelGroups,
              open: this._defOpen,
              disabled: this.saving,
              expandedGroups: this._defExpanded,
              onToggle: () => {
                this._defOpen = !this._defOpen;
                this._imgOpen = false;
                if (this._defOpen) {
                  const close = () => {
                    this._defOpen = false;
                  };
                  requestAnimationFrame(() =>
                    document.addEventListener("click", close, { once: true }),
                  );
                }
              },
              onSelect: (value: string) => {
                this._defOpen = false;
                this.dispatchEvent(
                  new CustomEvent("default-model-change", {
                    detail: { model: value },
                    bubbles: true,
                    composed: true,
                  }),
                );
              },
              onGroupToggle: (label: string) => {
                const s = new Set(this._defExpanded);
                if (s.has(label)) {
                  s.delete(label);
                } else {
                  s.add(label);
                }
                this._defExpanded = s;
              },
            })}
            <span class="muted" style="font-size: 11px;">
              ${t("defaultModelConfig.primaryModelHint") ?? "所有 Agent 默认使用的对话模型"}
            </span>
          </div>

          <!-- Sección de modelo de imagen -->
          <div style="display: flex; flex-direction: column; gap: 6px;">
            <span style="font-size: 13px; font-weight: 500;">
              ${t("defaultModelConfig.imageModel") ?? "图像理解模型"}
            </span>
            ${
              !this.hasVisionModels
                ? html`
                  <span class="muted" style="font-size: 11px;">
                    ${t("defaultModelConfig.noVisionModelsHint") ?? "请先添加支持图像输入的模型"}
                  </span>
                `
                : html`
                  ${renderDropdown({
                    value: this.currentImageModel || null,
                    placeholder: t("defaultModelConfig.disabled") ?? "— 关闭 —",
                    items: [disabledItem],
                    groups: this.visionModelGroups,
                    open: this._imgOpen,
                    disabled: this.saving,
                    expandedGroups: this._imgExpanded,
                    onToggle: () => {
                      this._imgOpen = !this._imgOpen;
                      this._defOpen = false;
                      if (this._imgOpen) {
                        const close = () => {
                          this._imgOpen = false;
                        };
                        requestAnimationFrame(() =>
                          document.addEventListener("click", close, { once: true }),
                        );
                      }
                    },
                    onSelect: (value: string) => {
                      this._imgOpen = false;
                      this.dispatchEvent(
                        new CustomEvent("image-model-change", {
                          detail: { model: value },
                          bubbles: true,
                          composed: true,
                        }),
                      );
                    },
                    onGroupToggle: (label: string) => {
                      const s = new Set(this._imgExpanded);
                      if (s.has(label)) {
                        s.delete(label);
                      } else {
                        s.add(label);
                      }
                      this._imgExpanded = s;
                    },
                  })}
                  <span class="muted" style="font-size: 11px;">
                    ${t("defaultModelConfig.imageModelHint") ?? "用于自动识别用户发送的图片内容"}
                  </span>
                `
            }
          </div>

          <!-- Sección de allowlist de modelos -->
          ${this.allModels.length > 0
            ? html`
              <div class="model-allowlist">
                <div class="model-allowlist__header">
                  <span style="font-size: 13px; font-weight: 500;">
                    ${t("defaultModelConfig.allowlistTitle") ?? "可用模型"}
                  </span>
                  <span class="model-allowlist__count">${checkedCount}/${allCount}</span>
                  <div class="model-allowlist__actions">
                    <button
                      type="button"
                      class="model-allowlist__action-btn"
                      ?disabled=${this.saving}
                      @click=${() => this._onSelectAll()}
                    >${t("defaultModelConfig.selectAll") ?? "全选"}</button>
                    <button
                      type="button"
                      class="model-allowlist__action-btn"
                      ?disabled=${this.saving}
                      @click=${() => this._onDeselectAll()}
                    >${t("defaultModelConfig.deselectAll") ?? "清空"}</button>
                  </div>
                </div>
                <div class="model-allowlist__list">
                  ${[...byProvider.entries()].map(([provider, models]) => html`
                    ${byProvider.size > 1
                      ? html`<div class="model-allowlist__provider-label">${provider}</div>`
                      : nothing}
                    ${models.map((m) => html`
                      <label class="model-allowlist__item" title=${m.value}>
                        <input
                          type="checkbox"
                          .checked=${this.allowedModels.has(m.value)}
                          ?disabled=${this.saving}
                          @change=${() => this._onAllowlistToggle(m.value)}
                        />
                        <span class="model-allowlist__label">${m.label}</span>
                        ${byProvider.size <= 1
                          ? nothing
                          : nothing}
                      </label>
                    `)}
                  `)}
                </div>
                <span class="muted" style="font-size: 11px;">
                  ${t("defaultModelConfig.allowlistHint") ?? "勾选的模型将出现在聊天模型切换器中"}
                </span>
              </div>
            `
            : nothing}
        </div>
      </section>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "oc-default-model-config": OcDefaultModelConfig;
  }
}
