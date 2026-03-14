import React, { useCallback, useRef, useState } from "react";
import { t } from "../../i18n/index.ts";
import { generateRandomAvatars } from "../../lib/helpers/multiavatar.ts";
import { Dropdown, type DropdownGroup, type DropdownItem } from "../Dropdown.tsx";

// ─── Types ───────────────────────────────────────────────────

export type ChannelType = "telegram" | "feishu" | "discord" | "whatsapp";

export interface ChannelQuickAddForm {
  channelType: ChannelType;
  accountId: string;
  botToken: string;
  telegramStreaming: boolean;
  telegramBlockStreaming: boolean;
  appId: string;
  appSecret: string;
  botName: string;
  discordToken: string;
  whatsappDmPolicy: "pairing" | "allowlist" | "open";
  whatsappAllowFrom: string;
  feishuRequireMention: boolean;
  feishuStreaming: boolean;
  feishuBlockStreaming: boolean;
  createAgent: boolean;
  agentId: string;
  agentName: string;
  agentEmoji: string;
  agentModel: string;
}

export type ChannelQuickAddProps = {
  form: ChannelQuickAddForm;
  expanded: boolean;
  busy: boolean;
  error: string | null;
  availableModels: DropdownItem[];
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
  /* WhatsApp QR login */
  whatsappQrDataUrl?: string | null;
  whatsappLoginMessage?: string | null;
  whatsappBusy?: boolean;
  onWhatsAppLogin?: () => void;
};

// ─── Component ───────────────────────────────────────────────

