import React, { useCallback, useEffect, useRef, useState } from "react";

// ─── Types ───────────────────────────────────────────────────

export type InlineSelectOption = {
  value: string;
  label: string;
};

export type InlineSelectProps = {
  value: string;
  options: InlineSelectOption[];
  disabled?: boolean;
  onChange: (value: string) => void;
};

// ─── Component ───────────────────────────────────────────────

export function InlineSelect({ value, options, disabled, onChange }: InlineSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? (value || "—");

  // Cierra al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [open]);

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (!disabled) setOpen((prev) => !prev);
    },
    [disabled],
  );

  const handleSelect = useCallback(
    (val: string) => {
      setOpen(false);
      onChange(val);
    },
    [onChange],
  );

  return (
    <div className={`inline-select${open ? " inline-select--open" : ""}${disabled ? " inline-select--disabled" : ""}`} ref={ref}>
      <button
        type="button"
        className="inline-select__trigger"
        disabled={disabled}
        onClick={handleToggle}
      >
        <span className="inline-select__label">{displayLabel}</span>
        <svg
          className="inline-select__chevron"
          viewBox="0 0 24 24"
          width="12"
          height="12"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points={open ? "18 15 12 9 6 15" : "6 9 12 15 18 9"} />
        </svg>
      </button>

      {open && (
        <div className="inline-select__panel" onClick={(e) => e.stopPropagation()}>
          {options.map((opt) => {
            const active = opt.value === value;
            return (
              <button
                key={opt.value}
                type="button"
                className={`inline-select__item${active ? " inline-select__item--active" : ""}`}
                onClick={() => handleSelect(opt.value)}
              >
                {opt.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
