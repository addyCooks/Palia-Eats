import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Restaurant panel links look like  /panel/enter/<token>.
// The token is  base64url(payload) + "." + base64url(HMAC signature).
// Only our server can create a valid signature (it needs PANEL_TOKEN_SECRET), so a
// token can't be forged or edited. Tokens expire, and can be cancelled early by moving
// the restaurant's "links valid since" date forward (see panel/session.ts).

export type PanelTokenClaims = {
  restaurantId: string;
  issuedAt: number; // seconds since 1970
};

function secret(): string {
  const value = process.env.PANEL_TOKEN_SECRET;
  if (!value || value.length < 32) {
    throw new Error("PANEL_TOKEN_SECRET is missing or too short (use 32+ random characters).");
  }
  return value;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createPanelToken(restaurantId: string, issuedAt: Date, ttlDays = 30): string {
  const iat = Math.floor(issuedAt.getTime() / 1000);
  const payload = Buffer.from(
    JSON.stringify({ r: restaurantId, iat, exp: iat + ttlDays * 24 * 60 * 60 }),
  ).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

// Returns the token's contents, or null if it's forged, damaged or expired.
export function verifyPanelToken(token: string): PanelTokenClaims | null {
  const [payload, signature, ...rest] = token.split(".");
  if (!payload || !signature || rest.length > 0) return null;

  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as {
      r?: unknown;
      iat?: unknown;
      exp?: unknown;
    };
    if (typeof data.r !== "string" || typeof data.iat !== "number" || typeof data.exp !== "number") {
      return null;
    }
    if (data.exp < Math.floor(Date.now() / 1000)) return null;
    return { restaurantId: data.r, issuedAt: data.iat };
  } catch {
    return null;
  }
}
