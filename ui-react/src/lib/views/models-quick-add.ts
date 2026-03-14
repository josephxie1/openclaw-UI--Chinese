import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";

export interface ModelEntry {
  id: string;
  name: string;
  supportsImage?: boolean;
}

export interface QuickAddProviderForm {
  provider: string;
  baseUrl: string;
  api: string;
  apiKey: string;
  models: ModelEntry[];
}

export interface ModelsQuickAddProps {
  form: QuickAddProviderForm;
  busy: boolean;
  error: string | null;
  selectedPreset: string;
  selectedModelIds: Set<string>;
  onPresetChange: (presetId: string) => void;
  onPresetModelToggle: (modelId: string) => void;
  onPresetSelectAll: () => void;
  onFieldChange: (field: keyof Omit<QuickAddProviderForm, "models">, value: string) => void;
  onModelChange: (index: number, field: keyof ModelEntry, value: string | boolean) => void;
  onAddModel: () => void;
  onRemoveModel: (index: number) => void;
  onSubmit: () => void;
}

// ── Available Model Catalog ──

export interface PresetModel {
  id: string;
  name: string;
  supportsImage?: boolean;
  tag?: string; // e.g. "推荐", "free"
}

export interface ProviderPreset {
  id: string;
  label: string;
  provider: string;
  baseUrl: string;
  api: string;
  apiKeyUrl: string;
  models: PresetModel[];
  allowCustomModels?: boolean;
}

