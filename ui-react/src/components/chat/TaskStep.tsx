import React, { type ReactNode } from "react";
import { t } from "../../i18n/index.ts";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./primitives/Collapsible.tsx";

// ─── Status Icons ────────────────────────────────────────────

const CheckIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

const AlertIcon = () => (
  <svg
    width="11"
    height="11"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="12" x2="12" y1="8" y2="12" />
    <line x1="12" x2="12.01" y1="16" y2="16" />
  </svg>
);

const ChevronIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m6 9 6 6 6-6" />
  </svg>
);

// ─── Types ───────────────────────────────────────────────────

export type TaskStepStatus = "done" | "loading" | "error";

export interface TaskStepProps {
  label: string;
  status?: TaskStepStatus;
  timestamp?: number;
  defaultOpen?: boolean;
  children?: ReactNode;
}

// ─── Component ───────────────────────────────────────────────

export function TaskStep({
  label,
  status = "done",
  timestamp,
  defaultOpen = false,
  children,
}: TaskStepProps) {
  const timeStr = timestamp
    ? new Date(timestamp).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
      })
    : null;

  const hasContent = Boolean(children);

  // Sin contenido hijo: renderizar como fila simple sin <details>
  if (!hasContent) {
    return (
      <div className="chat-task-step chat-task-step--no-content">
        <div className="chat-task-step__summary">
          <StatusCircle status={status} />
          <span className="chat-task-step__label">{label}</span>
          {status === "loading" && (
            <span className="chat-task-step__badge">{t("chatView.taskInProgress")}</span>
          )}
          {timeStr && <span className="chat-task-step__time">{timeStr}</span>}
        </div>
      </div>
    );
  }

  return (
    <Collapsible className="chat-task-step" defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="chat-task-step__summary">
        <StatusCircle status={status} />
        <span className="chat-task-step__label">{label}</span>
        {status === "loading" && (
          <span className="chat-task-step__badge">{t("chatView.taskInProgress")}</span>
        )}
        {timeStr && <span className="chat-task-step__time">{timeStr}</span>}
        <span className="chat-task-step__chevron">
          <ChevronIcon />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="chat-task-step__body">{children}</CollapsibleContent>
    </Collapsible>
  );
}

// ─── Status Circle ───────────────────────────────────────────

function StatusCircle({ status }: { status: TaskStepStatus }) {
  return (
    <span className={`chat-task-step__status chat-task-step__status--${status}`}>
      {status === "done" && <CheckIcon />}
      {status === "error" && <AlertIcon />}
    </span>
  );
}
