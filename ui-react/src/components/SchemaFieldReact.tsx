/**
 * SchemaFieldReact — Componente React genérico para renderizar campos
 * de configuración basados en JSON Schema. Soporta todos los tipos:
 * string, number, boolean, enum, object, array, anyOf/oneOf, additionalProperties.
 */
import React, { useState, useCallback } from "react";
import {
  schemaType,
  hintForPath,
  humanize,
  defaultValue,
  type JsonSchema,
} from "../lib/views/config-form.shared.ts";
import type { ConfigUiHints } from "../lib/types.ts";
import { t } from "../i18n/index.ts";

// ── SVG Icons (Lucide-style) ──
export const SchemaIcons = {
  chevron: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  close: (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  plus: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  trash: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14" strokeLinecap="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
};

// ── getFieldMeta: obtener label y help del schema + uiHints ──
export function getFieldMeta(
  path: Array<string | number>,
  fieldSchema: JsonSchema | undefined,
  uiHints: ConfigUiHints,
) {
  let hint = hintForPath(path, uiHints);

  // Fallback: para campos en agents.list.N.*, buscar hints de agents.defaults.*
  if (!hint) {
    const strSegments = path.filter((s): s is string => typeof s === "string");
    if (strSegments[0] === "agents" && strSegments[1] === "list" && strSegments.length >= 3) {
      const fallbackPath = ["agents", "defaults", ...strSegments.slice(2)];
      hint = hintForPath(fallbackPath, uiHints);
    }
  }

  const label = hint?.label ?? fieldSchema?.title ?? humanize(String(path[path.length - 1]));
  const help = hint?.help ?? fieldSchema?.description ?? "";
  const sensitive = hint?.sensitive ?? false;
  return { label, help, sensitive };
}

// ── CollapsibleGroup ──
export function CollapsibleGroup({
  label,
  help,
  children,
  depth,
  defaultOpen = true,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
  depth: number;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`ac-group ${depth === 0 ? "ac-group--top" : "ac-group--nested"}`}>
      <div className="ac-group__header" onClick={() => setOpen(!open)}>
        <span className={`ac-group__chevron ${open ? "ac-group__chevron--open" : ""}`}>
          {SchemaIcons.chevron}
        </span>
        <div className="ac-group__meta">
          <span className="ac-group__label">{label}</span>
          {help && !open && <span className="ac-group__help-inline">{help}</span>}
        </div>
      </div>
      {open && (
        <div className="ac-group__body">
          {help && <div className="ac-group__help">{help}</div>}
          {children}
        </div>
      )}
    </div>
  );
}

// ── Utilidades internas ──
function jsonValue(value: unknown): string {
  if (value === undefined) return "";
  try {
    return JSON.stringify(value, null, 2) ?? "";
  } catch {
    return "";
  }
}

function isAnySchema(schema: JsonSchema): boolean {
  const META_KEYS = new Set(["title", "description", "default", "nullable", "tags", "x-tags"]);
  const keys = Object.keys(schema ?? {}).filter((key) => !META_KEYS.has(key));
  return keys.length === 0;
}

