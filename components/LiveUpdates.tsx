"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";

export type LiveTable = {
  table: "orders" | "restaurants" | "menu_items" | "order_status_events";
  // Optional: only changes to matching rows, e.g. "id=eq.<uuid>"
  filter?: string;
};

type LiveUpdatesProps = {
  // Listen to live database changes (the logged-in user's access rules still apply).
  tables?: LiveTable[];
  // Listen to the restaurant panel's secret ping channel (see 0007_realtime.sql).
  panelTopic?: string;
  // Safety net: also re-check this often, in case a connection silently drops.
  fallbackSeconds?: number;
  // Show a small "Live" light.
  showStatus?: boolean;
};

// Keeps the page up to date over a WebSocket: when something changes, the page's
// server data is re-loaded instantly. Renders only the optional "Live" light.
export function LiveUpdates({
  tables = [],
  panelTopic,
  fallbackSeconds = 60,
  showStatus = false,
}: LiveUpdatesProps) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const tablesKey = JSON.stringify(tables); // a stable value to depend on

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let channel: RealtimeChannel | undefined;
    let hasConnectedBefore = false;

    // Several changes can arrive together (e.g. an order and its items): reload once.
    const refresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), 200);
    };

    (async () => {
      // Listen as the logged-in user, so database rules decide what we may receive.
      const { data } = await supabase.auth.getSession();
      if (cancelled) return;
      if (data.session) supabase.realtime.setAuth(data.session.access_token);

      channel = supabase.channel(panelTopic ? `panel:${panelTopic}` : `live-${crypto.randomUUID()}`);

      for (const item of JSON.parse(tablesKey) as LiveTable[]) {
        channel.on(
          "postgres_changes",
          { event: "*", schema: "public", table: item.table, filter: item.filter },
          refresh,
        );
      }
      if (panelTopic) channel.on("broadcast", { event: "refresh" }, refresh);

      channel.subscribe((status) => {
        if (cancelled) return;
        const isConnected = status === "SUBSCRIBED";
        setConnected(isConnected);
        if (isConnected) {
          // Reconnected after a drop: catch up on anything we missed meanwhile.
          if (hasConnectedBefore) refresh();
          hasConnectedBefore = true;
        }
      });
    })();

    const fallback = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, fallbackSeconds * 1000);

    return () => {
      cancelled = true;
      clearTimeout(refreshTimer);
      clearInterval(fallback);
      if (channel) supabase.removeChannel(channel);
    };
  }, [router, tablesKey, panelTopic, fallbackSeconds]);

  if (!showStatus) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-stone-500" aria-live="polite">
      <span className={`size-2 rounded-full ${connected ? "bg-green-500" : "bg-stone-300"}`} />
      {connected ? "Live" : "Connecting…"}
    </span>
  );
}
