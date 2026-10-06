"use client";

import { useSyncExternalStore } from "react";
import { NoInternetIllustration } from "@/components/illustrations";

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
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
  if (online) return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex items-center gap-3 bg-[#7A1F1F] px-4 py-2 text-[#FFFAF3] shadow-md"
    >
      <NoInternetIllustration className="h-10 w-11 shrink-0" />
      <p className="text-sm">
        <strong className="font-semibold">No internet connection.</strong> We&apos;ll reconnect on our own. Your
        cart is safe.
      </p>
    </div>
  );
}
