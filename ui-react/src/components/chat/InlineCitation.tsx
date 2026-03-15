import React, { useState, useRef, useEffect, type ReactNode } from "react";

// ─── Types ───────────────────────────────────────────────────

export interface CitationSource {
  url: string;
  title?: string;
  description?: string;
}

interface InlineCitationProps {
  children: ReactNode;
  sources: CitationSource[];
}

// ─── Helpers ─────────────────────────────────────────────────

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// ─── Component ───────────────────────────────────────────────

export function InlineCitation({ children, sources }: InlineCitationProps) {
  const [showCard, setShowCard] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!showCard) {
      return;
    }
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowCard(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCard]);

  if (sources.length === 0) {
    return <>{children}</>;
  }

  const primary = sources[0];
  const hostname = extractHostname(primary.url);
  const badgeText = sources.length > 1 ? `${hostname} +${sources.length - 1}` : hostname;
  const current = sources[currentIndex];

  return (
    <span className="inline-citation" ref={containerRef}>
      <span className="inline-citation__text">{children}</span>
      <span
        className="inline-citation__badge"
        onMouseEnter={() => setShowCard(true)}
        onMouseLeave={() => setShowCard(false)}
      >
        {badgeText}
      </span>

      {showCard && (
        <div className="inline-citation__card">
          {/* Header con navegación carousel */}
          {sources.length > 1 && (
            <div className="inline-citation__nav">
              <button
                className="inline-citation__nav-btn"
                type="button"
                disabled={currentIndex === 0}
                onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
                aria-label="Previous"
              >
                <ArrowLeftIcon />
              </button>
              <span className="inline-citation__nav-index">
                {currentIndex + 1}/{sources.length}
              </span>
              <button
                className="inline-citation__nav-btn"
                type="button"
                disabled={currentIndex === sources.length - 1}
                onClick={() => setCurrentIndex(Math.min(sources.length - 1, currentIndex + 1))}
                aria-label="Next"
              >
                <ArrowRightIcon />
              </button>
            </div>
          )}

          {/* Contenido de la fuente actual */}
          {current && (
            <div className="inline-citation__source">
              {current.title && <h4 className="inline-citation__source-title">{current.title}</h4>}
              <a
                className="inline-citation__source-url"
                href={current.url}
                target="_blank"
                rel="noreferrer"
              >
                {current.url}
              </a>
              {current.description && (
                <p className="inline-citation__source-desc">{current.description}</p>
              )}
            </div>
          )}
        </div>
      )}
    </span>
  );
}

// ─── Icons ───────────────────────────────────────────────────

const ArrowLeftIcon = () => (
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
    <path d="m12 19-7-7 7-7" />
    <path d="M19 12H5" />
  </svg>
);

const ArrowRightIcon = () => (
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
    <path d="M5 12h14" />
    <path d="m12 5 7 7-7 7" />
  </svg>
);
