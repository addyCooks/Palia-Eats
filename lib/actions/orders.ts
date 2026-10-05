"use server";

import { after } from "next/server";
import { getCurrentUser, getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { sendOrderPlacedEmails } from "@/lib/email/order-emails";
import { isUuid } from "@/lib/validation/menu";
import { REFRESH_CART_CODES, orderErrorMessage } from "@/lib/orders/errors";

export type PlaceOrderInput = {
  restaurantId: string;
  items: { id: string; quantity: number }[];
  addressId: string;
  notes: string;
  expectedTotal: number;
};

export type PlaceOrderResult =
  | { orderId: string }
  | { error: string; refreshCart?: boolean };

// Hands the order to the database function place_order(), which re-checks prices,
// availability, hours and totals. This file only validates the shape of the request.
export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  const profile = await getProfile();
  if (!profile) return { error: orderErrorMessage("not_authenticated") };

  const validItems =
    Array.isArray(input?.items) &&
    input.items.length > 0 &&
    input.items.length <= 50 &&
    input.items.every(
      (item) =>
        isUuid(String(item?.id)) &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= 20,
    );

  if (
    !validItems ||
    !isUuid(String(input.restaurantId)) ||
    !isUuid(String(input.addressId)) ||
    typeof input.expectedTotal !== "number" ||
    !Number.isFinite(input.expectedTotal)
  ) {
    return { error: orderErrorMessage("invalid_items") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_restaurant_id: input.restaurantId,
    p_items: input.items.map((item) => ({ id: item.id, quantity: item.quantity })),
    p_address_id: input.addressId,
    p_notes: String(input.notes ?? "").slice(0, 400) || null,
    p_expected_total: Math.round(input.expectedTotal * 100) / 100,
  });

  if (error || !data) {
    return {
      error: orderErrorMessage(error?.message ?? "", error?.details),
      refreshCart: REFRESH_CART_CODES.includes(error?.message ?? ""),
    };
  }

  // Tell the restaurant (and confirm to the customer) AFTER the response is sent, so
  // email trouble can never slow down or break placing an order.
  const user = await getCurrentUser();
  const orderId = data as string;
  after(() => sendOrderPlacedEmails(orderId, user?.email ?? null));

  return { orderId };
}
