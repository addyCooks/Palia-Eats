import { formatPrice } from "@/lib/utils/format";
import { makeT, type T } from "@/lib/i18n/messages";

// The database function reports problems with short codes (see 0005_place_order.sql).
// This turns them into messages a customer can act on, in their language (English when no
// translator is given: the WhatsApp bot uses it that way).
export function orderErrorMessage(code: string, detail?: string | null, t: T = makeT("en")): string {
  switch (code) {
    case "not_authenticated":
      return t("err.not_authenticated");
    case "invalid_items":
      return t("err.invalid_items");
    case "invalid_address":
      return t("err.invalid_address");
    case "phone_required":
      return t("err.phone_required");
    case "name_required":
      return t("err.name_required");
    case "restaurant_unavailable":
      return t("err.restaurant_unavailable");
    case "restaurant_paused":
      return t("err.restaurant_paused");
    case "restaurant_closed":
      return t("err.restaurant_closed");
    case "item_unavailable":
      return t("err.item_unavailable", { item: detail ?? t("err.an_item") });
    case "below_minimum":
      return detail
        ? t("err.below_minimum", { amount: formatPrice(Number(detail)) })
        : t("err.below_minimum_generic");
    case "price_changed":
      return t("err.price_changed");
    case "too_many_orders":
      return t("err.too_many_orders");
    case "account_blocked":
      return t("err.account_blocked");
    case "notes_too_long":
      return t("err.notes_too_long");
    default:
      return t("err.default");
  }
}

// After these errors the cart is probably out of date, so the page should refresh it.
export const REFRESH_CART_CODES = ["item_unavailable", "price_changed", "below_minimum"];
