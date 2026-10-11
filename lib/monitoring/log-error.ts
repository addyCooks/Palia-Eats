import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/mailer";
import { escapeHtml, siteUrl } from "@/lib/email/shared";
import { allow } from "@/lib/utils/rate-limit";
import { SUPPORT_EMAIL } from "@/lib/utils/support";
import { isNoise, redact, safePath } from "@/lib/monitoring/noise";

export type ErrorInput = {
  source: "server" | "browser";
  message: string;
  path?: string | null;
  stack?: string | null;
  digest?: string | null;
  userAgent?: string | null;
};

// Where crash alerts go. ADMIN_ALERT_EMAIL can override the support inbox.
function alertAddress(): string {
  return process.env.ADMIN_ALERT_EMAIL?.trim() || SUPPORT_EMAIL;
}

// Saves one crash in public.error_log (the same crash is stored once and counted) and, for a
// brand new problem, emails the admin (at most 8 emails an hour). It NEVER throws: reporting a
// crash must not cause another one.
export async function recordError(input: ErrorInput): Promise<void> {
  try {
    const message = redact(input.message || "Unknown error");
    const stack = input.stack ? redact(input.stack) : null;
    if (isNoise(message, stack)) return;

    const path = input.path ? safePath(input.path) : null;
    const { data: shouldAlert, error } = await createAdminClient().rpc("log_error", {
      p_source: input.source,
      p_message: message,
      p_path: path,
      p_stack: stack,
      p_digest: input.digest ?? null,
      p_user: null,
      p_user_agent: input.userAgent ?? null,
    });
    if (error) {
      console.error("[monitoring] Could not save error:", error.message);
      return;
    }

    if (shouldAlert === true && (await allow("error-alert-mail", 8, 3600))) {
      const link = `${siteUrl()}/admin/errors`;
      await sendEmail({
        to: alertAddress(),
        subject: `PaliaEats problem: ${message.slice(0, 80)}`,
        text:
          `PaliaEats hit a new problem.\n\n${message}\n\nWhere: ${path ?? "unknown"} (${input.source})\n\n` +
          `See all problems: ${link}\n`,
        html:
          `<div style="font-family:Arial,sans-serif;max-width:520px">` +
          `<h2 style="margin:0 0 8px">PaliaEats hit a new problem</h2>` +
          `<p style="background:#fef2f2;padding:10px;border-radius:8px;word-break:break-word">${escapeHtml(message)}</p>` +
          `<p>Where: ${escapeHtml(path ?? "unknown")} (${input.source})</p>` +
          `<p><a href="${link}">See all problems in Admin</a></p></div>`,
      });
    }
  } catch (caught) {
    console.error("[monitoring] Error reporter failed:", caught instanceof Error ? caught.message : caught);
  }
}

// Called by Next.js (instrumentation.ts) whenever the server fails while handling a request.
export async function recordServerError(
  error: unknown,
  request: { path: string; method: string },
  context: { routePath: string; routeType: string },
): Promise<void> {
  const digest =
    typeof error === "object" && error !== null && "digest" in error ? String((error as { digest: unknown }).digest) : null;
  if (digest?.startsWith("NEXT_")) return;

  const message = error instanceof Error ? error.message : String(error);
  await recordError({
    source: "server",
    message,
    stack: error instanceof Error ? (error.stack ?? null) : null,
    digest,
    // The route pattern (/orders/[id]) rather than the real address: addresses can hold secrets.
    path: `${request.method} ${context.routePath} (${context.routeType})`,
  });
}
