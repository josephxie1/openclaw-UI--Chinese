import React, { useEffect, useRef, useCallback } from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import {
  applyConfig,
  loadConfig,
  runUpdate,
  saveConfig,
} from "../lib/controllers/config.ts";
import "../styles/json-edit.css";

export function JsonEditView() {
  const s = useAppStore;
  const configForm = s((st) => st.configForm);
  const configLoading = s((st) => st.configLoading);
  const configSaving = s((st) => st.configSaving);
  const configApplying = s((st) => st.configApplying);
  const updateRunning = s((st) => st.updateRunning);
  const connected = s((st) => st.connected);
  const set = s((st) => st.set);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const originalRef = useRef<string>("");
  const [rawContent, setRawContent] = React.useState<string>("");
  const [parseError, setParseError] = React.useState<string | null>(null);

  // Derivar JSON desde configForm cuando se carga
  useEffect(() => {
    if (configForm && typeof configForm === "object") {
      try {
        const json = JSON.stringify(configForm, null, 2);
        setRawContent(json);
        originalRef.current = json;
        setParseError(null);
      } catch {
        // Config demasiado grande
      }
    }
  }, [configForm]);

  // Asegurar modo raw para saveConfig
  useEffect(() => {
    const rs = getReactiveState();
    rs.configFormMode = "raw";
  }, []);

  const isDirty = rawContent !== originalRef.current;

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setRawContent(val);
    // Validar JSON en tiempo real
    try {
      JSON.parse(val);
      setParseError(null);
    } catch (err) {
      setParseError(String(err).replace("SyntaxError: ", ""));
    }
    // Sincronizar con store para saveConfig
    const rs = getReactiveState();
    rs.configRaw = val;
  }, []);

  const handleReload = useCallback(async () => {
    await loadConfig(getReactiveState() as never);
  }, []);

  const handleSave = useCallback(async () => {
    // Sincronizar raw al store antes de guardar
    const rs = getReactiveState();
    rs.configRaw = rawContent;
    rs.configFormMode = "raw";
    await saveConfig(rs as never);
  }, [rawContent]);

  const handleApply = useCallback(async () => {
    const rs = getReactiveState();
    rs.configRaw = rawContent;
    rs.configFormMode = "raw";
    await applyConfig(rs as never);
  }, [rawContent]);

  const handleUpdate = useCallback(async () => {
    await runUpdate(getReactiveState() as never);
  }, []);



  return (
    <div className="json-edit">
      {/* Barra de acciones */}
      <div className="json-edit__toolbar">
        <div className="json-edit__status">
          {parseError ? (
            <span className="json-edit__error">{parseError}</span>
          ) : isDirty ? (
            <span className="json-edit__dirty">● 已修改</span>
          ) : (
            <span className="muted">无更改</span>
          )}
        </div>
        <div className="json-edit__actions">

          <button
            className="btn btn--sm"
            onClick={handleReload}
            disabled={configLoading}
          >
            {configLoading ? "加载中..." : "重新加载"}
          </button>
          <button
            className="btn btn--sm primary"
            onClick={handleSave}
            disabled={configSaving || !isDirty || !!parseError || !connected}
          >
            {configSaving ? "保存中..." : "保存"}
          </button>
          <button
            className="btn btn--sm"
            onClick={handleApply}
            disabled={configApplying || !isDirty || !!parseError || !connected}
          >
            {configApplying ? "应用中..." : "应用"}
          </button>
          <button
            className="btn btn--sm"
            onClick={handleUpdate}
            disabled={updateRunning}
          >
            {updateRunning ? "更新中..." : "更新"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="json-edit__editor-wrap">
        <textarea
          ref={textareaRef}
          className={`json-edit__textarea${parseError ? " json-edit__textarea--error" : ""}`}
          value={rawContent}
          onChange={handleChange}
          spellCheck={false}
          autoComplete="off"
          autoCorrect="off"
          autoCapitalize="off"
          placeholder={configLoading ? "正在加载配置..." : "{}"}
        />
      </div>
    </div>
  );
}
