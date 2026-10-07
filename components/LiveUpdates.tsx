"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient as createSupabaseClient, type RealtimeChannel, type SupabaseClient } from "@supabase/supabase-js";

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
  // The logged-in person's access token, handed over by the server page (see
  // getRealtimeToken). Needed for private rows such as a customer's own order.
  accessToken?: string | null;
  // Safety net: also re-check this often, in case a connection silently drops.
  fallbackSeconds?: number;
  // Show a small "Live" light.
  showStatus?: boolean;
};

// A small client used only for live updates. It never touches the login session (no
// browser storage, no locks), so it can't stall behind other parts of the page that
// read the session at the same moment; the server hands it the token instead.
function liveClient(): SupabaseClient {
  return createSupabaseClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false, storageKey: `pe-live-${crypto.randomUUID()}` },
  });
}

// Keeps the page up to date over a WebSocket: when something changes, the page's
// server data is re-loaded straight away (usually within half a second). Renders only
// the optional "Live" light.
export function LiveUpdates({
  tables = [],
  panelTopic,
  accessToken = null,
  fallbackSeconds = 60,
  showStatus = false,
}: LiveUpdatesProps) {
  const router = useRouter();
  const [connected, setConnected] = useState(false);
  const clientRef = useRef<SupabaseClient | null>(null);
  const tablesKey = JSON.stringify(tables); // a stable value to depend on

  // Fresh tokens arrive with each server refresh: pass them on without re-subscribing.
  useEffect(() => {
    if (accessToken && clientRef.current) void clientRef.current.realtime.setAuth(accessToken);
  }, [accessToken]);

  useEffect(() => {
    const supabase = liveClient();
    clientRef.current = supabase;
    let cancelled = false;
    let refreshTimer: ReturnType<typeof setTimeout> | undefined;
    let channel: RealtimeChannel | undefined;
    let hasConnectedBefore = false;

    // Several changes can arrive together (e.g. an order and its timeline): reload once.
    const refresh = () => {
      clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => router.refresh(), 120);
    };

    (async () => {
      // Listen as the logged-in person, so database rules decide what we may receive.
      if (accessToken) await supabase.realtime.setAuth(accessToken);
      if (cancelled) return;

      channel = supabase.channel(panelTopic ? `panel:${panelTopic}` : `live-${crypto.randomUUID()}`);
      for (const item of JSON.parse(tablesKey) as LiveTable[]) {
        channel.on("postgres_changes", { event: "*", schema: "public", table: item.table, filter: item.filter }, refresh);
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

    // Coming back to the tab (phones pause pages in the background): catch up at once.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);

    const fallback = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, fallbackSeconds * 1000);

    return () => {
      cancelled = true;
      clearTimeout(refreshTimer);
      clearInterval(fallback);
      document.removeEventListener("visibilitychange", onVisible);
      if (channel) void supabase.removeChannel(channel);
      void supabase.realtime.disconnect();
      clientRef.current = null;
    };
    // The token is applied separately above; a new token must not tear down the connection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router, tablesKey, panelTopic, fallbackSeconds]);

  if (!showStatus) return null;

  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-stone-500" aria-live="polite">
      <span className={`relative size-2 rounded-full ${connected ? "bg-green-500" : "bg-stone-300"}`}>
        {connected && <span className="pe-ring absolute inset-0 rounded-full bg-green-500" />}
      </span>
      {connected ? "Live" : "Connecting…"}
    </span>
  );
}
