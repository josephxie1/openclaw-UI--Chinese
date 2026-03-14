import React from "react";
import { toSanitizedMarkdownHtml } from "../../lib/markdown.ts";

type MarkdownSidebarProps = {
  content: string | null;
  error: string | null;
  onClose: () => void;
  onViewRawText: () => void;
};

export function MarkdownSidebar({ content, error, onClose, onViewRawText }: MarkdownSidebarProps) {
  return (
    <div className="sidebar-panel">
      <div className="sidebar-header">
        <div className="sidebar-title">Tool Output</div>
        <button onClick={onClose} className="btn" title="Close sidebar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      </div>
      <div className="sidebar-content">
        {error ? (
          <>
            <div className="callout danger">{error}</div>
            <button onClick={onViewRawText} className="btn" style={{ marginTop: 12 }}>
              View Raw Text
            </button>
          </>
        ) : content ? (
          <div
            className="sidebar-markdown"
            dangerouslySetInnerHTML={{ __html: toSanitizedMarkdownHtml(content) }}
          />
        ) : (
          <div className="muted">No content available</div>
        )}
      </div>
    </div>
  );
}
