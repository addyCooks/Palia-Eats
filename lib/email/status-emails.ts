import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPanelToken } from "@/lib/panel/token";
import { button, deliver, escapeHtml, siteUrl } from "@/lib/email/shared";
import { emailButton, emailLayout, emailNote, emailParagraph, emailSmall } from "@/lib/email/layout";
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
const CUSTOMER_COPY: Record<string, { subject: string; kicker: string; heading: string; line: string; button: string }> = {
  preparing: {
    subject: "is cooking",
    kicker: "Cooking",
    heading: "Your order is cooking",
    line: "The kitchen has started on your food. We'll tell you the moment it leaves.",
    button: "Track your order",
  },
  out_for_delivery: {
    subject: "is on the way",
    kicker: "On the way",
    heading: "Your order is on the way",
    line: "Your food has left the kitchen and is heading to you now.",
    button: "Track your order",
  },
  delivered: {
    subject: "was delivered",
    kicker: "Delivered",
    heading: "Delivered. Enjoy your meal!",
    line: "Your order has arrived. We hope you love it.",
    button: "Rate your order",
  },
  cancelled: {
    subject: "was cancelled",
    kicker: "Cancelled",
    heading: "Your order was cancelled",
    line: "Sorry, your order could not be completed. Nothing was charged.",
    button: "View your order",
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
          `Hi ${order.customer_name},\n\n${copy.heading}${/[.!?]$/.test(copy.heading) ? "" : "."}\n${copy.line}\n` +
          (reason ? `\nReason: ${reason}\n` : "") +
          (status === "cancelled" || status === "delivered" ? "" : `\nTotal: ${formatPrice(order.total)} (cash or UPI on delivery)\n`) +
          `\nOrder #${order.order_number} from ${restaurantName}.\nView it here: ${orderLink}\n\nRegards,\n${restaurantName}\n`,
        html: emailLayout({
          brand: restaurantName,
          preheader: `${copy.heading} Order #${order.order_number}.`,
          kicker: `Order #${order.order_number} · ${copy.kicker}`,
          title: copy.heading,
          content:
            emailParagraph(`Hi ${escapeHtml(order.customer_name)}, ${escapeHtml(copy.line)}`) +
            (reason ? emailNote("Reason:", reason) : "") +
            (status === "cancelled" || status === "delivered"
              ? ""
              : emailParagraph(`Keep <b style="color:#16120D">${formatPrice(order.total)}</b> ready for the rider (cash or UPI).`)) +
            emailButton(orderLink, copy.button) +
            emailSmall(`Regards,<br>${escapeHtml(restaurantName)}`),
          footer: `${restaurantName} · ordered on PaliaEats`,
        }),
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
