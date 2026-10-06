import { formatPrice } from "@/lib/utils/format";

// The database function reports problems with short codes (see 0005_place_order.sql).
// This turns them into messages a customer can act on.
export function orderErrorMessage(code: string, detail?: string | null): string {
  switch (code) {
    case "not_authenticated":
      return "Please log in again to place your order.";
    case "invalid_items":
      return "Something is wrong with your cart. Please review it and try again.";
    case "invalid_address":
      return "Please choose a delivery address.";
    case "phone_required":
      return "We need a mobile number so the restaurant can reach you. Add one to your account or to this address.";
    case "name_required":
      return "Please add your name in My account first.";
    case "restaurant_unavailable":
      return "This restaurant isn't available right now.";
    case "restaurant_paused":
      return "This restaurant has paused orders for the moment. Please try again soon.";
    case "restaurant_closed":
      return "This restaurant is closed right now.";
    case "item_unavailable":
      return `${detail ?? "An item"} is no longer available. We've updated your cart.`;
    case "below_minimum":
      return detail
        ? `This restaurant's minimum order is ${formatPrice(Number(detail))}.`
        : "Your order is below the restaurant's minimum.";
    case "price_changed":
      return "Prices changed while you were ordering. We've updated your cart, so please check the new total.";
    case "too_many_orders":
      return "You've placed several orders in the last few minutes. Please wait a little before ordering again.";
    case "account_blocked":
      return "This account can't place orders right now. Please contact PaliaEats if you think this is a mistake.";
    case "notes_too_long":
      return "Your note is too long. Please keep it under 300 characters.";
    default:
      return "We couldn't place your order. Please try again.";
  }
}

// After these errors the cart is probably out of date, so the page should refresh it.
export const REFRESH_CART_CODES = ["item_unavailable", "price_changed", "below_minimum"];
