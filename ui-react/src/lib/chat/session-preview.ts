// Caché de previews de sesiones: guarda la primera pregunta del usuario para mostrar en sidebar
const STORAGE_KEY = "openclaw:session-previews";
const MAX_PREVIEW_LENGTH = 50;
const MAX_CACHED_SESSIONS = 100;

type PreviewCache = Record<string, string>;

function loadCache(): PreviewCache {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as PreviewCache) : {};
  } catch {
    return {};
  }
}

function saveCache(cache: PreviewCache) {
  try {
    // Limitar tamaño del caché
    const keys = Object.keys(cache);
    if (keys.length > MAX_CACHED_SESSIONS) {
      const toRemove = keys.slice(0, keys.length - MAX_CACHED_SESSIONS);
      for (const k of toRemove) {
        delete cache[k];
      }
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cache));
  } catch {
    // localStorage no disponible
  }
}

/** Extraer texto de un mensaje del usuario */
function extractUserText(message: unknown): string | null {
  if (!message || typeof message !== "object") {
    return null;
  }
  const msg = message as Record<string, unknown>;
  if (msg.role !== "user") {
    return null;
  }

  // Buscar texto en content array o string
  const content = msg.content;
  if (typeof content === "string") {
    return content.trim();
  }
  if (Array.isArray(content)) {
    for (const block of content) {
      if (
        block &&
        typeof block === "object" &&
        (block as Record<string, unknown>).type === "text"
      ) {
        const text = (block as Record<string, unknown>).text;
        if (typeof text === "string" && text.trim()) {
          return text.trim();
        }
      }
    }
  }
  return null;
}

/**
 * Guardar el preview de una sesión basado en los mensajes cargados.
 * Extrae la primera pregunta del usuario y la guarda en caché.
 */
export function cacheSessionPreview(sessionKey: string, messages: unknown[]) {
  if (!sessionKey || !messages?.length) {
    return;
  }

  // Buscar el primer mensaje del usuario
  for (const msg of messages) {
    const text = extractUserText(msg);
    if (text) {
      const preview =
        text.length > MAX_PREVIEW_LENGTH ? text.slice(0, MAX_PREVIEW_LENGTH) + "…" : text;
      const cache = loadCache();
      cache[sessionKey] = preview;
      saveCache(cache);
      return;
    }
  }
}

/**
 * Obtener el preview guardado para una sesión.
 */
export function getSessionPreview(sessionKey: string): string | null {
  const cache = loadCache();
  return cache[sessionKey] ?? null;
}
