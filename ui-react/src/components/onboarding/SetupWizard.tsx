import React, { useCallback } from "react";
import { useAppStore } from "../../store/appStore.ts";
import { Dropdown } from "../Dropdown.tsx";
import { MultiDropdown } from "../MultiDropdown.tsx";
import { ChannelQuickAdd } from "../channels/ChannelQuickAdd.tsx";
import { PROVIDER_PRESETS } from "../../lib/views/models-quick-add.ts";
import type { QuickAddProviderForm } from "../../lib/views/models-quick-add.ts";
import { t } from "../../i18n/index.ts";

// Carga diferida de helpers de configuración para evitar dependencias circulares
async function getConfigHelpers() {
  const mod = await import("../../lib/controllers/config.ts");
  return {
    loadConfig: mod.loadConfig,
    applyConfig: mod.applyConfig,
    updateConfigFormValue: mod.updateConfigFormValue,
  };
}

const API_OPTIONS = [
  { value: "openai-completions", label: "OpenAI Completions" },
  { value: "anthropic-messages", label: "Anthropic Messages" },
];

const TOTAL_STEPS = 4;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function PasswordInput({
  value,
  onChange,
  visible,
  onToggle,
}: {
  value: string;
  onChange: (v: string) => void;
  visible: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="setup-wizard__password-wrap">
      <input
        className="setup-wizard__form-input setup-wizard__form-input--password"
        type={visible ? "text" : "password"}
        placeholder="sk-xxx"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button
        type="button"
        className="setup-wizard__eye-toggle"
        onClick={onToggle}
        title={visible ? "Hide" : "Show"}
      >
        {visible ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
            <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
            <line x1="1" y1="1" x2="23" y2="23" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        )}
      </button>
    </div>
  );
}

