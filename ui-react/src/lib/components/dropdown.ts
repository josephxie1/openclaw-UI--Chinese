import { html, nothing } from "lit";
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

export type DropdownProps = {
  /** Currently selected value (single-select) */
  value: string | null;
  /** Placeholder when nothing is selected */
  placeholder?: string;
  /** Flat items (rendered without grouping) */
  items?: DropdownItem[];
  /** Grouped items (rendered with collapsible sections) */
  groups?: DropdownGroup[];
  /** Whether the dropdown is open */
  open: boolean;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Set of expanded group labels (for collapsible groups) */
  expandedGroups?: Set<string>;
  /** Called when user selects an item */
  onSelect: (value: string) => void;
  /** Called when dropdown open state changes */
  onToggle: () => void;
  /** Called when a group is toggled */
  onGroupToggle?: (label: string) => void;
};

export type MultiDropdownProps = {
  /** Currently selected values */
  values: string[];
  /** Placeholder when nothing is selected */
  placeholder?: string;
  /** Flat items */
  items?: DropdownItem[];
  /** Grouped items */
  groups?: DropdownGroup[];
  /** Whether the dropdown is open */
  open: boolean;
  /** Whether the dropdown is disabled */
  disabled?: boolean;
  /** Set of expanded group labels */
  expandedGroups?: Set<string>;
  /** Called when selection changes */
  onToggleItem: (value: string) => void;
  /** Called when dropdown open state changes */
  onToggle: () => void;
  /** Called when a group is toggled */
  onGroupToggle?: (label: string) => void;
};

// ─── Helpers ─────────────────────────────────────────────────

function findLabel(value: string, items?: DropdownItem[], groups?: DropdownGroup[]): string {
  if (items) {
    const found = items.find((item) => item.value === value);
    if (found) {
      return found.label;
    }
  }
  if (groups) {
    for (const group of groups) {
      const found = group.items.find((item) => item.value === value);
      if (found) {
        return found.label;
      }
    }
  }
  return value;
}

// ─── Single-select Dropdown ──────────────────────────────────

function resolveDisplayLabel(props: DropdownProps): string {
  const { value, placeholder, items, groups } = props;
  if (!value) {
    return placeholder ?? t("shared.select");
  }
  return findLabel(value, items, groups);
}

export function renderDropdown(props: DropdownProps) {
  const displayLabel = resolveDisplayLabel(props);
  const hasItems =
    (props.items && props.items.length > 0) ||
    (props.groups && props.groups.some((g) => g.items.length > 0));
  const expandedGroups = props.expandedGroups ?? new Set<string>();

  return html`
    <div class="oc-dropdown ${props.open ? "oc-dropdown--open" : ""} ${props.disabled ? "oc-dropdown--disabled" : ""}">
      <button
        type="button"
        class="oc-dropdown__trigger"
        ?disabled=${props.disabled}
        @click=${(e: Event) => {
          e.stopPropagation();
          props.onToggle();
        }}
      >
        <span class="oc-dropdown__label ${!props.value ? "oc-dropdown__label--placeholder" : ""}">
          ${displayLabel}
        </span>
        <span class="oc-dropdown__chevron">${props.open ? "▴" : "▾"}</span>
      </button>
      ${
        props.open
          ? html`
            <div class="oc-dropdown__panel" @click=${(e: Event) => e.stopPropagation()}>
              ${
                !hasItems
                  ? html`<div class="oc-dropdown__empty">${t("agentsView.noConfiguredModels")}</div>`
                  : nothing
              }
              ${renderItems(props.items, props.value, false, props.onSelect)}
              ${renderGroups(props.groups, props.value, false, expandedGroups, props.onSelect, props.onGroupToggle)}
            </div>
          `
          : nothing
      }
    </div>
  `;
}

// ─── Multi-select Dropdown ───────────────────────────────────

function resolveMultiDisplayLabel(props: MultiDropdownProps): string {
  const { values, placeholder, items, groups } = props;
  if (values.length === 0) {
    return placeholder ?? t("shared.select");
  }
  return values.map((v) => findLabel(v, items, groups)).join(", ");
}

