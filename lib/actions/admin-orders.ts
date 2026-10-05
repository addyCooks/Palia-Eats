"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/menu";

// Lets the admin move any order along, or cancel it. Uses the normal logged-in client,
// so the database's own rules apply: only admins may update orders, and the order
// guard still blocks illegal jumps (like delivered -> cooking).
export async function adminUpdateOrderStatus(input: {
  orderId: string;
  status: string;
  reason?: string;
}): Promise<{ error?: string }> {
  await requireAdmin();

  const allowed = ["preparing", "out_for_delivery", "delivered", "cancelled"];
  if (!isUuid(String(input?.orderId)) || !allowed.includes(input.status)) {
    return { error: "That change isn't allowed." };
  }

  const reason =
    input.status === "cancelled" ? String(input.reason ?? "").trim().slice(0, 200) || null : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({ status: input.status, rejection_reason: reason })
    .eq("id", input.orderId)
    .select("id");

  if (error) {
    if (error.message.includes("Invalid order status change")) {
      return { error: "This order has already moved on. The list has been refreshed." };
    }
    return { error: "Could not update the order. Please try again." };
  }
  if (!data?.length) return { error: "Order not found." };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  return {};
}
