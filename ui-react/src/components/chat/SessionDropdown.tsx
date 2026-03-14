import React, { useState, useRef, useEffect, useCallback } from "react";
import { t } from "../../i18n/index.ts";

// ─── Types ───────────────────────────────────────────────────

export type DropdownItem = {
  value: string;
  label: string;
};

export type DropdownGroup = {
  label: string;
  items: DropdownItem[];
  expanded?: boolean;
};

type SessionDropdownProps = {
  value: string | null;
  placeholder?: string;
  items?: DropdownItem[];
  groups?: DropdownGroup[];
  disabled?: boolean;
  onSelect: (value: string) => void;
};

// ─── Helpers ─────────────────────────────────────────────────

function findLabel(
  value: string,
  items?: DropdownItem[],
  groups?: DropdownGroup[],
): string {
  if (items) {
    const found = items.find((item) => item.value === value);
    if (found) return found.label;
  }
  if (groups) {
    for (const group of groups) {
      const found = group.items.find((item) => item.value === value);
      if (found) return found.label;
    }
  }
  return value;
}

// ─── Component ───────────────────────────────────────────────

export function SessionDropdown({
  value,
  placeholder,
  items,
  groups,
  disabled,
  onSelect,
}: SessionDropdownProps) {
  const [open, setOpen] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    window.addEventListener("click", handleClick, true);
    return () => window.removeEventListener("click", handleClick, true);
  }, [open]);

  const displayLabel = value
    ? findLabel(value, items, groups)
    : placeholder ?? t("shared.select");

  const hasItems =
    (items && items.length > 0) ||
    (groups && groups.some((g) => g.items.length > 0));

  const handleSelect = useCallback(
    (v: string) => {
      setOpen(false);
      onSelect(v);
    },
    [onSelect],
  );

  const toggleGroup = useCallback((label: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  }, []);

  return (
    <div
      ref={containerRef}
      className={`oc-dropdown${open ? " oc-dropdown--open" : ""}${disabled ? " oc-dropdown--disabled" : ""}`}
    >
      <button
        type="button"
        className="oc-dropdown__trigger"
        disabled={disabled}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        <span
          className={`oc-dropdown__label${!value ? " oc-dropdown__label--placeholder" : ""}`}
        >
          {displayLabel}
        </span>
        <span className="oc-dropdown__chevron">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div
          className="oc-dropdown__panel"
          onClick={(e) => e.stopPropagation()}
        >
          {!hasItems && (
            <div className="oc-dropdown__empty">
              {t("agentsView.noConfiguredModels")}
            </div>
          )}

          {/* Flat items */}
          {items?.map((item) => {
            const active = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                className={`oc-dropdown__item${active ? " oc-dropdown__item--active" : ""}`}
                onClick={() => handleSelect(item.value)}
              >
                <span className="oc-dropdown__check">
                  {active ? "✓" : ""}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Grouped items */}
          {groups?.map((group) => {
            const isExpanded = expandedGroups.has(group.label);
            return (
              <div key={group.label} className="oc-dropdown__group">
                <button
                  type="button"
                  className="oc-dropdown__group-header"
                  onClick={() => toggleGroup(group.label)}
                >
                  <span
                    className={`oc-dropdown__group-chevron${isExpanded ? " oc-dropdown__group-chevron--open" : ""}`}
                  >
                    ▸
                  </span>
                  <span className="oc-dropdown__group-label">
                    {group.label}
                  </span>
                  <span className="oc-dropdown__group-count">
                    {group.items.length}
                  </span>
                </button>
                {isExpanded &&
                  group.items.map((item) => {
                    const active = item.value === value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={`oc-dropdown__item oc-dropdown__item--grouped${active ? " oc-dropdown__item--active" : ""}`}
                        onClick={() => handleSelect(item.value)}
                      >
                        <span className="oc-dropdown__check">
                          {active ? "✓" : ""}
                        </span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
