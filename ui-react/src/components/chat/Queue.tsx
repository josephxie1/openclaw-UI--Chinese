import React, { type ReactNode } from "react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./primitives/Collapsible.tsx";

// ─── Types ───────────────────────────────────────────────────

export interface QueueTodo {
  id: string;
  title: string;
  description?: string;
  status?: "pending" | "completed";
}

export interface QueueMessage {
  id: string;
  text: string;
  attachments?: QueueAttachment[];
}

export interface QueueAttachment {
  type: "image" | "file";
  url?: string;
  filename?: string;
}

// ─── Icons ───────────────────────────────────────────────────

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

const PaperclipIcon = () => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
);

// ─── Queue (container) ───────────────────────────────────────

interface QueueProps {
  children: ReactNode;
  className?: string;
}

export function Queue({ children, className }: QueueProps) {
  return <div className={`queue${className ? ` ${className}` : ""}`}>{children}</div>;
}

// ─── QueueSection (collapsible group) ────────────────────────

interface QueueSectionProps {
  label: string;
  count?: number;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
}

export function QueueSection({
  label,
  count,
  icon,
  defaultOpen = true,
  children,
}: QueueSectionProps) {
  return (
    <Collapsible className="queue__section" defaultOpen={defaultOpen}>
      <CollapsibleTrigger className="queue__section-trigger">
        <span className="queue__section-label">
          <span className="queue__section-chevron">
            <ChevronIcon />
          </span>
          {icon && <span className="queue__section-icon">{icon}</span>}
          <span>{count !== undefined ? `${count} ${label}` : label}</span>
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="queue__section-content">{children}</CollapsibleContent>
    </Collapsible>
  );
}

// ─── QueueList (scrollable item list) ────────────────────────

interface QueueListProps {
  children: ReactNode;
}

export function QueueList({ children }: QueueListProps) {
  return (
    <div className="queue__list-wrapper">
      <ul className="queue__list">{children}</ul>
    </div>
  );
}

// ─── QueueItem ───────────────────────────────────────────────

interface QueueItemProps {
  completed?: boolean;
  children: ReactNode;
  actions?: ReactNode;
}

export function QueueItem({ completed = false, children, actions }: QueueItemProps) {
  return (
    <li className={`queue__item${completed ? " queue__item--completed" : ""}`}>
      <div className="queue__item-row">
        <span
          className={`queue__item-indicator${completed ? " queue__item-indicator--done" : ""}`}
        />
        <span className={`queue__item-content${completed ? " queue__item-content--done" : ""}`}>
          {children}
        </span>
        {actions && <span className="queue__item-actions">{actions}</span>}
      </div>
    </li>
  );
}

// ─── QueueItemDescription ────────────────────────────────────

interface QueueItemDescriptionProps {
  completed?: boolean;
  children: ReactNode;
}

export function QueueItemDescription({ completed = false, children }: QueueItemDescriptionProps) {
  return (
    <div className={`queue__item-desc${completed ? " queue__item-desc--done" : ""}`}>
      {children}
    </div>
  );
}

// ─── QueueItemFile (attachment badge) ────────────────────────

interface QueueItemFileProps {
  children: ReactNode;
}

export function QueueItemFile({ children }: QueueItemFileProps) {
  return (
    <span className="queue__item-file">
      <PaperclipIcon />
      <span className="queue__item-file-name">{children}</span>
    </span>
  );
}

// ─── QueueItemImage (thumbnail) ──────────────────────────────

interface QueueItemImageProps {
  src: string;
  alt?: string;
}

export function QueueItemImage({ src, alt = "" }: QueueItemImageProps) {
  return <img className="queue__item-img" src={src} alt={alt} />;
}

// ─── QueueItemAttachments (wrapper) ──────────────────────────

interface QueueItemAttachmentsProps {
  children: ReactNode;
}

export function QueueItemAttachments({ children }: QueueItemAttachmentsProps) {
  return <div className="queue__item-attachments">{children}</div>;
}