function StepIndicators({ current, total, isDone }: { current: number; total: number; isDone: boolean }) {
  return (
    <div className="setup-wizard__indicators">
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        const isActive = step === current;
        const isComplete = step < current || isDone;
        const dotClass = isActive
          ? "setup-wizard__step-dot--active"
          : isComplete
            ? "setup-wizard__step-dot--complete"
            : "setup-wizard__step-dot--inactive";
        return (
          <React.Fragment key={step}>
            {i > 0 && (
              <div className="setup-wizard__connector">
                <div
                  className="setup-wizard__connector-fill"
                  style={{ width: current > step || isDone ? "100%" : "0%" }}
                />
              </div>
            )}
            <button className={`setup-wizard__step-dot ${dotClass}`}>
              {isComplete && !isActive ? (
                <svg className="setup-wizard__check" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              ) : isActive ? (
                <div className="setup-wizard__step-dot-inner" />
              ) : (
                <span>{step}</span>
              )}
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 1: Welcome
// ---------------------------------------------------------------------------
function WelcomeStep() {
  return (
    <div className="setup-wizard__welcome">
      <div className="setup-wizard__welcome-logo">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M24 4c-7 0-13 4-16 10s-3 14 2 20c3 4 7 6 10 8l4 2 4-2c3-2 7-4 10-8 5-6 5-14 2-20S31 4 24 4z" />
          <circle cx="17" cy="20" r="2.5" fill="var(--accent)" stroke="none" />
          <circle cx="31" cy="20" r="2.5" fill="var(--accent)" stroke="none" />
          <path d="M18 30c2 3 4 4 6 4s4-1 6-4" />
        </svg>
      </div>
      <h2>{t("setupWizard.welcomeTitle")}</h2>
      <p>{t("setupWizard.welcomeDesc")}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 2: Model Config (uses Dropdown + MultiDropdown unified components)
// ---------------------------------------------------------------------------
function ModelStep({
  preset,
  selectedModelIds,
  apiKey,
  apiKeyVisible,
  customForm,
  presetDropdownOpen,
  modelDropdownOpen,
  onPresetSelect,
  onPresetDropdownToggle,
  onModelToggle,
  onModelDropdownToggle,
  onApiKeyChange,
  onApiKeyVisibilityToggle,
  onCustomFieldChange,
  onCustomModelChange,
  onCustomAddModel,
  onCustomRemoveModel,
}: {
  preset: string;
  selectedModelIds: string[];
  apiKey: string;
  apiKeyVisible: boolean;
  customForm: QuickAddProviderForm;
  presetDropdownOpen: boolean;
  modelDropdownOpen: boolean;
  onPresetSelect: (id: string) => void;
  onPresetDropdownToggle: () => void;
  onModelToggle: (id: string) => void;
  onModelDropdownToggle: () => void;
  onApiKeyChange: (v: string) => void;
  onApiKeyVisibilityToggle: () => void;
  onCustomFieldChange: (field: string, value: string) => void;
  onCustomModelChange: (index: number, field: string, value: string) => void;
  onCustomAddModel: () => void;
  onCustomRemoveModel: (index: number) => void;
}) {
  const isCustom = preset === "__custom__";
  const activePreset = PROVIDER_PRESETS.find((p) => p.id === preset);

  // Items del dropdown de proveedores
  const providerItems = [
    ...PROVIDER_PRESETS.map((p) => ({ value: p.id, label: p.label })),
    { value: "__custom__", label: t("modelsQuickAdd.custom") ?? "自定义" },
  ];

  // Items del multi-dropdown de modelos
  const modelItems = activePreset
    ? activePreset.models.map((m) => ({
        value: m.id,
        label: `${m.name}${m.tag ? ` (${m.tag})` : ""}`,
      }))
    : [];

  return (
    <div>
      <div className="setup-wizard__step-label">{t("setupWizard.step")} 1 / 2</div>
      <div className="setup-wizard__step-title">{t("setupWizard.modelTitle")}</div>

      {/* Selector de proveedor — componente Dropdown unificado */}
      <div className="setup-wizard__form-group">
        <label className="setup-wizard__form-label">{t("modelsQuickAdd.provider")}</label>
        <Dropdown
          value={preset || null}
          placeholder={t("setupWizard.selectProvider") ?? "选择模型供应商…"}
          items={providerItems}
          open={presetDropdownOpen}
          onSelect={(value) => onPresetSelect(value)}
          onToggle={onPresetDropdownToggle}
        />
      </div>

      {/* Selección de modelos — componente MultiDropdown */}
      {activePreset && (
        <>
          <div className="setup-wizard__form-group">
            <label className="setup-wizard__form-label">
              {t("modelsQuickAdd.selectModels")}
              <span className="setup-wizard__model-count">
                {selectedModelIds.length} / {activePreset.models.length}
              </span>
            </label>
            <MultiDropdown
              values={selectedModelIds}
              placeholder={t("setupWizard.selectModels") ?? "选择要添加的模型…"}
              items={modelItems}
              open={modelDropdownOpen}
              onToggleItem={(value) => onModelToggle(value)}
              onToggle={onModelDropdownToggle}
            />
          </div>

          <div className="setup-wizard__form-group">
            <label className="setup-wizard__form-label">
              API Key
              <a
                className="setup-wizard__api-key-link"
                href={activePreset.apiKeyUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
                </svg>
                {" "}{t("modelsQuickAdd.getApiKey")}
              </a>
            </label>
            <PasswordInput
              value={apiKey}
              onChange={onApiKeyChange}
              visible={apiKeyVisible}
              onToggle={onApiKeyVisibilityToggle}
            />
          </div>
        </>
      )}

      {/* Formulario custom */}
      {isCustom && (
        <>
          <div className="setup-wizard__form-group">
            <label className="setup-wizard__form-label">{t("modelsQuickAdd.provider")}</label>
            <input
              className="setup-wizard__form-input"
              type="text"
              placeholder="my-provider"
              value={customForm.provider}
              onChange={(e) => onCustomFieldChange("provider", e.target.value)}
            />
          </div>

          <div className="setup-wizard__form-group">
            <label className="setup-wizard__form-label">{t("modelsQuickAdd.baseUrl")}</label>
            <input
              className="setup-wizard__form-input"
              type="text"
              placeholder="https://api.example.com/v1"
              value={customForm.baseUrl}
              onChange={(e) => onCustomFieldChange("baseUrl", e.target.value)}
            />
          </div>

          <div className="setup-wizard__form-group">
            <label className="setup-wizard__form-label">{t("modelsQuickAdd.api")}</label>
            <Dropdown
              value={customForm.api}
              items={API_OPTIONS}
              open={false}
              onSelect={(v) => onCustomFieldChange("api", v)}
              onToggle={() => {}}
            />
          </div>

          <div className="setup-wizard__form-group">
            <label className="setup-wizard__form-label">API Key</label>
            <PasswordInput
              value={customForm.apiKey}
              onChange={(v) => onCustomFieldChange("apiKey", v)}
              visible={apiKeyVisible}
              onToggle={onApiKeyVisibilityToggle}
            />
          </div>

          <div className="setup-wizard__form-group">
            <label className="setup-wizard__form-label">
              {t("modelsQuickAdd.modelsTitle")}
              <button className="setup-wizard__add-model-btn" onClick={onCustomAddModel}>
                ＋ {t("modelsQuickAdd.addModel")}
              </button>
            </label>
            {customForm.models.map((model, index) => (
              <div key={index} className="setup-wizard__custom-model-row">
                <input
                  className="setup-wizard__form-input"
                  type="text"
                  placeholder="model-id"
                  value={model.id}
                  onChange={(e) => onCustomModelChange(index, "id", e.target.value)}
                />
                <input
                  className="setup-wizard__form-input"
                  type="text"
                  placeholder={t("modelsQuickAdd.modelName") ?? "模型名称"}
                  value={model.name}
                  onChange={(e) => onCustomModelChange(index, "name", e.target.value)}
                />
                {customForm.models.length > 1 && (
                  <button
                    className="setup-wizard__remove-model-btn"
                    onClick={() => onCustomRemoveModel(index)}
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 3: Channel Config (reuses ChannelQuickAdd component)
// ---------------------------------------------------------------------------
function ChannelStep() {
  const s = useAppStore.getState;
  const set = useAppStore((st) => st.set);

  const form = useAppStore((st) => st.channelQuickAddForm);
  const busy = useAppStore((st) => st.channelQuickAddBusy);
  const error = useAppStore((st) => st.channelQuickAddError);
  const configForm = useAppStore((st) => st.configForm);
  const agentDropdownOpen = useAppStore((st) => st.chAgentDropdownOpen);
  const modelDropdownOpen = useAppStore((st) => st.chModelDropdownOpen);
  const modelDropdownExpandedGroups = useAppStore((st) => st.chModelDropdownExpandedGroups);

  // Construir modelos disponibles desde la configuración
  const modelsSection = configForm?.models as Record<string, unknown> | undefined;
  const providersObj = modelsSection?.providers as Record<string, unknown> | undefined;
  const availableModels: Array<{ value: string; label: string }> = [];
  if (providersObj) {
    for (const [provId, provData] of Object.entries(providersObj)) {
      const prov = provData as Record<string, unknown>;
      const models = prov.models as Array<{ id: string; name?: string }> | undefined;
      if (models) {
        for (const m of models) {
          availableModels.push({
            value: `${provId}/${m.id}`,
            label: `${provId}/${m.name || m.id}`,
          });
        }
      }
    }
  }

  const modelGroups = providersObj
    ? Object.entries(providersObj)
        .map(([provId, provData]) => {
          const prov = provData as Record<string, unknown>;
          const models = (prov.models as Array<{ id: string; name?: string }>) ?? [];
          return {
            label: provId,
            items: models.map((m) => ({
              value: `${provId}/${m.id}`,
              label: m.name || m.id,
            })),
          };
        })
        .filter((g) => g.items.length > 0)
    : [];

  // Construir agentes disponibles
  const agentsObj = configForm?.agents as Record<string, unknown> | undefined;
  const agentsList = (agentsObj?.list ?? []) as Array<{
    id: string;
    identity?: { name?: string };
  }>;
  const availableAgents = agentsList.map((a) => ({
    id: a.id,
    name: a.identity?.name ?? a.id,
  }));

  return (
    <div>
      <div className="setup-wizard__step-label">{t("setupWizard.step")} 2 / 2</div>
      <div className="setup-wizard__step-title">{t("setupWizard.channelTitle")}</div>
      <p style={{ color: "var(--muted)", fontSize: "0.85rem", margin: "0 0 1rem" }}>
        {t("setupWizard.channelDesc")}
      </p>
      <ChannelQuickAdd
        form={form}
        expanded={true}
        busy={busy}
        error={error}
        availableModels={availableModels}
        modelGroups={modelGroups}
        availableAgents={availableAgents}
        onToggle={() => {}}
        onChannelTypeChange={(type) => {
          set({ channelQuickAddForm: { ...s().channelQuickAddForm, channelType: type } });
        }}
        onFieldChange={(field, value) => {
          set({ channelQuickAddForm: { ...s().channelQuickAddForm, [field]: value } });
        }}
        agentDropdownOpen={agentDropdownOpen}
        onAgentDropdownToggle={() => {
          const next = !s().chAgentDropdownOpen;
          set({ chAgentDropdownOpen: next });
          if (next) {
            const close = () => {
              set({ chAgentDropdownOpen: false });
              document.removeEventListener("click", close);
            };
            requestAnimationFrame(() =>
              document.addEventListener("click", close, { once: true }),
            );
          }
        }}
        modelDropdownOpen={modelDropdownOpen}
        modelDropdownExpandedGroups={modelDropdownExpandedGroups}
        onModelDropdownToggle={() => {
          const next = !s().chModelDropdownOpen;
          set({ chModelDropdownOpen: next });
          if (next) {
            const close = () => {
              set({ chModelDropdownOpen: false });
              document.removeEventListener("click", close);
            };
            requestAnimationFrame(() =>
              document.addEventListener("click", close, { once: true }),
            );
          }
        }}
        onModelDropdownGroupToggle={(label) => {
          const nextSet = new Set(s().chModelDropdownExpandedGroups ?? new Set());
          if (nextSet.has(label)) {
            nextSet.delete(label);
          } else {
            nextSet.add(label);
          }
          set({ chModelDropdownExpandedGroups: nextSet });
        }}
        onSubmit={() => {}}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Step 4: Done
// ---------------------------------------------------------------------------
function DoneStep() {
  return (
    <div className="setup-wizard__done">
      <div className="setup-wizard__done-icon">
        <svg viewBox="0 0 48 48" width="48" height="48" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="24" cy="24" r="20" />
          <path d="M14 24l6 6 14-14" />
        </svg>
      </div>
      <h2>{t("setupWizard.doneTitle")}</h2>
      <p>{t("setupWizard.doneDesc")}</p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Wizard Component
// ---------------------------------------------------------------------------
export function SetupWizard() {
  const s = useAppStore.getState;
  const set = useAppStore((st) => st.set);

  // Wizard state
  const wizardStep = useAppStore((st) => st.wizardStep);
  const wizardDirection = useAppStore((st) => st.wizardDirection);
  const wizardAnimating = useAppStore((st) => st.wizardAnimating);
  const wizardSaving = useAppStore((st) => st.wizardSaving);
  const wizardApiKeyVisible = useAppStore((st) => st.wizardApiKeyVisible);
  const wizardPresetDropdownOpen = useAppStore((st) => st.wizardPresetDropdownOpen);
  const wizardModelDropdownOpen = useAppStore((st) => st.wizardModelDropdownOpen);

  // Model config state
  const modelsQuickAddPreset = useAppStore((st) => st.modelsQuickAddPreset);
  const modelsQuickAddSelectedIds = useAppStore((st) => st.modelsQuickAddSelectedIds);
  const modelsQuickAddForm = useAppStore((st) => st.modelsQuickAddForm);

  const isDone = wizardStep > TOTAL_STEPS;

  // Validación del paso de modelos
  const isCustom = modelsQuickAddPreset === "__custom__";
  const activePreset = PROVIDER_PRESETS.find((p) => p.id === modelsQuickAddPreset);
  const modelStepValid = isCustom
    ? !!(
        modelsQuickAddForm.provider.trim() &&
        modelsQuickAddForm.baseUrl.trim() &&
        modelsQuickAddForm.apiKey.trim() &&
        modelsQuickAddForm.models.some((m) => m.id.trim())
      )
    : !!(activePreset && modelsQuickAddSelectedIds.length > 0 && modelsQuickAddForm.apiKey.trim());

  // ── Handlers ──

  const handlePresetSelect = useCallback((presetId: string) => {
    const state = s();
    if (presetId === "__custom__") {
      set({
        modelsQuickAddPreset: presetId,
        modelsQuickAddForm: {
          provider: "",
          baseUrl: "",
          api: "openai-completions",
          apiKey: "",
          models: [{ id: "", name: "" }],
        },
        modelsQuickAddSelectedIds: [],
        wizardPresetDropdownOpen: false,
      });
    } else {
      const preset = PROVIDER_PRESETS.find((p) => p.id === presetId);
      if (preset) {
        const first = preset.models[0];
        set({
          modelsQuickAddPreset: presetId,
          modelsQuickAddForm: {
            provider: preset.provider,
            baseUrl: preset.baseUrl,
            api: preset.api,
            apiKey: state.modelsQuickAddForm.apiKey,
            models: [],
          },
          modelsQuickAddSelectedIds: first ? [first.id] : [],
          wizardPresetDropdownOpen: false,
        });
      }
    }
  }, [s, set]);

  const handlePresetDropdownToggle = useCallback(() => {
    const next = !s().wizardPresetDropdownOpen;
    set({ wizardPresetDropdownOpen: next });
    if (next) {
      set({ wizardModelDropdownOpen: false });
    }
  }, [s, set]);

  const handleModelToggle = useCallback((modelId: string) => {
    const ids = new Set(s().modelsQuickAddSelectedIds);
    if (ids.has(modelId)) {
      ids.delete(modelId);
    } else {
      ids.add(modelId);
    }
    set({ modelsQuickAddSelectedIds: [...ids] });
  }, [s, set]);

  const handleModelDropdownToggle = useCallback(() => {
    const next = !s().wizardModelDropdownOpen;
    set({ wizardModelDropdownOpen: next });
    if (next) {
      set({ wizardPresetDropdownOpen: false });
    }
  }, [s, set]);

  const handleApiKeyChange = useCallback((value: string) => {
    set({ modelsQuickAddForm: { ...s().modelsQuickAddForm, apiKey: value } });
  }, [s, set]);

  const handleApiKeyVisibilityToggle = useCallback(() => {
    set({ wizardApiKeyVisible: !s().wizardApiKeyVisible });
  }, [s, set]);

  const handleCustomFieldChange = useCallback((field: string, value: string) => {
    set({ modelsQuickAddForm: { ...s().modelsQuickAddForm, [field]: value } });
  }, [s, set]);

  const handleCustomModelChange = useCallback((index: number, field: string, value: string) => {
    const models = [...s().modelsQuickAddForm.models];
    models[index] = { ...models[index], [field]: value };
    set({ modelsQuickAddForm: { ...s().modelsQuickAddForm, models } });
  }, [s, set]);

  const handleCustomAddModel = useCallback(() => {
    const form = s().modelsQuickAddForm;
    set({ modelsQuickAddForm: { ...form, models: [...form.models, { id: "", name: "" }] } });
  }, [s, set]);

  const handleCustomRemoveModel = useCallback((index: number) => {
    const form = s().modelsQuickAddForm;
    set({ modelsQuickAddForm: { ...form, models: form.models.filter((_, i) => i !== index) } });
  }, [s, set]);

  // Guardar configuración de modelo al avanzar desde el paso 2
  const saveModelConfig = useCallback(async () => {
    const state = s();
    const f = state.modelsQuickAddForm;
    const isCustomLocal = state.modelsQuickAddPreset === "__custom__";
    let newModels: Array<{ id: string; name: string; input: string[] }>;

    if (isCustomLocal) {
      newModels = f.models
        .filter((m) => m.id.trim() !== "")
        .map((m) => ({
          id: m.id.trim(),
          name: m.name.trim() || m.id.trim(),
          input: m.supportsImage ? ["text", "image"] : ["text"],
        }));
    } else {
      const preset = PROVIDER_PRESETS.find((p) => p.id === state.modelsQuickAddPreset);
      const selectedIds = new Set(state.modelsQuickAddSelectedIds);
      newModels = (preset?.models ?? [])
        .filter((m) => selectedIds.has(m.id))
        .map((m) => ({
          id: m.id,
          name: m.name,
          input: m.supportsImage ? ["text", "image"] : ["text"],
        }));
    }

    if (!f.provider.trim() || !f.apiKey.trim() || newModels.length === 0) {
      console.warn("Wizard: skipping model config save – missing provider/apiKey/models");
      return;
    }

    try {
      const { loadConfig, updateConfigFormValue } = await getConfigHelpers();
      const { getReactiveState } = await import("../../store/appStore.ts");
      const reactive = getReactiveState();

      // Verificar conexión al gateway
      console.log("Wizard: client connected?", !!reactive.client, !!reactive.connected);
      if (!reactive.client || !reactive.connected) {
        console.warn("Wizard: gateway not connected, cannot save model config");
        return;
      }

      // Cargar snapshot de configuración si no existe
      if (!(reactive.configSnapshot as Record<string, unknown>)?.hash) {
        console.log("Wizard: loading config snapshot...");
        await loadConfig(reactive as never);
        // Esperar a que el microtask flush sincronice los datos
        await new Promise((r) => setTimeout(r, 50));
      }

      const snapshot = reactive.configSnapshot as Record<string, unknown>;
      if (!snapshot?.hash) {
        console.error("Wizard: config snapshot still missing after load");
        return;
      }
      console.log("Wizard: config snapshot loaded, hash=", snapshot.hash);

      // Aplicar cambios de modelo al config form
      const providerObj: Record<string, unknown> = {
        baseUrl: f.baseUrl.trim(),
        apiKey: f.apiKey.trim(),
        api: f.api,
        models: newModels,
      };
      updateConfigFormValue(reactive as never, ["models", "mode"], "merge");
      updateConfigFormValue(reactive as never, ["models", "providers", f.provider.trim()], providerObj);

      const firstModel = `${f.provider.trim()}/${newModels[0].id}`;
      updateConfigFormValue(reactive as never, ["agents", "defaults", "model"], firstModel);

      const visionModel = newModels.find((m) => m.input?.includes("image"));
      if (visionModel) {
        updateConfigFormValue(
          reactive as never,
          ["tools", "media", "models"],
          [{ provider: f.provider.trim(), model: visionModel.id }],
        );
      }

      // Forzar flush de los patches pendientes al Zustand store
      await new Promise((r) => setTimeout(r, 50));
      console.log("Wizard: model config prepared, configFormDirty=", reactive.configFormDirty);
    } catch (err) {
      console.error("Wizard: failed to prepare model config", err);
    }
  }, [s]);

  const handleNext = useCallback(async () => {
    const state = s();
    if (state.wizardStep === 2) {
      await saveModelConfig();
    }
    set({
      wizardDirection: 1,
      wizardAnimating: true,
      wizardStep: state.wizardStep + 1,
    });
  }, [s, set, saveModelConfig]);

  const handleBack = useCallback(() => {
    set({
      wizardDirection: -1,
      wizardAnimating: true,
      wizardStep: s().wizardStep - 1,
    });
  }, [s, set]);

  const handleSkip = useCallback(() => {
    set({
      wizardDirection: 1,
      wizardAnimating: true,
      wizardStep: s().wizardStep + 1,
    });
  }, [s, set]);

  const handleComplete = useCallback(async () => {
    set({ wizardSaving: true });
    try {
      const { loadConfig, applyConfig } = await getConfigHelpers();
      const reactive = (await import("../../store/appStore.ts")).getReactiveState();
      if (!(reactive.configSnapshot as Record<string, unknown>)?.hash) {
        await loadConfig(reactive as never);
      }
      if ((reactive.configSnapshot as Record<string, unknown>)?.hash) {
        await applyConfig(reactive as never);
        await new Promise((r) => setTimeout(r, 2500));
      }
    } catch (err) {
      console.error("Wizard: failed to save config", err);
    } finally {
      set({ wizardSaving: false });
    }
    set({ onboarding: false, wizardStep: 1 });
    const state = s();
    if (state.tab !== "chat") {
      set({ tab: "chat" as never });
    }
    // Notificar al proceso principal de Desktop
    const dsk = (window as unknown as Record<string, unknown>).desktop as
      | { onboardingDone?: () => void }
      | undefined;
    dsk?.onboardingDone?.();
  }, [s, set]);

  const handleAnimationEnd = useCallback(() => {
    set({ wizardAnimating: false });
  }, [set]);

  // ── Render ──

  const isFirst = wizardStep === 1;
  const isLast = wizardStep === TOTAL_STEPS;

  const slideClass = wizardAnimating
    ? wizardDirection > 0
      ? "setup-wizard__slide--enter-left"
      : "setup-wizard__slide--enter-right"
    : "";

  return (
    <div className="setup-wizard">
      <div className="setup-wizard__container">
        <StepIndicators current={wizardStep} total={TOTAL_STEPS} isDone={isDone} />

        {wizardSaving && (
          <div className="setup-wizard__saving-overlay">
            <div className="setup-wizard__saving-spinner" />
            <p>{t("setupWizard.saving") ?? "正在保存配置…"}</p>
          </div>
        )}

        <div className="setup-wizard__content">
          <div
            className={`setup-wizard__slide ${slideClass}`}
            onAnimationEnd={handleAnimationEnd}
          >
            {wizardStep === 1 && <WelcomeStep />}
            {wizardStep === 2 && (
              <ModelStep
                preset={modelsQuickAddPreset}
                selectedModelIds={modelsQuickAddSelectedIds}
                apiKey={modelsQuickAddForm.apiKey}
                apiKeyVisible={wizardApiKeyVisible}
                customForm={modelsQuickAddForm}
                presetDropdownOpen={wizardPresetDropdownOpen}
                modelDropdownOpen={wizardModelDropdownOpen}
                onPresetSelect={handlePresetSelect}
                onPresetDropdownToggle={handlePresetDropdownToggle}
                onModelToggle={handleModelToggle}
                onModelDropdownToggle={handleModelDropdownToggle}
                onApiKeyChange={handleApiKeyChange}
                onApiKeyVisibilityToggle={handleApiKeyVisibilityToggle}
                onCustomFieldChange={handleCustomFieldChange}
                onCustomModelChange={handleCustomModelChange}
                onCustomAddModel={handleCustomAddModel}
                onCustomRemoveModel={handleCustomRemoveModel}
              />
            )}
            {wizardStep === 3 && <ChannelStep />}
            {wizardStep >= 4 && <DoneStep />}
          </div>
        </div>

        {/* Footer con navegación */}
        {!isDone && (
          <div className={`setup-wizard__footer ${!isFirst ? "setup-wizard__footer--spread" : ""}`}>
            {!isFirst && (
              <button className="setup-wizard__btn-back" onClick={handleBack}>
                {t("setupWizard.back")}
              </button>
            )}
            <div style={{ display: "flex", gap: "0.5rem" }}>
              {/* Botón "跳过" solo en paso 3 (canal es opcional) */}
              {wizardStep === 3 && (
                <button className="setup-wizard__btn-skip" onClick={handleSkip}>
                  {t("setupWizard.skip")}
                </button>
              )}
              {isLast ? (
                <button className="setup-wizard__btn-next" onClick={handleComplete}>
                  {t("setupWizard.finish")}
                </button>
              ) : wizardStep === 2 ? (
                <button
                  className="setup-wizard__btn-next"
                  disabled={!modelStepValid}
                  onClick={handleNext}
                >
                  {t("setupWizard.next")}
                </button>
              ) : (
                <button className="setup-wizard__btn-next" onClick={handleNext}>
                  {wizardStep === 1 ? t("setupWizard.start") : t("setupWizard.next")}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
