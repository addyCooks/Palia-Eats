import { createClient } from "@/lib/supabase/server";
import type { SupportStatus } from "@/lib/support/topics";

// Help requests (admin only: Row Level Security returns nothing to anyone else).
export type SupportRequest = {
  id: string;
  created_at: string;
  kind: "customer" | "restaurant";
  user_id: string | null;
  order_id: string | null;
  restaurant_id: string | null;
  name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  topic: string;
  message: string;
  status: SupportStatus;
  admin_note: string | null;
  answered_at: string | null;
};

export async function countOpenSupportRequests(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("support_requests")
    .select("id", { count: "exact", head: true })
    .eq("status", "open");
  return count ?? 0;
}

export async function getSupportRequests(filter: SupportStatus | "all"): Promise<SupportRequest[]> {
  const supabase = await createClient();
  let query = supabase.from("support_requests").select("*").order("created_at", { ascending: false }).limit(200);
  if (filter !== "all") query = query.eq("status", filter);
  const { data } = await query;
  return (data ?? []) as SupportRequest[];
}

export type SupportDetail = SupportRequest & {
  order_number: number | null;
  restaurant_name: string | null;
};

export async function getSupportRequest(id: string): Promise<SupportDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("support_requests")
    .select("*, orders(order_number), restaurants(name)")
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  const { orders, restaurants, ...rest } = data as SupportRequest & {
    orders: { order_number: number } | { order_number: number }[] | null;
    restaurants: { name: string } | { name: string }[] | null;
  };
  const order = Array.isArray(orders) ? orders[0] : orders;
  const restaurant = Array.isArray(restaurants) ? restaurants[0] : restaurants;
  return { ...rest, order_number: order?.order_number ?? null, restaurant_name: restaurant?.name ?? null };
}
