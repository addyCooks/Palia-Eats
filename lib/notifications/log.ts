import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

export type NotificationEntry = {
  orderId: string;
  channel: "email" | "whatsapp";
  recipientType: "restaurant" | "customer";
  event: string;
  recipient: string | null;
  status: "sent" | "failed" | "skipped";
  error?: string;
  attempts?: number;
};

// Records one send attempt in notification_log so the admin can see what was sent and
// what failed. Never throws: logging must not break an order.
export async function logNotification(entry: NotificationEntry): Promise<void> {
  try {
    const { error } = await createAdminClient().from("notification_log").insert({
      order_id: entry.orderId,
      channel: entry.channel,
      recipient_type: entry.recipientType,
      event: entry.event,
      recipient: entry.recipient,
      status: entry.status,
      error: entry.error?.slice(0, 500) ?? null,
      attempts: entry.attempts ?? 1,
    });
    // 23505 = this message was already sent successfully once; that's the safety net working.
    if (error && error.code !== "23505") {
      console.error("[notifications] Could not write log:", error.message);
    }
  } catch (error) {
    console.error("[notifications] Could not write log:", error instanceof Error ? error.message : error);
  }
}

// Has this exact message already been delivered? (Stops duplicates when something retries.)
export async function alreadySent(
  orderId: string,
  channel: "email" | "whatsapp",
  recipientType: "restaurant" | "customer",
  event: string,
): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("notification_log")
    .select("id")
    .eq("order_id", orderId)
    .eq("channel", channel)
    .eq("recipient_type", recipientType)
    .eq("event", event)
    .eq("status", "sent")
    .limit(1);
  return Boolean(data?.length);
}
