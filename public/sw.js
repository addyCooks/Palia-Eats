// PaliaEats service worker. It does ONE job: show order notifications (web push) and open the
// right page when one is tapped. It does not cache anything, so it can never show an old version
// of the website.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
    // Firebase wraps what we send: { data: { title, body, url, tag }, from, ... }. Web push does not.
    if (data && typeof data.data === "object" && data.data !== null) data = data.data;
  } catch {
    data = { title: "PaliaEats", body: event.data ? event.data.text() : "" };
  }

  event.waitUntil(
    self.registration.showNotification(data.title || "PaliaEats", {
      body: data.body || "",
      icon: "/icons/icon-192.png",
      tag: data.tag || "paliaeats",
      renotify: true,
      data: { url: data.url || "/orders" },
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/orders", self.location.origin).href;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          if ("navigate" in client) client.navigate(target);
          return client.focus();
        }
      }
      return self.clients.openWindow(target);
    }),
  );
});
