// Runs in the visitor's browser. Sends a crash to /api/log-error so it shows up in Admin ->
// Problems. At most a handful per page load, and never throws.
const MAX_PER_PAGE_LOAD = 5;
let sent = 0;

export function reportClientError(error: unknown): void {
  try {
    if (sent >= MAX_PER_PAGE_LOAD) return;
    sent++;

    const err = error instanceof Error ? error : new Error(typeof error === "string" ? error : "Unknown error");
    const body = JSON.stringify({
      message: String(err.message || "Unknown error").slice(0, 500),
      stack: String(err.stack ?? "").slice(0, 3000),
      digest: (err as Error & { digest?: string }).digest ?? null,
      path: window.location.pathname,
    });

    const blob = new Blob([body], { type: "application/json" });
    if (!(navigator.sendBeacon && navigator.sendBeacon("/api/log-error", blob))) {
      void fetch("/api/log-error", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    }
  } catch {
    // reporting a crash must never cause another one
  }
}
