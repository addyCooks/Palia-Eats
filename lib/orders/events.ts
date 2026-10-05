import "server-only";
import { sendOrderPlacedEmails } from "@/lib/email/order-emails";
import { sendOrderStatusEmails } from "@/lib/email/status-emails";
import { sendWhatsAppOrderUpdate } from "@/lib/whatsapp/notify";

// The ONE place that reacts to things happening to an order. Every code path that
// places or changes an order (website, restaurant panel, admin, later WhatsApp) calls
// this, so notifications can't be forgotten in one path.
//
// Callers run it inside after() so a slow email never delays the response.
export type OrderEvent =
  | { type: "placed"; orderId: string; customerEmail: string | null }
  | { type: "status_changed"; orderId: string; status: string };

export async function handleOrderEvent(event: OrderEvent): Promise<void> {
  try {
    switch (event.type) {
      // Email and WhatsApp go out side by side; neither can hold up or break the other.
      case "placed":
        await Promise.allSettled([
          sendOrderPlacedEmails(event.orderId, event.customerEmail),
          sendWhatsAppOrderUpdate(event.orderId, { type: "placed" }),
        ]);
        break;
      case "status_changed":
        await Promise.allSettled([
          sendOrderStatusEmails(event.orderId, event.status),
          sendWhatsAppOrderUpdate(event.orderId, { type: "status", status: event.status }),
        ]);
        break;
    }
  } catch (error) {
    console.error("[orders] Event handler failed:", error instanceof Error ? error.message : error);
  }
}
