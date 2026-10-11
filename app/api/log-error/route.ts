import { after, NextResponse, type NextRequest } from "next/server";
import { recordError } from "@/lib/monitoring/log-error";
import { allowFromHere } from "@/lib/utils/rate-limit";

// Receives crash reports from visitors' browsers (see lib/monitoring/report-client.ts).
// Public on purpose, so it is small, rate limited, and answers 204 whatever happens.
export const dynamic = "force-dynamic";

const MAX_BODY_CHARS = 8_000;

export async function POST(request: NextRequest) {
  const done = new NextResponse(null, { status: 204 });
  try {
    if (!(await allowFromHere("log-error", 20, 600))) return done;

    const text = (await request.text()).slice(0, MAX_BODY_CHARS);
    const body = JSON.parse(text) as Record<string, unknown>;
    const userAgent = request.headers.get("user-agent");

    after(() =>
      recordError({
        source: "browser",
        message: String(body.message ?? "").slice(0, 500),
        stack: body.stack ? String(body.stack).slice(0, 3000) : null,
        digest: body.digest ? String(body.digest).slice(0, 80) : null,
        path: body.path ? String(body.path).slice(0, 200) : null,
        userAgent,
      }),
    );
  } catch {
    // malformed or oversized report: ignore it
  }
  return done;
}
