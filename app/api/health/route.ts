import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// For an uptime monitor (see docs/monitoring.md): answers 200 when the website and its
// database both respond, 503 when the database does not. Reveals nothing private.
export const dynamic = "force-dynamic";

async function check() {
  let db = false;
  try {
    const timeout = new Promise<never>((_, reject) => setTimeout(() => reject(new Error("timeout")), 5_000));
    const query = createAdminClient().from("restaurants").select("id").limit(1);
    const { error } = await Promise.race([query, timeout]);
    db = !error;
  } catch {
    db = false;
  }

  return NextResponse.json(
    {
      status: db ? "ok" : "degraded",
      database: db ? "ok" : "down",
      time: new Date().toISOString(),
      version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "dev",
    },
    { status: db ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}

export const GET = check;
export const HEAD = check;
