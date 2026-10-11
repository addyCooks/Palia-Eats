import { reportClientError } from "@/lib/monitoring/report-client";

// Runs in every visitor's browser before the app starts: any crash that nothing else catches is
// reported to /api/log-error (Admin -> Problems).
window.addEventListener("error", (event) => {
  reportClientError(event.error ?? event.message);
});
window.addEventListener("unhandledrejection", (event) => {
  reportClientError(event.reason);
});
