import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";

// ─── Types ───────────────────────────────────────────────────

export type DropdownItem = {
  value: string;
  label: string;
};

export type DropdownGroup = {
  label: string;
  items: DropdownItem[];
};

type PanelPos = { top: number; left: number; width: number };

// ─── Panel posicionado con Portal ────────────────────────────

function DropdownPanel({
  pos,
  children,
  onMouseDown,
}: {
  pos: PanelPos;
  children: React.ReactNode;
  onMouseDown: (e: React.MouseEvent) => void;
}) {
  return createPortal(
    <div
      className="oc-dropdown__panel"
      style={{
        position: "fixed",
        top: pos.top,
        left: pos.left,
        width: pos.width,
        zIndex: 9999,
      }}
      onMouseDown={onMouseDown}
    >
      {children}
    </div>,
    document.body,
  );
}

// ─── Helpers ─────────────────────────────────────────────────

function findLabel(value: string, items?: DropdownItem[], groups?: DropdownGroup[]): string {
  if (items) {
    const found = items.find((i) => i.value === value);
    if (found) return found.label;
  }
  if (groups) {
    for (const g of groups) {
      const found = g.items.find((i) => i.value === value);
      if (found) return found.label;
    }
  }
  return value;
}

// ─── Single-select Dropdown ──────────────────────────────────

export type DropdownProps = {
  value: string | null;
  placeholder?: string;
  items?: DropdownItem[];
  groups?: DropdownGroup[];
  disabled?: boolean;
  onSelect: (value: string) => void;
};

