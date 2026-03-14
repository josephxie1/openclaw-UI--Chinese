/**
 * Gateway protocol types and constants — self-contained copy from src/gateway/.
 * These are inlined here so ui-react has zero imports from the monorepo backend.
 */

// ─── Events ─────────────────────────────────────────────────────────
export const GATEWAY_EVENT_UPDATE_AVAILABLE = "update.available" as const;

export type UpdateAvailable = {
  version?: string;
  url?: string;
  releaseNotes?: string;
  [key: string]: unknown;
};

export type GatewayUpdateAvailableEventPayload = {
  updateAvailable: UpdateAvailable | null;
};

// ─── Client Info ────────────────────────────────────────────────────
export const GATEWAY_CLIENT_IDS = {
  WEBCHAT_UI: "webchat-ui",
  CONTROL_UI: "openclaw-control-ui",
  WEBCHAT: "webchat",
  CLI: "cli",
  GATEWAY_CLIENT: "gateway-client",
  MACOS_APP: "openclaw-macos",
  IOS_APP: "openclaw-ios",
  ANDROID_APP: "openclaw-android",
  NODE_HOST: "node-host",
  TEST: "test",
  FINGERPRINT: "fingerprint",
  PROBE: "openclaw-probe",
} as const;

export type GatewayClientId = (typeof GATEWAY_CLIENT_IDS)[keyof typeof GATEWAY_CLIENT_IDS];

export const GATEWAY_CLIENT_NAMES = GATEWAY_CLIENT_IDS;
export type GatewayClientName = GatewayClientId;

export const GATEWAY_CLIENT_MODES = {
  WEBCHAT: "webchat",
  CLI: "cli",
  UI: "ui",
  BACKEND: "backend",
  NODE: "node",
  PROBE: "probe",
  TEST: "test",
} as const;

export type GatewayClientMode = (typeof GATEWAY_CLIENT_MODES)[keyof typeof GATEWAY_CLIENT_MODES];

export type GatewayClientInfo = {
  id: GatewayClientId;
  displayName?: string;
  version: string;
  platform: string;
  deviceFamily?: string;
  modelIdentifier?: string;
  mode: GatewayClientMode;
  instanceId?: string;
};

export const GATEWAY_CLIENT_CAPS = { TOOL_EVENTS: "tool-events" } as const;
export type GatewayClientCap = (typeof GATEWAY_CLIENT_CAPS)[keyof typeof GATEWAY_CLIENT_CAPS];

const GATEWAY_CLIENT_ID_SET = new Set<GatewayClientId>(Object.values(GATEWAY_CLIENT_IDS));
const GATEWAY_CLIENT_MODE_SET = new Set<GatewayClientMode>(Object.values(GATEWAY_CLIENT_MODES));

export function normalizeGatewayClientId(raw?: string | null): GatewayClientId | undefined {
  const normalized = raw?.trim().toLowerCase();
  if (!normalized) return undefined;
  return GATEWAY_CLIENT_ID_SET.has(normalized as GatewayClientId) ? (normalized as GatewayClientId) : undefined;
}

export function normalizeGatewayClientName(raw?: string | null): GatewayClientName | undefined {
  return normalizeGatewayClientId(raw);
}

export function normalizeGatewayClientMode(raw?: string | null): GatewayClientMode | undefined {
  const normalized = raw?.trim().toLowerCase();
  if (!normalized) return undefined;
  return GATEWAY_CLIENT_MODE_SET.has(normalized as GatewayClientMode)
    ? (normalized as GatewayClientMode)
    : undefined;
}

export function hasGatewayClientCap(caps: string[] | null | undefined, cap: GatewayClientCap): boolean {
  if (!Array.isArray(caps)) return false;
  return caps.includes(cap);
}

