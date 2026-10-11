import { createClient } from "@/lib/supabase/server";

// The website's crash log (admin only: Row Level Security returns nothing to anyone else).
export type ErrorRow = {
  id: number;
  source: "server" | "browser";
  message: string;
  path: string | null;
  stack: string | null;
  digest: string | null;
  user_agent: string | null;
  occurrences: number;
  first_seen: string;
  last_seen: string;
  resolved: boolean;
};

export async function countUnresolvedErrors(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("error_log")
    .select("id", { count: "exact", head: true })
    .eq("resolved", false)
    .gte("last_seen", new Date(Date.now() - 7 * 86_400_000).toISOString());
  return count ?? 0;
}

export async function getErrors(filter: "open" | "fixed" | "all"): Promise<ErrorRow[]> {
  const supabase = await createClient();
  let query = supabase.from("error_log").select("*").order("last_seen", { ascending: false }).limit(200);
  if (filter === "open") query = query.eq("resolved", false);
  if (filter === "fixed") query = query.eq("resolved", true);
  const { data } = await query;
  return (data ?? []) as ErrorRow[];
}
