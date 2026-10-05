import { createClient } from "@/lib/supabase/server";
import type { Address } from "@/types/app";

// Row Level Security makes sure these only ever return the logged-in user's own addresses.

export async function getMyAddresses(): Promise<Address[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .order("is_default", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Could not load addresses: ${error.message}`);
  return (data ?? []) as Address[];
}

export async function getMyAddress(id: string): Promise<Address | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customer_addresses")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load address: ${error.message}`);
  return data as Address | null;
}
