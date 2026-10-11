"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/menu";
import { getT } from "@/lib/i18n/server";

// A customer rates a delivered order once (1–5 stars, optional note). The database only
// accepts it for their own delivered order, and only once (see 0012_v2_features.sql).
export async function rateOrder(input: { orderId: string; stars: number; comment?: string }): Promise<{ error?: string }> {
  const t = await getT();
  const profile = await getProfile();
  if (!profile) return { error: t("rate.err.login") };

  const orderId = String(input?.orderId);
  const stars = Number(input?.stars);
  if (!isUuid(orderId) || !Number.isInteger(stars) || stars < 1 || stars > 5) {
    return { error: t("rate.err.choose") };
  }
  const comment = String(input?.comment ?? "").trim().slice(0, 300) || null;

  const supabase = await createClient();
  const { data: order } = await supabase.from("orders").select("restaurant_id, restaurants(slug)").eq("id", orderId).maybeSingle();
  if (!order) return { error: t("rate.err.not_found") };

  const { error } = await supabase.from("order_ratings").insert({
    order_id: orderId,
    customer_id: profile.id,
    restaurant_id: order.restaurant_id,
    stars,
    comment,
  });
  if (error) {
    if (error.code === "23505") return { error: t("rate.err.already") };
    return { error: t("rate.err.not_delivered") };
  }

  const restaurant = Array.isArray(order.restaurants) ? order.restaurants[0] : order.restaurants;
  revalidatePath(`/orders/${orderId}`);
  revalidatePath("/orders");
  if (restaurant?.slug) revalidatePath(`/restaurants/${restaurant.slug}`);
  revalidatePath("/");
  return {};
}
