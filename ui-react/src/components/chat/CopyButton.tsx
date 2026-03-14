import React, { useCallback, useRef } from "react";

// ─── Copy button (replaces Lit copy-as-markdown.ts) ──────────

const COPIED_FOR_MS = 1500;
const ERROR_FOR_MS = 2000;

export function CopyButton({ text }: { text: string }) {
  const btnRef = useRef<HTMLButtonElement>(null);

  const handleCopy = useCallback(async () => {
    const btn = btnRef.current;
    if (!btn || btn.dataset.copying === "1") return;

    btn.dataset.copying = "1";
    btn.disabled = true;

    let copied = false;
    try {
      await navigator.clipboard.writeText(text);
      copied = true;
    } catch { /* empty */ }

    if (!btn.isConnected) return;
    delete btn.dataset.copying;
    btn.disabled = false;

    if (!copied) {
      btn.dataset.error = "1";
      btn.title = "Copy failed";
      setTimeout(() => {
        if (!btn.isConnected) return;
        delete btn.dataset.error;
        btn.title = "Copy as markdown";
      }, ERROR_FOR_MS);
      return;
    }

    btn.dataset.copied = "1";
    btn.title = "Copied";
    setTimeout(() => {
      if (!btn.isConnected) return;
      delete btn.dataset.copied;
      btn.title = "Copy as markdown";
    }, COPIED_FOR_MS);
  }, [text]);

  return (
    <button
      ref={btnRef}
      className="chat-copy-btn"
      type="button"
      title="Copy as markdown"
      aria-label="Copy as markdown"
      onClick={handleCopy}
    >
      <span className="chat-copy-btn__icon" aria-hidden="true">
        <span className="chat-copy-btn__icon-copy">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
            <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
          </svg>
        </span>
        <span className="chat-copy-btn__icon-check">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
      </span>
    </button>
  );
}