// ── SchemaField ──
export function SchemaField({
  path,
  fieldSchema,
  value,
  uiHints,
  onPatch,
  depth,
}: {
  path: Array<string | number>;
  fieldSchema: JsonSchema;
  value: unknown;
  uiHints: ConfigUiHints;
  onPatch: (path: Array<string | number>, value: unknown) => void;
  depth: number;
}) {
  const { label, help, sensitive } = getFieldMeta(path, fieldSchema, uiHints);
  const type = schemaType(fieldSchema);

  // ── anyOf / oneOf ──
  if (fieldSchema.anyOf || fieldSchema.oneOf) {
    return renderAnyOf({ path, fieldSchema, value, uiHints, onPatch, depth, label, help });
  }

  // ── Enum ──
  if (fieldSchema.enum) {
    const options = fieldSchema.enum;
    // Segmented control para ≤5 opciones
    if (options.length <= 5) {
      const resolvedValue = value ?? fieldSchema.default;
      return (
        <div className="ac-field" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
          <div className="ac-field__label">{label}</div>
          {help && <div className="ac-field__help">{help}</div>}
          <div className="ac-segmented">
            {options.map((opt) => {
              const isActive = opt === resolvedValue || String(opt) === String(resolvedValue);
              return (
                <button
                  key={String(opt)}
                  type="button"
                  className={`ac-segmented__btn ${isActive ? "active" : ""}`}
                  onClick={() => onPatch(path, opt)}
                >
                  {String(opt)}
                </button>
              );
            })}
          </div>
        </div>
      );
    }
    // Dropdown para >5 opciones
    return (
      <div className="ac-field" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
        <div className="ac-field__label">{label}</div>
        {help && <div className="ac-field__help">{help}</div>}
        <div className="ac-field__input">
          <select
            className="ac-input"
            value={String(value ?? "")}
            onChange={(e) => onPatch(path, e.target.value || undefined)}
          >
            <option value="">--</option>
            {options.map((opt) => (
              <option key={String(opt)} value={String(opt)}>
                {String(opt)}
              </option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // ── Boolean ──
  if (type === "boolean") {
    const displayValue = typeof value === "boolean" ? value : typeof fieldSchema.default === "boolean" ? fieldSchema.default : false;
    return (
      <div className="ac-field" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
        <label className="ac-toggle-row">
          <div className="ac-toggle-row__content">
            <span className="ac-toggle-row__label">{label}</span>
            {help && <span className="ac-toggle-row__help">{help}</span>}
          </div>
          <div className="ac-toggle">
            <input
              type="checkbox"
              checked={displayValue}
              onChange={(e) => onPatch(path, e.target.checked)}
            />
            <span className="ac-toggle__track" />
          </div>
        </label>
      </div>
    );
  }

  // ── Number / Integer ──
  if (type === "number" || type === "integer") {
    const displayValue = value ?? fieldSchema.default ?? "";
    const numValue = typeof displayValue === "number" ? displayValue : 0;
    return (
      <div className="ac-field" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
        <div className="ac-field__label">{label}</div>
        {help && <div className="ac-field__help">{help}</div>}
        <div className="ac-number">
          <button
            type="button"
            className="ac-number__btn"
            onClick={() => onPatch(path, numValue - 1)}
          >−</button>
          <input
            className="ac-number__input"
            type="number"
            value={displayValue == null ? "" : String(displayValue)}
            onChange={(e) => {
              const raw = e.target.value;
              const parsed = raw === "" ? undefined : Number(raw);
              onPatch(path, parsed);
            }}
            placeholder={fieldSchema.default != null ? String(fieldSchema.default) : ""}
          />
          <button
            type="button"
            className="ac-number__btn"
            onClick={() => onPatch(path, numValue + 1)}
          >+</button>
        </div>
      </div>
    );
  }

  // ── Object con properties ──
  if (type === "object" && fieldSchema.properties) {
    const obj = value != null && typeof value === "object" && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};

    const additional = fieldSchema.additionalProperties;
    const allowExtra = Boolean(additional) && typeof additional === "object";
    const reserved = new Set(Object.keys(fieldSchema.properties));

    return (
      <CollapsibleGroup label={label} help={help} depth={depth} defaultOpen={false}>
        {Object.entries(fieldSchema.properties).map(([key, subSchema]) => (
          <SchemaField
            key={key}
            path={[...path, key]}
            fieldSchema={subSchema}
            value={obj[key]}
            uiHints={uiHints}
            onPatch={onPatch}
            depth={depth + 1}
          />
        ))}
        {allowExtra && (
          <MapField
            schema={additional as JsonSchema}
            value={obj}
            path={path}
            uiHints={uiHints}
            reservedKeys={reserved}
            onPatch={onPatch}
            depth={depth + 1}
          />
        )}
      </CollapsibleGroup>
    );
  }

  // ── Object sin properties (schema libre) ──
  if (type === "object" && !fieldSchema.properties) {
    const additional = fieldSchema.additionalProperties;
    if (additional && typeof additional === "object") {
      const obj = value != null && typeof value === "object" && !Array.isArray(value)
        ? (value as Record<string, unknown>)
        : {};
      return (
        <CollapsibleGroup label={label} help={help} depth={depth} defaultOpen={false}>
          <MapField
            schema={additional}
            value={obj}
            path={path}
            uiHints={uiHints}
            reservedKeys={new Set()}
            onPatch={onPatch}
            depth={depth + 1}
          />
        </CollapsibleGroup>
      );
    }
    // Fallback: textarea JSON
    return (
      <div className="ac-field" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
        <div className="ac-field__label">{label}</div>
        {help && <div className="ac-field__help">{help}</div>}
        <div className="ac-field__input">
          <textarea
            className="ac-input"
            value={jsonValue(value)}
            onChange={(e) => {
              try { onPatch(path, JSON.parse(e.target.value)); } catch { /* ignorar */ }
            }}
            placeholder="{}"
            rows={3}
            style={{ resize: "vertical", minHeight: 60 }}
          />
        </div>
      </div>
    );
  }

  // ── Array ──
  if (type === "array") {
    return renderArray({ path, fieldSchema, value, uiHints, onPatch, depth, label, help });
  }

  // ── String (por defecto) ──
  const isSensitive = sensitive && !/^\$\{[^}]*\}$/.test(String(value ?? "").trim());
  return (
    <div className="ac-field" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
      <div className="ac-field__label">{label}</div>
      {help && <div className="ac-field__help">{help}</div>}
      <div className="ac-field__input">
        <input
          className="ac-input"
          type={isSensitive ? "password" : "text"}
          value={String(value ?? "")}
          onChange={(e) => onPatch(path, e.target.value || undefined)}
          placeholder={
            isSensitive ? "••••"
              : fieldSchema.default != null ? String(fieldSchema.default) : ""
          }
        />
        {fieldSchema.default !== undefined && (
          <button
            type="button"
            className="ac-input__reset"
            title={t("configForm.resetDefault") ?? "Reset"}
            onClick={() => onPatch(path, fieldSchema.default)}
          >↺</button>
        )}
      </div>
    </div>
  );
}

// ── anyOf/oneOf renderer ──
function renderAnyOf({
  path, fieldSchema, value, uiHints, onPatch, depth, label, help,
}: {
  path: Array<string | number>;
  fieldSchema: JsonSchema;
  value: unknown;
  uiHints: ConfigUiHints;
  onPatch: (path: Array<string | number>, value: unknown) => void;
  depth: number;
  label: string;
  help: string;
}) {
  const variants = fieldSchema.anyOf ?? fieldSchema.oneOf ?? [];
  const nonNull = variants.filter(
    (v) => !(v.type === "null" || (Array.isArray(v.type) && v.type.includes("null"))),
  );

  // Si sólo hay un variante no-null, renderizar directamente
  if (nonNull.length === 1) {
    return (
      <SchemaField
        path={path}
        fieldSchema={{ ...nonNull[0], title: fieldSchema.title, description: fieldSchema.description }}
        value={value}
        uiHints={uiHints}
        onPatch={onPatch}
        depth={depth}
      />
    );
  }

  // Comprobar si son literales (const o enum de 1 valor)
  const extractLiteral = (v: JsonSchema): unknown => {
    if (v.const !== undefined) return v.const;
    if (v.enum && v.enum.length === 1) return v.enum[0];
    return undefined;
  };
  const literals = nonNull.map(extractLiteral);
  const allLiterals = literals.every((v) => v !== undefined);

  // Segmented control para literales ≤5
  if (allLiterals && literals.length > 0 && literals.length <= 5) {
    const resolvedValue = value ?? fieldSchema.default;
    return (
      <div className="ac-field" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
        <div className="ac-field__label">{label}</div>
        {help && <div className="ac-field__help">{help}</div>}
        <div className="ac-segmented">
          {literals.map((lit) => {
            const isActive = lit === resolvedValue || String(lit) === String(resolvedValue);
            return (
              <button
                key={String(lit)}
                type="button"
                className={`ac-segmented__btn ${isActive ? "active" : ""}`}
                onClick={() => onPatch(path, lit)}
              >
                {String(lit)}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // Dropdown para literales >5
  if (allLiterals && literals.length > 5) {
    return (
      <div className="ac-field" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
        <div className="ac-field__label">{label}</div>
        {help && <div className="ac-field__help">{help}</div>}
        <div className="ac-field__input">
          <select
            className="ac-input"
            value={String(value ?? "")}
            onChange={(e) => onPatch(path, e.target.value || undefined)}
          >
            <option value="">--</option>
            {literals.map((lit) => (
              <option key={String(lit)} value={String(lit)}>{String(lit)}</option>
            ))}
          </select>
        </div>
      </div>
    );
  }

  // Tipos primitivos mezclados: renderizar como text input
  const primitiveTypes = new Set(nonNull.map((v) => schemaType(v)).filter(Boolean));
  const normalizedTypes = new Set(
    [...primitiveTypes].map((v) => (v === "integer" ? "number" : v)),
  );

  if ([...normalizedTypes].every((v) => ["string", "number", "boolean"].includes(v as string))) {
    const hasBoolean = normalizedTypes.has("boolean");
    if (hasBoolean && normalizedTypes.size === 1) {
      return (
        <SchemaField
          path={path}
          fieldSchema={{ ...fieldSchema, type: "boolean", anyOf: undefined, oneOf: undefined }}
          value={value}
          uiHints={uiHints}
          onPatch={onPatch}
          depth={depth}
        />
      );
    }
    const hasNumber = normalizedTypes.has("number");
    const hasString = normalizedTypes.has("string");
    return (
      <div className="ac-field" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
        <div className="ac-field__label">{label}</div>
        {help && <div className="ac-field__help">{help}</div>}
        <div className="ac-field__input">
          <input
            className="ac-input"
            type={hasNumber && !hasString ? "number" : "text"}
            value={String(value ?? "")}
            onChange={(e) => {
              const raw = e.target.value;
              if (hasNumber && !hasString) {
                if (raw.trim() === "") { onPatch(path, undefined); return; }
                const parsed = Number(raw);
                onPatch(path, Number.isNaN(parsed) ? raw : parsed);
                return;
              }
              onPatch(path, raw || undefined);
            }}
            placeholder={fieldSchema.default != null ? String(fieldSchema.default) : ""}
          />
        </div>
      </div>
    );
  }

  // Fallback: textarea JSON
  return (
    <div className="ac-field" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
      <div className="ac-field__label">{label}</div>
      {help && <div className="ac-field__help">{help}</div>}
      <div className="ac-field__input">
        <textarea
          className="ac-input"
          value={jsonValue(value)}
          onChange={(e) => {
            try { onPatch(path, JSON.parse(e.target.value)); } catch { /* ignorar */ }
          }}
          placeholder="..."
          rows={3}
          style={{ resize: "vertical", minHeight: 60 }}
        />
      </div>
    </div>
  );
}

// ── Array renderer ──
function renderArray({
  path, fieldSchema, value, uiHints, onPatch, depth, label, help,
}: {
  path: Array<string | number>;
  fieldSchema: JsonSchema;
  value: unknown;
  uiHints: ConfigUiHints;
  onPatch: (path: Array<string | number>, value: unknown) => void;
  depth: number;
  label: string;
  help: string;
}) {
  const itemsSchema = Array.isArray(fieldSchema.items) ? fieldSchema.items[0] : fieldSchema.items;
  const arr = Array.isArray(value) ? value : Array.isArray(fieldSchema.default) ? fieldSchema.default : [];

  if (!itemsSchema) {
    // Sin items schema: textarea JSON
    return (
      <div className="ac-field" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
        <div className="ac-field__label">{label}</div>
        {help && <div className="ac-field__help">{help}</div>}
        <div className="ac-field__input">
          <textarea
            className="ac-input"
            value={arr.length > 0 ? JSON.stringify(arr, null, 2) : ""}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                if (Array.isArray(parsed)) onPatch(path, parsed);
              } catch { /* ignorar */ }
            }}
            placeholder="[]"
            rows={Math.min(arr.length + 1, 4)}
            style={{ resize: "vertical", minHeight: 60 }}
          />
        </div>
      </div>
    );
  }

  const itemType = schemaType(itemsSchema);
  const isComplexItem = itemType === "object" || Boolean(itemsSchema.anyOf) || Boolean(itemsSchema.oneOf);

  return (
    <div className="ac-array" style={{ paddingLeft: depth > 0 ? depth * 16 : 0 }}>
      <div className="ac-array__header">
        <div className="ac-array__title">
          <span className="ac-array__label">{label}</span>
          <span className="ac-array__count">({arr.length})</span>
        </div>
        <button
          type="button"
          className="ac-array__add"
          onClick={() => {
            const next = [...arr, defaultValue(itemsSchema)];
            onPatch(path, next);
          }}
        >
          {SchemaIcons.plus}
          <span>{t("configForm.add") ?? "Add"}</span>
        </button>
      </div>
      {help && <div className="ac-array__help">{help}</div>}

      {arr.length === 0 ? (
        <div className="ac-array__empty">{t("configForm.noItems") ?? "No items"}</div>
      ) : (
        <div className="ac-array__items">
          {arr.map((item, idx) => (
            <div className="ac-array__item" key={idx}>
              <div className="ac-array__item-header">
                <span className="ac-array__item-index">#{idx + 1}</span>
                <button
                  type="button"
                  className="ac-array__item-remove"
                  title={t("configForm.removeItem") ?? "Remove"}
                  onClick={() => {
                    const next = [...arr];
                    next.splice(idx, 1);
                    onPatch(path, next);
                  }}
                >
                  {SchemaIcons.trash}
                </button>
              </div>
              <div className="ac-array__item-content">
                {isComplexItem ? (
                  <SchemaField
                    path={[...path, idx]}
                    fieldSchema={itemsSchema}
                    value={item}
                    uiHints={uiHints}
                    onPatch={onPatch}
                    depth={0}
                  />
                ) : (
                  // Item primitivo: renderizar inline
                  <input
                    className="ac-input"
                    type={itemType === "number" || itemType === "integer" ? "number" : "text"}
                    value={String(item ?? "")}
                    onChange={(e) => {
                      const next = [...arr];
                      const raw = e.target.value;
                      if (itemType === "number" || itemType === "integer") {
                        next[idx] = raw === "" ? undefined : Number(raw);
                      } else {
                        next[idx] = raw;
                      }
                      onPatch(path, next);
                    }}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── MapField (additionalProperties) ──
function MapField({
  schema,
  value,
  path,
  uiHints,
  reservedKeys,
  onPatch,
  depth,
}: {
  schema: JsonSchema;
  value: Record<string, unknown>;
  path: Array<string | number>;
  uiHints: ConfigUiHints;
  reservedKeys: Set<string>;
  onPatch: (path: Array<string | number>, value: unknown) => void;
  depth: number;
}) {
  const anySchema = isAnySchema(schema);
  const entries = Object.entries(value ?? {}).filter(([key]) => !reservedKeys.has(key));

  return (
    <div className="ac-map">
      <div className="ac-map__header">
        <span className="ac-map__label">{t("configForm.customEntries") ?? "Custom entries"}</span>
        <button
          type="button"
          className="ac-map__add"
          onClick={() => {
            const next = { ...value };
            let index = 1;
            let key = `custom-${index}`;
            while (key in next) { index += 1; key = `custom-${index}`; }
            next[key] = anySchema ? {} : defaultValue(schema);
            onPatch(path, next);
          }}
        >
          {SchemaIcons.plus}
          <span>{t("configForm.addEntry") ?? "Add Entry"}</span>
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="ac-map__empty">{t("configForm.noCustomEntries") ?? "No custom entries"}</div>
      ) : (
        <div className="ac-map__items">
          {entries.map(([key, entryValue]) => (
            <div className="ac-map__item" key={key}>
              <div className="ac-map__item-header">
                <input
                  type="text"
                  className="ac-input ac-input--sm"
                  placeholder={t("configForm.keyPlaceholder") ?? "Key"}
                  defaultValue={key}
                  onBlur={(e) => {
                    const nextKey = e.target.value.trim();
                    if (!nextKey || nextKey === key) return;
                    const next = { ...value };
                    if (nextKey in next) return;
                    next[nextKey] = next[key];
                    delete next[key];
                    onPatch(path, next);
                  }}
                />
                <button
                  type="button"
                  className="ac-map__item-remove"
                  title={t("configForm.removeEntry") ?? "Remove"}
                  onClick={() => {
                    const next = { ...value };
                    delete next[key];
                    onPatch(path, next);
                  }}
                >
                  {SchemaIcons.trash}
                </button>
              </div>
              <div className="ac-map__item-value">
                {anySchema ? (
                  <textarea
                    className="ac-input"
                    placeholder={t("configForm.jsonValuePlaceholder") ?? "JSON value"}
                    rows={2}
                    defaultValue={jsonValue(entryValue)}
                    onBlur={(e) => {
                      const raw = e.target.value.trim();
                      if (!raw) { onPatch([...path, key], undefined); return; }
                      try { onPatch([...path, key], JSON.parse(raw)); } catch { /* ignorar */ }
                    }}
                  />
                ) : (
                  <SchemaField
                    path={[...path, key]}
                    fieldSchema={schema}
                    value={entryValue}
                    uiHints={uiHints}
                    onPatch={onPatch}
                    depth={0}
                  />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
