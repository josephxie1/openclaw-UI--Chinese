import { html, nothing } from "lit";
import { t } from "../../i18n/index.ts";

export type ClawhubSkill = {
  slug: string;
  displayName: string;
  summary?: string | null;
  score?: number;
  updatedAt?: number;
  tags?: Record<string, string>;
  stats?: {
    stars?: number;
    downloads?: number;
    versions?: number;
    installsAllTime?: number;
  };
  latestVersion?: {
    version: string;
    changelog?: string;
  } | null;
};

export type ClawhubMarketProps = {
  query: string;
  results: ClawhubSkill[];
  loading: boolean;
  installing: string | null;
  error: string | null;
  message: string | null;
  tokenMasked: string | null;
  tokenDraft: string;
  tokenSaving: boolean;
  onSearch: (query: string) => void;
  onInstall: (slug: string) => void;
  onQueryChange: (query: string) => void;
  onTokenDraftChange: (value: string) => void;
  onTokenSave: () => void;
};

function formatTimeAgo(ts?: number): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export function renderClawhubMarket(props: ClawhubMarketProps) {
  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      props.onSearch(props.query);
    }
  };

  return html`
    <section class="card">
      <div class="row" style="justify-content: space-between; align-items: flex-start;">
        <div>
          <div class="card-title">🏪 ${t("clawhub.title")}</div>
          <div class="card-sub">${t("clawhub.subtitle")}</div>
        </div>
        <a
          class="btn btn--sm"
          href="https://clawhub.ai"
          target="_blank"
          rel="noopener noreferrer"
          style="text-decoration: none;"
        >
          ${t("clawhub.openWebsite")}
        </a>
      </div>

      <!-- Token settings -->
      <div style="margin-top: 16px; padding: 12px 14px; border-radius: 8px; border: 1px solid var(--border); background: var(--bg-offset, var(--bg));">
        <div class="row" style="justify-content: space-between; align-items: center;">
          <div>
            <div style="font-weight: 600; font-size: 13px;">🔑 ${t("clawhub.tokenTitle")}</div>
            <div class="muted" style="font-size: 12px; margin-top: 2px;">
              ${props.tokenMasked
                ? html`${t("clawhub.tokenActive")}: <code>${props.tokenMasked}</code>`
                : t("clawhub.tokenHint")}
            </div>
          </div>
        </div>
        <div class="row" style="margin-top: 8px; gap: 8px;">
          <label class="field" style="flex: 1; margin: 0;">
            <input
              type="password"
              .value=${props.tokenDraft}
              @input=${(e: Event) =>
                props.onTokenDraftChange((e.target as HTMLInputElement).value)}
              placeholder="${t("clawhub.tokenPlaceholder")}"
              autocomplete="off"
            />
          </label>
          <button
            class="btn btn--sm primary"
            ?disabled=${props.tokenSaving || !props.tokenDraft.trim()}
            @click=${props.onTokenSave}
          >
            ${props.tokenSaving ? t("shared.saving") : t("shared.save")}
          </button>
        </div>
      </div>

      <!-- Search bar -->
      <div class="row" style="margin-top: 16px; gap: 8px;">
        <label class="field" style="flex: 1; margin: 0;">
          <input
            type="text"
            .value=${props.query}
            @input=${(e: Event) =>
              props.onQueryChange((e.target as HTMLInputElement).value)}
            @keydown=${handleKeydown}
            placeholder="${t("clawhub.searchPlaceholder")}"
          />
        </label>
        <button
          class="btn primary"
          ?disabled=${props.loading}
          @click=${() => props.onSearch(props.query)}
        >
          ${props.loading ? t("shared.loading") : t("clawhub.search")}
        </button>
      </div>

      ${
        props.error
          ? html`<div class="callout danger" style="margin-top: 12px;">${props.error}</div>`
          : nothing
      }
      ${
        props.message
          ? html`<div class="callout success" style="margin-top: 12px;">${props.message}</div>`
          : nothing
      }

      ${
        props.results.length === 0 && !props.loading
          ? html`
              <div class="muted" style="margin-top: 24px; text-align: center; padding: 32px 0;">
                ${props.query
                  ? t("clawhub.noResults")
                  : t("clawhub.searchHint")}
              </div>
            `
          : html`
            <div class="list" style="margin-top: 16px;">
              ${props.results.map((skill) => renderSkillCard(skill, props))}
            </div>
          `
      }
    </section>
  `;
}

function renderSkillCard(skill: ClawhubSkill, props: ClawhubMarketProps) {
  const isInstalling = props.installing === skill.slug;
  const version = skill.latestVersion?.version ?? "";
  const stars = skill.stats?.stars ?? 0;
  const downloads = skill.stats?.installsAllTime ?? skill.stats?.downloads ?? 0;
  const timeAgo = formatTimeAgo(skill.updatedAt);

  return html`
    <div class="list-item" style="padding: 14px 16px;">
      <div class="list-main" style="min-width: 0;">
        <div class="list-title" style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span style="font-weight: 600;">${skill.displayName || skill.slug}</span>
          ${version
            ? html`<span class="agent-pill" style="font-size: 11px;">v${version}</span>`
            : nothing}
        </div>
        <div class="list-sub" style="margin-top: 4px;">
          ${skill.summary || skill.slug}
        </div>
        <div class="row" style="gap: 12px; margin-top: 8px; flex-wrap: wrap;">
          <span class="muted" style="font-size: 12px;">
            📦 ${skill.slug}
          </span>
          ${stars > 0
            ? html`<span class="muted" style="font-size: 12px;">⭐ ${stars}</span>`
            : nothing}
          ${downloads > 0
            ? html`<span class="muted" style="font-size: 12px;">📥 ${downloads}</span>`
            : nothing}
          ${timeAgo
            ? html`<span class="muted" style="font-size: 12px;">🕐 ${timeAgo}</span>`
            : nothing}
        </div>
      </div>
      <div class="list-meta" style="flex-shrink: 0;">
        <button
          class="btn primary btn--sm"
          ?disabled=${isInstalling || props.installing !== null}
          @click=${() => props.onInstall(skill.slug)}
        >
          ${isInstalling ? t("shared.installing") : t("clawhub.install")}
        </button>
      </div>
    </div>
  `;
}
