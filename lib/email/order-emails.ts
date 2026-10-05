import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPanelToken } from "@/lib/panel/token";
import { sendEmail } from "@/lib/email/mailer";
import { logNotification } from "@/lib/notifications/log";
import { formatDateTime, formatPrice } from "@/lib/utils/format";
import type { OrderItem } from "@/types/app";

// Customer-supplied text (name, notes, address) goes into HTML emails, so escape it.
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function itemRowsHtml(items: OrderItem[]): string {
  return items
    .map(
      (item) =>
        `<tr><td style="padding:4px 0">${item.quantity} × ${escapeHtml(item.item_name)}</td>` +
        `<td style="padding:4px 0;text-align:right">${formatPrice(item.line_total)}</td></tr>`,
    )
    .join("");
}

function button(href: string, label: string): string {
  return `<p><a href="${href}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${label}</a></p>`;
}

// Sends one email and records the outcome in notification_log.
async function deliver(
  orderId: string,
  recipientType: "restaurant" | "customer",
  event: string,
  email: Parameters<typeof sendEmail>[0],
) {
  const result = await sendEmail(email);
  await logNotification({
    orderId,
    channel: "email",
    recipientType,
    event,
    recipient: email.to,
    status: result.ok ? "sent" : "failed",
    error: result.ok ? undefined : result.error,
  });
}

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
    };
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
          `Address: ${address.address_line}${address.landmark ? `\nLandmark: ${address.landmark}` : ""}\n\n` +
          `Open your orders panel: ${panelLink}\n`,
        html:
          `<div style="font-family:Arial,sans-serif;max-width:480px">` +
          `<h2 style="margin:0 0 4px">New order #${order.order_number}</h2>` +
          `<p style="color:#666;margin:0 0 16px">${escapeHtml(placedAt)}</p>` +
          `<table style="width:100%;border-collapse:collapse;border-top:1px solid #ddd;border-bottom:1px solid #ddd">${itemRowsHtml(items)}</table>` +
          `<p style="font-size:18px"><strong>Total ${formatPrice(order.total)}</strong> · cash on delivery</p>` +
          (order.customer_notes
            ? `<p style="background:#fffbeb;padding:8px;border-radius:8px"><strong>Note:</strong> ${escapeHtml(order.customer_notes)}</p>`
            : "") +
          `<p><strong>${escapeHtml(order.customer_name)}</strong><br>${escapeHtml(order.customer_phone)}<br>` +
          `${escapeHtml(address.address_line)}${address.landmark ? `<br>Landmark: ${escapeHtml(address.landmark)}` : ""}</p>` +
          button(panelLink, "Open your orders panel") +
          `<p style="color:#888;font-size:12px">This link is private. Anyone with it can manage your orders.</p></div>`,
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
        subject: `Your order from ${restaurant?.name ?? "PaliaEats"} is placed (#${order.order_number})`,
        text:
          `Hi ${order.customer_name},\n\nYour order #${order.order_number} from ${restaurant?.name ?? "the restaurant"} has been placed.\n\n` +
          items.map((i) => `${i.quantity} x ${i.item_name}  ${formatPrice(i.line_total)}`).join("\n") +
          `\n\nTotal: ${formatPrice(order.total)} - pay in cash on delivery.\n\nTrack it here: ${orderLink}\n`,
        html:
          `<div style="font-family:Arial,sans-serif;max-width:480px">` +
          `<h2 style="margin:0 0 8px">Order placed!</h2>` +
          `<p>Hi ${escapeHtml(order.customer_name)}, ${escapeHtml(restaurant?.name ?? "the restaurant")} has your order <strong>#${order.order_number}</strong>.</p>` +
          `<table style="width:100%;border-collapse:collapse;border-top:1px solid #ddd;border-bottom:1px solid #ddd">${itemRowsHtml(items)}</table>` +
          `<p style="font-size:18px"><strong>Total ${formatPrice(order.total)}</strong><br><span style="font-size:14px;color:#666">Pay in cash on delivery</span></p>` +
          button(orderLink, "Track your order") +
          `</div>`,
      });
    }
  } catch (error) {
    console.error("[email] Could not prepare order emails:", error instanceof Error ? error.message : error);
  }
}
