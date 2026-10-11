import "server-only";
import { buildServiceAccountJwt, GOOGLE_TOKEN_URL, parseServiceAccount, type ServiceAccount } from "@/lib/push/fcm-auth";

// Sends a notification through Firebase Cloud Messaging (free). Needs FIREBASE_SERVICE_ACCOUNT (the
// key file from Firebase console > Project settings > Service accounts). Without it nothing is sent
// and nothing else is affected.
export function fcmAccount(): ServiceAccount | null {
  return parseServiceAccount(process.env.FIREBASE_SERVICE_ACCOUNT);
}

let cached: { token: string; expiresAt: number } | null = null;

async function accessToken(account: ServiceAccount): Promise<string | null> {
  const now = Math.floor(Date.now() / 1000);
  if (cached && cached.expiresAt - 120 > now) return cached.token;

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: buildServiceAccountJwt(account, now),
    }),
    signal: AbortSignal.timeout(10_000),
  });
  if (!response.ok) {
    console.error("[fcm] Google refused the service account login:", response.status);
    return null;
  }
  const json = (await response.json()) as { access_token?: string; expires_in?: number };
  if (!json.access_token) return null;
  cached = { token: json.access_token, expiresAt: now + (json.expires_in ?? 3000) };
  return json.access_token;
}

export type FcmResult = "sent" | "gone" | "failed";

// "gone" means this phone no longer wants notifications (app removed, permission withdrawn): the
// caller forgets its token.
export async function sendFcm(
  token: string,
  payload: { title: string; body: string; url: string; tag: string },
): Promise<FcmResult> {
  try {
    const account = fcmAccount();
    if (!account) return "failed";
    const access = await accessToken(account);
    if (!access) return "failed";

    // Data-only on purpose: our own service worker (public/sw.js) shows the notification, in the same
    // way for notifications that arrive through Firebase and through web push.
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${account.projectId}/messages:send`, {
      method: "POST",
      headers: { authorization: `Bearer ${access}`, "content-type": "application/json" },
      body: JSON.stringify({
        message: {
          token,
          data: { title: payload.title, body: payload.body, url: payload.url, tag: payload.tag },
          webpush: { headers: { Urgency: "high", TTL: "3600" } },
        },
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (response.ok) return "sent";

    const text = await response.text();
    if (response.status === 404 || text.includes("UNREGISTERED")) return "gone";
    console.error("[fcm] Could not send:", response.status, text.slice(0, 200));
    return "failed";
  } catch (error) {
    console.error("[fcm] Could not send:", error instanceof Error ? error.message : error);
    return "failed";
  }
}
