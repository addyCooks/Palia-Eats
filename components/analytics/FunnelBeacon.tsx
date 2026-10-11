"use client";

import { useEffect } from "react";
import { trackFunnel, type FunnelEvent } from "@/lib/analytics/funnel";

// Drop on a page to count "this visit reached this step" (see lib/analytics/funnel.ts).
export function FunnelBeacon({ event }: { event: FunnelEvent }) {
  useEffect(() => {
    trackFunnel(event);
  }, [event]);
  return null;
}
