import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";
import type { ConfigUiHints } from "../types.ts";
import type { ChannelsProps } from "./channels.types.ts";
import { analyzeConfigSchema, renderNode, schemaType, type JsonSchema } from "./config-form.ts";

type ChannelConfigFormProps = {
  channelId: string;
  configValue: Record<string, unknown> | null;
  schema: unknown;
  uiHints: ConfigUiHints;
  disabled: boolean;
  onPatch: (path: Array<string | number>, value: unknown) => void;
};

function resolveSchemaNode(
  schema: JsonSchema | null,
  path: Array<string | number>,
): JsonSchema | null {
  let current = schema;
  for (const key of path) {
    if (!current) {
      return null;
    }
    const type = schemaType(current);
    if (type === "object") {
      const properties = current.properties ?? {};
      if (typeof key === "string" && properties[key]) {
        current = properties[key];
        continue;
      }
      const additional = current.additionalProperties;
      if (typeof key === "string" && additional && typeof additional === "object") {
        current = additional;
        continue;
      }
      return null;
    }
    if (type === "array") {
      if (typeof key !== "number") {
        return null;
      }
      const items = Array.isArray(current.items) ? current.items[0] : current.items;
      current = items ?? null;
      continue;
    }
    return null;
  }
  return current;
}

function resolveChannelValue(
  config: Record<string, unknown>,
  channelId: string,
): Record<string, unknown> {
  const channels = (config.channels ?? {}) as Record<string, unknown>;
  const fromChannels = channels[channelId];
  const fallback = config[channelId];
  const resolved =
    (fromChannels && typeof fromChannels === "object"
      ? (fromChannels as Record<string, unknown>)
      : null) ??
    (fallback && typeof fallback === "object" ? (fallback as Record<string, unknown>) : null);
  return resolved ?? {};
}

const EXTRA_CHANNEL_FIELDS = ["groupPolicy", "streamMode", "dmPolicy"] as const;

function formatExtraValue(raw: unknown): string {
  if (raw == null) {
    return "n/a";
  }
  if (typeof raw === "string" || typeof raw === "number" || typeof raw === "boolean") {
    return String(raw);
  }
  try {
    return JSON.stringify(raw);
  } catch {
    return "n/a";
  }
}

function renderExtraChannelFields(value: Record<string, unknown>) {
  const entries = EXTRA_CHANNEL_FIELDS.flatMap((field) => {
    if (!(field in value)) {
      return [];
    }
    return [[field, value[field]]] as Array<[string, unknown]>;
  });
  if (entries.length === 0) {
    return null;
  }
  return html`
    <div class="status-list" style="margin-top: 12px;">
      ${entries.map(
        ([field, raw]) => html`
          <div>
            <span class="label">${field}</span>
            <span>${formatExtraValue(raw)}</span>
          </div>
        `,
      )}
    </div>
  `;
}

/** Fields shown by default for every channel */
const BASIC_FIELDS = new Set(["accounts", "enabled"]);
/** Fields shown by default for each account entry inside accounts */
const BASIC_ACCOUNT_FIELDS = new Set(["appId", "appSecret", "botName", "enabled", "name"]);

/**
 * Strip advanced sub-fields from the accounts schema so only basic
 * account fields are rendered in the main view.
 */
function filterAccountSchema(accountsSchema: JsonSchema): JsonSchema {
  // accounts is a map → additionalProperties is the per-account schema
  const perAccount = accountsSchema.additionalProperties;
  if (!perAccount || typeof perAccount !== "object") {
    return accountsSchema;
  }
  const perAccountSchema = perAccount;
  const props = perAccountSchema.properties;
  if (!props) {
    return accountsSchema;
  }
  const filtered: Record<string, JsonSchema> = {};
  for (const [k, v] of Object.entries(props)) {
    if (BASIC_ACCOUNT_FIELDS.has(k)) {
      filtered[k] = v;
    }
  }
  return {
    ...accountsSchema,
    additionalProperties: { ...perAccountSchema, properties: filtered },
  };
}

export function renderChannelConfigForm(props: ChannelConfigFormProps) {
  const analysis = analyzeConfigSchema(props.schema);
  const normalized = analysis.schema;
  if (!normalized) {
    return html`
      <div class="callout danger">${t("channelsView.schemaUnavailable")}</div>
    `;
  }
  const node = resolveSchemaNode(normalized, ["channels", props.channelId]);
  if (!node) {
    return html`
      <div class="callout danger">${t("channelsView.channelSchemaUnavailable")}</div>
    `;
  }
  const configValue = props.configValue ?? {};
  const value = resolveChannelValue(configValue, props.channelId);

  // Split schema properties into basic and advanced
  const allProps = node.properties ?? {};
  const basicProps: Record<string, JsonSchema> = {};
  const advancedProps: Record<string, JsonSchema> = {};
  for (const [k, v] of Object.entries(allProps)) {
    if (BASIC_FIELDS.has(k)) {
      // For accounts, further filter to only show basic account fields
      basicProps[k] = k === "accounts" ? filterAccountSchema(v) : v;
    } else {
      advancedProps[k] = v;
    }
  }

  const basicSchema: JsonSchema = { ...node, properties: basicProps };
  const advancedSchema: JsonSchema = { ...node, properties: advancedProps };

  const commonOpts = {
    path: ["channels", props.channelId] as Array<string | number>,
    hints: props.uiHints,
    unsupported: new Set(analysis.unsupportedPaths),
    disabled: props.disabled,
    showLabel: false,
    onPatch: props.onPatch,
  };

  const hasAdvanced = Object.keys(advancedProps).length > 0;

  return html`
    <div class="config-form">
      ${renderNode({ schema: basicSchema, value, ...commonOpts })}
      ${
        hasAdvanced
          ? html`
            <details class="channel-advanced-section">
              <summary class="channel-advanced-toggle">
                <span>${t("channelsView.advancedSettings") ?? "高级设置"}</span>
                <svg class="channel-advanced-chevron" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </summary>
              <div class="channel-advanced-content">
                ${renderNode({ schema: advancedSchema, value, ...commonOpts })}
              </div>
            </details>
          `
          : nothing
      }
    </div>
    ${renderExtraChannelFields(value)}
  `;
}

export function renderChannelConfigSection(params: {
  channelId: string;
  props: ChannelsProps;
  extraButtons?: unknown;
}) {
  const { channelId, props, extraButtons } = params;
  const disabled = props.configSaving || props.configSchemaLoading;
  return html`
    <div style="margin-top: auto; padding-top: 16px;">
      ${
        props.configSchemaLoading
          ? html`
              <div class="muted">${t("channelsView.loadingSchema")}</div>
            `
          : renderChannelConfigForm({
              channelId,
              configValue: props.configForm,
              schema: props.configSchema,
              uiHints: props.configUiHints,
              disabled,
              onPatch: props.onConfigPatch,
            })
      }
      <div class="row" style="margin-top: 12px; flex-wrap: wrap;">
        <button
          class="btn primary"
          ?disabled=${disabled || !props.configFormDirty}
          @click=${() => props.onConfigSave()}
        >
          ${props.configSaving ? t("shared.saving") : t("shared.save")}
        </button>
        <button
          class="btn"
          ?disabled=${disabled}
          @click=${() => props.onConfigReload()}
        >
          ${t("shared.reload")}
        </button>
        ${extraButtons ?? nothing}
      </div>
    </div>
  `;
}
