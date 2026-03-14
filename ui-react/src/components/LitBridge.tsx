/**
 * LitBridge — renders a Lit TemplateResult into a React container.
 *
 * This lets us reuse the existing ~5000 lines of Lit view code directly
 * without rewriting every template to JSX. The bridge calls Lit's `render()`
 * into a <div> ref and attaches DOM event listeners via Lit's directives.
 */
import React, { useEffect, useRef } from "react";
import { render, type TemplateResult } from "lit";

export function LitBridge({ template }: { template: TemplateResult | typeof import("lit").nothing }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    render(template, containerRef.current);
  }, [template]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (containerRef.current) {
        render(undefined as unknown as TemplateResult, containerRef.current);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        display: "flex",
        flexDirection: "column",
        flex: "1 1 0",
        minHeight: 0,
        overflow: "hidden",
      }}
    />
  );
}
