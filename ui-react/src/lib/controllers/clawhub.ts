import { t } from "../../i18n/index.ts";
import type { GatewayBrowserClient } from "../gateway.ts";

export type ClawhubState = {
  client: GatewayBrowserClient | null;
  connected: boolean;
  clawhubQuery: string;
  clawhubResults: unknown[];
  clawhubLoading: boolean;
  clawhubInstalling: string | null;
  clawhubError: string | null;
  clawhubMessage: string | null;
  clawhubTokenMasked: string | null;
  clawhubTokenDraft: string;
  clawhubTokenSaving: boolean;
};

export async function loadClawhubToken(state: ClawhubState) {
  if (!state.client || !state.connected) return;
  try {
    const res = await state.client.request<{ hasToken?: boolean; masked?: string | null }>(
      "clawhub.token.get",
      {},
    );
    state.clawhubTokenMasked = res?.hasToken ? (res.masked ?? "****") : null;
  } catch {
    // Silently fail — token display is optional
  }
}

export async function saveClawhubToken(state: ClawhubState) {
  if (!state.client || !state.connected) return;
  if (state.clawhubTokenSaving) return;
  state.clawhubTokenSaving = true;
  state.clawhubError = null;
  state.clawhubMessage = null;
  try {
    await state.client.request("clawhub.token.set", { token: state.clawhubTokenDraft });
    state.clawhubMessage = state.clawhubTokenDraft
      ? t("clawhub.tokenSaved")
      : t("clawhub.tokenCleared");
    state.clawhubTokenDraft = "";
    // Reload masked token
    await loadClawhubToken(state);
  } catch (err) {
    state.clawhubError = err instanceof Error ? err.message : String(err);
  } finally {
    state.clawhubTokenSaving = false;
  }
}

export async function searchClawhub(state: ClawhubState, query: string) {
  if (!state.client || !state.connected) return;
  if (state.clawhubLoading) return;
  state.clawhubQuery = query;
  state.clawhubLoading = true;
  state.clawhubError = null;
  state.clawhubMessage = null;
  try {
    const res = await state.client.request<{ results?: unknown[]; items?: unknown[] }>(
      "clawhub.search",
      { query: query.trim(), limit: 20 },
    );
    state.clawhubResults = res?.results ?? res?.items ?? [];
  } catch (err) {
    state.clawhubError = err instanceof Error ? err.message : String(err);
    state.clawhubResults = [];
  } finally {
    state.clawhubLoading = false;
  }
}

export async function installClawhubSkill(state: ClawhubState, slug: string) {
  if (!state.client || !state.connected) return;
  if (state.clawhubInstalling) return;
  state.clawhubInstalling = slug;
  state.clawhubError = null;
  state.clawhubMessage = null;
  try {
    const res = await state.client.request<{
      sizeKB?: string;
      speedKBs?: string;
      elapsedMs?: number;
    }>("clawhub.install", { slug });
    const speedInfo = res?.sizeKB ? ` (${res.sizeKB} KB, ${res.speedKBs} KB/s)` : "";
    state.clawhubMessage = t("clawhub.installSuccess") + speedInfo;
  } catch (err) {
    state.clawhubError = `${t("clawhub.installError")}: ${err instanceof Error ? err.message : String(err)}`;
  } finally {
    state.clawhubInstalling = null;
  }
}
