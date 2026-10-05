import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/mailer";
import { logNotification } from "@/lib/notifications/log";
import { formatPrice } from "@/lib/utils/format";
import type { OrderItem } from "@/types/app";

// Customer-supplied text (name, notes, address, cancel reason) goes into HTML emails,
// so escape it.
export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

export function itemRowsHtml(items: OrderItem[]): string {
  return items
    .map(
      (item) =>
        `<tr><td style="padding:4px 0">${item.quantity} × ${escapeHtml(item.item_name)}</td>` +
        `<td style="padding:4px 0;text-align:right">${formatPrice(item.line_total)}</td></tr>`,
    )
    .join("");
}

export function button(href: string, label: string): string {
  return `<p><a href="${href}" style="display:inline-block;background:#ea580c;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:600">${label}</a></p>`;
}

const RETRY_DELAYS_MS = [0, 2_000, 6_000]; // up to 3 attempts
const NOT_CONFIGURED = "SMTP is not configured";
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Sends one email for an order event and records the outcome in notification_log.
//  - Skips if this exact message was already sent (so retries/duplicate triggers are harmless).
//  - Retries a failed send a couple of times before giving up.
export async function deliver(
  orderId: string,
  recipientType: "restaurant" | "customer",
  event: string,
  email: Parameters<typeof sendEmail>[0],
): Promise<void> {
  const { data: alreadySent } = await createAdminClient()
    .from("notification_log")
    .select("id")
    .eq("order_id", orderId)
    .eq("channel", "email")
    .eq("recipient_type", recipientType)
    .eq("event", event)
    .eq("status", "sent")
    .limit(1);
  if (alreadySent?.length) return;

  let result: Awaited<ReturnType<typeof sendEmail>> = { ok: false, error: "not attempted" };
  let attempts = 0;
  for (const delay of RETRY_DELAYS_MS) {
    if (delay) await sleep(delay);
    attempts++;
    result = await sendEmail(email);
    if (result.ok || result.error === NOT_CONFIGURED) break;
  }

  await logNotification({
    orderId,
    channel: "email",
    recipientType,
    event,
    recipient: email.to,
    status: result.ok ? "sent" : "failed",
    error: result.ok ? undefined : result.error,
    attempts,
  });
}