// ─── Connect Error Details ──────────────────────────────────────────
export const ConnectErrorDetailCodes = {
  AUTH_REQUIRED: "AUTH_REQUIRED",
  AUTH_UNAUTHORIZED: "AUTH_UNAUTHORIZED",
  AUTH_TOKEN_MISSING: "AUTH_TOKEN_MISSING",
  AUTH_TOKEN_MISMATCH: "AUTH_TOKEN_MISMATCH",
  AUTH_TOKEN_NOT_CONFIGURED: "AUTH_TOKEN_NOT_CONFIGURED",
  AUTH_PASSWORD_MISSING: "AUTH_PASSWORD_MISSING",
  AUTH_PASSWORD_MISMATCH: "AUTH_PASSWORD_MISMATCH",
  AUTH_PASSWORD_NOT_CONFIGURED: "AUTH_PASSWORD_NOT_CONFIGURED",
  AUTH_DEVICE_TOKEN_MISMATCH: "AUTH_DEVICE_TOKEN_MISMATCH",
  AUTH_RATE_LIMITED: "AUTH_RATE_LIMITED",
  AUTH_TAILSCALE_IDENTITY_MISSING: "AUTH_TAILSCALE_IDENTITY_MISSING",
  AUTH_TAILSCALE_PROXY_MISSING: "AUTH_TAILSCALE_PROXY_MISSING",
  AUTH_TAILSCALE_WHOIS_FAILED: "AUTH_TAILSCALE_WHOIS_FAILED",
  AUTH_TAILSCALE_IDENTITY_MISMATCH: "AUTH_TAILSCALE_IDENTITY_MISMATCH",
  CONTROL_UI_DEVICE_IDENTITY_REQUIRED: "CONTROL_UI_DEVICE_IDENTITY_REQUIRED",
  DEVICE_IDENTITY_REQUIRED: "DEVICE_IDENTITY_REQUIRED",
  DEVICE_AUTH_INVALID: "DEVICE_AUTH_INVALID",
  DEVICE_AUTH_DEVICE_ID_MISMATCH: "DEVICE_AUTH_DEVICE_ID_MISMATCH",
  DEVICE_AUTH_SIGNATURE_EXPIRED: "DEVICE_AUTH_SIGNATURE_EXPIRED",
  DEVICE_AUTH_NONCE_REQUIRED: "DEVICE_AUTH_NONCE_REQUIRED",
  DEVICE_AUTH_NONCE_MISMATCH: "DEVICE_AUTH_NONCE_MISMATCH",
  DEVICE_AUTH_SIGNATURE_INVALID: "DEVICE_AUTH_SIGNATURE_INVALID",
  DEVICE_AUTH_PUBLIC_KEY_INVALID: "DEVICE_AUTH_PUBLIC_KEY_INVALID",
  PAIRING_REQUIRED: "PAIRING_REQUIRED",
} as const;

export type ConnectErrorDetailCode = (typeof ConnectErrorDetailCodes)[keyof typeof ConnectErrorDetailCodes];

export function resolveAuthConnectErrorDetailCode(reason: string | undefined): ConnectErrorDetailCode {
  switch (reason) {
    case "token_missing": return ConnectErrorDetailCodes.AUTH_TOKEN_MISSING;
    case "token_mismatch": return ConnectErrorDetailCodes.AUTH_TOKEN_MISMATCH;
    case "token_missing_config": return ConnectErrorDetailCodes.AUTH_TOKEN_NOT_CONFIGURED;
    case "password_missing": return ConnectErrorDetailCodes.AUTH_PASSWORD_MISSING;
    case "password_mismatch": return ConnectErrorDetailCodes.AUTH_PASSWORD_MISMATCH;
    case "password_missing_config": return ConnectErrorDetailCodes.AUTH_PASSWORD_NOT_CONFIGURED;
    case "tailscale_user_missing": return ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISSING;
    case "tailscale_proxy_missing": return ConnectErrorDetailCodes.AUTH_TAILSCALE_PROXY_MISSING;
    case "tailscale_whois_failed": return ConnectErrorDetailCodes.AUTH_TAILSCALE_WHOIS_FAILED;
    case "tailscale_user_mismatch": return ConnectErrorDetailCodes.AUTH_TAILSCALE_IDENTITY_MISMATCH;
    case "rate_limited": return ConnectErrorDetailCodes.AUTH_RATE_LIMITED;
    case "device_token_mismatch": return ConnectErrorDetailCodes.AUTH_DEVICE_TOKEN_MISMATCH;
    case undefined: return ConnectErrorDetailCodes.AUTH_REQUIRED;
    default: return ConnectErrorDetailCodes.AUTH_UNAUTHORIZED;
  }
}

