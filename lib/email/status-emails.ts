import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPanelToken } from "@/lib/panel/token";
import { button, deliver, escapeHtml, siteUrl } from "@/lib/email/shared";
import { formatPrice } from "@/lib/utils/format";

type RestaurantRow = {
  id: string;
  name: string;
  restaurant_private: { notification_email: string | null } | { notification_email: string | null }[] | null;
};

function notificationEmail(restaurant: RestaurantRow | null): string | null {
  const row = Array.isArray(restaurant?.restaurant_private)
    ? restaurant?.restaurant_private[0]
    : restaurant?.restaurant_private;
  return row?.notification_email ?? null;
}

async function loadOrder(orderId: string) {
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("*, restaurants(id, name, restaurant_private(notification_email))")
    .eq("id", orderId)
    .maybeSingle();
  return order;
}

// What the customer is told for each status.
const CUSTOMER_COPY: Record<string, { subject: string; heading: string; line: string }> = {
  preparing: {
    subject: "is being prepared",
    heading: "Your food is being cooked",
    line: "The restaurant has started preparing your order.",
  },
  out_for_delivery: {
    subject: "is on its way",
    heading: "Your order is on its way",
    line: "Your order is out for delivery. Keep the cash ready.",
  },
  delivered: {
    subject: "was delivered",
    heading: "Your order was delivered",
    line: "Your order has been delivered. Enjoy your meal!",
  },
  cancelled: {
    subject: "was cancelled",
    heading: "Your order was cancelled",
    line: "Sorry, your order could not be completed.",
  },
};

// Emails the customer when their order moves to a new status (and tells the restaurant
// if an admin cancelled one of its orders). Never throws.
export async function sendOrderStatusEmails(orderId: string, status: string) {
  try {
    const copy = CUSTOMER_COPY[status];
    if (!copy) return;

    const order = await loadOrder(orderId);
    if (!order) return;
    const restaurant = order.restaurants as RestaurantRow | null;
    const restaurantName = restaurant?.name ?? "the restaurant";
    const orderLink = `${siteUrl()}/orders/${order.id}`;
    const reason = status === "cancelled" ? order.rejection_reason : null;

    // ---- Customer ----
    const { data: userData } = await createAdminClient().auth.admin.getUserById(order.customer_id);
    const customerEmail = userData?.user?.email ?? null;
    // WhatsApp customers have no real email (they are told on WhatsApp instead).
    if (customerEmail && order.channel !== "whatsapp") {
      await deliver(order.id, "customer", `status_${status}`, {
        to: customerEmail,
        subject: `Your order #${order.order_number} from ${restaurantName} ${copy.subject}`,
        text:
          `Hi ${order.customer_name},\n\n${copy.heading}.\n${copy.line}\n` +
          (reason ? `\nReason: ${reason}\n` : "") +
          (status === "cancelled" ? "" : `\nTotal: ${formatPrice(order.total)} (cash on delivery)\n`) +
          `\nOrder #${order.order_number} from ${restaurantName}.\nView it here: ${orderLink}\n\nRegards,\n${restaurantName}\n`,
        html:
          `<div style="font-family:Arial,sans-serif;max-width:480px">` +
          `<h2 style="margin:0 0 8px">${escapeHtml(copy.heading)}</h2>` +
          `<p>Hi ${escapeHtml(order.customer_name)}, ${escapeHtml(copy.line)}</p>` +
          (reason
            ? `<p style="background:#fef2f2;padding:8px;border-radius:8px"><strong>Reason:</strong> ${escapeHtml(reason)}</p>`
            : "") +
          `<p style="color:#666">Order #${order.order_number} from ${escapeHtml(restaurantName)}` +
          (status === "cancelled" ? "" : ` · ${formatPrice(order.total)} cash on delivery`) +
          `</p>` +
          button(orderLink, "View your order") +
          `<p style="color:#444">Regards,<br>${escapeHtml(restaurantName)}</p>` +
          `</div>`,
      });
    }

    // ---- Restaurant: only when PaliaEats (admin) cancelled, since the restaurant
    // already knows when it cancelled an order itself. ----
    const toRestaurant = notificationEmail(restaurant);
    if (status === "cancelled" && order.cancelled_by === "admin" && restaurant && toRestaurant) {
      await deliver(order.id, "restaurant", "order_cancelled_by_admin", {
        to: toRestaurant,
        subject: `Order #${order.order_number} was cancelled by PaliaEats`,
        text:
          `Order #${order.order_number} has been cancelled by PaliaEats.\n` +
          (reason ? `Reason: ${reason}\n` : "") +
          `\nPlease don't prepare or deliver it.\n`,
        html:
          `<div style="font-family:Arial,sans-serif;max-width:480px">` +
          `<h2 style="margin:0 0 8px">Order #${order.order_number} was cancelled</h2>` +
          `<p>PaliaEats cancelled this order. Please don't prepare or deliver it.</p>` +
          (reason
            ? `<p style="background:#fef2f2;padding:8px;border-radius:8px"><strong>Reason:</strong> ${escapeHtml(reason)}</p>`
            : "") +
          `</div>`,
      });
    }
  } catch (error) {
    console.error("[email] Could not send status emails:", error instanceof Error ? error.message : error);
  }
}

// Reminder to the restaurant when an order has sat unanswered at "Order placed".
// Sent at most once per order (the log blocks repeats). Never throws.
export async function sendPendingReminder(orderId: string): Promise<boolean> {
  try {
    const order = await loadOrder(orderId);
    if (!order || order.status !== "pending") return false;
    const restaurant = order.restaurants as RestaurantRow | null;
    const to = notificationEmail(restaurant);
    if (!restaurant || !to) return false;

    const minutes = Math.max(1, Math.round((Date.now() - new Date(order.placed_at).getTime()) / 60_000));
    const panelLink = `${siteUrl()}/panel/enter/${createPanelToken(restaurant.id, new Date(), 30)}`;

    await deliver(order.id, "restaurant", "pending_reminder", {
      to,
      subject: `Reminder: order #${order.order_number} is still waiting`,
      text:
        `Order #${order.order_number} (${formatPrice(order.total)}) was placed ${minutes} minutes ago ` +
        `and hasn't been started yet.\n\nOpen your orders panel: ${panelLink}\n`,
      html:
        `<div style="font-family:Arial,sans-serif;max-width:480px">` +
        `<h2 style="margin:0 0 8px">Order #${order.order_number} is still waiting</h2>` +
        `<p>It was placed ${minutes} minutes ago (${formatPrice(order.total)}) and hasn't been started yet. ` +
        `The customer is waiting.</p>` +
        button(panelLink, "Open your orders panel") +
        `</div>`,
    });
    return true;
  } catch (error) {
    console.error("[email] Could not send reminder:", error instanceof Error ? error.message : error);
    return false;
  }
}
