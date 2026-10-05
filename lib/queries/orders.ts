import { createClient } from "@/lib/supabase/server";
import type { OrderWithDetails } from "@/types/app";

// Row Level Security makes sure customers only ever get their own orders.
const ORDER_SELECT = "*, order_items(*), restaurants(name, slug, phone)";

export async function getMyOrders(): Promise<OrderWithDetails[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .order("placed_at", { ascending: false })
    .limit(50);

  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return (data ?? []) as OrderWithDetails[];
}

export async function getMyOrder(id: string): Promise<OrderWithDetails | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Could not load order: ${error.message}`);
  return data as OrderWithDetails | null;
}
