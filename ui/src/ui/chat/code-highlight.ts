import { createHighlighter, type Highlighter } from "shiki";

let highlighterPromise: Promise<Highlighter> | null = null;

const COMMON_LANGS = [
  "javascript",
  "typescript",
  "python",
  "json",
  "bash",
  "html",
  "css",
  "markdown",
  "yaml",
  "sql",
  "go",
  "rust",
  "java",
  "c",
  "cpp",
  "shell",
  "plaintext",
] as const;

// Alias map for common short names
const LANG_ALIASES: Record<string, string> = {
  js: "javascript",
  ts: "typescript",
  py: "python",
  sh: "bash",
  zsh: "bash",
  yml: "yaml",
  md: "markdown",
  "c++": "cpp",
  "": "plaintext",
};

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark"],
      langs: [...COMMON_LANGS],
    });
  }
  return highlighterPromise;
}

function resolveLang(lang: string): string {
  const lower = lang.toLowerCase().trim();
  return LANG_ALIASES[lower] ?? lower;
}

/**
 * Highlight all `<pre><code>` blocks with a `data-lang` attribute inside
 * the given container. This is designed to be called AFTER the markdown
 * HTML has been inserted into the DOM.
 *
 * Returns a promise that resolves when all code blocks are highlighted.
 */
export async function highlightCodeBlocks(container: HTMLElement): Promise<void> {
  const codeBlocks = container.querySelectorAll<HTMLElement>("pre > code[data-lang]");
  if (codeBlocks.length === 0) {
    return;
  }

  let hl: Highlighter;
  try {
    hl = await getHighlighter();
  } catch (err) {
    // Shiki failed to load — leave code blocks unhighlighted
    console.warn("[code-highlight] Shiki failed to load:", err);
    return;
  }

  for (const codeEl of codeBlocks) {
    const lang = resolveLang(codeEl.getAttribute("data-lang") ?? "");
    const code = codeEl.textContent ?? "";

    if (codeEl.hasAttribute("data-highlighted")) {
      continue;
    }

    // Check if language is loaded, skip if not
    const loadedLangs = hl.getLoadedLanguages();
    if (!loadedLangs.includes(lang) && lang !== "plaintext") {
      try {
        await hl.loadLanguage(lang as Parameters<Highlighter["loadLanguage"]>[0]);
      } catch {
        // Language not supported, skip highlighting
        continue;
      }
    }

    try {
      const highlighted = hl.codeToHtml(code, {
        lang,
        theme: "github-dark",
      });

      // Replace the <pre> element content
      const preEl = codeEl.parentElement;
      if (preEl) {
        // Parse the shiki output and extract the inner content
        const temp = document.createElement("div");
        temp.innerHTML = highlighted;
        const shikiPre = temp.querySelector("pre");
        if (shikiPre) {
          // Copy Shiki styles to our pre element
          preEl.className = `code-block code-block--highlighted ${preEl.className}`;
          preEl.style.cssText = shikiPre.style.cssText;
          const shikiCode = shikiPre.querySelector("code");
          if (shikiCode) {
            codeEl.innerHTML = shikiCode.innerHTML;
          }
        }
      }
      codeEl.setAttribute("data-highlighted", "1");
    } catch {
      // Highlighting failed for this block, skip
    }
  }
}
