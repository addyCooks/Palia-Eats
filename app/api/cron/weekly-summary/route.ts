import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isCronAuthorized } from "@/lib/cron/auth";
import { sendWeeklySummary } from "@/lib/email/summary-emails";
import { summarizeWeek, type WeekItem, type WeekOrder } from "@/lib/reports/weekly";
import { addDaysToKey, istDateKey, istDayStart, mondayOfKey, todayKeyIST } from "@/lib/utils/time";

// Called by the database timer on Monday mornings (see 0019_cron_jobs.sql). Emails every active
// restaurant its summary of the week that just ended (Monday to Sunday, Indian time), unless the
// restaurant switched it off in its panel. Safe to run twice: a week is emailed only once.
export const dynamic = "force-dynamic";

type OrderRow = WeekOrder & { id: string; restaurant_id: string };

async function run(request: NextRequest) {
  if (!(await isCronAuthorized(request, "weekly_summary"))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = createAdminClient();
  const thisMonday = mondayOfKey(todayKeyIST());
  const weekStart = addDaysToKey(thisMonday, -7);
  const weekEnd = addDaysToKey(thisMonday, -1);
  const previousStart = addDaysToKey(weekStart, -7);

  const [{ data: restaurants }, { data: orders, error }] = await Promise.all([
    admin
      .from("restaurants")
      .select("id, name, restaurant_private(notification_email, weekly_summary)")
      .eq("is_active", true),
    admin
      .from("orders")
      .select("id, restaurant_id, placed_at, total, status")
      .in("status", ["delivered", "cancelled"])
      .gte("placed_at", istDayStart(previousStart))
      .lt("placed_at", istDayStart(thisMonday))
      .limit(30000),
  ]);
  if (error) return NextResponse.json({ error: "Query failed" }, { status: 500 });

  const byRestaurant = new Map<string, OrderRow[]>();
  for (const order of (orders ?? []) as OrderRow[]) {
    const list = byRestaurant.get(order.restaurant_id) ?? [];
    list.push(order);
    byRestaurant.set(order.restaurant_id, list);
  }

  const weekFrom = istDayStart(weekStart);
  const weekTo = istDayStart(thisMonday);
  let sent = 0;
  let skipped = 0;

  for (const restaurant of restaurants ?? []) {
    const priv = Array.isArray(restaurant.restaurant_private) ? restaurant.restaurant_private[0] : restaurant.restaurant_private;
    const to = priv?.notification_email;
    if (!to || priv?.weekly_summary === false) {
      skipped++;
      continue;
    }

    const all = byRestaurant.get(restaurant.id) ?? [];
    const thisWeek = all.filter((order) => order.placed_at >= weekFrom && order.placed_at < weekTo);
    const lastWeek = all.filter((order) => order.placed_at < weekFrom);
    // A restaurant with no orders for two weeks gets no email: nothing to report.
    if (thisWeek.length === 0 && lastWeek.length === 0) {
      skipped++;
      continue;
    }

    const event = `weekly_summary_${weekStart}`;
    const { data: already } = await admin
      .from("notification_log")
      .select("id")
      .eq("event", event)
      .eq("recipient", to)
      .eq("status", "sent")
      .limit(1);
    if (already?.length) {
      skipped++;
      continue;
    }

    // Dishes sold (delivered orders only), and the week's ratings.
    const deliveredIds = thisWeek.filter((order) => order.status === "delivered").map((order) => order.id);
    const items: WeekItem[] = [];
    for (let i = 0; i < deliveredIds.length; i += 150) {
      const { data } = await admin
        .from("order_items")
        .select("item_name, quantity")
        .in("order_id", deliveredIds.slice(i, i + 150));
      items.push(...((data ?? []) as WeekItem[]));
    }
    const { data: ratings } = await admin
      .from("order_ratings")
      .select("stars")
      .eq("restaurant_id", restaurant.id)
      .gte("created_at", weekFrom)
      .lt("created_at", weekTo);

    const summary = summarizeWeek(thisWeek, items, istDateKey);
    const previous = summarizeWeek(lastWeek, [], istDateKey);
    const ok = await sendWeeklySummary({
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      to,
      event,
      weekStart,
      weekEnd,
      summary,
      previous,
      ratings: (ratings ?? []).map((row) => Number(row.stars)),
    });
    if (ok) sent++;
  }

  return NextResponse.json({ weekStart, sent, skipped });
}

export const GET = run;
export const POST = run;
