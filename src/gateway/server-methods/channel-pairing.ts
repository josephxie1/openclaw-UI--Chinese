import { listPairingChannels, notifyPairingApproved } from "../../channels/plugins/pairing.js";
import { loadConfig } from "../../config/config.js";
import {
  approveChannelPairingCode,
  listChannelPairingRequests,
} from "../../pairing/pairing-store.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

export const channelPairingHandlers: GatewayRequestHandlers = {
  "channel.pairing.list": async ({ respond }) => {
    try {
      const channels = listPairingChannels();
      const results: Array<{
        channel: string;
        requests: Array<{
          id: string;
          code: string;
          createdAt: string;
          meta?: Record<string, string>;
        }>;
      }> = [];

      for (const channel of channels) {
        const requests = await listChannelPairingRequests(channel);
        if (requests.length > 0) {
          results.push({ channel, requests });
        }
      }

      respond(true, { channels: results }, undefined);
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.UNAVAILABLE,
          `failed to list channel pairing requests: ${String(err)}`,
        ),
      );
    }
  },

  "channel.pairing.approve": async ({ params, respond, context }) => {
    const channel = typeof params.channel === "string" ? params.channel.trim() : "";
    const code = typeof params.code === "string" ? params.code.trim() : "";

    if (!channel || !code) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "channel and code are required"),
      );
      return;
    }

    try {
      const approved = await approveChannelPairingCode({ channel, code });
      if (!approved) {
        respond(
          false,
          undefined,
          errorShape(
            ErrorCodes.INVALID_REQUEST,
            `no pending pairing request found for code: ${code}`,
          ),
        );
        return;
      }

      context.logGateway.info(`channel pairing approved channel=${channel} sender=${approved.id}`);

      // Notify the requester on the channel (best-effort)
      try {
        const cfg = loadConfig();
        await notifyPairingApproved({ channelId: channel, id: approved.id, cfg });
      } catch {
        // Non-fatal: approval succeeded even if notification fails
      }

      respond(true, { channel, id: approved.id }, undefined);
    } catch (err) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.UNAVAILABLE, `failed to approve pairing: ${String(err)}`),
      );
    }
  },
};
