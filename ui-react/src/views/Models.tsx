import React, { useCallback, useMemo } from "react";
import { html } from "lit";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { LitBridge } from "../components/LitBridge.tsx";
import { renderModelsQuickAdd, PROVIDER_PRESETS } from "../lib/views/models-quick-add.ts";
import "../lib/views/models-default-config.ts"; // registers <oc-default-model-config>
import {
  applyConfig,
  updateConfigFormValue,
} from "../lib/controllers/config.ts";
import type { DropdownGroup } from "../lib/components/dropdown.ts";


// ---- Models page with Quick-Add + Default Model Config ----

export function ModelsView() {
  const s = useAppStore;
  const form = s((st) => st.modelsQuickAddForm);
  const busy = s((st) => st.modelsQuickAddBusy);
  const error = s((st) => st.modelsQuickAddError);
  const preset = s((st) => st.modelsQuickAddPreset);
  const selectedIds = s((st) => st.modelsQuickAddSelectedIds);
  const configForm = s((st) => st.configForm);
  const configSaving = s((st) => st.configSaving);

  // ── Preset change ──
  const onPresetChange = useCallback((presetId: string) => {
    const st = s.getState();
    st.set({ modelsQuickAddPreset: presetId });
    if (presetId === "") {
      st.set({
        modelsQuickAddForm: {
          provider: "",
          baseUrl: "",
          api: "openai-completions",
          apiKey: "",
          models: [{ id: "", name: "" }],
        },
        modelsQuickAddSelectedIds: [],
      });
    } else {
      const p = PROVIDER_PRESETS.find((pp) => pp.id === presetId);
      if (p) {
        st.set({
          modelsQuickAddForm: {
            provider: p.provider,
            baseUrl: p.baseUrl,
            api: p.api,
            apiKey: st.modelsQuickAddForm.apiKey,
            models: [],
          },
          modelsQuickAddSelectedIds: p.models[0] ? [p.models[0].id] : [],
        });
      }
    }
  }, []);

  const onPresetModelToggle = useCallback((modelId: string) => {
    const st = s.getState();
    const ids = new Set(st.modelsQuickAddSelectedIds);
    if (ids.has(modelId)) ids.delete(modelId);
    else ids.add(modelId);
    st.set({ modelsQuickAddSelectedIds: [...ids] });
  }, []);

  const onPresetSelectAll = useCallback(() => {
    const st = s.getState();
    const p = PROVIDER_PRESETS.find((pp) => pp.id === st.modelsQuickAddPreset);
    if (!p) return;
    if (st.modelsQuickAddSelectedIds.length === p.models.length) {
      st.set({ modelsQuickAddSelectedIds: [] });
    } else {
      st.set({ modelsQuickAddSelectedIds: p.models.map((m) => m.id) });
    }
  }, []);

  const onFieldChange = useCallback((field: string, value: string) => {
    const st = s.getState();
    st.set({ modelsQuickAddForm: { ...st.modelsQuickAddForm, [field]: value } });
  }, []);

  const onModelChange = useCallback(
    (index: number, field: string, value: string | boolean) => {
      const st = s.getState();
      const models = [...st.modelsQuickAddForm.models];
      models[index] = { ...models[index], [field]: value };
      st.set({ modelsQuickAddForm: { ...st.modelsQuickAddForm, models } });
    },
    [],
  );

  const onAddModel = useCallback(() => {
    const st = s.getState();
    st.set({
      modelsQuickAddForm: {
        ...st.modelsQuickAddForm,
        models: [...st.modelsQuickAddForm.models, { id: "", name: "" }],
      },
    });
  }, []);

  const onRemoveModel = useCallback((index: number) => {
    const st = s.getState();
    const models = st.modelsQuickAddForm.models.filter((_, i) => i !== index);
    st.set({ modelsQuickAddForm: { ...st.modelsQuickAddForm, models } });
  }, []);

  const onSubmit = useCallback(async () => {
    const st = s.getState();
    const f = st.modelsQuickAddForm;
    const isCustom = st.modelsQuickAddPreset === "";

    let newModels: Array<{ id: string; name: string; input: string[] }>;
    if (isCustom) {
      newModels = f.models
        .filter((m) => m.id.trim() !== "")
        .map((m) => ({
          id: m.id.trim(),
          name: m.name.trim() || m.id.trim(),
          input: m.supportsImage ? ["text", "image"] : ["text"],
        }));
    } else {
      const p = PROVIDER_PRESETS.find((pp) => pp.id === st.modelsQuickAddPreset);
      const sel = new Set(st.modelsQuickAddSelectedIds);
      const presetModels = (p?.models ?? [])
        .filter((m) => sel.has(m.id))
        .map((m) => ({
          id: m.id,
          name: m.name,
          input: m.supportsImage ? ["text", "image"] : ["text"],
        }));
      // Incluir modelos custom si el preset lo permite
      const customModels = p?.allowCustomModels
        ? f.models
            .filter((m) => m.id.trim() !== "")
            .map((m) => ({
              id: m.id.trim(),
              name: m.name.trim() || m.id.trim(),
              input: m.supportsImage ? ["text", "image"] : ["text"],
            }))
        : [];
      newModels = [...presetModels, ...customModels];
    }

    if (!f.provider.trim() || !f.baseUrl.trim() || !f.api.trim() || !f.apiKey.trim() || newModels.length === 0) {
      st.set({ modelsQuickAddError: "请填写所有必填项并选择至少一个模型" });
      return;
    }

    st.set({ modelsQuickAddBusy: true, modelsQuickAddError: null });
    try {
      const providerObj: Record<string, unknown> = {
        baseUrl: f.baseUrl.trim(),
        apiKey: f.apiKey.trim(),
        api: f.api,
        models: newModels,
      };
      updateConfigFormValue(getReactiveState() as never, ["models", "mode"], "merge");

      const existing = (st.configForm as Record<string, unknown>)?.models as Record<string, unknown> | undefined;
      const existingProviders = (existing?.providers ?? {}) as Record<string, unknown>;
      const existingProvider = existingProviders[f.provider.trim()] as Record<string, unknown> | undefined;

      if (existingProvider && Array.isArray(existingProvider.models)) {
        providerObj.baseUrl = existingProvider.baseUrl ?? f.baseUrl.trim();
        providerObj.apiKey = existingProvider.apiKey ?? f.apiKey.trim();
        providerObj.api = existingProvider.api ?? f.api;
        const newIds = new Set(newModels.map((m) => m.id));
        const kept = (existingProvider.models as Array<{ id: string }>).filter((m) => !newIds.has(m.id));
        providerObj.models = [...kept, ...newModels];
      }

      updateConfigFormValue(getReactiveState() as never, ["models", "providers", f.provider.trim()], providerObj);
      await applyConfig(getReactiveState() as never);

      st.set({
        modelsQuickAddForm: {
          provider: "",
          baseUrl: "",
          api: "openai-completions",
          apiKey: "",
          models: [{ id: "", name: "" }],
        },
      });
    } catch (err) {
      st.set({ modelsQuickAddError: String(err) });
    } finally {
      st.set({ modelsQuickAddBusy: false });
    }
  }, []);

  // Build model groups for default model config
  const { modelGroups, visionModelGroups, hasVisionModels, curDef, curImg } = useMemo(() => {
    const cfgProviders = ((configForm as Record<string, unknown>)?.models as Record<string, unknown>)?.providers as
      | Record<string, unknown>
      | undefined;

    type MEntry = { id: string; name?: string; input?: string[] };
    const mg: DropdownGroup[] = [];
    const vmg: DropdownGroup[] = [];
    let hasVis = false;

    if (cfgProviders) {
      for (const [pid, pd] of Object.entries(cfgProviders)) {
        const ml = ((pd as Record<string, unknown>).models ?? []) as MEntry[];
        const allItems: Array<{ value: string; label: string }> = [];
        const visItems: Array<{ value: string; label: string }> = [];
        for (const m of ml) {
          const item = { value: `${pid}/${m.id}`, label: m.name || m.id };
          allItems.push(item);
          if (m.input?.includes("image")) {
            visItems.push(item);
            hasVis = true;
          }
        }
        if (allItems.length > 0) mg.push({ label: pid, items: allItems });
        if (visItems.length > 0) vmg.push({ label: pid, items: visItems });
      }
    }

    const agC = (configForm as Record<string, unknown>)?.agents as Record<string, unknown> | undefined;
    const dC = (agC?.defaults ?? {}) as Record<string, unknown>;
    const def =
      typeof dC.model === "string"
        ? dC.model
        : typeof dC.model === "object" && dC.model
          ? (((dC.model as Record<string, unknown>).primary as string) ?? "")
          : "";

    const tC = (configForm as Record<string, unknown>)?.tools as Record<string, unknown> | undefined;
    const mM = (((tC?.media ?? {}) as Record<string, unknown>).models ?? []) as Array<{
      provider?: string;
      model?: string;
    }>;
    const fm = mM[0];
    const img = fm ? `${fm.provider ?? ""}/${fm.model ?? ""}` : "";

    return { modelGroups: mg, visionModelGroups: vmg, hasVisionModels: hasVis, curDef: def, curImg: img };
  }, [configForm]);

  // Event handlers for default model config
  const onDefaultModelChange = useCallback((e: Event) => {
    const model = (e as CustomEvent).detail.model as string;
    updateConfigFormValue(getReactiveState() as never, ["agents", "defaults", "model"], model || undefined);
    void applyConfig(getReactiveState() as never);
  }, []);

  const onImageModelChange = useCallback((e: Event) => {
    const model = (e as CustomEvent).detail.model as string;
    if (!model) {
      updateConfigFormValue(getReactiveState() as never, ["tools", "media", "models"], []);
    } else {
      const [provider, ...rest] = model.split("/");
      const modelId = rest.join("/");
      updateConfigFormValue(getReactiveState() as never, ["tools", "media", "models"], [{ provider, model: modelId }]);
    }
    void applyConfig(getReactiveState() as never);
  }, []);

  const template = useMemo(
    () =>
      html`
        <div class="models-page">
          ${renderModelsQuickAdd({
            form,
            busy,
            error,
            selectedPreset: preset,
            selectedModelIds: new Set(selectedIds),
            onPresetChange,
            onPresetModelToggle,
            onPresetSelectAll,
            onFieldChange,
            onModelChange: onModelChange as never,
            onAddModel,
            onRemoveModel,
            onSubmit,
          })}
          <oc-default-model-config
            .modelGroups=${modelGroups}
            .visionModelGroups=${visionModelGroups}
            .currentDefaultModel=${curDef}
            .currentImageModel=${curImg}
            ?saving=${configSaving}
            ?hasVisionModels=${hasVisionModels}
            @default-model-change=${onDefaultModelChange}
            @image-model-change=${onImageModelChange}
          ></oc-default-model-config>
        </div>
      `,
    [
      form, busy, error, preset, selectedIds,
      modelGroups, visionModelGroups, curDef, curImg, configSaving, hasVisionModels,
      onPresetChange, onPresetModelToggle, onPresetSelectAll,
      onFieldChange, onModelChange, onAddModel, onRemoveModel, onSubmit,
      onDefaultModelChange, onImageModelChange,
    ],
  );

  return <LitBridge template={template} />;
}