export function resolveDeviceAuthConnectErrorDetailCode(reason: string | undefined): ConnectErrorDetailCode {
  switch (reason) {
    case "device-id-mismatch": return ConnectErrorDetailCodes.DEVICE_AUTH_DEVICE_ID_MISMATCH;
    case "device-signature-stale": return ConnectErrorDetailCodes.DEVICE_AUTH_SIGNATURE_EXPIRED;
    case "device-nonce-missing": return ConnectErrorDetailCodes.DEVICE_AUTH_NONCE_REQUIRED;
    case "device-nonce-mismatch": return ConnectErrorDetailCodes.DEVICE_AUTH_NONCE_MISMATCH;
    case "device-signature": return ConnectErrorDetailCodes.DEVICE_AUTH_SIGNATURE_INVALID;
    case "device-public-key": return ConnectErrorDetailCodes.DEVICE_AUTH_PUBLIC_KEY_INVALID;
    default: return ConnectErrorDetailCodes.DEVICE_AUTH_INVALID;
  }
}

export function readConnectErrorDetailCode(details: unknown): string | null {
  if (!details || typeof details !== "object" || Array.isArray(details)) return null;
  const code = (details as { code?: unknown }).code;
  return typeof code === "string" && code.trim().length > 0 ? code : null;
}

// ─── Device Auth ────────────────────────────────────────────────────
function normalizeTrimmedMetadata(value?: string | null): string {
  if (typeof value !== "string") return "";
  const trimmed = value.trim();
  return trimmed ? trimmed : "";
}

function toLowerAscii(input: string): string {
  return input.replace(/[A-Z]/g, (char) => String.fromCharCode(char.charCodeAt(0) + 32));
}

export function normalizeDeviceMetadataForAuth(value?: string | null): string {
  const trimmed = normalizeTrimmedMetadata(value);
  if (!trimmed) return "";
  return toLowerAscii(trimmed);
}

export type DeviceAuthPayloadParams = {
  deviceId: string;
  clientId: string;
  clientMode: string;
  role: string;
  scopes: string[];
  signedAtMs: number;
  token?: string | null;
  nonce: string;
};

export type DeviceAuthPayloadV3Params = DeviceAuthPayloadParams & {
  platform?: string | null;
  deviceFamily?: string | null;
};

export function buildDeviceAuthPayload(params: DeviceAuthPayloadParams): string {
  const scopes = params.scopes.join(",");
  const token = params.token ?? "";
  return ["v2", params.deviceId, params.clientId, params.clientMode, params.role, scopes, String(params.signedAtMs), token, params.nonce].join("|");
}

export function buildDeviceAuthPayloadV3(params: DeviceAuthPayloadV3Params): string {
  const scopes = params.scopes.join(",");
  const token = params.token ?? "";
  const platform = normalizeDeviceMetadataForAuth(params.platform);
  const deviceFamily = normalizeDeviceMetadataForAuth(params.deviceFamily);
  return ["v3", params.deviceId, params.clientId, params.clientMode, params.role, scopes, String(params.signedAtMs), token, params.nonce, platform, deviceFamily].join("|");
}

// ─── Control UI Contract ────────────────────────────────────────────
export const CONTROL_UI_BOOTSTRAP_CONFIG_PATH = "/__openclaw/control-ui-config.json";

export type ControlUiBootstrapConfig = {
  basePath: string;
  assistantName: string;
  assistantAvatar: string;
  assistantAgentId: string;
};
