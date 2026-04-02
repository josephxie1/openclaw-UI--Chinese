import { listChannelPlugins } from "../../channels/plugins/index.js";
import type { ChannelPlugin } from "../../channels/plugins/types.js";
import { getActivePluginRegistry } from "../../plugins/runtime.js";
import {
  ErrorCodes,
  errorShape,
  formatValidationErrors,
  validateWebLoginStartParams,
  validateWebLoginWaitParams,
} from "../protocol/index.js";
import { formatForLog } from "../ws-log.js";
import type { GatewayRequestHandlers, RespondFn } from "./types.js";

const WEB_LOGIN_METHODS = new Set(["web.login.start", "web.login.wait"]);

function hasQrLogin(plugin: ChannelPlugin): boolean {
  return (
    (plugin.gatewayMethods ?? []).some((m) => WEB_LOGIN_METHODS.has(m)) ||
    plugin.gateway?.loginWithQrStart != null
  );
}

/** Resolve a channel plugin that supports QR login.
 *  Checks both the pinned channel registry (built-in channels) and
 *  the full active registry (extension channels like openclaw-weixin). */
const resolveWebLoginProvider = (channel?: string): ChannelPlugin | null => {
  // Primero: buscar en el registro de canales pinned (built-in)
  const pinnedPlugins = listChannelPlugins().filter(hasQrLogin);
  if (channel) {
    const match = pinnedPlugins.find((p) => p.id === channel);
    if (match) {
      return match;
    }
  } else if (pinnedPlugins.length > 0) {
    return pinnedPlugins[0];
  }

  // Segundo: buscar en el registro activo completo (incluye extensiones)
  const activeRegistry = getActivePluginRegistry();
  if (activeRegistry) {
    const extensionPlugins = activeRegistry.channels
      .map((entry) => entry.plugin)
      .filter(hasQrLogin);
    if (channel) {
      return extensionPlugins.find((p) => p.id === channel) ?? null;
    }
    return extensionPlugins[0] ?? null;
  }

  return null;
};

function resolveAccountId(params: unknown): string | undefined {
  return typeof (params as { accountId?: unknown }).accountId === "string"
    ? (params as { accountId?: string }).accountId
    : undefined;
}

function respondProviderUnavailable(respond: RespondFn) {
  respond(
    false,
    undefined,
    errorShape(ErrorCodes.INVALID_REQUEST, "web login provider is not available"),
  );
}

function respondProviderUnsupported(respond: RespondFn, providerId: string) {
  respond(
    false,
    undefined,
    errorShape(ErrorCodes.INVALID_REQUEST, `web login is not supported by provider ${providerId}`),
  );
}

export const webHandlers: GatewayRequestHandlers = {
  "web.login.start": async ({ params, respond, context }) => {
    if (!validateWebLoginStartParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid web.login.start params: ${formatValidationErrors(validateWebLoginStartParams.errors)}`,
        ),
      );
      return;
    }
    try {
      const accountId = resolveAccountId(params);
      const channel =
        typeof (params as { channel?: unknown }).channel === "string"
          ? (params as { channel?: string }).channel
          : undefined;
      const provider = resolveWebLoginProvider(channel);
      if (!provider) {
        respondProviderUnavailable(respond);
        return;
      }
      await context.stopChannel(provider.id, accountId);
      if (!provider.gateway?.loginWithQrStart) {
        respondProviderUnsupported(respond, provider.id);
        return;
      }
      const result = await provider.gateway.loginWithQrStart({
        force: Boolean((params as { force?: boolean }).force),
        timeoutMs:
          typeof (params as { timeoutMs?: unknown }).timeoutMs === "number"
            ? (params as { timeoutMs?: number }).timeoutMs
            : undefined,
        verbose: Boolean((params as { verbose?: boolean }).verbose),
        accountId,
      });
      respond(true, result, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
    }
  },
  "web.login.wait": async ({ params, respond, context }) => {
    if (!validateWebLoginWaitParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid web.login.wait params: ${formatValidationErrors(validateWebLoginWaitParams.errors)}`,
        ),
      );
      return;
    }
    try {
      const accountId = resolveAccountId(params);
      const channel =
        typeof (params as { channel?: unknown }).channel === "string"
          ? (params as { channel?: string }).channel
          : undefined;
      const provider = resolveWebLoginProvider(channel);
      if (!provider) {
        respondProviderUnavailable(respond);
        return;
      }
      if (!provider.gateway?.loginWithQrWait) {
        respondProviderUnsupported(respond, provider.id);
        return;
      }
      const result = await provider.gateway.loginWithQrWait({
        timeoutMs:
          typeof (params as { timeoutMs?: unknown }).timeoutMs === "number"
            ? (params as { timeoutMs?: number }).timeoutMs
            : undefined,
        accountId,
        ...(typeof (params as { sessionKey?: unknown }).sessionKey === "string"
          ? { sessionKey: (params as { sessionKey?: string }).sessionKey }
          : {}),
      });
      if (result.connected) {
        await context.startChannel(provider.id, accountId);
      }
      respond(true, result, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, formatForLog(err)));
    }
  },
};
