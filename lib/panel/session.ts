import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPanelToken } from "@/lib/panel/token";

export const PANEL_COOKIE = "panel_token";
export const PANEL_COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type PanelRestaurant = {
  id: string;
  slug: string;
  name: string;
  is_accepting_orders: boolean;
  opening_time: string | null;
  closing_time: string | null;
  closed_days: number[];
  // Secret name of this restaurant's live-ping channel (see 0007_realtime.sql)
  realtime_topic: string;
  // Approved but not on the website yet (see 0015_restaurant_applications.sql)
  setting_up: boolean;
};

// Checks a panel token and returns the restaurant it opens, or null.
// A token is valid when: the signature is good, it hasn't expired, the restaurant is
// active (or newly approved and still setting up), and it was issued AFTER the admin's last "generate a new link" (that is how
// old links get cancelled).
export async function resolvePanelToken(token: string): Promise<PanelRestaurant | null> {
  const claims = verifyPanelToken(token);
  if (!claims) return null;

  // Service-role client: this is the one place panel visitors (who have no account)
  // are identified. Everything after this is scoped to the restaurant found here.
  const admin = createAdminClient();
  const { data } = await admin
    .from("restaurants")
    .select(
      "id, slug, name, is_active, is_accepting_orders, opening_time, closing_time, closed_days, restaurant_private(panel_key_created_at, realtime_topic, setting_up)",
    )
    .eq("id", claims.restaurantId)
    .maybeSingle();

  if (!data) return null;

  const privateRow = Array.isArray(data.restaurant_private)
    ? data.restaurant_private[0]
    : data.restaurant_private;
  const settingUp = !data.is_active && Boolean(privateRow?.setting_up);
  if (!data.is_active && !settingUp) return null;
  const validSince = privateRow?.panel_key_created_at
    ? Math.floor(new Date(privateRow.panel_key_created_at).getTime() / 1000)
    : 0;
  if (claims.issuedAt < validSince) return null;
  if (!privateRow?.realtime_topic) return null;

  return {
    id: data.id,
    slug: data.slug,
    name: data.name,
    is_accepting_orders: data.is_accepting_orders,
    opening_time: data.opening_time,
    closing_time: data.closing_time,
    closed_days: data.closed_days ?? [],
    realtime_topic: privateRow.realtime_topic,
    setting_up: settingUp,
  };
}

// The restaurant for the current visitor, from their panel cookie (null if none/invalid).
export const getPanelRestaurant = cache(async (): Promise<PanelRestaurant | null> => {
  const token = (await cookies()).get(PANEL_COOKIE)?.value;
  if (!token) return null;
  return resolvePanelToken(token);
});