export function ChannelQuickAdd(props: ChannelQuickAddProps) {
  const {
    form, expanded, busy, error,
    availableModels, modelGroups, availableAgents,
    onToggle, onChannelTypeChange, onFieldChange, onSubmit,
    agentDropdownOpen, onAgentDropdownToggle,
    modelDropdownOpen, modelDropdownExpandedGroups,
    onModelDropdownToggle, onModelDropdownGroupToggle,
    whatsappQrDataUrl, whatsappLoginMessage, whatsappBusy, onWhatsAppLogin,
  } = props;

  // Estado local para avatares aleatorios
  const [avatarOptions, setAvatarOptions] = useState(() => generateRandomAvatars(8));
  const fileInputRef = useRef<HTMLInputElement>(null);

  const channelType = form.channelType;

  // Validación del formulario según el tipo de canal
  let hasChannelInfo = false;
  if (channelType === "telegram") {
    hasChannelInfo = form.accountId.trim() !== "" && form.botToken.trim() !== "";
  } else if (channelType === "feishu") {
    hasChannelInfo = form.accountId.trim() !== "" && form.appId.trim() !== "" && form.appSecret.trim() !== "";
  } else if (channelType === "discord") {
    hasChannelInfo = form.discordToken.trim() !== "";
  } else if (channelType === "whatsapp") {
    // WhatsApp solo necesita habilitarse; el enlace QR se hace via CLI
    hasChannelInfo = true;
  }
  const hasAgentInfo =
    !form.createAgent ||
    ((form.agentId.trim() !== "" || form.accountId.trim() !== "") && form.agentModel.trim() !== "");
  const canSubmit = !busy && hasChannelInfo && hasAgentInfo;

  // Handlers
  const handleRefreshAvatars = useCallback(() => {
    setAvatarOptions(generateRandomAvatars(8));
    // Dispara re-render manteniendo el emoji actual
    onFieldChange("agentEmoji", form.agentEmoji || "🤖");
  }, [onFieldChange, form.agentEmoji]);

  const handleFileUpload = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === "string") {
          onFieldChange("agentEmoji", reader.result);
        }
      };
      reader.readAsDataURL(file);
    },
    [onFieldChange],
  );

  // Items para el dropdown de agent
  const agentDropdownItems: DropdownItem[] = [
    { value: "", label: t("channelsQuickAdd.newAgent") ?? "— 新建Agent —" },
    ...availableAgents.map((a) => ({ value: a.id, label: `${a.name} (${a.id})` })),
  ];

  // ¿Es la imagen personalizada y no es una de las opciones generadas?
  const isCustomAvatar =
    form.agentEmoji &&
    /^data:image\//i.test(form.agentEmoji) &&
    !avatarOptions.find((o) => o.dataUri === form.agentEmoji);

  // Local state para el dropdown de DM policy (WhatsApp)
  const [dmPolicyDropdownOpen, setDmPolicyDropdownOpen] = useState(false);
  const [permsCopied, setPermsCopied] = useState(false);
  const dmPolicyItems: DropdownItem[] = [
    { value: "pairing", label: "pairing（配对审批）" },
    { value: "allowlist", label: "allowlist（白名单）" },
    { value: "open", label: "open（开放）" },
  ];

  return (
    <section className="card channel-quick-add">
      {/* ── Header con toggle ── */}
      <div className="channel-quick-add__header" onClick={onToggle}>
        <div>
          <div className="card-title">{t("channelsQuickAdd.title")}</div>
          <div className="card-sub">{t("channelsQuickAdd.subtitle")}</div>
        </div>
        <span className={`channel-quick-add__toggle${expanded ? " open" : ""}`}>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </div>

      {/* Chips siempre visibles — clicar abre el fold y selecciona el tipo */}
      <div className="quick-add__presets" style={{ marginTop: 10 }}>
        {([["telegram", "Telegram", "/Telegram_(software)-Logo.wine.svg"],
           ["feishu", t("channelsQuickAdd.feishu") ?? "飞书", "/feishu-logo.svg"],
           ["discord", "Discord", "/discord-svgrepo-com.svg"],
           ["whatsapp", "WhatsApp", "/whatsapp-color-svgrepo-com.svg"],
          ] as const).map(([ct, label, icon]) => (
          <button
            key={ct}
            className={`quick-add__preset-chip${expanded && channelType === ct ? " active" : ""}`}
            onClick={() => {
              onChannelTypeChange(ct as ChannelType);
              if (!expanded) onToggle();
            }}
          >
            <img src={icon} alt="" width="16" height="16" style={{ verticalAlign: "middle", marginRight: 4, borderRadius: 2 }} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Body (expandible) ── */}
      {expanded && (
        <div className="channel-quick-add__body">

          {error && <div className="quick-add__error">{error}</div>}

          {/* ── Campos del canal ── */}
          <div className="quick-add__grid" style={{ marginTop: 10 }}>
            {/* Account ID — solo para Telegram (Feishu lo incluye en su propia sección) */}
            {channelType === "telegram" && (
              <label className="quick-add__field">
                <span className="quick-add__label">{t("channelsQuickAdd.accountId")}</span>
                <input
                  className="quick-add__input"
                  type="text"
                  placeholder="brainstorm"
                  value={form.accountId}
                  onChange={(e) => onFieldChange("accountId", e.target.value)}
                />
                <span className="quick-add__hint">{t("channelsQuickAdd.accountIdHint")}</span>
              </label>
            )}

            {/* ── Telegram ── */}
            {channelType === "telegram" && (
              <>
                <label className="quick-add__field">
                  <span className="quick-add__label">Bot Token</span>
                  <input
                    className="quick-add__input"
                    type="password"
                    placeholder="123456:ABC-DEF..."
                    value={form.botToken}
                    onChange={(e) => onFieldChange("botToken", e.target.value)}
                  />
                  <span className="quick-add__hint">{t("channelsQuickAdd.botTokenHint")}</span>
                </label>
                {/* ── Toggle: 流媒体 ── */}
                <div className="quick-add__toggle-row">
                  <span
                    className={`quick-add__toggle-track${form.telegramStreaming ? " on" : ""}`}
                    onClick={() => {
                      const next = !form.telegramStreaming;
                      onFieldChange("telegramStreaming", next);
                      if (next) onFieldChange("telegramBlockStreaming", false);
                    }}
                  />
                  <span className="quick-add__toggle-text">
                    <strong>启用流媒体输出</strong>
                    <span className="quick-add__hint">
                      通过实时编辑消息模拟打字效果（不可与块流同时开启）
                    </span>
                  </span>
                </div>
                {/* ── Toggle: 块流 ── */}
                <div className="quick-add__toggle-row">
                  <span
                    className={`quick-add__toggle-track${form.telegramBlockStreaming ? " on" : ""}`}
                    onClick={() => {
                      const next = !form.telegramBlockStreaming;
                      onFieldChange("telegramBlockStreaming", next);
                      if (next) onFieldChange("telegramStreaming", false);
                    }}
                  />
                  <span className="quick-add__toggle-text">
                    <strong>启用块流</strong>
                    <span className="quick-add__hint">
                      按段落/代码块逐步发送回复，效果更自然（不可与流媒体同时开启）
                    </span>
                  </span>
                </div>
                <div className="quick-add__tutorial-link" style={{ gridColumn: "span 2" }}>
                  <a href="https://docs.openclaw.ai/channels/telegram" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: "middle", marginRight: 4}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Telegram 配置教程
                  </a>
                </div>
              </>
            )}

            {/* ── Feishu ── */}
            {channelType === "feishu" && (
              <>
                {/* Todos los campos de credenciales en una sola fila de 4 columnas */}
                <div style={{ gridColumn: "span 2", display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12, alignItems: "start" }}>
                  <label className="quick-add__field">
                    <span className="quick-add__label">{t("channelsQuickAdd.accountId")}</span>
                    <input
                      className="quick-add__input"
                      type="text"
                      placeholder="brainstorm"
                      value={form.accountId}
                      onChange={(e) => onFieldChange("accountId", e.target.value)}
                    />
                    <span className="quick-add__hint">{t("channelsQuickAdd.accountIdHint")}</span>
                  </label>
                  <label className="quick-add__field">
                    <span className="quick-add__label">App ID</span>
                    <input
                      className="quick-add__input"
                      type="text"
                      placeholder="cli_a9xxx"
                      value={form.appId}
                      onChange={(e) => onFieldChange("appId", e.target.value)}
                    />
                    <span className="quick-add__hint">
                      {t("channelsQuickAdd.appIdHint")}{" "}
                      <a href="https://open.feishu.cn/app?lang=zh-CN" target="_blank" rel="noopener noreferrer">
                        {t("channelsQuickAdd.feishuConsoleLink")}
                      </a>
                    </span>
                  </label>
                  <label className="quick-add__field">
                    <span className="quick-add__label">App Secret</span>
                    <input
                      className="quick-add__input"
                      type="password"
                      placeholder=""
                      value={form.appSecret}
                      onChange={(e) => onFieldChange("appSecret", e.target.value)}
                    />
                    <span className="quick-add__hint">{t("channelsQuickAdd.appSecretHint")}</span>
                  </label>
                  <label className="quick-add__field">
                    <span className="quick-add__label">{t("channelsQuickAdd.botName")}</span>
                    <input
                      className="quick-add__input"
                      type="text"
                      placeholder={t("channelsQuickAdd.botNamePlaceholder") ?? ""}
                      value={form.botName}
                      onChange={(e) => onFieldChange("botName", e.target.value)}
                    />
                    <span className="quick-add__hint">{t("channelsQuickAdd.botNameHint")}</span>
                  </label>
                </div>
                {/* ── Toggle: 群组需要@ ── */}
                <div className="quick-add__toggle-row">
                  <span
                    className={`quick-add__toggle-track${form.feishuRequireMention ? " on" : ""}`}
                    onClick={() => onFieldChange("feishuRequireMention", !form.feishuRequireMention)}
                  />
                  <span className="quick-add__toggle-text">
                    <strong>群组消息需要 @</strong>
                    <span className="quick-add__hint">
                      开启后机器人仅在被 @提及 时回复群消息，关闭则响应所有消息
                    </span>
                  </span>
                </div>
                {/* ── Toggle: 流媒体卡 ── */}
                <div className="quick-add__toggle-row">
                  <span
                    className={`quick-add__toggle-track${form.feishuStreaming ? " on" : ""}`}
                    onClick={() => {
                      const next = !form.feishuStreaming;
                      onFieldChange("feishuStreaming", next);
                      if (next) onFieldChange("feishuBlockStreaming", false);
                    }}
                  />
                  <span className="quick-add__toggle-text">
                    <strong>启用流媒体卡输出</strong>
                    <span className="quick-add__hint">
                      通过交互卡片实时更新回复内容（不可与块流同时开启）
                    </span>
                  </span>
                </div>
                {/* ── Toggle: 块流 ── */}
                <div className="quick-add__toggle-row">
                  <span
                    className={`quick-add__toggle-track${form.feishuBlockStreaming ? " on" : ""}`}
                    onClick={() => {
                      const next = !form.feishuBlockStreaming;
                      onFieldChange("feishuBlockStreaming", next);
                      if (next) onFieldChange("feishuStreaming", false);
                    }}
                  />
                  <span className="quick-add__toggle-text">
                    <strong>启用块流</strong>
                    <span className="quick-add__hint">
                      按段落/代码块逐步发送回复，效果更自然（不可与流媒体卡同时开启）
                    </span>
                  </span>
                </div>
                <div className="quick-add__tutorial-link" style={{ gridColumn: "span 2" }}>
                  <a href="https://docs.openclaw.ai/channels/feishu" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: "middle", marginRight: 4}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> 飞书配置教程
                  </a>
                  {" · "}
                  <a href="https://open.feishu.cn/app?lang=zh-CN" target="_blank" rel="noopener noreferrer">
                    飞书开放平台 ↗
                  </a>
                  {" · "}
                  <button
                    type="button"
                    className="quick-add__copy-perms-btn"
                    onClick={(e) => {
                      e.preventDefault();
                      const permsJson = JSON.stringify({
                        scopes: {
                          tenant: [
                            "aily:file:read", "aily:file:write",
                            "application:application.app_message_stats.overview:readonly",
                            "application:application:self_manage",
                            "application:bot.menu:write",
                            "cardkit:card:read", "cardkit:card:write",
                            "contact:user.employee_id:readonly",
                            "corehr:file:download", "event:ip_list",
                            "im:chat.access_event.bot_p2p_chat:read",
                            "im:chat.members:bot_access",
                            "im:message", "im:message.group_at_msg:readonly",
                            "im:message.p2p_msg:readonly", "im:message:readonly",
                            "im:message:send_as_bot", "im:resource",
                          ],
                          user: ["aily:file:read", "aily:file:write", "im:chat.access_event.bot_p2p_chat:read"],
                        },
                      }, null, 2);
                      navigator.clipboard.writeText(permsJson);
                      setPermsCopied(true);
                      setTimeout(() => setPermsCopied(false), 2000);
                    }}
                  >
                    {permsCopied ? "✓ 已复制" : <><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: "middle", marginRight: 4}}><rect x="8" y="2" width="8" height="4" rx="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>复制权限 JSON</>}
                  </button>
                </div>
              </>
            )}

            {/* ── Discord ── */}
            {channelType === "discord" && (
              <>
                <label className="quick-add__field" style={{ gridColumn: "span 2" }}>
                  <span className="quick-add__label">Bot Token</span>
                  <input
                    className="quick-add__input"
                    type="password"
                    placeholder="MTExxx...abcdef"
                    value={form.discordToken}
                    onChange={(e) => onFieldChange("discordToken", e.target.value)}
                  />
                  <span className="quick-add__hint">从 Discord Developer Portal 获取 Bot Token。需先创建 Application → Bot，并开启 Message Content Intent。</span>
                </label>
                <div className="quick-add__tutorial-link" style={{ gridColumn: "span 2" }}>
                  <a href="https://docs.openclaw.ai/channels/discord" target="_blank" rel="noopener noreferrer">
                    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: "middle", marginRight: 4}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> Discord 配置教程
                  </a>
                  {" · "}
                  <a href="https://discord.com/developers/applications" target="_blank" rel="noopener noreferrer">
                    Discord Developer Portal ↗
                  </a>
                </div>
              </>
            )}

            {/* ── WhatsApp ── */}
            {channelType === "whatsapp" && (
              <>
                {/* DM Policy selector */}
                <label className="quick-add__field">
                  <span className="quick-add__label">DM 策略</span>
                  <Dropdown
                    value={form.whatsappDmPolicy}
                    items={dmPolicyItems}
                    open={dmPolicyDropdownOpen}
                    onToggle={() => setDmPolicyDropdownOpen((v) => !v)}
                    onSelect={(v) => {
                      onFieldChange("whatsappDmPolicy", v);
                      setDmPolicyDropdownOpen(false);
                    }}
                  />
                  <span className="quick-add__hint">控制谁可以向机器人发送私信。推荐使用 pairing 模式。</span>
                </label>

                {/* AllowFrom phone list */}
                <label className="quick-add__field">
                  <span className="quick-add__label">允许号码（allowFrom）</span>
                  <input
                    className="quick-add__input"
                    type="text"
                    placeholder="+15551234567, +447700900123"
                    value={form.whatsappAllowFrom}
                    onChange={(e) => onFieldChange("whatsappAllowFrom", e.target.value)}
                  />
                  <span className="quick-add__hint">逗号分隔的手机号。allowlist 模式下必填，pairing 模式下可留空。</span>
                </label>

                {/* QR Login section */}
                <div style={{ gridColumn: "span 2" }}>
                  <div className="callout" style={{ marginBottom: 8, fontSize: 13, lineHeight: 1.6 }}>
                    <strong>📱 WhatsApp 链接</strong>
                    <p style={{ margin: "6px 0 0" }}>
                      启用后需扫描 QR 码完成链接。可以点击下方按钮直接获取 QR 码，或通过 CLI 运行：
                    </p>
                    <code style={{ display: "block", margin: "6px 0", padding: "6px 10px", background: "var(--bg-elevated)", borderRadius: "var(--radius-md)", fontSize: 12 }}>
                      openclaw channels login --channel whatsapp
                    </code>
                  </div>

                  {/* QR login button */}
                  {onWhatsAppLogin && (
                    <div style={{ marginTop: 8 }}>
                      <button
                        type="button"
                        className="btn"
                        disabled={whatsappBusy}
                        onClick={onWhatsAppLogin}
                      >
                        {whatsappBusy ? "获取中..." : "🔗 获取 QR 码"}
                      </button>

                      {/* Status message — siempre visible */}
                      {whatsappLoginMessage && (
                        <div
                          className="quick-add__hint"
                          style={{
                            marginTop: 8,
                            padding: "6px 10px",
                            background: whatsappQrDataUrl ? "var(--ok-subtle)" : "var(--danger-subtle)",
                            borderRadius: "var(--radius-md)",
                            color: whatsappQrDataUrl ? "var(--ok)" : "var(--danger)",
                          }}
                        >
                          {whatsappLoginMessage}
                        </div>
                      )}

                      {/* QR code display */}
                      {whatsappQrDataUrl && (
                        <div style={{ marginTop: 12, textAlign: "center" }}>
                          <img
                            src={whatsappQrDataUrl}
                            alt="WhatsApp QR"
                            style={{ maxWidth: 240, borderRadius: "var(--radius-md)", border: "1px solid var(--border)" }}
                          />
                          <div className="quick-add__hint" style={{ marginTop: 6 }}>
                            用 WhatsApp 扫描此二维码完成链接
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="quick-add__tutorial-link" style={{ marginTop: 10 }}>
                    <a href="https://docs.openclaw.ai/channels/whatsapp" target="_blank" rel="noopener noreferrer">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" style={{verticalAlign: "middle", marginRight: 4}}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg> WhatsApp 配置教程
                    </a>
                  </div>
                </div>
              </>
            )}
          </div>

          {/* ── Agent binding ── */}
          <div className="channel-quick-add__agent-section">
            <div className="quick-add__models-header">
              <label className="channel-quick-add__agent-toggle">
                <input
                  type="checkbox"
                  checked={form.createAgent}
                  onChange={(e) => onFieldChange("createAgent", e.target.checked)}
                />
                <span className="quick-add__label">{t("channelsQuickAdd.bindAgent")}</span>
              </label>
            </div>

            {form.createAgent && (
              <div className="channel-quick-add__agent-form">
                <div className="quick-add__grid">
                  {/* Agent selector */}
                  <div className="quick-add__field">
                    <span className="quick-add__label">{t("channelsQuickAdd.agentSelect")}</span>
                    <Dropdown
                      value={form.agentId || null}
                      placeholder={t("channelsQuickAdd.newAgent") ?? "— 新建Agent —"}
                      items={agentDropdownItems}
                      open={agentDropdownOpen}
                      onSelect={(val) => {
                        onFieldChange("agentId", val);
                        if (val && form.accountId.trim() === "") {
                          onFieldChange("accountId", val);
                        }
                      }}
                      onToggle={onAgentDropdownToggle}
                    />
                  </div>

                  {/* Campos de nuevo agent (solo cuando no se selecciona uno existente) */}
                  {form.agentId === "" && (
                    <>
                      <label className="quick-add__field">
                        <span className="quick-add__label">{t("channelsQuickAdd.agentId")}</span>
                        <input
                          className="quick-add__input"
                          type="text"
                          placeholder="brainstorm"
                          value={form.accountId}
                          readOnly
                        />
                        <span className="quick-add__hint">{t("channelsQuickAdd.agentIdHint")}</span>
                      </label>
                      <label className="quick-add__field">
                        <span className="quick-add__label">{t("channelsQuickAdd.agentName")}</span>
                        <input
                          className="quick-add__input"
                          type="text"
                          placeholder={t("channelsQuickAdd.agentNamePlaceholder") ?? ""}
                          value={form.agentName}
                          onChange={(e) => onFieldChange("agentName", e.target.value)}
                        />
                        <span className="quick-add__hint">{t("channelsQuickAdd.agentNameHint")}</span>
                      </label>

                      {/* Avatar grid */}
                      <label className="quick-add__field" style={{ gridColumn: "span 2" }}>
                        <span className="quick-add__label">{t("channelsQuickAdd.avatar") ?? "头像"}</span>
                        <div className="channel-quick-add__avatar-grid">
                          {avatarOptions.map((opt, idx) => (
                            <button
                              key={`avatar-${idx}`}
                              type="button"
                              className={`channel-quick-add__avatar-btn${form.agentEmoji === opt.dataUri ? " active" : ""}`}
                              onClick={() => onFieldChange("agentEmoji", opt.dataUri)}
                            >
                              <img src={opt.dataUri} alt="avatar" width="36" height="36" />
                            </button>
                          ))}

                          {/* Vista previa de imagen personalizada */}
                          {isCustomAvatar && (
                            <button
                              type="button"
                              className="channel-quick-add__avatar-btn active"
                              title="已选择本地图片"
                            >
                              <img
                                src={form.agentEmoji}
                                alt="custom avatar"
                                width="36"
                                height="36"
                                style={{ objectFit: "cover", borderRadius: 4 }}
                              />
                            </button>
                          )}

                          {/* Botón refresh */}
                          <button
                            type="button"
                            className="channel-quick-add__avatar-btn channel-quick-add__avatar-refresh"
                            title={t("channelsQuickAdd.refreshAvatars") ?? "换一批"}
                            onClick={handleRefreshAvatars}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M23 4v6h-6" />
                              <path d="M1 20v-6h6" />
                              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                            </svg>
                          </button>

                          {/* Botón de subir archivo */}
                          <button
                            type="button"
                            className="channel-quick-add__avatar-btn channel-quick-add__avatar-upload"
                            title="从本地文件选择"
                            onClick={handleFileUpload}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <polyline points="21 15 16 10 5 21" />
                            </svg>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            style={{ display: "none" }}
                            onChange={handleFileChange}
                          />
                        </div>
                        <span className="quick-add__hint" style={{ marginTop: 6 }}>
                          点击图片选择，
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" style={{ verticalAlign: "middle" }}>
                            <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                          </svg>
                          {" "}换一批，
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{ verticalAlign: "middle" }}>
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                          {" "}上传本地图片
                        </span>
                      </label>

                      {/* Model selector */}
                      <div className="quick-add__field" style={{ gridColumn: "span 2" }}>
                        <span className="quick-add__label">{t("channelsQuickAdd.agentModel")}</span>
                        <Dropdown
                          value={form.agentModel || null}
                          placeholder={t("channelsQuickAdd.selectModel") ?? "选择模型"}
                          groups={modelGroups}
                          items={modelGroups ? undefined : availableModels}
                          open={modelDropdownOpen}
                          expandedGroups={modelDropdownExpandedGroups}
                          onSelect={(val) => onFieldChange("agentModel", val)}
                          onToggle={onModelDropdownToggle}
                          onGroupToggle={onModelDropdownGroupToggle}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* ── Submit ── */}
          <div className="quick-add__actions">
            <button className="btn primary quick-add__submit" disabled={!canSubmit} onClick={onSubmit}>
              {busy ? t("channelsQuickAdd.adding") : t("channelsQuickAdd.addAndApply")}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
