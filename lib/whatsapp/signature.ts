import { createHmac, timingSafeEqual } from "node:crypto";

// WhatsApp signs every webhook call: header "X-Hub-Signature-256: sha256=<hex>", an HMAC of
// the EXACT raw request body using the app secret. Anything else is rejected.
export function verifyWebhookSignature(
  rawBody: string,
  header: string | null,
  appSecret: string,
): boolean {
  if (!appSecret || !header || !header.startsWith("sha256=")) return false;
  const given = Buffer.from(header.slice("sha256=".length), "hex");
  const expected = createHmac("sha256", appSecret).update(rawBody, "utf8").digest();
  return given.length === expected.length && timingSafeEqual(given, expected);
}

export function signBody(rawBody: string, appSecret: string): string {
  return `sha256=${createHmac("sha256", appSecret).update(rawBody, "utf8").digest("hex")}`;
}
