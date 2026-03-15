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

// Heurísticas simples para detectar lenguaje cuando no se especifica
function guessLang(code: string): string {
  const trimmed = code.trim();
  if (/^\s*(curl|wget|chmod|sudo|apt|brew|npm|pnpm|yarn|pip|git|docker|ssh)\b/m.test(trimmed)) {
    return "bash";
  }
  if (/^\s*(import |from |def |class )/.test(trimmed) && /:\s*$/m.test(trimmed)) {
    return "python";
  }
  if (/^\s*(import |export |const |let |var |function |async |=>)/.test(trimmed)) {
    return "typescript";
  }
  if (/^\s*[{[]/.test(trimmed) && /[}\]]\s*$/.test(trimmed)) {
    return "json";
  }
  if (/^\s*<[!?a-zA-Z]/.test(trimmed)) {
    return "html";
  }
  if (/^\s*(SELECT|INSERT|UPDATE|DELETE|CREATE|ALTER|DROP)\b/i.test(trimmed)) {
    return "sql";
  }
  if (/^\s*apiVersion:/m.test(trimmed) || /^\s*\w+:\s/m.test(trimmed)) {
    return "yaml";
  }
  return "plaintext";
}

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ["github-dark", "github-light"],
      langs: [...COMMON_LANGS],
    });
  }
  return highlighterPromise;
}

// Detectar el tema activo del documento
function getCurrentShikiTheme(): string {
  const docTheme = document.documentElement.getAttribute("data-theme");
  return docTheme === "light" ? "github-light" : "github-dark";
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
export async function highlightCodeBlocks(container: HTMLElement | null): Promise<void> {
  if (!container) {
    return;
  }
  // Seleccionar todos los bloques pre.code-block, con o sin code hijo
  const codeBlocks = container.querySelectorAll<HTMLElement>("pre > code");
  if (codeBlocks.length === 0) {
    return;
  }

  let hl: Highlighter;
  const currentTheme = getCurrentShikiTheme();
  try {
    hl = await getHighlighter();
  } catch (err) {
    console.warn("[code-highlight] Shiki failed to load:", err);
    return;
  }

  for (const codeEl of codeBlocks) {
    const rawLang = codeEl.getAttribute("data-lang") ?? "";
    const code = codeEl.textContent ?? "";
    const lang = rawLang ? resolveLang(rawLang) : guessLang(code);

    if (codeEl.hasAttribute("data-highlighted")) {
      const prevTheme = codeEl.getAttribute("data-highlighted-theme");
      if (prevTheme === currentTheme) {
        continue;
      }
    }

    // Cargar lenguaje si no está disponible
    const loadedLangs = hl.getLoadedLanguages();
    if (!loadedLangs.includes(lang) && lang !== "plaintext") {
      try {
        await hl.loadLanguage(lang as Parameters<Highlighter["loadLanguage"]>[0]);
      } catch {
        continue;
      }
    }

    try {
      const highlighted = hl.codeToHtml(code, {
        lang,
        theme: currentTheme,
      });

      const preEl = codeEl.parentElement;
      if (preEl) {
        const temp = document.createElement("div");
        temp.innerHTML = highlighted;
        const shikiPre = temp.querySelector("pre");
        if (shikiPre) {
          preEl.className = `code-block code-block--highlighted`;
          // No copiar estilos inline de Shiki — CSS controla colores
          preEl.removeAttribute("style");
          const shikiCode = shikiPre.querySelector("code");
          if (shikiCode) {
            codeEl.innerHTML = shikiCode.innerHTML;
          }
        }

        // Insertar toolbar (lenguaje + botón copiar) si no existe
        addToolbar(preEl, lang, code);

        // Insertar números de línea
        addLineNumbers(codeEl);
      }
      codeEl.setAttribute("data-highlighted", "1");
      codeEl.setAttribute("data-highlighted-theme", currentTheme);
    } catch {
      // Error de resaltado, skip
    }
  }

  // También procesar bloques sin code hijo (pre.code-block sin hijos code)
  addToolbarToPlainBlocks(container);
}

/** Agregar toolbar con etiqueta de lenguaje y botón de copiar */
function addToolbar(preEl: HTMLElement, lang: string, code: string) {
  if (preEl.querySelector(".code-block__toolbar")) {
    return;
  }

  const toolbar = document.createElement("div");
  toolbar.className = "code-block__toolbar";

  // Etiqueta de lenguaje
  const langLabel = document.createElement("span");
  langLabel.className = "code-block__lang";
  langLabel.textContent = lang === "plaintext" ? "" : lang;
  toolbar.appendChild(langLabel);

  // Botón copiar
  const copyBtn = document.createElement("button");
  copyBtn.className = "code-block__copy";
  copyBtn.type = "button";
  copyBtn.title = "Copy";
  copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;

  copyBtn.addEventListener("click", () => {
    void navigator.clipboard.writeText(code).then(() => {
      copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>`;
      copyBtn.classList.add("code-block__copy--done");
      setTimeout(() => {
        copyBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>`;
        copyBtn.classList.remove("code-block__copy--done");
      }, 1500);
    });
  });

  toolbar.appendChild(copyBtn);
  preEl.insertBefore(toolbar, preEl.firstChild);
}

/** Agregar números de línea al elemento code */
function addLineNumbers(codeEl: HTMLElement) {
  if (codeEl.hasAttribute("data-line-numbers")) {
    return;
  }

  // Contar líneas desde el contenido de Shiki (spans por línea)
  const lines = codeEl.innerHTML.split("\n");
  // Solo mostrar números si hay más de 1 línea
  if (lines.length <= 1) {
    codeEl.setAttribute("data-line-numbers", "1");
    return;
  }

  const wrappedLines = lines.map((lineHtml, i) => {
    const num = i + 1;
    return `<span class="code-line"><span class="code-line__number">${num}</span><span class="code-line__content">${lineHtml}</span></span>`;
  });

  codeEl.innerHTML = wrappedLines.join("\n");
  codeEl.setAttribute("data-line-numbers", "1");
}

/** Procesar bloques planos sin highlight */
function addToolbarToPlainBlocks(container: HTMLElement) {
  const plainBlocks = container.querySelectorAll<HTMLElement>(
    "pre.code-block:not(.code-block--highlighted)",
  );
  for (const preEl of plainBlocks) {
    if (preEl.querySelector(".code-block__toolbar")) {
      continue;
    }
    const code = preEl.textContent ?? "";
    addToolbar(preEl, "", code);
  }
}
