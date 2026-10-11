// Pure helpers (no imports) so they can be tested on their own.

// Things that are not our bugs: people going offline, browser extensions, redirects.
const NOISE = [
  /NEXT_REDIRECT/,
  /NEXT_NOT_FOUND/,
  /NEXT_HTTP_ERROR_FALLBACK/,
  /ResizeObserver loop/i,
  /Failed to fetch/i,
  /Load failed/i,
  /NetworkError/i,
  /Network request failed/i,
  /AbortError/i,
  /The operation was aborted/i,
  /^Script error\.?$/i,
  /chrome-extension:\/\//,
  /moz-extension:\/\//,
  /safari-extension:\/\//,
  /Non-Error promise rejection/i,
  /ChunkLoadError/i,
  /Loading chunk \d+ failed/i,
];

export function isNoise(message: string, stack?: string | null): boolean {
  const text = `${message}\n${stack ?? ""}`;
  return NOISE.some((pattern) => pattern.test(text));
}

// Error text can contain what a person typed (an email, a phone number). Keep that out of the log.
export function redact(text: string): string {
  return text
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "[email]")
    .replace(/\b\d{10,}\b/g, "[number]")
    .replace(/eyJ[\w-]{10,}\.[\w-]{10,}\.[\w-]{5,}/g, "[token]");
}

// "/orders/6f1c...-uuid" -> "/orders/:id"; long secret-looking path parts are hidden too.
export function safePath(path: string): string {
  return path.split("?")[0].replace(/\/[A-Za-z0-9_-]{30,}/g, "/:id").slice(0, 200);
}
