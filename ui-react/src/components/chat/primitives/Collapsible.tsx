import React, { useCallback, useRef, type ReactNode } from "react";

// ─── Collapsible ─────────────────────────────────────────────
// Primitiva basada en <details>/<summary> nativo.
// No depende de Radix ni ninguna librería externa.

export interface CollapsibleProps {
  open?: boolean;
  defaultOpen?: boolean;
  onToggle?: (open: boolean) => void;
  className?: string;
  children: ReactNode;
}

export function Collapsible({
  open,
  defaultOpen = false,
  onToggle,
  className,
  children,
}: CollapsibleProps) {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const handleToggle = useCallback(() => {
    if (detailsRef.current && onToggle) {
      onToggle(detailsRef.current.open);
    }
  }, [onToggle]);

  return (
    <details
      ref={detailsRef}
      className={className}
      open={open ?? defaultOpen}
      onToggle={handleToggle}
    >
      {children}
    </details>
  );
}

// ─── CollapsibleTrigger ──────────────────────────────────────

export interface CollapsibleTriggerProps {
  className?: string;
  children: ReactNode;
}

export function CollapsibleTrigger({ className, children }: CollapsibleTriggerProps) {
  return <summary className={className}>{children}</summary>;
}

// ─── CollapsibleContent ──────────────────────────────────────

export interface CollapsibleContentProps {
  className?: string;
  children: ReactNode;
}

export function CollapsibleContent({ className, children }: CollapsibleContentProps) {
  return <div className={className}>{children}</div>;
}
