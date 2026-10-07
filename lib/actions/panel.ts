"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPanelRestaurant } from "@/lib/panel/session";
import { isUuid } from "@/lib/validation/menu";
import { handleOrderEvent } from "@/lib/orders/events";
import { MAX_REASON_LENGTH } from "@/lib/orders/cancel-reasons";
import { parseClosedDays } from "@/lib/validation/restaurant";
import { emailRestaurantReady } from "@/lib/email/application-emails";

export type PanelActionResult = { error?: string };

const SESSION_EXPIRED = "Your session has expired. Please open the link from your email again.";

// What the restaurant is allowed to set. (The database also checks that an order only
// moves forward: placed -> cooking -> out for delivery -> delivered, or cancelled.)
const SETTABLE_STATUSES = ["preparing", "out_for_delivery", "delivered", "cancelled"] as const;
type SettableStatus = (typeof SETTABLE_STATUSES)[number];

// Everything below runs with the service-role client (the restaurant has no account),
// so EVERY query is limited to the restaurant found from the signed panel link.

export async function setAcceptingOrders(accepting: boolean): Promise<PanelActionResult> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: SESSION_EXPIRED };

  const admin = createAdminClient();
  const { error } = await admin
    .from("restaurants")
    .update({ is_accepting_orders: Boolean(accepting) })
    .eq("id", restaurant.id);
  if (error) return { error: "Could not change this. Please try again." };

  revalidatePath("/panel", "layout");
  revalidatePath(`/restaurants/${restaurant.slug}`);
  revalidatePath("/");
  return {};
}

export async function updateOrderStatus(input: {
  orderId: string;
  status: string;
  reason?: string;
}): Promise<PanelActionResult> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: SESSION_EXPIRED };

  if (!isUuid(String(input?.orderId)) || !SETTABLE_STATUSES.includes(input.status as SettableStatus)) {
    return { error: "That change isn't allowed." };
  }

  const status = input.status as SettableStatus;
  const reason = status === "cancelled" ? String(input.reason ?? "").trim().slice(0, MAX_REASON_LENGTH) || null : null;

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("orders")
    .update({ status, rejection_reason: reason, cancelled_by: status === "cancelled" ? "restaurant" : null })
    .eq("id", input.orderId)
    .eq("restaurant_id", restaurant.id)
    .select("id");

  if (error) {
    // Raised by the database rule that stops orders going backwards.
    if (error.message.includes("Invalid order status change")) {
      return { error: "This order has already moved on. The list has been refreshed." };
    }
    return { error: "Could not update the order. Please try again." };
  }
  if (!data?.length) return { error: "Order not found." };

  after(() => handleOrderEvent({ type: "status_changed", orderId: input.orderId, status }));
  revalidatePath("/panel");
  return {};
}

export async function setPanelItemAvailability(input: {
  itemId: string;
  available: boolean;
}): Promise<PanelActionResult> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: SESSION_EXPIRED };
  if (!isUuid(String(input?.itemId))) return { error: "Missing item." };

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("menu_items")
    .update({ is_available: Boolean(input.available) })
    .eq("id", input.itemId)
    .eq("restaurant_id", restaurant.id)
    .select("id");
  if (error || !data?.length) return { error: "Could not update the item." };

  revalidatePath("/panel/menu");
  revalidatePath(`/restaurants/${restaurant.slug}`);
  return {};
}

export type PanelHoursState = { error?: string; saved?: boolean } | undefined;

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

// The restaurant sets its own opening hours and days off. (Delivery fee and minimum
// order stay with PaliaEats.) Leave both times empty for "open all day".
export async function updatePanelHours(
  _prev: PanelHoursState,
  formData: FormData,
): Promise<PanelHoursState> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: SESSION_EXPIRED };

  const opening = String(formData.get("opening_time") ?? "").trim();
  const closing = String(formData.get("closing_time") ?? "").trim();
  if ((opening && !TIME_PATTERN.test(opening)) || (closing && !TIME_PATTERN.test(closing))) {
    return { error: "Please enter valid times." };
  }
  if (Boolean(opening) !== Boolean(closing)) {
    return { error: "Set both the opening and closing time, or leave both empty." };
  }

  const { error } = await createAdminClient()
    .from("restaurants")
    .update({
      opening_time: opening || null,
      closing_time: closing || null,
      closed_days: parseClosedDays(formData),
    })
    .eq("id", restaurant.id);
  if (error) return { error: "Could not save. Please try again." };

  revalidatePath("/panel", "layout");
  revalidatePath(`/restaurants/${restaurant.slug}`);
  revalidatePath("/");
  return { saved: true };
}

// A newly approved restaurant (still hidden while setting up) tells the admin its menu
// is ready to go on the website. The admin then makes it visible.
export async function panelReadyToGoLive(): Promise<PanelActionResult> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: SESSION_EXPIRED };
  if (!restaurant.setting_up) return {};

  const admin = createAdminClient();
  const { count } = await admin
    .from("menu_items")
    .select("id", { count: "exact", head: true })
    .eq("restaurant_id", restaurant.id);
  if (!count) return { error: "Add at least one dish to your menu first." };

  after(() => emailRestaurantReady({ id: restaurant.id, name: restaurant.name, dishes: count }));
  return {};
}
