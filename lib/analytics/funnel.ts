// Anonymous "how far did visitors get" counting, in the visitor's browser. It sends only the
// step's name, at most once per step per visit (remembered in sessionStorage, which disappears
// when the tab closes). No cookie, no ID, no personal data. Visitors who have "Do Not Track" or
// "Global Privacy Control" switched on are not counted at all.
export type FunnelEvent = "visit" | "restaurant_view" | "add_to_cart" | "checkout_start";

export function trackFunnel(event: FunnelEvent): void {
  try {
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;
    const path = window.location.pathname;
    if (path.startsWith("/admin") || path.startsWith("/panel")) return; // our own staff

    const key = `pe-funnel-${event}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const body = JSON.stringify({ event });
    const blob = new Blob([body], { type: "application/json" });
    if (!(navigator.sendBeacon && navigator.sendBeacon("/api/funnel", blob))) {
      void fetch("/api/funnel", { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true });
    }
  } catch {
    // counting must never get in the way of the page
  }
}
