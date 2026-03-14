import React, { useCallback, useMemo, useState } from "react";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { t } from "../i18n/index.ts";
import { formatRelativeTimestamp } from "../lib/format.ts";
import { ChannelQuickAdd, type ChannelQuickAddForm } from "../components/channels/ChannelQuickAdd.tsx";
import { ChannelPairings } from "../components/channels/ChannelPairings.tsx";
import { ChannelCard, type ChannelCardData } from "../components/channels/ChannelCard.tsx";
import { ChannelConfigDrawer } from "../components/channels/ChannelConfigDrawer.tsx";
import { loadChannels } from "../lib/controllers/channels.ts";
import { approveChannelPairing, loadChannelPairings } from "../lib/controllers/channel-pairing.ts";
import {
  applyConfig,
  saveConfig,
  updateConfigFormValue,
} from "../lib/controllers/config.ts";
import type { DropdownGroup } from "../components/Dropdown.tsx";
import type { ChannelAccountSnapshot } from "../lib/types.ts";

export function ChannelsView() {
  const s = useAppStore;

  // ── Store selectors ──
  const connected = s((st) => st.connected);
  const snapshot = s((st) => st.channelsSnapshot);
  const error = s((st) => st.channelsError);
  const lastSuccess = s((st) => st.channelsLastSuccess);
  const configForm = s((st) => st.configForm);
  const configSchema = s((st) => st.configSchema);
  const configSchemaLoading = s((st) => st.configSchemaLoading);
  const configSaving = s((st) => st.configSaving);
  const configFormDirty = s((st) => st.configFormDirty);
  const configUiHints = s((st) => st.configUiHints);

  // Quick-add state
  const quickAddExpanded = s((st) => st.channelQuickAddExpanded);
  const quickAddBusy = s((st) => st.channelQuickAddBusy);
  const quickAddError = s((st) => st.channelQuickAddError);
  const quickAddForm = s((st) => st.channelQuickAddForm);

  // Dropdown state
  const agentDropdownOpen = s((st) => st.chAgentDropdownOpen);
  const modelDropdownOpen = s((st) => st.chModelDropdownOpen);
  const modelDropdownExpandedGroups = s((st) => st.chModelDropdownExpandedGroups);

  // Channel pairings state
  const channelPairingsLoading = s((st) => st.channelPairingsLoading);
  const channelPairings = s((st) => st.channelPairings);
  const channelPairingsError = s((st) => st.channelPairingsError);

  const set = s((st) => st.set);

  // WhatsApp QR login state
  const whatsappQrDataUrl = s((st) => st.whatsappLoginQrDataUrl);
  const whatsappLoginMessage = s((st) => st.whatsappLoginMessage);
  const whatsappBusy = s((st) => st.whatsappBusy);

  // ── Drawer state (local) ──
  const [drawerChannelId, setDrawerChannelId] = useState<string | null>(null);
  const [drawerChannelLabel, setDrawerChannelLabel] = useState<string>("");

  const openDrawer = useCallback((id: string, label: string) => {
    setDrawerChannelId(id);
    setDrawerChannelLabel(label);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerChannelId(null);
  }, []);

  // ── Build models/agents list from configForm ──
  const { availableModels, modelGroups, availableAgents } = useMemo(() => {
    const providersObj = (
      (configForm as Record<string, unknown>)?.models as Record<string, unknown>
    )?.providers as Record<string, unknown> | undefined;

    const models: Array<{ value: string; label: string }> = [];
    const groups: DropdownGroup[] = [];

    if (providersObj) {
      for (const [provId, provData] of Object.entries(providersObj)) {
        const prov = provData as Record<string, unknown>;
        const ml = (prov.models as Array<{ id: string; name?: string }>) ?? [];
        const items: Array<{ value: string; label: string }> = [];
        for (const m of ml) {
          const item = { value: `${provId}/${m.id}`, label: `${provId}/${m.name || m.id}` };
          models.push(item);
          items.push({ value: `${provId}/${m.id}`, label: m.name || m.id });
        }
        if (items.length > 0) groups.push({ label: provId, items });
      }
    }

    const agentsObj = (configForm as Record<string, unknown>)?.agents as Record<string, unknown> | undefined;
    const agentsList = (agentsObj?.list ?? []) as Array<{ id: string; identity?: { name?: string } }>;
    const agents = agentsList.map((a) => ({ id: a.id, name: a.identity?.name ?? a.id }));

    return { availableModels: models, modelGroups: groups, availableAgents: agents };
  }, [configForm]);

  // ── Resolve channel cards data ──
  const channelCards: ChannelCardData[] = useMemo(() => {
    const channels = snapshot?.channels as Record<string, unknown> | null;
    if (!channels) return [];

    // Orden de canales
    let channelOrder: string[];
    if (snapshot?.channelMeta?.length) {
      channelOrder = snapshot.channelMeta.map((e) => e.id);
    } else if (snapshot?.channelOrder?.length) {
      channelOrder = snapshot.channelOrder;
    } else {
      channelOrder = ["whatsapp", "telegram", "discord", "googlechat", "slack", "signal", "imessage", "nostr", "feishu"];
    }

    const metaMap: Record<string, { label: string }> = {};
    if (snapshot?.channelMeta) {
      for (const m of snapshot.channelMeta) metaMap[m.id] = { label: m.label };
    }

    return channelOrder
      .map((key) => {
        const status = channels[key] as Record<string, unknown> | undefined;
        const accounts: ChannelAccountSnapshot[] = snapshot?.channelAccounts?.[key] ?? [];
        const configured = typeof status?.configured === "boolean" ? status.configured : undefined;
        const running = typeof status?.running === "boolean" ? status.running : undefined;
        const connectedVal = typeof status?.connected === "boolean" ? status.connected : undefined;
        const lastError = typeof status?.lastError === "string" ? status.lastError : undefined;

        const isEnabled =
          configured || running || connectedVal ||
          accounts.some((a) => a.configured || a.running || a.connected);

        return {
          key,
          label: metaMap[key]?.label ?? snapshot?.channelLabels?.[key] ?? key,
          enabled: !!isEnabled,
          configured: configured ?? undefined,
          running: running ?? undefined,
          connected: connectedVal ?? undefined,
          lastError: lastError ?? null,
          accounts,
        };
      })
      // Ordenar: habilitados primero
      .sort((a, b) => {
        if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
        return 0;
      });
  }, [snapshot]);

  // ── Quick-add handlers ──
  const onToggle = useCallback(() => {
    set({ channelQuickAddExpanded: !s.getState().channelQuickAddExpanded });
  }, [set]);

  const onChannelTypeChange = useCallback((type: "telegram" | "feishu" | "discord" | "whatsapp") => {
    set({ channelQuickAddForm: { ...s.getState().channelQuickAddForm, channelType: type } });
  }, [set]);

  const onFieldChange = useCallback((field: string, value: string | boolean) => {
    set({ channelQuickAddForm: { ...s.getState().channelQuickAddForm, [field]: value } as typeof quickAddForm });
  }, [set]);

  const onAgentDropdownToggle = useCallback(() => {
    set({ chAgentDropdownOpen: !s.getState().chAgentDropdownOpen });
  }, [set]);

  const onModelDropdownToggle = useCallback(() => {
    set({ chModelDropdownOpen: !s.getState().chModelDropdownOpen });
  }, [set]);

  const onModelDropdownGroupToggle = useCallback((label: string) => {
    const next = new Set(s.getState().chModelDropdownExpandedGroups ?? new Set());
    next.has(label) ? next.delete(label) : next.add(label);
    set({ chModelDropdownExpandedGroups: next });
  }, [set]);

  const onSubmit = useCallback(async () => {
    const reactive = getReactiveState() as any;
    const f = s.getState().channelQuickAddForm;
    set({ channelQuickAddBusy: true, channelQuickAddError: null });
    try {
      const channel = f.channelType;
      const accountId = f.accountId.trim();

      if (channel === "telegram") {
        const accountObj: Record<string, unknown> = {
          dmPolicy: "pairing", botToken: f.botToken.trim(),
          groupPolicy: "allowlist", streaming: "off",
        };
        updateConfigFormValue(reactive, ["channels", "telegram", "enabled"], true);
        updateConfigFormValue(reactive, ["channels", "telegram", "accounts", accountId], accountObj);
        updateConfigFormValue(reactive, ["channels", "telegram", "streaming"], f.telegramStreaming);
        updateConfigFormValue(reactive, ["channels", "telegram", "blockStreaming"], f.telegramBlockStreaming);
      } else if (channel === "feishu") {
        const accountObj: Record<string, unknown> = {
          appId: f.appId.trim(), appSecret: f.appSecret.trim(),
          botName: f.botName.trim() || accountId,
        };
        updateConfigFormValue(reactive, ["channels", "feishu", "enabled"], true);
        updateConfigFormValue(reactive, ["channels", "feishu", "accounts", accountId], accountObj);
        updateConfigFormValue(reactive, ["channels", "feishu", "groups", "*", "requireMention"], f.feishuRequireMention);
        updateConfigFormValue(reactive, ["channels", "feishu", "streaming"], f.feishuStreaming);
        updateConfigFormValue(reactive, ["channels", "feishu", "blockStreaming"], f.feishuBlockStreaming);
      } else if (channel === "discord") {
        updateConfigFormValue(reactive, ["channels", "discord", "enabled"], true);
        updateConfigFormValue(reactive, ["channels", "discord", "token"], f.discordToken.trim());
      } else if (channel === "whatsapp") {
        updateConfigFormValue(reactive, ["channels", "whatsapp", "dmPolicy"], f.whatsappDmPolicy);
        updateConfigFormValue(reactive, ["channels", "whatsapp", "groupPolicy"], "allowlist");
        const phones = f.whatsappAllowFrom.split(",").map((p) => p.trim()).filter(Boolean);
        if (phones.length > 0) {
          updateConfigFormValue(reactive, ["channels", "whatsapp", "allowFrom"], phones);
        }
      }

      // Esperar a que el proxy flush las escrituras al store
      await new Promise((r) => setTimeout(r, 50));

      const agentIdToUse = f.createAgent ? f.agentId || accountId : "";
      if (f.createAgent && f.agentId === "") {
        let avatarValue: string = f.agentEmoji;
        const isDataUri = /^data:image\//i.test(f.agentEmoji);
        if (isDataUri && reactive.client) {
          try {
            const res = await reactive.client.request("agent.avatar.save", {
              agentId: accountId, dataUri: f.agentEmoji,
            });
            const saved = res as { path?: string } | null;
            if (saved?.path) avatarValue = saved.path;
          } catch { /* fallback */ }
        }
        const newAgent: Record<string, unknown> = {
          id: accountId,
          identity: { name: f.agentName.trim() || accountId, avatar: avatarValue },
        };
        const agentDefaults = (
          (reactive.configForm as Record<string, unknown>)?.agents as Record<string, unknown>
        )?.defaults as Record<string, unknown> | undefined;
        const defaultWs = typeof agentDefaults?.workspace === "string"
          ? agentDefaults.workspace.replace(/[\\/]+$/, "") : null;
        if (defaultWs) {
          const sep = defaultWs.includes("\\") ? "\\" : "/";
          const stateDir = defaultWs.substring(0, defaultWs.lastIndexOf(sep));
          newAgent.workspace = `${stateDir}${sep}workspace-${accountId}`;
        }
        if (f.agentModel) newAgent.model = { primary: f.agentModel };
        updateConfigFormValue(reactive, ["agents", "defaults", "blockStreamingDefault"], "on");
        updateConfigFormValue(reactive, ["agents", "defaults", "blockStreamingBreak"], "text_end");
        const currentAgents = ((
          (reactive.configForm as Record<string, unknown>)?.agents as Record<string, unknown>
        )?.list ?? []) as unknown[];
        updateConfigFormValue(reactive, ["agents", "list"], [...currentAgents, newAgent]);
      }

      if (f.createAgent && agentIdToUse) {
        const newBinding = { agentId: agentIdToUse, match: { channel, accountId } };
        const currentBindings = ((reactive.configForm as Record<string, unknown>)?.bindings ?? []) as unknown[];
        updateConfigFormValue(reactive, ["bindings"], [...currentBindings, newBinding]);
      }

      // Esperar flush final antes de persistir
      await new Promise((r) => setTimeout(r, 50));

      await saveConfig(reactive);
      await applyConfig(reactive);

      set({
        channelQuickAddForm: {
          channelType: f.channelType, accountId: "", botToken: "",
          telegramStreaming: false, telegramBlockStreaming: true,
          appId: "", appSecret: "", botName: "",
          discordToken: "",
          whatsappDmPolicy: "pairing" as const, whatsappAllowFrom: "",
          feishuRequireMention: true,
          feishuStreaming: false, feishuBlockStreaming: true,
          createAgent: true, agentId: "", agentName: "",
          agentEmoji: "🤖", agentModel: "",
        },
        channelQuickAddExpanded: false,
      });
    } catch (err) {
      set({ channelQuickAddError: String(err) });
    } finally {
      set({ channelQuickAddBusy: false });
    }
  }, [set]);

  // ── Config drawer handlers ──
  const onConfigPatch = useCallback((path: Array<string | number>, value: unknown) => {
    updateConfigFormValue(getReactiveState() as never, path, value);
  }, []);

  const onConfigSave = useCallback(async () => {
    const st = s.getState() as any;
    await st.handleChannelConfigSave?.();
  }, []);

  const onConfigReload = useCallback(async () => {
    const st = s.getState() as any;
    await st.handleChannelConfigReload?.();
  }, []);

  // WhatsApp QR login: usa client + set() directamente para compatibilidad con Zustand
  const onWhatsAppLogin = useCallback(async () => {
    const { client, connected, whatsappBusy } = s.getState();
    if (!client || !connected || whatsappBusy) return;

    set({ whatsappBusy: true });
    try {
      const res = await client.request<{ message?: string; qrDataUrl?: string }>(
        "web.login.start", { force: false, timeoutMs: 30000 },
      );
      set({
        whatsappLoginMessage: res.message ?? null,
        whatsappLoginQrDataUrl: res.qrDataUrl ?? null,
        whatsappLoginConnected: null,
      });

      // Espera a que el usuario escanee el QR
      if (res.qrDataUrl) {
        const waitRes = await client.request<{ message?: string; connected?: boolean }>(
          "web.login.wait", { timeoutMs: 120000 },
        );
        set({
          whatsappLoginMessage: waitRes.message ?? null,
          whatsappLoginConnected: waitRes.connected ?? null,
          whatsappLoginQrDataUrl: waitRes.connected ? null : s.getState().whatsappLoginQrDataUrl,
        });
      }
    } catch (err) {
      // Mapeo de errores comunes a mensajes amigables en chino
      const raw = String(err);
      let friendly: string;
      if (raw.includes("web login provider is not available")) {
        friendly = "WhatsApp 渠道尚未启用。请先点击「添加并应用」保存配置，然后再获取 QR 码。";
      } else if (raw.includes("already connected") || raw.includes("already linked")) {
        friendly = "WhatsApp 已链接，无需重新扫码。";
      } else if (raw.includes("timeout") || raw.includes("timed out")) {
        friendly = "QR 码获取超时，请稍后重试。";
      } else if (raw.includes("not connected") || raw.includes("disconnected")) {
        friendly = "网关连接断开，请检查网关是否正在运行。";
      } else {
        friendly = `WhatsApp 登录失败: ${raw.replace(/^GatewayRequestError:\s*/i, "")}`;
      }
      set({ whatsappLoginMessage: friendly, whatsappLoginQrDataUrl: null, whatsappLoginConnected: null });
    } finally {
      set({ whatsappBusy: false });
    }
  }, [set]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      {/* Primera fila: Quick Add + Pairings */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr minmax(280px,380px)", gap: 18, alignItems: "stretch" }}>
        <ChannelQuickAdd
          form={quickAddForm}
          expanded={quickAddExpanded}
          busy={quickAddBusy}
          error={quickAddError}
          availableModels={availableModels}
          modelGroups={modelGroups}
          availableAgents={availableAgents}
          onToggle={onToggle}
          onChannelTypeChange={onChannelTypeChange}
          onFieldChange={onFieldChange as (field: keyof ChannelQuickAddForm, value: string | boolean) => void}
          onSubmit={onSubmit}
          agentDropdownOpen={agentDropdownOpen ?? false}
          onAgentDropdownToggle={onAgentDropdownToggle}
          modelDropdownOpen={modelDropdownOpen ?? false}
          modelDropdownExpandedGroups={modelDropdownExpandedGroups ?? new Set()}
          onModelDropdownToggle={onModelDropdownToggle}
          onModelDropdownGroupToggle={onModelDropdownGroupToggle}
          whatsappQrDataUrl={whatsappQrDataUrl}
          whatsappLoginMessage={whatsappLoginMessage}
          whatsappBusy={whatsappBusy}
          onWhatsAppLogin={onWhatsAppLogin}
        />
        <ChannelPairings
          loading={channelPairingsLoading}
          pairings={channelPairings}
          error={channelPairingsError}
          onRefresh={() => void loadChannelPairings(getReactiveState() as never)}
          onApprove={(channel, code) => void approveChannelPairing(getReactiveState() as never, channel, code)}
        />
      </div>

      {/* Channel cards grid */}
      <section>
        <div className="row" style={{ justifyContent: "space-between", marginBottom: 12 }}>
          <div>
            <div className="card-title">{t("channelsView.channelHealth")}</div>
            <div className="card-sub">{t("channelsView.channelHealthSub")}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span className="muted" style={{ fontSize: 12 }}>
              {lastSuccess ? formatRelativeTimestamp(lastSuccess) : "n/a"}
            </span>
            <button className="btn btn--sm" onClick={() => loadChannels(getReactiveState() as never, true)}>
              刷新
            </button>
          </div>
        </div>

        {error && (
          <div className="callout danger" style={{ marginBottom: 12 }}>{error}</div>
        )}

        {channelCards.length > 0 ? (
          <div className="channels-grid">
            {channelCards.map((ch) => (
              <ChannelCard
                key={ch.key}
                channel={ch}
                onClick={() => openDrawer(ch.key, ch.label)}
              />
            ))}
          </div>
        ) : (
          <div className="muted">{t("channelsView.noSnapshotYet")}</div>
        )}

        {/* Raw JSON snapshot — como en la versión Lit original */}
        {snapshot && (
          <details style={{ marginTop: 12 }}>
            <summary className="muted" style={{ cursor: "pointer", fontSize: 13 }}>
              查看原始数据
            </summary>
            <pre className="code-block" style={{ marginTop: 8, whiteSpace: "pre-wrap", wordBreak: "break-all" }}>
              {JSON.stringify(snapshot, null, 2)}
            </pre>
          </details>
        )}
      </section>

      {/* Config drawer */}
      <ChannelConfigDrawer
        open={drawerChannelId != null}
        channelId={drawerChannelId}
        channelLabel={drawerChannelLabel}
        configSchema={configSchema}
        configSchemaLoading={configSchemaLoading}
        configForm={configForm as Record<string, unknown> | null}
        configUiHints={configUiHints}
        configSaving={configSaving}
        configFormDirty={configFormDirty}
        onConfigPatch={onConfigPatch}
        onConfigSave={onConfigSave}
        onConfigReload={onConfigReload}
        onClose={closeDrawer}
      />
    </div>
  );
}
