import React, { useEffect } from "react";
import { Shell } from "./components/layout/Shell.tsx";
import { useGateway } from "./hooks/useGateway.ts";
import { useAppStore, getReactiveState } from "./store/appStore.ts";
import {
  attachThemeListener,
  detachThemeListener,
  inferBasePath,
  onPopState,
  syncTabWithLocation,
  syncThemeWithSettings,
  applySettingsFromUrl,
} from "./lib/app-settings.ts";
import { loadControlUiBootstrapConfig } from "./lib/controllers/control-ui-bootstrap.ts";
import { i18n, isSupportedLocale } from "./i18n/index.ts";

export function App() {
  const set = useAppStore((s) => s.set);
  const locale = useAppStore((s) => s.settings.locale);

  // Apply locale from settings on first render
  useEffect(() => {
    if (isSupportedLocale(locale)) {
      void i18n.setLocale(locale);
    }
  }, [locale]);

  // One-time init: base path, theme, popstate
  useEffect(() => {
    const basePath = inferBasePath();
    set({ basePath });

    const host = getReactiveState() as never;
    applySettingsFromUrl(host);
    syncTabWithLocation(host, true);
    syncThemeWithSettings(host);
    attachThemeListener(host);
    void loadControlUiBootstrapConfig(host);

    const popStateHandler = () => onPopState(getReactiveState() as never);
    window.addEventListener("popstate", popStateHandler);

    return () => {
      window.removeEventListener("popstate", popStateHandler);
      detachThemeListener(host);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Connect to the OpenClaw gateway WebSocket
  useGateway();

  return <Shell />;
}
