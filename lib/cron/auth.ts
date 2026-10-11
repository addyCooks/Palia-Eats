import "server-only";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function same(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// The database timer (pg_cron, see 0014 and 0019) calls our /api/cron/... routes with
// "Authorization: Bearer <key>". The key is created in the database (public.cron_keys, server
// only), so no secret is ever copied by hand. CRON_SECRET also works, for running a job by hand.
export async function isCronAuthorized(request: NextRequest, name: string): Promise<boolean> {
  const given = request.headers.get("authorization") ?? "";
  if (!given.startsWith("Bearer ") || given.length < 40) return false;

  if (process.env.CRON_SECRET && same(given, `Bearer ${process.env.CRON_SECRET}`)) return true;

  const { data } = await createAdminClient().from("cron_keys").select("key").eq("name", name).maybeSingle();
  return Boolean(data?.key) && same(given, `Bearer ${data!.key}`);
}
