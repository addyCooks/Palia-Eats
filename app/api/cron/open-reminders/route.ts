import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron/auth";
import { sendOpenReminder } from "@/lib/email/reminder-emails";
import { getRestaurantStatus } from "@/lib/utils/hours";

// Called by the database timer (see 0014_open_reminders.sql) when a restaurant that
// customers are waiting for has opened. Emails each of them once, then forgets the
// reminder. The caller must send "Authorization: Bearer <key>", where the key is the
// one stored in cron_keys (or CRON_SECRET, for running it by hand).

export const dynamic = "force-dynamic";

type ReminderRow = {
  user_id: string;
  restaurant_id: string;
  restaurants: {
    name: string;
    slug: string;
    is_active: boolean;
    is_accepting_orders: boolean;
    opening_time: string | null;
    closing_time: string | null;
    closed_days: number[] | null;
  } | null;
  profiles: { full_name: string | null } | null;
};

async function run(request: NextRequest) {
  if (!(await isCronAuthorized(request, "open_reminders"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("open_reminders")
    .select(
      "user_id, restaurant_id, restaurants(name, slug, is_active, is_accepting_orders, opening_time, closing_time, closed_days), profiles(full_name)",
    )
    .order("created_at", { ascending: true })
    .limit(200);
  if (error) return NextResponse.json({ error: "Query failed" }, { status: 500 });

  let sent = 0;
  for (const row of (data ?? []) as unknown as ReminderRow[]) {
    const restaurant = row.restaurants;
    if (!restaurant?.is_active || !getRestaurantStatus(restaurant).canOrder) continue;

    // Remove the reminder first: if two runs overlap, only the one that removed it sends.
    const { data: removed } = await admin
      .from("open_reminders")
      .delete()
      .eq("user_id", row.user_id)
      .eq("restaurant_id", row.restaurant_id)
      .select("user_id");
    if (!removed?.length) continue;

    const { data: user } = await admin.auth.admin.getUserById(row.user_id);
    const email = user.user?.email;
    if (!email || email.endsWith(".invalid")) continue;

    if (await sendOpenReminder({ to: email, customerName: row.profiles?.full_name ?? null, restaurant })) sent++;
  }

  return NextResponse.json({ sent });
}

export const POST = run;
export const GET = run;
