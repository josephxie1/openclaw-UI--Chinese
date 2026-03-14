import { useEffect, useRef } from "react";
import { GatewayBrowserClient, resolveGatewayErrorDetailCode, type GatewayEventFrame, type GatewayHelloOk } from "../lib/gateway.ts";
import { addExecApproval, parseExecApprovalRequested, parseExecApprovalResolved, removeExecApproval } from "../lib/controllers/exec-approval.ts";
import { handleAgentEvent, resetToolStream, type AgentEventPayload } from "../lib/app-tool-stream.ts";
import { flushChatQueueForEvent, CHAT_SESSIONS_ACTIVE_MINUTES } from "../lib/app-chat.ts";
import { shouldReloadHistoryForFinalEvent } from "../lib/chat-event-reload.ts";
import { handleChatEvent, loadChatHistory, type ChatEventPayload } from "../lib/controllers/chat.ts";
import { loadAgents, loadToolsCatalog } from "../lib/controllers/agents.ts";
import { loadAssistantIdentity } from "../lib/controllers/assistant-identity.ts";
import { loadDevices } from "../lib/controllers/devices.ts";
import { loadNodes } from "../lib/controllers/nodes.ts";
import { loadSessions } from "../lib/controllers/sessions.ts";
import { refreshActiveTab, setLastActiveSessionKey } from "../lib/app-settings.ts";
import { useAppStore, getReactiveState } from "../store/appStore.ts";
import { generateUUID } from "../lib/uuid.ts";

/** Gateway WebSocket hook — connects on mount, cleans up on unmount */
export function useGateway() {
  const clientInstanceId = useRef(generateUUID());

  useEffect(() => {
    const s = useAppStore.getState();
    s.set({
      lastError: null,
      lastErrorCode: null,
      hello: null,
      connected: false,
      execApprovalQueue: [],
      execApprovalError: null,
    });

    const { settings, password } = s;
    const client = new GatewayBrowserClient({
      url: settings.gatewayUrl,
      token: settings.token.trim() ? settings.token : undefined,
      password: password.trim() ? password : undefined,
      clientName: "openclaw-control-ui",
      mode: "webchat",
      instanceId: clientInstanceId.current,

      onHello: (hello: GatewayHelloOk) => {
        if (useAppStore.getState().client !== client) return;
        const snapshot = hello.snapshot as {
          presence?: unknown[];
          health?: unknown;
          updateAvailable?: unknown;
        } | undefined;
        const patch: Partial<import("../store/appStore.ts").AppState> = {
          connected: true,
          lastError: null,
          lastErrorCode: null,
          hello,
          chatRunId: null,
          chatStream: null,
          chatStreamStartedAt: null,
        };
        if (snapshot?.presence && Array.isArray(snapshot.presence)) {
          patch.presenceEntries = snapshot.presence as never;
        }
        if (snapshot?.health) {
          patch.debugHealth = snapshot.health as never;
        }
        if (typeof snapshot?.updateAvailable !== "undefined") {
          patch.updateAvailable = snapshot.updateAvailable ?? null;
        }
        useAppStore.getState().set(patch);
        const rs = getReactiveState();
        resetToolStream(rs as never);
        void loadAssistantIdentity(rs as never);
        void loadAgents(rs as never);
        void loadToolsCatalog(rs as never);
        void loadNodes(rs as never, { quiet: true });
        void loadDevices(rs as never, { quiet: true });
        void loadSessions(rs as never);
        void refreshActiveTab(rs as never);
      },

      onClose: ({ code, error }: { code: number; reason: string; error?: { message?: string; code?: string; details?: unknown } }) => {
        if (useAppStore.getState().client !== client) return;
        const lastErrorCode =
          resolveGatewayErrorDetailCode(error as { details?: unknown } | undefined) ??
          (typeof error?.code === "string" ? error.code : null);
        if (code !== 1012) {
          useAppStore.getState().set({
            connected: false,
            lastErrorCode,
            lastError: error?.message ?? `disconnected (${code})`,
          });
        } else {
          useAppStore.getState().set({ connected: false, lastError: null, lastErrorCode: null });
        }
      },

      onEvent: (evt: GatewayEventFrame) => {
        if (useAppStore.getState().client !== client) return;
        handleGatewayEvent(evt);
      },

      onGap: ({ expected, received }: { expected: number; received: number }) => {
        if (useAppStore.getState().client !== client) return;
        useAppStore.getState().set({
          lastError: `event gap (expected ${expected}, got ${received}); refresh recommended`,
          lastErrorCode: null,
        });
      },
    });

    useAppStore.getState().set({ client });
    client.start();

    return () => {
      client.stop();
      useAppStore.getState().set({ client: null, connected: false });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ---------------------------------------------------------------------------
// Gateway event dispatcher
// ---------------------------------------------------------------------------
function handleGatewayEvent(evt: GatewayEventFrame) {
  const s = getReactiveState();

  // Buffer event log (for debug tab)
  const newLog = [{ ts: Date.now(), event: evt.event, payload: evt.payload }, ...(s.eventLog ?? [])].slice(0, 250);
  if (s.tab === "debug") {
    useAppStore.getState().set({ eventLog: newLog });
  }

  if (evt.event === "agent") {
    if (s.onboarding) return;
    handleAgentEvent(s as never, evt.payload as AgentEventPayload | undefined);
    return;
  }

  if (evt.event === "chat") {
    const payload = evt.payload as ChatEventPayload | undefined;
    if (payload?.sessionKey) {
      setLastActiveSessionKey(s as never, payload.sessionKey);
    }
    const chatState = handleChatEvent(s as never, payload);
    if (chatState === "final" || chatState === "error" || chatState === "aborted") {
      resetToolStream(s as never);
      void flushChatQueueForEvent(s as never);
      const runId = payload?.runId;
      if (runId && s.refreshSessionsAfterChat.has(runId)) {
        s.refreshSessionsAfterChat.delete(runId);
        if (chatState === "final") {
          void loadSessions(s as never, { activeMinutes: CHAT_SESSIONS_ACTIVE_MINUTES });
        }
      }
    }
    if (chatState === "final" && shouldReloadHistoryForFinalEvent(payload)) {
      void loadChatHistory(s as never);
    }
    return;
  }

  if (evt.event === "presence") {
    const payload = evt.payload as { presence?: unknown[] } | undefined;
    if (payload?.presence && Array.isArray(payload.presence)) {
      useAppStore.getState().set({ presenceEntries: payload.presence as never, presenceError: null, presenceStatus: null });
    }
    return;
  }

  if (evt.event === "device.pair.requested" || evt.event === "device.pair.resolved") {
    void loadDevices(s as never, { quiet: true });
    return;
  }

  if (evt.event === "exec.approval.requested") {
    const entry = parseExecApprovalRequested(evt.payload);
    if (entry) {
      useAppStore.getState().set({ execApprovalQueue: addExecApproval(useAppStore.getState().execApprovalQueue, entry), execApprovalError: null });
      const delay = Math.max(0, entry.expiresAtMs - Date.now() + 500);
      window.setTimeout(() => {
        const cur = useAppStore.getState();
        cur.set({ execApprovalQueue: removeExecApproval(cur.execApprovalQueue, entry.id) });
      }, delay);
    }
    return;
  }

  if (evt.event === "exec.approval.resolved") {
    const resolved = parseExecApprovalResolved(evt.payload);
    if (resolved) {
      useAppStore.getState().set({ execApprovalQueue: removeExecApproval(useAppStore.getState().execApprovalQueue, resolved.id) });
    }
    return;
  }
}
