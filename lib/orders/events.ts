import "server-only";
import { sendOrderPlacedEmails } from "@/lib/email/order-emails";

// The ONE place that reacts to things happening to an order. Every code path that
// places or changes an order (website, restaurant panel, admin, later WhatsApp) calls
// this, so notifications can't be forgotten in one path.
//
// Callers run it inside after() so a slow email never delays the response.
export type OrderEvent =
  | { type: "placed"; orderId: string; customerEmail: string | null }
  | { type: "status_changed"; orderId: string; status: string; reason: string | null };

export async function handleOrderEvent(event: OrderEvent): Promise<void> {
  try {
    switch (event.type) {
      case "placed":
        await sendOrderPlacedEmails(event.orderId, event.customerEmail);
        break;
      case "status_changed":
        // Customer status notifications are added in the next section.
        break;
    }
  } catch (error) {
    console.error("[orders] Event handler failed:", error instanceof Error ? error.message : error);
  }
}
