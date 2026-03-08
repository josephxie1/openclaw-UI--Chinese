import { coerceIdentityValue } from "../../../src/shared/assistant-identity-values.js";

const MAX_ASSISTANT_NAME = 50;
const MAX_ASSISTANT_AVATAR = 200;

export const DEFAULT_ASSISTANT_NAME = "Assistant";
export const DEFAULT_ASSISTANT_AVATAR = "A";

export type AssistantIdentity = {
  agentId?: string | null;
  name: string;
  avatar: string | null;
};

function coerceAvatarValue(value: string | undefined): string | null {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  // Data URIs (base64 SVG/PNG) can be very long — don't truncate them
  if (/^data:image\//i.test(trimmed) || /^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return coerceIdentityValue(trimmed, MAX_ASSISTANT_AVATAR) ?? null;
}

export function normalizeAssistantIdentity(
  input?: Partial<AssistantIdentity> | null,
): AssistantIdentity {
  const name = coerceIdentityValue(input?.name, MAX_ASSISTANT_NAME) ?? DEFAULT_ASSISTANT_NAME;
  const avatar = coerceAvatarValue(input?.avatar ?? undefined);
  const agentId =
    typeof input?.agentId === "string" && input.agentId.trim() ? input.agentId.trim() : null;
  return { agentId, name, avatar };
}
