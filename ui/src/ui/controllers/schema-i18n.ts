/**
 * Client-side schema translation map.
 *
 * Overrides `uiHints` label/help fields after receiving the schema
 * from the server. Keyed by the same dotted path format used in
 * the server's FIELD_LABELS / FIELD_HELP (e.g. "models.mode").
 *
 * Only applied when locale !== "en".
 */
import { i18n } from "../../i18n/index.ts";
import type { ConfigUiHints } from "../types.ts";

type HintOverride = {
  label?: string;
  help?: string;
};

export type SchemaTranslationMap = Record<string, HintOverride>;

/**
 * Get the translation map for the current locale.
 * Returns null if the current locale is English (no overrides needed).
 */
function getTranslationMap(): SchemaTranslationMap | null {
  const locale = i18n.getLocale();
  if (!locale || locale === "en") {
    return null;
  }
  return TRANSLATION_MAPS[locale] ?? null;
}

/**
 * Apply locale-specific label/help overrides to uiHints.
 * Returns a new object with translations applied (does not mutate input).
 */
export function applySchemaTranslations(hints: ConfigUiHints): ConfigUiHints {
  const map = getTranslationMap();
  if (!map) {
    return hints;
  }
  const next = { ...hints };
  for (const [path, override] of Object.entries(map)) {
    const existing = next[path];
    if (existing) {
      next[path] = {
        ...existing,
        ...(override.label ? { label: override.label } : {}),
        ...(override.help ? { help: override.help } : {}),
      };
    } else {
      next[path] = {
        ...(override.label ? { label: override.label } : {}),
        ...(override.help ? { help: override.help } : {}),
      };
    }
  }
  return next;
}

// ───────────────────────────────────────────────
// Translation Maps
// ───────────────────────────────────────────────

import { ZH_CN_MAP } from "./schema-i18n-zh.ts";

const TRANSLATION_MAPS: Record<string, SchemaTranslationMap> = {
  "zh-CN": ZH_CN_MAP,
};
