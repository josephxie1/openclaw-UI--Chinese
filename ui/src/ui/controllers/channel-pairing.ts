import type { GatewayBrowserClient } from "../gateway.ts";

export type ChannelPairingRequest = {
  id: string;
  code: string;
  createdAt: string;
  meta?: Record<string, string>;
};

export type ChannelPairingGroup = {
  channel: string;
  requests: ChannelPairingRequest[];
};

export type ChannelPairingState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  channelPairingsLoading: boolean;
  channelPairings: ChannelPairingGroup[];
  channelPairingsError: string | null;
};

export async function loadChannelPairings(state: ChannelPairingState) {
  if (!state.client || !state.connected) {
    return;
  }
  if (state.channelPairingsLoading) {
    return;
  }
  state.channelPairingsLoading = true;
  state.channelPairingsError = null;
  try {
    const res = await state.client.request<{
      channels?: ChannelPairingGroup[];
    }>("channel.pairing.list", {});
    state.channelPairings = Array.isArray(res?.channels) ? res.channels : [];
  } catch (err) {
    state.channelPairingsError = String(err);
  } finally {
    state.channelPairingsLoading = false;
  }
}

export async function approveChannelPairing(
  state: ChannelPairingState,
  channel: string,
  code: string,
) {
  if (!state.client || !state.connected) {
    return;
  }
  try {
    await state.client.request("channel.pairing.approve", { channel, code });
    await loadChannelPairings(state);
  } catch (err) {
    state.channelPairingsError = String(err);
  }
}
