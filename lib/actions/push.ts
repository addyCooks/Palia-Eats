"use server";

import { requireUser } from "@/lib/auth/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { isLang } from "@/lib/i18n/messages";
import { allow } from "@/lib/utils/rate-limit";

export type PushResult = { error?: string };

const MAX_PHONES_PER_PERSON = 8;

type SubscriptionInput = { endpoint: string; keys: { p256dh: string; auth: string } };

// Remembers that this phone wants order notifications. A phone is identified by its push address
// (the endpoint); if someone else used the same phone before, it now belongs to the person
// signed in.
export async function savePushSubscription(subscription: SubscriptionInput, lang: string): Promise<PushResult> {
  const profile = await requireUser("/account");
  const endpoint = String(subscription?.endpoint ?? "");
  const p256dh = String(subscription?.keys?.p256dh ?? "");
  const auth = String(subscription?.keys?.auth ?? "");

  if (!/^https:\/\/[^\s]{10,500}$/.test(endpoint) || !/^[\w-]{20,200}$/.test(p256dh) || !/^[\w-]{10,100}$/.test(auth)) {
    return { error: "invalid" };
  }
  if (!(await allow(`push-save:${profile.id}`, 20, 3600))) return { error: "too_many" };

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    { user_id: profile.id, endpoint, p256dh, auth, lang: isLang(lang) ? lang : "en" },
    { onConflict: "endpoint" },
  );
  if (error) return { error: "failed" };

  // Keep only the newest few phones per person.
  const { data: all } = await admin
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });
  const extra = (all ?? []).slice(MAX_PHONES_PER_PERSON).map((row) => row.id);
  if (extra.length) await admin.from("push_subscriptions").delete().in("id", extra);
  return {};
}

// Same for a phone set up through Firebase: all we keep is its token (stored in "endpoint").
export async function saveFcmToken(token: string, lang: string): Promise<PushResult> {
  const profile = await requireUser("/account");
  const value = String(token ?? "");
  if (!/^[\w:.-]{40,500}$/.test(value)) return { error: "invalid" };
  if (!(await allow(`push-save:${profile.id}`, 20, 3600))) return { error: "too_many" };

  const admin = createAdminClient();
  const { error } = await admin.from("push_subscriptions").upsert(
    { user_id: profile.id, kind: "fcm", endpoint: value, p256dh: null, auth: null, lang: isLang(lang) ? lang : "en" },
    { onConflict: "endpoint" },
  );
  if (error) return { error: "failed" };

  const { data: all } = await admin
    .from("push_subscriptions")
    .select("id")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });
  const extra = (all ?? []).slice(MAX_PHONES_PER_PERSON).map((row) => row.id);
  if (extra.length) await admin.from("push_subscriptions").delete().in("id", extra);
  return {};
}

export async function removePushSubscription(endpoint: string): Promise<PushResult> {
  const profile = await requireUser("/account");
  const { error } = await createAdminClient()
    .from("push_subscriptions")
    .delete()
    .eq("user_id", profile.id)
    .eq("endpoint", String(endpoint ?? ""));
  return error ? { error: "failed" } : {};
}