export function Dropdown({ value, placeholder, items, groups, disabled, onSelect }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pos, setPos] = useState<PanelPos>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);

  const displayLabel = value
    ? findLabel(value, items, groups)
    : placeholder || "选择";

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => {
      if (!prev && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      }
      return !prev;
    });
  }, [disabled]);

  const handleGroupToggle = useCallback((label: string) => {
    setExpanded((prev) => {
      // Mutualmente excluyente: solo un grupo abierto a la vez
      if (prev.has(label)) return new Set();
      return new Set([label]);
    });
  }, []);

  const handleSelect = useCallback(
    (val: string) => {
      onSelect(val);
      setOpen(false);
    },
    [onSelect],
  );

  const hasItems = (items && items.length > 0) || (groups && groups.some((g) => g.items.length > 0));

  return (
    <div className={`oc-dropdown ${open ? "oc-dropdown--open" : ""} ${disabled ? "oc-dropdown--disabled" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className="oc-dropdown__trigger"
        disabled={disabled}
        onClick={handleToggle}
      >
        <span className={`oc-dropdown__label ${!value ? "oc-dropdown__label--placeholder" : ""}`}>
          {displayLabel}
        </span>
        <span className="oc-dropdown__chevron">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <DropdownPanel pos={pos} onMouseDown={(e) => e.stopPropagation()}>
          {!hasItems && <div className="oc-dropdown__empty">无可用模型</div>}
          {items?.map((item) => {
            const active = item.value === value;
            return (
              <button
                key={item.value}
                type="button"
                className={`oc-dropdown__item ${active ? "oc-dropdown__item--active" : ""}`}
                onClick={() => handleSelect(item.value)}
              >
                <span className="oc-dropdown__check">{active ? "✓" : ""}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
          {groups?.map((group) => {
            const isExpanded = expanded.has(group.label);
            return (
              <div key={group.label} className="oc-dropdown__group">
                <button
                  type="button"
                  className="oc-dropdown__group-header"
                  onClick={() => handleGroupToggle(group.label)}
                >
                  <span className={`oc-dropdown__group-chevron ${isExpanded ? "oc-dropdown__group-chevron--open" : ""}`}>
                    ▸
                  </span>
                  <span className="oc-dropdown__group-label">{group.label}</span>
                  <span className="oc-dropdown__group-count">{group.items.length}</span>
                </button>
                {isExpanded &&
                  group.items.map((item) => {
                    const active = item.value === value;
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={`oc-dropdown__item oc-dropdown__item--grouped ${active ? "oc-dropdown__item--active" : ""}`}
                        onClick={() => handleSelect(item.value)}
                      >
                        <span className="oc-dropdown__check">{active ? "✓" : ""}</span>
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </DropdownPanel>
      )}
    </div>
  );
}

// ─── Multi-select Dropdown ───────────────────────────────────

export type MultiDropdownProps = {
  values: string[];
  placeholder?: string;
  items?: DropdownItem[];
  groups?: DropdownGroup[];
  disabled?: boolean;
  onToggleItem: (value: string) => void;
};

export function MultiDropdown({ values, placeholder, items, groups, disabled, onToggleItem }: MultiDropdownProps) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pos, setPos] = useState<PanelPos>({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selectedSet = new Set(values);

  const displayLabel =
    values.length > 0
      ? values.map((v) => findLabel(v, items, groups)).join(", ")
      : placeholder || "选择";

  // Cerrar al hacer clic fuera
  useEffect(() => {
    if (!open) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (triggerRef.current?.contains(e.target as Node)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [open]);

  const handleToggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => {
      if (!prev && triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect();
        setPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
      }
      return !prev;
    });
  }, [disabled]);

  const handleGroupToggle = useCallback((label: string) => {
    setExpanded((prev) => {
      // Mutualmente excluyente: solo un grupo abierto a la vez
      if (prev.has(label)) return new Set();
      return new Set([label]);
    });
  }, []);

  const hasItems = (items && items.length > 0) || (groups && groups.some((g) => g.items.length > 0));

  return (
    <div className={`oc-dropdown ${open ? "oc-dropdown--open" : ""} ${disabled ? "oc-dropdown--disabled" : ""}`}>
      <button
        ref={triggerRef}
        type="button"
        className="oc-dropdown__trigger"
        disabled={disabled}
        onClick={handleToggle}
      >
        <span className={`oc-dropdown__label ${values.length === 0 ? "oc-dropdown__label--placeholder" : ""}`}>
          {displayLabel}
        </span>
        {values.length > 0 && <span className="oc-dropdown__badge">{values.length}</span>}
        <span className="oc-dropdown__chevron">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <DropdownPanel pos={pos} onMouseDown={(e) => e.stopPropagation()}>
          {!hasItems && <div className="oc-dropdown__empty">无可用模型</div>}
          {items?.map((item) => {
            const active = selectedSet.has(item.value);
            return (
              <button
                key={item.value}
                type="button"
                className={`oc-dropdown__item ${active ? "oc-dropdown__item--active" : ""}`}
                onClick={() => onToggleItem(item.value)}
              >
                <span className={`oc-dropdown__checkbox ${active ? "oc-dropdown__checkbox--checked" : ""}`} />
                <span>{item.label}</span>
              </button>
            );
          })}
          {groups?.map((group) => {
            const isExpanded = expanded.has(group.label);
            return (
              <div key={group.label} className="oc-dropdown__group">
                <button
                  type="button"
                  className="oc-dropdown__group-header"
                  onClick={() => handleGroupToggle(group.label)}
                >
                  <span className={`oc-dropdown__group-chevron ${isExpanded ? "oc-dropdown__group-chevron--open" : ""}`}>
                    ▸
                  </span>
                  <span className="oc-dropdown__group-label">{group.label}</span>
                  <span className="oc-dropdown__group-count">{group.items.length}</span>
                </button>
                {isExpanded &&
                  group.items.map((item) => {
                    const active = selectedSet.has(item.value);
                    return (
                      <button
                        key={item.value}
                        type="button"
                        className={`oc-dropdown__item oc-dropdown__item--grouped ${active ? "oc-dropdown__item--active" : ""}`}
                        onClick={() => onToggleItem(item.value)}
                      >
                        <span className={`oc-dropdown__checkbox ${active ? "oc-dropdown__checkbox--checked" : ""}`} />
                        <span>{item.label}</span>
                      </button>
                    );
                  })}
              </div>
            );
          })}
        </DropdownPanel>
      )}
    </div>
  );
}
