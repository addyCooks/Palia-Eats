import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPanelToken } from "@/lib/panel/token";
import { logNotification } from "@/lib/notifications/log";
import { deliver, escapeHtml, siteUrl } from "@/lib/email/shared";
import { emailButton, emailDetails, emailItems, emailLayout, emailNote, emailParagraph, emailSmall } from "@/lib/email/layout";
import { formatDateTime, formatPrice } from "@/lib/utils/format";
import { addressPin, mapsLink } from "@/lib/utils/maps";
import type { OrderItem } from "@/types/app";

// Called right after an order is placed. Sends the restaurant its new-order email
// (with a link into its panel) and the customer a confirmation. Never throws.
export async function sendOrderPlacedEmails(orderId: string, customerEmail: string | null) {
  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("*, order_items(*), restaurants(id, name, slug, restaurant_private(notification_email))")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;

    const restaurant = order.restaurants;
    const privateRow = Array.isArray(restaurant?.restaurant_private)
      ? restaurant.restaurant_private[0]
      : restaurant?.restaurant_private;
    const items = order.order_items as OrderItem[];
    const address = order.delivery_address as {
      label: string;
      address_line: string;
      landmark: string | null;
      lat?: number | null;
      lng?: number | null;
    };
    const pin = addressPin(address);
    const placedAt = formatDateTime(order.placed_at);

    // ---- Email to the restaurant ----
    if (restaurant && privateRow?.notification_email) {
      const panelLink = `${siteUrl()}/panel/enter/${createPanelToken(restaurant.id, new Date(), 30)}`;
      const notes = order.customer_notes ? `\nNote: ${order.customer_notes}` : "";

      await deliver(order.id, "restaurant", "order_placed", {
        to: privateRow.notification_email,
        subject: `New order #${order.order_number} · ${formatPrice(order.total)}`,
        text:
          `New order #${order.order_number} (${placedAt})\n\n` +
          items.map((i) => `${i.quantity} x ${i.item_name}  ${formatPrice(i.line_total)}`).join("\n") +
          `\n\nTotal: ${formatPrice(order.total)} (cash on delivery)${notes}\n\n` +
          `Customer: ${order.customer_name}, ${order.customer_phone}\n` +
          `Address: ${address.address_line}${address.landmark ? `\nLandmark: ${address.landmark}` : ""}\n` +
          (pin ? `Location pin: ${mapsLink(pin.lat, pin.lng)}\n` : "") +
          `\nOpen your orders panel: ${panelLink}\n`,
        html: emailLayout({
          preheader: `New order #${order.order_number}, ${formatPrice(order.total)}. Open your panel to accept it.`,
          kicker: `New order · ${placedAt}`,
          title: `Order #${order.order_number} for ${restaurant.name}`,
          content:
            emailItems(items, formatPrice(order.total), "Total · cash on delivery") +
            (order.customer_notes ? emailNote("Note:", order.customer_notes) : "") +
            emailDetails([
              ["Customer", order.customer_name],
              ["Phone", order.customer_phone],
              ["Address", `${address.address_line}${address.landmark ? `\nLandmark: ${address.landmark}` : ""}`],
            ]) +
            (pin
              ? emailParagraph(
                  `&#128205; <a href="${mapsLink(pin.lat, pin.lng)}" style="color:#C2410C;font-weight:600">Open the customer's location in Google Maps</a>`,
                )
              : "") +
            emailButton(panelLink, "Open your orders panel") +
            emailSmall("This button is private. Anyone with it can manage your orders."),
        }),
      });
    } else {
      console.error(`[email] No notification email set for the restaurant of order ${orderId}.`);
      await logNotification({
        orderId: order.id,
        channel: "email",
        recipientType: "restaurant",
        event: "order_placed",
        recipient: null,
        status: "skipped",
        error: "Restaurant has no notification email",
      });
    }

    // ---- Confirmation to the customer ----
    if (customerEmail) {
      const orderLink = `${siteUrl()}/orders/${order.id}`;
      await deliver(order.id, "customer", "order_placed", {
        to: customerEmail,
        subject: `Your order from ${restaurant?.name ?? "the restaurant"} is placed (#${order.order_number})`,
        text:
          `Hi ${order.customer_name},\n\nYour order #${order.order_number} from ${restaurant?.name ?? "the restaurant"} has been placed.\n\n` +
          items.map((i) => `${i.quantity} x ${i.item_name}  ${formatPrice(i.line_total)}`).join("\n") +
          `\n\nTotal: ${formatPrice(order.total)} - pay in cash on delivery.\n\nTrack it here: ${orderLink}\n\nRegards,\n${restaurant?.name ?? "the restaurant"}\n`,
        html: emailLayout({
          brand: restaurant?.name ?? "Your order",
          preheader: `Order placed! ${restaurant?.name ?? "The restaurant"} has your order #${order.order_number}.`,
          kicker: `Order #${order.order_number} · Placed`,
          title: "Your kind of delicious, coming right up",
          content:
            emailParagraph(
              `Hi ${escapeHtml(order.customer_name)}, ${escapeHtml(restaurant?.name ?? "the restaurant")} has your order and will start cooking in a minute.`,
            ) +
            emailItems(items, formatPrice(order.total), "To pay · cash or UPI on delivery") +
            emailButton(orderLink, "Track your order") +
            emailSmall(`Regards,<br>${escapeHtml(restaurant?.name ?? "the restaurant")}`),
          footer: `${restaurant?.name ?? "Your restaurant"} · ordered on PaliaEats`,
        }),
      });
    }
  } catch (error) {
    console.error("[email] Could not prepare order emails:", error instanceof Error ? error.message : error);
  }
}
