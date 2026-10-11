import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { allowFromHere } from "@/lib/utils/rate-limit";

// Counts one step of a visit (see lib/analytics/funnel.ts). Public, anonymous, small, rate
// limited, and always answers 204.
export const dynamic = "force-dynamic";

const EVENTS = ["visit", "restaurant_view", "add_to_cart", "checkout_start"];

export async function POST(request: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  try {
    const body = JSON.parse((await request.text()).slice(0, 200)) as { event?: unknown };
    if (typeof body.event !== "string" || !EVENTS.includes(body.event)) return done;
    if (!(await allowFromHere("funnel", 120, 600))) return done;
    await createAdminClient().rpc("bump_funnel", { p_event: body.event });
  } catch {
    // nothing to report to a counter
  }
  return done;
}
