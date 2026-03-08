import type { ThemeMode } from "./theme.ts";

export type ThemeTransitionContext = {
  element?: HTMLElement | null;
  pointerClientX?: number;
  pointerClientY?: number;
};

export type ThemeTransitionOptions = {
  nextTheme: ThemeMode;
  applyTheme: () => void;
  context?: ThemeTransitionContext;
  currentTheme?: ThemeMode | null;
};

const TRANSITION_DURATION = 350; // ms

const hasReducedMotionPreference = () => {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return false;
  }
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches ?? false;
};

/**
 * Inject a temporary <style> that forces smooth CSS transitions on ALL elements
 * during the theme switch. Uses !important to override element-level transitions.
 * Automatically removed after the transition completes.
 */
let _transitionStyle: HTMLStyleElement | null = null;
let _transitionTimer: ReturnType<typeof setTimeout> | null = null;

function injectTransitionOverride() {
  if (_transitionTimer) {
    clearTimeout(_transitionTimer);
    _transitionTimer = null;
  }

  if (!_transitionStyle) {
    _transitionStyle = document.createElement("style");
    _transitionStyle.setAttribute("data-theme-transition", "");
    _transitionStyle.textContent = `
      *, *::before, *::after {
        transition: background-color ${TRANSITION_DURATION}ms ease,
                    color ${TRANSITION_DURATION}ms ease,
                    border-color ${TRANSITION_DURATION}ms ease,
                    box-shadow ${TRANSITION_DURATION}ms ease,
                    fill ${TRANSITION_DURATION}ms ease,
                    stroke ${TRANSITION_DURATION}ms ease !important;
      }
    `;
    document.head.appendChild(_transitionStyle);
  }

  _transitionTimer = setTimeout(() => {
    if (_transitionStyle?.parentNode) {
      _transitionStyle.parentNode.removeChild(_transitionStyle);
    }
    _transitionStyle = null;
    _transitionTimer = null;
  }, TRANSITION_DURATION + 100);
}

export const startThemeTransition = ({
  nextTheme,
  applyTheme,
  currentTheme,
}: ThemeTransitionOptions) => {
  if (currentTheme === nextTheme) {
    return;
  }

  const documentReference = globalThis.document ?? null;
  if (!documentReference) {
    applyTheme();
    return;
  }

  if (hasReducedMotionPreference()) {
    applyTheme();
    return;
  }

  // Inject transition override, wait one frame for it to apply, then switch theme
  injectTransitionOverride();
  requestAnimationFrame(() => {
    applyTheme();
  });
};
