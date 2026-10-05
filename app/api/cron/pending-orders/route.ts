import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendPendingReminder } from "@/lib/email/status-emails";

// Called on a timer (every few minutes). Finds orders that have been sitting at
// "Order placed" for a while and nudges the restaurant once.
// Protected by CRON_SECRET: callers must send "Authorization: Bearer <CRON_SECRET>".
const REMIND_AFTER_MINUTES = 5;
const GIVE_UP_AFTER_HOURS = 6; // don't nag about very old orders

export const dynamic = "force-dynamic";

function isAuthorized(request: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = request.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: NextRequest) {
  if (!process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = Date.now();
  const { data: orders, error } = await createAdminClient()
    .from("orders")
    .select("id")
    .eq("status", "pending")
    .lt("placed_at", new Date(now - REMIND_AFTER_MINUTES * 60_000).toISOString())
    .gt("placed_at", new Date(now - GIVE_UP_AFTER_HOURS * 3_600_000).toISOString())
    .order("placed_at", { ascending: true })
    .limit(50);

  if (error) return NextResponse.json({ error: "Query failed" }, { status: 500 });

  let checked = 0;
  for (const order of orders ?? []) {
    checked++;
    await sendPendingReminder(order.id); // skips if already reminded
  }
  return NextResponse.json({ checked });
}
