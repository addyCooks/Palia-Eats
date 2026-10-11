import "server-only";
import webpush from "web-push";
import { createAdminClient } from "@/lib/supabase/admin";
import { makeT } from "@/lib/i18n/messages";
import { siteUrl } from "@/lib/email/shared";

// Web push: a notification on the customer's phone when their order moves along. Needs the
// VAPID keys (NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_SUBJECT); without them it
// does nothing and nothing else is affected.
function configure(): boolean {
  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) return false;
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || "mailto:paliaeats@gmail.com", publicKey, privateKey);
  return true;
}

type PushRow = { id: string; endpoint: string; p256dh: string; auth: string; lang: string };

async function sendTo(row: PushRow, payload: { title: string; body: string; url: string; tag: string }) {
  try {
    await webpush.sendNotification(
      { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
      JSON.stringify(payload),
      { TTL: 60 * 60, urgency: "high", timeout: 10_000 },
    );
  } catch (error) {
    const status = (error as { statusCode?: number }).statusCode;
    // 404/410: the phone no longer wants these (app removed, permission withdrawn): forget it.
    if (status === 404 || status === 410) {
      await createAdminClient().from("push_subscriptions").delete().eq("id", row.id);
    } else {
      console.error("[push] Could not send:", status ?? (error instanceof Error ? error.message : error));
    }
  }
}

// Tells the customer about their order's new status, in the language each phone was set up in.
// Never throws.
export async function sendOrderPush(orderId: string, status: string): Promise<void> {
  try {
    if (!["preparing", "out_for_delivery", "delivered", "cancelled"].includes(status)) return;
    if (!configure()) return;

    const admin = createAdminClient();
    const { data: order } = await admin
      .from("orders")
      .select("id, order_number, customer_id, rejection_reason, restaurants(name)")
      .eq("id", orderId)
      .maybeSingle();
    if (!order?.customer_id) return;

    const { data: rows } = await admin
      .from("push_subscriptions")
      .select("id, endpoint, p256dh, auth, lang")
      .eq("user_id", order.customer_id);
    if (!rows?.length) return;

    const restaurant = Array.isArray(order.restaurants) ? order.restaurants[0] : order.restaurants;
    const restaurantName = restaurant?.name ?? "PaliaEats";
    const url = `${siteUrl()}/orders/${order.id}`;

    await Promise.allSettled(
      (rows as PushRow[]).map((row) => {
        const t = makeT(row.lang === "hi" ? "hi" : "en");
        const vars = { restaurant: restaurantName, n: order.order_number };
        const body =
          status === "cancelled"
            ? order.rejection_reason
              ? t("push.msg.cancelled.body_reason", { n: order.order_number, reason: order.rejection_reason })
              : t("push.msg.cancelled.body", vars)
            : status === "preparing"
              ? t("push.msg.preparing.body", vars)
              : status === "out_for_delivery"
                ? t("push.msg.out_for_delivery.body", vars)
                : t("push.msg.delivered.body", vars);
        const title =
          status === "cancelled"
            ? t("push.msg.cancelled.title")
            : status === "preparing"
              ? t("push.msg.preparing.title")
              : status === "out_for_delivery"
                ? t("push.msg.out_for_delivery.title")
                : t("push.msg.delivered.title");
        return sendTo(row, { title, body, url, tag: `order-${order.order_number}` });
      }),
    );
  } catch (error) {
    console.error("[push] Order notification failed:", error instanceof Error ? error.message : error);
  }
}