export function renderMultiDropdown(props: MultiDropdownProps) {
  const displayLabel = resolveMultiDisplayLabel(props);
  const hasItems =
    (props.items && props.items.length > 0) ||
    (props.groups && props.groups.some((g) => g.items.length > 0));
  const expandedGroups = props.expandedGroups ?? new Set<string>();
  const selectedSet = new Set(props.values);

  return html`
    <div class="oc-dropdown ${props.open ? "oc-dropdown--open" : ""} ${props.disabled ? "oc-dropdown--disabled" : ""}">
      <button
        type="button"
        class="oc-dropdown__trigger"
        ?disabled=${props.disabled}
        @click=${(e: Event) => {
          e.stopPropagation();
          props.onToggle();
        }}
      >
        <span class="oc-dropdown__label ${props.values.length === 0 ? "oc-dropdown__label--placeholder" : ""}">
          ${displayLabel}
        </span>
        ${
          props.values.length > 0
            ? html`<span class="oc-dropdown__badge">${props.values.length}</span>`
            : nothing
        }
        <span class="oc-dropdown__chevron">${props.open ? "▴" : "▾"}</span>
      </button>
      ${
        props.open
          ? html`
            <div class="oc-dropdown__panel" @click=${(e: Event) => e.stopPropagation()}>
              ${
                !hasItems
                  ? html`<div class="oc-dropdown__empty">${t("agentsView.noConfiguredModels")}</div>`
                  : nothing
              }
              ${renderItems(props.items, selectedSet, true, props.onToggleItem)}
              ${renderGroups(props.groups, selectedSet, true, expandedGroups, props.onToggleItem, props.onGroupToggle)}
            </div>
          `
          : nothing
      }
    </div>
  `;
}

// ─── Shared rendering ────────────────────────────────────────

function isSelected(value: string, selected: string | Set<string> | null): boolean {
  if (selected instanceof Set) {
    return selected.has(value);
  }
  return selected === value;
}

function renderItems(
  items: DropdownItem[] | undefined,
  selected: string | Set<string> | null,
  multi: boolean,
  onSelect: (value: string) => void,
) {
  if (!items) {
    return nothing;
  }
  return items.map((item) => {
    const active = isSelected(item.value, selected);
    return html`
        <button
          type="button"
          class="oc-dropdown__item ${active ? "oc-dropdown__item--active" : ""}"
          @click=${() => onSelect(item.value)}
        >
          ${
            multi
              ? html`<span class="oc-dropdown__checkbox ${active ? "oc-dropdown__checkbox--checked" : ""}"></span>`
              : html`<span class="oc-dropdown__check">${active ? "✓" : ""}</span>`
          }
          <span>${item.label}</span>
        </button>
      `;
  });
}

function renderGroups(
  groups: DropdownGroup[] | undefined,
  selected: string | Set<string> | null,
  multi: boolean,
  expandedGroups: Set<string>,
  onSelect: (value: string) => void,
  onGroupToggle?: (label: string) => void,
) {
  if (!groups) {
    return nothing;
  }
  return groups.map((group) => {
    const isExpanded = expandedGroups.has(group.label);
    return html`
      <div class="oc-dropdown__group">
        <button
          type="button"
          class="oc-dropdown__group-header"
          @click=${() => onGroupToggle?.(group.label)}
        >
          <span class="oc-dropdown__group-chevron ${isExpanded ? "oc-dropdown__group-chevron--open" : ""}">▸</span>
          <span class="oc-dropdown__group-label">${group.label}</span>
          <span class="oc-dropdown__group-count">${group.items.length}</span>
        </button>
        ${
          isExpanded
            ? group.items.map((item) => {
                const active = isSelected(item.value, selected);
                return html`
                  <button
                    type="button"
                    class="oc-dropdown__item oc-dropdown__item--grouped ${active ? "oc-dropdown__item--active" : ""}"
                    @click=${() => onSelect(item.value)}
                  >
                    ${
                      multi
                        ? html`<span class="oc-dropdown__checkbox ${active ? "oc-dropdown__checkbox--checked" : ""}"></span>`
                        : html`<span class="oc-dropdown__check">${active ? "✓" : ""}</span>`
                    }
                    <span>${item.label}</span>
                  </button>
                `;
              })
            : nothing
        }
      </div>
    `;
  });
}
