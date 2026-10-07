"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/menu";
import { handleOrderEvent } from "@/lib/orders/events";
import { MAX_REASON_LENGTH } from "@/lib/orders/cancel-reasons";

// Lets the admin move any order along, or cancel it. Uses the normal logged-in client,
// so the database's own rules apply: only admins may update orders, and the order
// guard still blocks illegal jumps (like delivered -> cooking).
export async function adminUpdateOrderStatus(input: {
  orderId: string;
  status: string;
  reason?: string;
  undo?: boolean;
}): Promise<{ error?: string }> {
  await requireAdmin();

  // "pending" = one step back from Cooking (undo); the database allows one step back only.
  const allowed = ["pending", "preparing", "out_for_delivery", "delivered", "cancelled"];
  if (!isUuid(String(input?.orderId)) || !allowed.includes(input.status)) {
    return { error: "That change isn't allowed." };
  }

  const reason =
    input.status === "cancelled" ? String(input.reason ?? "").trim().slice(0, MAX_REASON_LENGTH) || null : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("orders")
    .update({
      status: input.status,
      rejection_reason: reason,
      cancelled_by: input.status === "cancelled" ? "admin" : null,
    })
    .eq("id", input.orderId)
    .select("id");

  if (error) {
    if (error.message.includes("Invalid order status change")) {
      return { error: "This order has already moved on. The list has been refreshed." };
    }
    return { error: "Could not update the order. Please try again." };
  }
  if (!data?.length) return { error: "Order not found." };

  if (!input.undo) {
    after(() => handleOrderEvent({ type: "status_changed", orderId: input.orderId, status: input.status }));
  }
  revalidatePath("/admin/orders", "layout");
  revalidatePath("/admin");
  return {};
}
