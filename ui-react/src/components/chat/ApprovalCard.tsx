import React from "react";
import { t } from "../../i18n/index.ts";

// ─── Types ───────────────────────────────────────────────────

type ApprovalState = "requested" | "approved" | "rejected";

interface ApprovalItem {
  label?: string;
  summary?: string;
  [key: string]: unknown;
}

interface ApprovalData {
  prompt: string;
  items: ApprovalItem[];
  resumeToken?: string;
}

interface ApprovalCardProps {
  state: ApprovalState;
  data: ApprovalData;
  onApprove?: (token: string) => void;
  onReject?: (token: string) => void;
}

// ─── Icons ───────────────────────────────────────────────────

function ShieldIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z" />
    </svg>
  );
}

function CheckCircleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function XCircleIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="15" y1="9" x2="9" y2="15" />
      <line x1="9" y1="9" x2="15" y2="15" />
    </svg>
  );
}

// ─── Item rendering ─────────────────────────────────────────

function formatApprovalItem(item: unknown, index: number): string {
  if (typeof item === "string") {
    return item;
  }
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    // Intentar campos comunes para etiquetas legibles
    const label = obj.label ?? obj.summary ?? obj.name ?? obj.subject ?? obj.title;
    if (typeof label === "string") {
      return label;
    }
    // Devolver un JSON compacto como fallback
    return JSON.stringify(obj).slice(0, 100);
  }
  return `Item ${index + 1}`;
}

// ─── Component ───────────────────────────────────────────────

export function ApprovalCard({ state, data, onApprove, onReject }: ApprovalCardProps) {
  const token = data.resumeToken ?? "";
  const items = Array.isArray(data.items) ? data.items : [];

  return (
    <div className={`approval-card approval-card--${state}`} role="alert">
      {/* Encabezado */}
      <div className="approval-card__header">
        <span className="approval-card__icon">
          {state === "requested" && <ShieldIcon />}
          {state === "approved" && <CheckCircleIcon />}
          {state === "rejected" && <XCircleIcon />}
        </span>
        <span className="approval-card__title">
          {state === "requested" && t("approval.title")}
          {state === "approved" && t("approval.approved")}
          {state === "rejected" && t("approval.rejected")}
        </span>
      </div>

      {/* Prompt */}
      <div className="approval-card__prompt">{data.prompt}</div>

      {/* Lista de items */}
      {items.length > 0 && (
        <ul className="approval-card__items">
          {items.slice(0, 10).map((item, i) => (
            <li key={i} className="approval-card__item">
              {formatApprovalItem(item, i)}
            </li>
          ))}
          {items.length > 10 && (
            <li className="approval-card__item approval-card__item--more">
              +{items.length - 10} more
            </li>
          )}
        </ul>
      )}

      {/* Botones de acción (solo en estado 'requested') */}
      {state === "requested" && token && (
        <div className="approval-card__actions">
          <button
            className="approval-card__btn approval-card__btn--reject"
            type="button"
            onClick={() => onReject?.(token)}
          >
            <XCircleIcon />
            {t("approval.reject")}
          </button>
          <button
            className="approval-card__btn approval-card__btn--approve"
            type="button"
            onClick={() => onApprove?.(token)}
          >
            <CheckCircleIcon />
            {t("approval.approve")}
          </button>
        </div>
      )}

      {/* Estado resuelto */}
      {state === "approved" && (
        <div className="approval-card__resolved approval-card__resolved--approved">
          {t("approval.approvedDesc")}
        </div>
      )}
      {state === "rejected" && (
        <div className="approval-card__resolved approval-card__resolved--rejected">
          {t("approval.rejectedDesc")}
        </div>
      )}
    </div>
  );
}

// ─── Helper: parse lobster result to detect approval ────────

export type LobsterApproval = {
  state: ApprovalState;
  data: ApprovalData;
} | null;

export function parseLobsterApproval(text: string | undefined): LobsterApproval {
  if (!text?.trim()) {
    return null;
  }
  try {
    const parsed = JSON.parse(text.trim());
    if (typeof parsed !== "object" || parsed === null) {
      return null;
    }

    // Estado "necesita aprobación"
    if (parsed.status === "needs_approval" && parsed.requiresApproval) {
      return {
        state: "requested",
        data: {
          prompt: parsed.requiresApproval.prompt ?? "Approval required",
          items: Array.isArray(parsed.requiresApproval.items) ? parsed.requiresApproval.items : [],
          resumeToken: parsed.requiresApproval.resumeToken,
        },
      };
    }

    // Estado "cancelado" (rechazado)
    if (parsed.status === "cancelled") {
      return {
        state: "rejected",
        data: {
          prompt: parsed.requiresApproval?.prompt ?? "Workflow cancelled",
          items: [],
        },
      };
    }

    return null;
  } catch {
    return null;
  }
}
