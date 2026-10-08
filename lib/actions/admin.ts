"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isUuid } from "@/lib/validation/menu";
// COMMISSION OFF: import { addDaysToKey, istDayStart, mondayOfKey, todayKeyIST } from "@/lib/utils/time";
// COMMISSION OFF: import { settleWeek } from "@/lib/queries/admin";

export type AdminResult = { error?: string };
export type RiderFormState = { error?: string; saved?: boolean } | undefined;

const PHONE_PATTERN = /^[6-9][0-9]{9}$/;
// COMMISSION OFF: const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// ---------------------------------------------------------------- customers

// Block / unblock a customer. Blocked customers can still log in and see past orders,
// but the database refuses any new order from them. The flag can only be changed with
// the service-role key (customers can't touch it), so this checks for an admin first.
export async function setCustomerBlocked(input: { customerId: string; blocked: boolean }): Promise<AdminResult> {
  const admin = await requireAdmin();
  const customerId = String(input?.customerId);
  if (!isUuid(customerId)) return { error: "Missing customer." };
  if (customerId === admin.id) return { error: "You can't block yourself." };

  const service = createAdminClient();
  const { data: target } = await service.from("profiles").select("role").eq("id", customerId).maybeSingle();
  if (!target) return { error: "Customer not found." };
  if (target.role === "admin") return { error: "Admins can't be blocked." };

  const { error } = await service.from("profiles").update({ is_blocked: Boolean(input.blocked) }).eq("id", customerId);
  if (error) return { error: "Could not change this. Please try again." };

  revalidatePath("/admin/customers", "layout");
  return {};
}

// Removes one rating (a fake or abusive one). The restaurant's average and count update by
// themselves (a database trigger). Customers can't delete ratings, so this uses the server
// key, after the admin check.
export async function removeRating(input: { orderId: string }): Promise<AdminResult> {
  await requireAdmin();
  const orderId = String(input?.orderId);
  if (!isUuid(orderId)) return { error: "Missing rating." };

  const { data, error } = await createAdminClient().from("order_ratings").delete().eq("order_id", orderId).select("order_id");
  if (error) return { error: "Could not remove it. Please try again." };
  if (!data?.length) return { error: "That rating is already gone." };

  revalidatePath("/admin/ratings");
  revalidatePath("/admin/restaurants", "layout");
  return {};
}

// ---------------------------------------------------------------- riders

function parseRider(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim().slice(0, 80);
  const phone = String(formData.get("phone") ?? "").replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "");
  const restaurant = String(formData.get("restaurant_id") ?? "");
  if (!name) return { error: "Please enter the rider's name." } as const;
  if (!PHONE_PATTERN.test(phone)) return { error: "Please enter a 10-digit mobile number." } as const;
  if (restaurant && !isUuid(restaurant)) return { error: "Please choose who the rider works for." } as const;
  return { data: { name, phone, restaurant_id: restaurant || null } } as const;
}

export async function createRider(_prev: RiderFormState, formData: FormData): Promise<RiderFormState> {
  await requireAdmin();
  const parsed = parseRider(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase.from("riders").insert(parsed.data);
  if (error) return { error: "Could not add the rider. Please try again." };

  revalidatePath("/admin/riders");
  return { saved: true };
}

export async function updateRider(_prev: RiderFormState, formData: FormData): Promise<RiderFormState> {
  await requireAdmin();
  const riderId = String(formData.get("riderId") ?? "");
  if (!isUuid(riderId)) return { error: "Missing rider." };
  const parsed = parseRider(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await createClient();
  const { data, error } = await supabase.from("riders").update(parsed.data).eq("id", riderId).select("id");
  if (error || !data?.length) return { error: "Could not save the rider. Please try again." };

  revalidatePath("/admin/riders");
  return { saved: true };
}

export async function setRiderActive(input: { riderId: string; active: boolean }): Promise<AdminResult> {
  await requireAdmin();
  if (!isUuid(String(input?.riderId))) return { error: "Missing rider." };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("riders")
    .update({ is_active: Boolean(input.active) })
    .eq("id", input.riderId)
    .select("id");
  if (error || !data?.length) return { error: "Could not change this. Please try again." };
  revalidatePath("/admin/riders");
  return {};
}

// Put a rider on an order (or take them off). The database checks the rider is active and
// works for this restaurant or for PaliaEats.
export async function assignRider(input: { orderId: string; riderId: string | null }): Promise<AdminResult> {
  await requireAdmin();
  const orderId = String(input?.orderId);
  const riderId = input?.riderId ? String(input.riderId) : null;
  if (!isUuid(orderId) || (riderId && !isUuid(riderId))) return { error: "That change isn't allowed." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("orders").update({ rider_id: riderId }).eq("id", orderId).select("id");
  if (error) {
    if (error.message.includes("Invalid rider")) return { error: "That rider can't take this order." };
    return { error: "Could not assign the rider. Please try again." };
  }
  if (!data?.length) return { error: "Order not found." };

  revalidatePath(`/admin/orders/${orderId}`);
  revalidatePath("/admin/orders");
  return {};
}

/* COMMISSION OFF: weekly payouts (sales minus commission). Un-comment together with the other COMMISSION OFF pieces.
// ---------------------------------------------------------------- payouts

// Records a finished Monday–Sunday week as settled. The amounts are worked out here from
// the delivered orders, never taken from the browser.
export async function markPayoutPaid(input: { restaurantId: string; weekStart: string }): Promise<AdminResult> {
  const admin = await requireAdmin();
  const restaurantId = String(input?.restaurantId);
  const weekStart = String(input?.weekStart);
  if (!isUuid(restaurantId) || !DATE_PATTERN.test(weekStart) || mondayOfKey(weekStart) !== weekStart) {
    return { error: "That week isn't valid." };
  }
  if (addDaysToKey(weekStart, 6) >= todayKeyIST()) return { error: "That week isn't over yet." };

  const supabase = await createClient();
  const [{ data: priv }, { data: orders, error: ordersError }] = await Promise.all([
    supabase.from("restaurant_private").select("commission_percent").eq("restaurant_id", restaurantId).maybeSingle(),
    supabase
      .from("orders")
      .select("total")
      .eq("restaurant_id", restaurantId)
      .eq("status", "delivered")
      .gte("placed_at", istDayStart(weekStart))
      .lt("placed_at", istDayStart(addDaysToKey(weekStart, 7)))
      .limit(20000),
  ]);
  if (ordersError) return { error: "Could not work out the amount. Please try again." };

  const gross = (orders ?? []).reduce((sum, row) => sum + Number(row.total), 0);
  const week = settleWeek(gross, Number(priv?.commission_percent ?? 8), weekStart);

  const { error } = await supabase.from("restaurant_payouts").insert({
    restaurant_id: restaurantId,
    week_start: week.weekStart,
    week_end: week.weekEnd,
    gross: week.gross,
    commission_percent: week.commissionPercent,
    commission: week.commission,
    net: week.net,
    paid_by: admin.id,
  });
  if (error) {
    if (error.code === "23505") return { error: "This week is already marked as paid." };
    return { error: "Could not save. Please try again." };
  }

  revalidatePath(`/admin/restaurants/${restaurantId}`);
  return {};
}
*/
