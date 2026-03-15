import React from "react";
import { t } from "../../i18n/index.ts";
import { openExternalUrlSafe } from "../../lib/open-external-url.ts";

// ─── Types ───────────────────────────────────────────────────

export interface SearchSource {
  url: string;
  domain: string;
  title?: string;
}

interface SourcesProps {
  sources: SearchSource[];
}

// ─── Extraction ──────────────────────────────────────────────

/**
 * Extraer fuentes de búsqueda completas (URL + dominio + título)
 * desde tool cards de búsqueda web.
 */
export function extractSearchSources(card: {
  args?: unknown;
  text?: string;
  name?: string;
}): SearchSource[] {
  const sources: SearchSource[] = [];
  const seen = new Set<string>();

  const args = typeof card.args === "string" ? tryParseJson(card.args) : card.args;

  // 1. Extraer URLs de los argumentos del tool call
  if (args && typeof args === "object") {
    const a = args as Record<string, unknown>;
    const urlFields = ["url", "site", "domain"];
    const listFields = ["urls", "domains", "sites"];

    for (const field of urlFields) {
      const val = a[field];
      if (typeof val === "string" && val.trim()) {
        addSource(val, sources, seen);
      }
    }

    for (const field of listFields) {
      const val = a[field];
      if (Array.isArray(val)) {
        for (const item of val.slice(0, 6)) {
          if (typeof item === "string" && item.trim()) {
            addSource(item, sources, seen);
          }
        }
      }
    }
  }

  // 2. Extraer URLs de los resultados del tool call
  if (card.text?.trim()) {
    const urlRegex = /https?:\/\/[^\s"'<>)\]]+/g;
    let match;
    while ((match = urlRegex.exec(card.text)) !== null && sources.length < 8) {
      addSource(match[0], sources, seen);
    }
  }

  return sources;
}

function addSource(input: string, sources: SearchSource[], seen: Set<string>) {
  try {
    const url = input.startsWith("http") ? input : `https://${input}`;
    const parsed = new URL(url);
    const domain = parsed.hostname.replace(/^www\./, "");

    if (seen.has(domain)) {
      return;
    }
    seen.add(domain);

    // Intentar extraer un título legible del path
    const pathParts = parsed.pathname.split("/").filter(Boolean);
    const lastPart = pathParts.at(-1);
    const title = lastPart
      ? decodeURIComponent(lastPart)
          .replace(/[-_]/g, " ")
          .replace(/\.\w+$/, "")
          .slice(0, 60)
      : undefined;

    sources.push({ url, domain, title });
  } catch {
    // URL inválida, ignorar
  }
}

function tryParseJson(str: string): unknown {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

// ─── Icons ───────────────────────────────────────────────────

const BookIcon = () => (
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
    <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
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

const _GlobeIcon = () => (
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
    <circle cx="12" cy="12" r="10" />
    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
    <path d="M2 12h20" />
  </svg>
);

// ─── Favicon helper ──────────────────────────────────────────

function faviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(domain)}`;
}

// ─── Component ───────────────────────────────────────────────

export function Sources({ sources }: SourcesProps) {
  if (sources.length === 0) {
    return null;
  }

  return (
    <details className="chat-sources">
      <summary className="chat-sources__trigger">
        <BookIcon />
        <span className="chat-sources__label">
          {t("chatView.sourcesUsed").replace("{count}", String(sources.length))}
        </span>
        <span className="chat-sources__chevron">
          <ChevronIcon />
        </span>
      </summary>
      <div className="chat-sources__list">
        {sources.map((source) => (
          <a
            key={source.domain}
            className="chat-source"
            href={source.url}
            rel="noreferrer"
            target="_blank"
            onClick={(e) => {
              e.preventDefault();
              openExternalUrlSafe(source.url);
            }}
          >
            <img
              className="chat-source__favicon"
              src={faviconUrl(source.domain)}
              alt=""
              onError={(e) => {
                // Si falla el favicon, ocultar la imagen
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="chat-source__text">{source.title || source.domain}</span>
          </a>
        ))}
      </div>
    </details>
  );
}
