"use client";

import { useSyncExternalStore } from "react";
import { useT } from "@/lib/i18n/client";

function subscribe(onChange: () => void) {
  window.addEventListener("online", onChange);
  window.addEventListener("offline", onChange);
  return () => {
    window.removeEventListener("online", onChange);
    window.removeEventListener("offline", onChange);
  };
}

// A calm banner when the phone loses its connection (common on patchy 4G). Pages keep
// working with what they already loaded; everything reconnects by itself.
export function OfflineNotice() {
  const t = useT();
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center gap-3 bg-[#16120D] px-4 py-2.5 text-white shadow-md"
    >
      <span aria-hidden className="grid size-8 shrink-0 place-items-center rounded-[10px] bg-brand font-display text-lg text-on-brand">
        !
      </span>
      <p className="text-sm">
        <strong className="font-semibold">{t("offline.title")}</strong>{" "}
        <span className="text-[#D8D2C8]">{t("offline.body")}</span>
      </p>
    </div>
  );
}
