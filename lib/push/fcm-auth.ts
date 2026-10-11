import { createSign } from "node:crypto";

// Signing in to Google as the website's own "service account", so the server may send Firebase
// Cloud Messaging notifications. No libraries: a service account logs in by sending Google a small
// signed note (a JWT) and getting a short-lived access token back. Kept free of other imports so the
// automatic tests can load it.

export type ServiceAccount = { projectId: string; clientEmail: string; privateKey: string };

// FIREBASE_SERVICE_ACCOUNT holds the key file from the Firebase console, either as the JSON text or
// as the same text in base64 (easier to paste into some settings screens).
export function parseServiceAccount(raw: string | undefined | null): ServiceAccount | null {
  const text = (raw ?? "").trim();
  if (!text) return null;
  try {
    const json = JSON.parse(text.startsWith("{") ? text : Buffer.from(text, "base64").toString("utf8")) as Record<string, unknown>;
    const projectId = String(json.project_id ?? "");
    const clientEmail = String(json.client_email ?? "");
    const privateKey = String(json.private_key ?? "").replace(/\\n/g, "\n");
    if (!projectId || !clientEmail || !privateKey.includes("PRIVATE KEY")) return null;
    return { projectId, clientEmail, privateKey };
  } catch {
    return null;
  }
}

export const FCM_SCOPE = "https://www.googleapis.com/auth/firebase.messaging";
export const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

const base64url = (input: string | Buffer) => Buffer.from(input).toString("base64url");

export function buildServiceAccountJwt(
  account: ServiceAccount,
  nowSeconds: number,
  scope: string = FCM_SCOPE,
  audience: string = GOOGLE_TOKEN_URL,
): string {
  const header = base64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claims = base64url(
    JSON.stringify({ iss: account.clientEmail, scope, aud: audience, iat: nowSeconds, exp: nowSeconds + 3600 }),
  );
  const signature = createSign("RSA-SHA256").update(`${header}.${claims}`).sign(account.privateKey);
  return `${header}.${claims}.${base64url(signature)}`;
}
