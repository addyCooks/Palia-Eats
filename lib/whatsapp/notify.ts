import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { alreadySent, logNotification } from "@/lib/notifications/log";
import { sendWhatsApp, type SendResult } from "@/lib/whatsapp/client";
import { whatsappConfig } from "@/lib/whatsapp/config";
import { toWhatsAppNumber } from "@/lib/whatsapp/phone";
import { isWindowOpen } from "@/lib/whatsapp/sessions";
import { formatPrice } from "@/lib/utils/format";

type Kind = { type: "placed" } | { type: "status"; status: string };

const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Short phrase used inside the pre-approved template ("... from Blue Cafe: <phrase>").
const STATUS_PHRASE: Record<string, string> = {
  preparing: "is being cooked",
  out_for_delivery: "is on its way",
  delivered: "was delivered",
  cancelled: "was cancelled",
};

const RETRY_DELAYS_MS = [0, 3_000]; // up to 2 attempts

// Tells the customer about their order on WhatsApp. Never throws.
//  - Orders placed through the WhatsApp bot: yes, unless they replied STOP.
//  - Website orders: only if the customer ticked "send updates on WhatsApp".
//  - Customer names/wording use the RESTAURANT's name, not PaliaEats.
export async function sendWhatsAppOrderUpdate(orderId: string, kind: Kind): Promise<void> {
  try {
    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("*, restaurants(name)")
      .eq("id", orderId)
      .maybeSingle();
    if (!order) return;

    const { data: profile } = await admin
      .from("profiles")
      .select("whatsapp_phone, whatsapp_opt_in")
      .eq("id", order.customer_id)
      .maybeSingle();

    const isBotOrder = order.channel === "whatsapp";
    // The bot already confirmed a WhatsApp order in the chat itself.
    if (kind.type === "placed" && isBotOrder) return;

    // Both kinds need consent: bot customers are opted in when they first message us, and
    // can switch updates off by replying STOP.
    const to = !profile?.whatsapp_opt_in
      ? null
      : isBotOrder
        ? profile.whatsapp_phone
        : toWhatsAppNumber(order.customer_phone);
    if (!to) return; // not a WhatsApp customer, or no consent

    const restaurantName =
      (Array.isArray(order.restaurants) ? order.restaurants[0]?.name : order.restaurants?.name) ??
      "the restaurant";
    const number = order.order_number;
    const link = `${siteUrl()}/orders/${order.id}`;
    const reason = order.rejection_reason ? ` Reason: ${order.rejection_reason}.` : "";

    let text: string;
    let phrase: string;
    let event: string;
    if (kind.type === "placed") {
      event = "wa_placed";
      phrase = "was placed";
      text =
        `Order #${number} placed with ${restaurantName}.\n` +
        `Total ${formatPrice(order.total)}, cash on delivery.\nTrack it: ${link}\n\n${restaurantName}`;
    } else {
      const p = STATUS_PHRASE[kind.status];
      if (!p) return;
      event = `wa_status_${kind.status}`;
      phrase = p;
      const lines: Record<string, string> = {
        preparing: `${restaurantName} has started cooking your order #${number}.`,
        out_for_delivery: `Your order #${number} from ${restaurantName} is on its way. Please keep ${formatPrice(order.total)} in cash ready.`,
        delivered: `Your order #${number} from ${restaurantName} was delivered. Enjoy your meal!`,
        cancelled: `Sorry, ${restaurantName} had to cancel your order #${number}.${reason}`,
      };
      text = `${lines[kind.status]}\n\n${restaurantName}`;
    }

    if (await alreadySent(order.id, "whatsapp", "customer", event)) return;

    const config = whatsappConfig();
    const windowOpen = await isWindowOpen(to);

    let result: SendResult = { ok: false, error: "not attempted" };
    let attempts = 0;
    for (const delay of RETRY_DELAYS_MS) {
      if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
      attempts++;

      if (windowOpen) {
        result = await sendWhatsApp(to, { type: "text", body: text });
      } else if (config.templateName) {
        result = await sendWhatsApp(to, {
          type: "template",
          name: config.templateName,
          language: config.templateLanguage,
          params: [String(number), restaurantName, `${phrase}.${kind.type === "status" && kind.status === "cancelled" ? reason : ""}`.trim()],
        });
      } else {
        // Outside the 24-hour window we can only use an approved template.
        await logNotification({
          orderId: order.id,
          channel: "whatsapp",
          recipientType: "customer",
          event,
          recipient: to,
          status: "skipped",
          error: "Customer is outside the 24-hour window and no message template is configured",
        });
        return;
      }

      if (result.ok || result.error === "WhatsApp is not configured") break;
    }

    await logNotification({
      orderId: order.id,
      channel: "whatsapp",
      recipientType: "customer",
      event,
      recipient: to,
      status: result.ok ? "sent" : "failed",
      error: result.ok ? undefined : result.error,
      attempts,
    });
  } catch (error) {
    console.error("[whatsapp] Could not send order update:", error instanceof Error ? error.message : error);
  }
}
