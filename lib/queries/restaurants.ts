import { createClient } from "@/lib/supabase/server";
import type { AdminRestaurant } from "@/types/app";

// Admin-only reads. RLS lets admins see inactive restaurants and the private table.

export async function getAdminRestaurants(): Promise<AdminRestaurant[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, restaurant_private(notification_email, notification_phone, panel_key_created_at, owner_name, commission_percent)")
    .order("name");

  if (error) throw new Error(`Could not load restaurants: ${error.message}`);
  return (data ?? []) as AdminRestaurant[];
}

export async function getAdminRestaurant(
  id: string,
): Promise<AdminRestaurant | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, restaurant_private(notification_email, notification_phone, panel_key_created_at, owner_name, commission_percent)")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load restaurant: ${error.message}`);
  return data as AdminRestaurant | null;
}
