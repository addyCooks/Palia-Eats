import { createClient } from "@/lib/supabase/server";

// Orders for the admin's CSV download. Read in pages of 1,000 (the database never hands back more
// in one go), newest first.
export type ExportOrder = {
  order_number: number;
  placed_at: string;
  status: string;
  channel: string;
  customer_name: string;
  customer_phone: string;
  delivery_address: { label?: string; address_line?: string; landmark?: string | null } | null;
  customer_notes: string | null;
  subtotal: number;
  delivery_fee: number;
  total: number;
  cancelled_by: string | null;
  rejection_reason: string | null;
  restaurants: { name: string } | { name: string }[] | null;
  order_items: { item_name: string; quantity: number }[] | null;
  order_ratings: { stars: number } | { stars: number }[] | null;
};

export const MAX_EXPORT_ORDERS = 20_000;

export async function getOrdersForExport(input: {
  fromIso: string;
  toIso: string;
  restaurantId?: string | null;
}): Promise<{ rows: ExportOrder[]; truncated: boolean }> {
  const supabase = await createClient();
  const rows: ExportOrder[] = [];
  const pageSize = 1000;

  for (let from = 0; from < MAX_EXPORT_ORDERS; from += pageSize) {
    let query = supabase
      .from("orders")
      .select(
        "order_number, placed_at, status, channel, customer_name, customer_phone, delivery_address, customer_notes, subtotal, delivery_fee, total, cancelled_by, rejection_reason, restaurants(name), order_items(item_name, quantity), order_ratings(stars)",
      )
      .gte("placed_at", input.fromIso)
      .lt("placed_at", input.toIso)
      .order("placed_at", { ascending: false })
      .range(from, from + pageSize - 1);
    if (input.restaurantId) query = query.eq("restaurant_id", input.restaurantId);

    const { data, error } = await query;
    if (error) throw new Error(`Could not load orders: ${error.message}`);
    rows.push(...((data ?? []) as unknown as ExportOrder[]));
    if ((data ?? []).length < pageSize) return { rows, truncated: false };
  }
  return { rows, truncated: true };
}
