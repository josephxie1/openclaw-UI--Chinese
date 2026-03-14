import React from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { LitBridge } from "../components/LitBridge.tsx";
import { renderConfig } from "../lib/views/config.ts";
import {
  applyConfig,
  loadConfig,
  loadConfigRaw,
  runUpdate,
  saveConfig,
  updateConfigFormValue,
} from "../lib/controllers/config.ts";

export function ConfigView() {
  const s = useAppStore;
  const raw = s((st) => st.configRaw);
  const originalRaw = s((st) => st.configRawOriginal);
  const valid = s((st) => st.configValid);
  const issues = s((st) => st.configIssues);
  const loading = s((st) => st.configLoading);
  const saving = s((st) => st.configSaving);
  const applying = s((st) => st.configApplying);
  const updating = s((st) => st.updateRunning);
  const connected = s((st) => st.connected);
  const schema = s((st) => st.configSchema);
  const schemaLoading = s((st) => st.configSchemaLoading);
  const configForm = s((st) => st.configForm);
  const configFormOriginal = s((st) => st.configFormOriginal);
  const configFormMode = s((st) => st.configFormMode);
  const configSearchQuery = s((st) => st.configSearchQuery);
  const activeSection = s((st) => st.configActiveSection);
  const activeSubsection = s((st) => st.configActiveSubsection);
  const uiHints = s((st) => st.configUiHints);
  const configRawLoading = s((st) => st.configRawLoading);
  const set = s((st) => st.set);

  const template = React.useMemo(
    () =>
      renderConfig({
        raw,
        originalRaw,
        valid,
        issues,
        loading,
        saving,
        applying,
        updating,
        connected,
        schema,
        schemaLoading,
        uiHints,
        formMode: configFormMode,
        configRawLoading,
        formValue: configForm,
        originalValue: configFormOriginal,
        searchQuery: configSearchQuery,
        activeSection,
        activeSubsection,
        onRawChange: (next: string) => {
          const rs = getReactiveState();
          rs.configRaw = next;
        },
        onFormModeChange: (mode: "form" | "raw") => {
          const rs = getReactiveState();
          rs.configFormMode = mode;
        },
        onLoadRaw: () => void loadConfigRaw(getReactiveState() as never),
        onFormPatch: (path: Array<string | number>, value: unknown) =>
          updateConfigFormValue(getReactiveState() as never, path, value),
        onSearchChange: (query: string) => {
          const rs = getReactiveState();
          rs.configSearchQuery = query;
        },
        onSectionChange: (section: string | null) => {
          set({ configActiveSection: section, configActiveSubsection: null });
        },
        onSubsectionChange: (sub: string | null) => set({ configActiveSubsection: sub }),
        onReload: () => void loadConfig(getReactiveState() as never),
        onSave: () => void saveConfig(getReactiveState() as never),
        onApply: () => void applyConfig(getReactiveState() as never),
        onUpdate: () => void runUpdate(getReactiveState() as never),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [raw, originalRaw, valid, issues, loading, saving, applying, updating, connected, schema, schemaLoading, configForm, configFormOriginal, configFormMode, configSearchQuery, activeSection, activeSubsection, uiHints, configRawLoading],
  );

  return <LitBridge template={template} />;
}