export const PROVIDER_PRESETS: ProviderPreset[] = [
  {
    id: "siliconflow",
    label: "硅基流动 SiliconFlow",
    provider: "siliconflow",
    baseUrl: "https://api.siliconflow.cn/v1",
    api: "openai-completions",
    apiKeyUrl: "https://siliconflow.cn/",
    allowCustomModels: true,
    models: [
      { id: "deepseek-ai/DeepSeek-V3.2", name: "DeepSeek V3.2", tag: "推荐" },
      { id: "Qwen/Qwen3-Coder", name: "Qwen3 Coder" },
      { id: "Pro/deepseek-ai/DeepSeek-R1", name: "DeepSeek R1" },
    ],
  },
  {
    id: "kimicode",
    label: "Kimi Code",
    provider: "kimicode",
    baseUrl: "https://api.kimi.com/coding",
    api: "anthropic-messages",
    apiKeyUrl: "https://www.kimi.com/code/console",
    models: [
      { id: "kimi-k2.5", name: "Kimi K2.5", tag: "推荐" },
    ],
  },
  {
    id: "google",
    label: "Google Gemini",
    provider: "google",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    api: "openai-completions",
    apiKeyUrl: "https://aistudio.google.com/app/apikey",
    models: [
      { id: "gemini-3-flash-preview", name: "Gemini 3 Flash", tag: "推荐", supportsImage: true },
      { id: "gemini-2.5-pro-preview-06-05", name: "Gemini 2.5 Pro", supportsImage: true },
      { id: "gemini-2.5-flash-preview-05-20", name: "Gemini 2.5 Flash", supportsImage: true },
    ],
  },
  {
    id: "openai",
    label: "OpenAI (GPT)",
    provider: "openai",
    baseUrl: "https://api.openai.com/v1",
    api: "openai-completions",
    apiKeyUrl: "https://platform.openai.com/api-keys",
    models: [
      { id: "gpt-5.2", name: "GPT-5.2", tag: "推荐", supportsImage: true },
      { id: "o3", name: "o3" },
      { id: "o4-mini", name: "o4-mini", supportsImage: true },
      { id: "gpt-4.1", name: "GPT-4.1", supportsImage: true },
    ],
  },
  {
    id: "anthropic",
    label: "Anthropic Claude",
    provider: "anthropic",
    baseUrl: "https://api.anthropic.com",
    api: "anthropic-messages",
    apiKeyUrl: "https://console.anthropic.com/settings/keys",
    models: [
      { id: "claude-opus-4-6", name: "Claude Opus 4.6", tag: "推荐", supportsImage: true },
      { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6", supportsImage: true },
      { id: "claude-haiku-3-5", name: "Claude Haiku 3.5", supportsImage: true },
    ],
  },
  {
    id: "minimax",
    label: "MiniMax",
    provider: "minimax",
    baseUrl: "https://api.minimaxi.com/anthropic",
    api: "anthropic-messages",
    apiKeyUrl: "https://platform.minimaxi.com/",
    models: [
      { id: "MiniMax-M2.5", name: "MiniMax M2.5", tag: "推荐" },
    ],
  },
  {
    id: "xai",
    label: "xAI Grok",
    provider: "xai",
    baseUrl: "https://api.x.ai/v1",
    api: "openai-completions",
    apiKeyUrl: "https://grok.com/api-keys",
    models: [
      { id: "grok-4.1", name: "Grok 4.1", tag: "推荐", supportsImage: true },
      { id: "grok-3", name: "Grok 3" },
    ],
  },
  {
    id: "openrouter",
    label: "OpenRouter",
    provider: "openrouter",
    baseUrl: "https://openrouter.ai/api/v1",
    api: "openai-completions",
    apiKeyUrl: "https://openrouter.ai/keys",
    allowCustomModels: true,
    models: [
      { id: "nvidia/nemotron-3-nano-30b-a3b:free", name: "NVIDIA Nemotron 3 Nano", tag: "free" },
    ],
  },
  {
    id: "coding-plan-cn",
    label: "智谱 Coding Plan",
    provider: "coding-plan-cn",
    baseUrl: "https://open.bigmodel.cn/api/coding/paas/v4",
    api: "openai-completions",
    apiKeyUrl: "https://bigmodel.cn/glm-coding",
    models: [
      { id: "glm-5", name: "GLM-5", tag: "推荐" },
      { id: "glm-4.7", name: "GLM-4.7" },
      { id: "glm-4.6", name: "GLM-4.6" },
      { id: "glm-4.5-air", name: "GLM-4.5 Air" },
    ],
  },
  {
    id: "fangzhou-coding-plan",
    label: "方舟 Coding Plan",
    provider: "fangzhou-coding-plan",
    baseUrl: "https://ark.cn-beijing.volces.com/api/coding/v3",
    api: "openai-completions",
    apiKeyUrl: "https://www.volcengine.com/activity/codingplan",
    models: [
      { id: "doubao-seed-code", name: "Doubao Seed Code", tag: "推荐" },
      { id: "kimi-k2.5", name: "Kimi K2.5", supportsImage: true },
      { id: "glm-4.7", name: "GLM-4.7" },
      { id: "deepseek-v3.2", name: "DeepSeek V3.2" },
      { id: "doubao-seed-2.0-code", name: "Doubao Seed 2.0 Code" },
      { id: "doubao-seed-2.0-pro", name: "Doubao Seed 2.0 Pro" },
      { id: "doubao-seed-2.0-lite", name: "Doubao Seed 2.0 Lite" },
      { id: "minimax-m2.5", name: "MiniMax M2.5" },
    ],
  },
  {
    id: "bailian-coding-plan",
    label: "百炼 Coding Plan",
    provider: "bailian-coding-plan",
    baseUrl: "https://coding.dashscope.aliyuncs.com/v1",
    api: "openai-completions",
    apiKeyUrl: "https://bailian.console.aliyun.com/cn-beijing/?tab=coding-plan#/efm/detail",
    models: [
      { id: "qwen3.5-plus", name: "Qwen 3.5 Plus", tag: "推荐", supportsImage: true },
      { id: "kimi-k2.5", name: "Kimi K2.5", supportsImage: true },
      { id: "glm-5", name: "GLM-5" },
      { id: "MiniMax-M2.5", name: "MiniMax M2.5" },
      { id: "qwen3-max-2026-01-23", name: "Qwen3 Max" },
      { id: "qwen3-coder-next", name: "Qwen3 Coder Next" },
      { id: "qwen3-coder-plus", name: "Qwen3 Coder Plus" },
      { id: "glm-4.7", name: "GLM-4.7" },
    ],
  },
];

const API_OPTIONS = [
  { value: "openai-completions", label: "OpenAI Completions" },
  { value: "anthropic-messages", label: "Anthropic Messages" },
];

export function renderModelsQuickAdd(props: ModelsQuickAddProps) {
  const { form, busy, error, selectedPreset, selectedModelIds } = props;
  const activePreset = PROVIDER_PRESETS.find((p) => p.id === selectedPreset);
  const isCustom = selectedPreset === "";

  const hasValidModel = isCustom
    ? form.models.some((m) => m.id.trim() !== "")
    : selectedModelIds.size > 0;
  const canSubmit =
    !busy &&
    form.provider.trim() !== "" &&
    form.baseUrl.trim() !== "" &&
    form.api.trim() !== "" &&
    form.apiKey.trim() !== "" &&
    hasValidModel;

  return html`
    <div class="quick-add-content">
      <div class="card-title">${t("modelsQuickAdd.title") ?? "模型提供商配置"}</div>
      <p class="quick-add__desc">${t("modelsQuickAdd.desc")}</p>

      <!-- Preset selector -->
      <div class="quick-add__presets">
        <button
          class="quick-add__preset-chip ${selectedPreset === "" ? "active" : ""}"
          @click=${() => props.onPresetChange("")}
        >
          ${t("modelsQuickAdd.custom")}
        </button>
        ${PROVIDER_PRESETS.map(
          (preset) => html`
            <button
              class="quick-add__preset-chip ${selectedPreset === preset.id ? "active" : ""}"
              @click=${() => props.onPresetChange(preset.id)}
            >
              ${preset.label}
            </button>
          `,
        )}
      </div>

      ${activePreset
        ? html`
            <a
              class="quick-add__api-key-link"
              href=${activePreset.apiKeyUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              🔑 ${t("modelsQuickAdd.getApiKey")} — ${activePreset.label}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14" style="vertical-align: middle; margin-left: 4px;">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
            </a>
          `
        : nothing}

      ${error
        ? html`<div class="quick-add__error">${error}</div>`
        : nothing}

      <div class="quick-add__grid">
        ${isCustom
          ? html`
              <!-- Provider Name (solo custom) -->
              <label class="quick-add__field">
                <span class="quick-add__label">${t("modelsQuickAdd.provider")}</span>
                <input
                  class="quick-add__input"
                  type="text"
                  placeholder="siliconflow"
                  .value=${form.provider}
                  @input=${(e: Event) =>
                    props.onFieldChange("provider", (e.target as HTMLInputElement).value)}
                />
              </label>

              <!-- Base URL (solo custom) -->
              <label class="quick-add__field">
                <span class="quick-add__label">${t("modelsQuickAdd.baseUrl")}</span>
                <input
                  class="quick-add__input"
                  type="text"
                  placeholder="https://api.siliconflow.cn/v1"
                  .value=${form.baseUrl}
                  @input=${(e: Event) =>
                    props.onFieldChange("baseUrl", (e.target as HTMLInputElement).value)}
                />
              </label>

              <!-- API Protocol (solo custom) -->
              <label class="quick-add__field">
                <span class="quick-add__label">${t("modelsQuickAdd.api")}</span>
                <select
                  class="quick-add__select"
                  .value=${form.api}
                  @change=${(e: Event) =>
                    props.onFieldChange("api", (e.target as HTMLSelectElement).value)}
                >
                  ${API_OPTIONS.map(
                    (opt) => html`
                      <option value=${opt.value} ?selected=${form.api === opt.value}>
                        ${opt.label}
                      </option>
                    `,
                  )}
                </select>
              </label>
            `
          : nothing}

        <!-- API Key (siempre visible, ancho completo para presets) -->
        <label class="quick-add__field" style=${isCustom ? "" : "grid-column: span 2"}>
          <span class="quick-add__label">${t("modelsQuickAdd.apiKey")}</span>
          <input
            class="quick-add__input"
            type="password"
            placeholder="sk-xxx"
            .value=${form.apiKey}
            @input=${(e: Event) =>
              props.onFieldChange("apiKey", (e.target as HTMLInputElement).value)}
          />
        </label>
      </div>

      <!-- Model selection: preset checkboxes vs custom manual input -->
      ${activePreset
        ? html`
            <div class="quick-add__models-section">
              <div class="quick-add__models-header">
                <span class="quick-add__label">
                  ${t("modelsQuickAdd.selectModels")}
                  <span class="quick-add__model-count">${selectedModelIds.size} / ${activePreset.models.length}</span>
                </span>
                <button class="quick-add__add-model-btn" @click=${props.onPresetSelectAll}>
                  ${selectedModelIds.size === activePreset.models.length
                    ? t("modelsQuickAdd.deselectAll")
                    : t("modelsQuickAdd.selectAll")}
                </button>
              </div>

              <div class="quick-add__model-checklist">
                ${activePreset.models.map(
                  (model) => html`
                    <label class="quick-add__model-check ${selectedModelIds.has(model.id) ? "checked" : ""}">
                      <input
                        type="checkbox"
                        .checked=${selectedModelIds.has(model.id)}
                        @change=${() => props.onPresetModelToggle(model.id)}
                      />
                      <span class="quick-add__model-check-name">${model.name}</span>
                      ${model.supportsImage
                        ? html`<span class="quick-add__model-tag image"><svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align: -1px;"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg> ${t("modelsQuickAdd.imageSupport")}</span>`
                        : nothing}
                      <code class="quick-add__model-check-id">${model.id}</code>
                      ${model.tag
                        ? html`<span class="quick-add__model-tag">${model.tag}</span>`
                        : nothing}
                    </label>
                  `,
                )}
              </div>
              ${activePreset.allowCustomModels
                ? html`
                  <div class="quick-add__models-header" style="margin-top: 12px;">
                    <span class="quick-add__label">自定义模型</span>
                    <button class="quick-add__add-model-btn" @click=${props.onAddModel}>
                      ＋ ${t("modelsQuickAdd.addModel")}
                    </button>
                  </div>
                  ${form.models.map(
                    (model, index) => html`
                      <div class="quick-add__model-row">
                        <input
                          class="quick-add__input"
                          type="text"
                          placeholder="provider/model-id"
                          .value=${model.id}
                          @input=${(e: Event) =>
                            props.onModelChange(index, "id", (e.target as HTMLInputElement).value)}
                        />
                        <input
                          class="quick-add__input"
                          type="text"
                          placeholder="${t("modelsQuickAdd.modelName")}"
                          .value=${model.name}
                          @input=${(e: Event) =>
                            props.onModelChange(index, "name", (e.target as HTMLInputElement).value)}
                        />
                        <button
                          type="button"
                          class="quick-add__image-toggle ${model.supportsImage ? "active" : ""}"
                          title="${t("modelsQuickAdd.imageSupport")}"
                          @click=${() =>
                            props.onModelChange(index, "supportsImage", !model.supportsImage)}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                            <circle cx="8.5" cy="8.5" r="1.5"></circle>
                            <polyline points="21 15 16 10 5 21"></polyline>
                          </svg>
                          <span>${t("modelsQuickAdd.imageToggle")}</span>
                        </button>
                        ${form.models.length > 1
                          ? html`
                              <button
                                class="quick-add__remove-model-btn"
                                @click=${() => props.onRemoveModel(index)}
                                title="${t("modelsQuickAdd.removeModel")}"
                              >
                                ✕
                              </button>
                            `
                          : nothing}
                      </div>
                    `,
                  )}
                `
                : nothing}
            </div>
          `
        : html`
            <div class="quick-add__models-section">
              <div class="quick-add__models-header">
                <span class="quick-add__label">${t("modelsQuickAdd.modelsTitle")}</span>
                <button class="quick-add__add-model-btn" @click=${props.onAddModel}>
                  ＋ ${t("modelsQuickAdd.addModel")}
                </button>
              </div>

              ${form.models.map(
                (model, index) => html`
                  <div class="quick-add__model-row">
                    <input
                      class="quick-add__input"
                      type="text"
                      placeholder="model-id"
                      .value=${model.id}
                      @input=${(e: Event) =>
                        props.onModelChange(index, "id", (e.target as HTMLInputElement).value)}
                    />
                    <input
                      class="quick-add__input"
                      type="text"
                      placeholder="${t("modelsQuickAdd.modelName")}"
                      .value=${model.name}
                      @input=${(e: Event) =>
                        props.onModelChange(index, "name", (e.target as HTMLInputElement).value)}
                    />
                    <button
                      type="button"
                      class="quick-add__image-toggle ${model.supportsImage ? "active" : ""}"
                      title="${t("modelsQuickAdd.imageSupport")}"
                      @click=${() =>
                        props.onModelChange(index, "supportsImage", !model.supportsImage)}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                        <circle cx="8.5" cy="8.5" r="1.5"></circle>
                        <polyline points="21 15 16 10 5 21"></polyline>
                      </svg>
                      <span>${t("modelsQuickAdd.imageToggle")}</span>
                    </button>
                    ${form.models.length > 1
                      ? html`
                          <button
                            class="quick-add__remove-model-btn"
                            @click=${() => props.onRemoveModel(index)}
                            title="${t("modelsQuickAdd.removeModel")}"
                          >
                            ✕
                          </button>
                        `
                      : nothing}
                  </div>
                `,
              )}
            </div>
          `}

      <div class="quick-add__actions">
        <button
          class="btn primary quick-add__submit"
          ?disabled=${!canSubmit}
          @click=${props.onSubmit}
        >
          ${busy ? t("modelsQuickAdd.adding") : t("modelsQuickAdd.addAndApply")}
        </button>
      </div>
    </div>
  `;
}
