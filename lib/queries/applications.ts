import { createClient } from "@/lib/supabase/server";

// Restaurant registration requests (admin only: Row Level Security returns nothing to
// anyone else).

export type ApplicationStatus = "pending" | "approved" | "rejected";

export type RestaurantApplication = {
  id: string;
  created_at: string;
  restaurant_name: string;
  owner_name: string;
  phone: string;
  email: string;
  area: string;
  address: string;
  cuisines: string[];
  opening_time: string | null;
  closing_time: string | null;
  fssai: string | null;
  message: string | null;
  status: ApplicationStatus;
  decided_at: string | null;
  reject_reason: string | null;
  restaurant_id: string | null;
};

export async function countPendingApplications(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("restaurant_applications")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending");
  return count ?? 0;
}

export async function getApplications(filter: ApplicationStatus | "all"): Promise<RestaurantApplication[]> {
  const supabase = await createClient();
  let query = supabase.from("restaurant_applications").select("*").order("created_at", { ascending: false }).limit(200);
  if (filter !== "all") query = query.eq("status", filter);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load requests: ${error.message}`);
  return (data ?? []) as RestaurantApplication[];
}

export async function getApplication(id: string): Promise<RestaurantApplication | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("restaurant_applications").select("*").eq("id", id).maybeSingle();
  return data as RestaurantApplication | null;
}
