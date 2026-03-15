import React from "react";
import { extractTaskSegments, type TaskSegment } from "../../lib/chat/task-segments.ts";
import { pairToolCards } from "../../lib/chat/tool-cards.ts";
import type { MessageGroup } from "../../lib/types/chat-types.ts";
import { TaskStep } from "./TaskStep.tsx";
import { ToolCard } from "./ToolCard.tsx";

// ─── Types ───────────────────────────────────────────────────

export interface TaskStepListProps {
  group: MessageGroup;
  isStreaming?: boolean;
}

// ─── Component ───────────────────────────────────────────────

export function TaskStepList({ group, isStreaming = false }: TaskStepListProps) {
  const segments = extractTaskSegments(group);

  if (!segments || segments.length === 0) {
    return null;
  }

  return (
    <div className="chat-task-step-list">
      {segments.map((segment, index) => (
        <TaskStepItem
          key={index}
          segment={segment}
          isStreaming={isStreaming && index === segments.length - 1}
        />
      ))}
    </div>
  );
}

// ─── Single Segment ──────────────────────────────────────────

function TaskStepItem({ segment, isStreaming }: { segment: TaskSegment; isStreaming: boolean }) {
  const paired = pairToolCards(segment.toolCards);
  const hasToolCards = paired.length > 0;

  return (
    <TaskStep
      label={segment.label}
      status={segment.status}
      timestamp={segment.timestamp}
      defaultOpen={segment.status === "loading"}
    >
      {hasToolCards && (
        <div className="chat-task-step__tools">
          {paired.map((card, i) => (
            <ToolCard key={i} card={card} isStreaming={isStreaming} />
          ))}
        </div>
      )}
    </TaskStep>
  );
}
