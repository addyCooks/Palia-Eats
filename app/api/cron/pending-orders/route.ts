import { after, NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron/auth";
import { sendPendingReminder } from "@/lib/email/status-emails";
import { handleOrderEvent } from "@/lib/orders/events";
import {
  AUTO_CANCEL_REASON,
  REMIND_AFTER_MINUTES,
  pendingAction,
} from "@/lib/orders/auto-cancel";

// Called by the database timer every minute (see 0019_cron_jobs.sql). Looks at orders that are
// still at "Order placed":
//   after 5 minutes  -> reminds the restaurant once (email)
//   after 15 minutes -> cancels the order and tells the customer (nobody answered)
//   over a day old   -> cancels quietly (old leftovers; nobody is emailed about those)
// Protected by the cron key (or CRON_SECRET).
export const dynamic = "force-dynamic";

async function run(request: NextRequest) {
  if (!(await isCronAuthorized(request, "pending_orders"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const now = Date.now();
  const { data: orders, error } = await admin
    .from("orders")
    .select("id, placed_at")
    .eq("status", "pending")
    .lt("placed_at", new Date(now - REMIND_AFTER_MINUTES * 60_000).toISOString())
    .order("placed_at", { ascending: true })
    .limit(200);
  if (error) return NextResponse.json({ error: "Query failed" }, { status: 500 });

  let cancelled = 0;
  let tidied = 0;
  const toRemind: string[] = [];

  for (const order of orders ?? []) {
    const action = pendingAction(new Date(order.placed_at).getTime(), now);
    if (action === "remind") {
      toRemind.push(order.id);
      continue;
    }
    if (action === "cancel" || action === "cancel_quietly") {
      // Only if it is STILL pending: the restaurant may have accepted it a moment ago.
      const { data: done } = await admin
        .from("orders")
        .update({ status: "cancelled", rejection_reason: AUTO_CANCEL_REASON, cancelled_by: "system" })
        .eq("id", order.id)
        .eq("status", "pending")
        .select("id");
      if (!done?.length) continue;
      if (action === "cancel") {
        cancelled++;
        after(() => handleOrderEvent({ type: "status_changed", orderId: order.id, status: "cancelled" }));
      } else {
        tidied++;
      }
    }
  }

  // Emails to restaurants can be slow, so they go out after the answer is sent.
  after(async () => {
    for (const id of toRemind) await sendPendingReminder(id); // skips if already reminded
  });

  return NextResponse.json({ reminded: toRemind.length, cancelled, tidied });
}

export const GET = run;
export const POST = run;
