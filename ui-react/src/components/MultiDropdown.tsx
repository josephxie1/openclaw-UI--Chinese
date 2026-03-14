import React, { useCallback, useEffect, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────

export type MultiDropdownItem = {
  value: string;
  label: string;
};

export type MultiDropdownProps = {
  values: string[];
  placeholder?: string;
  items: MultiDropdownItem[];
  open: boolean;
  disabled?: boolean;
  onToggleItem: (value: string) => void;
  onToggle: () => void;
};

// ─── Component ───────────────────────────────────────────────

export function MultiDropdown(props: MultiDropdownProps) {
  const { values, placeholder, items, open, disabled, onToggleItem, onToggle } = props;
  const ref = useRef<HTMLDivElement>(null);

  const selectedSet = new Set(values);
  const displayLabel = values.length > 0
    ? items.filter((i) => selectedSet.has(i.value)).map((i) => i.label).join(", ")
    : placeholder ?? "选择…";

  // Cierra el dropdown al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onToggle();
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [open, onToggle]);

  const handleTriggerClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle();
    },
    [onToggle],
  );

  const cls = [
    "oc-dropdown",
    open && "oc-dropdown--open",
    disabled && "oc-dropdown--disabled",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={cls} ref={ref}>
      <button
        type="button"
        className="oc-dropdown__trigger"
        disabled={disabled}
        onClick={handleTriggerClick}
      >
        <span className={`oc-dropdown__label${values.length === 0 ? " oc-dropdown__label--placeholder" : ""}`}>
          {displayLabel}
        </span>
        <span className="oc-dropdown__chevron">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="oc-dropdown__panel" onClick={(e) => e.stopPropagation()}>
          {items.length === 0 && (
            <div className="oc-dropdown__empty">无可选项</div>
          )}
          {items.map((item) => {
            const checked = selectedSet.has(item.value);
            return (
              <button
                key={item.value}
                type="button"
                className={`oc-dropdown__item${checked ? " oc-dropdown__item--active" : ""}`}
                onClick={() => onToggleItem(item.value)}
              >
                <span className="oc-dropdown__check">{checked ? "✓" : ""}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
