import type { Instrumentation } from "next";

// Next.js calls this whenever the server fails while handling a request (a page that crashes,
// a server action that throws, a broken route). We keep a grouped record in Admin -> Problems,
// and email the admin about brand new ones. See lib/monitoring/log-error.ts.
export const onRequestError: Instrumentation.onRequestError = async (error, request, context) => {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { recordServerError } = await import("@/lib/monitoring/log-error");
  await recordServerError(error, request, context);
};
