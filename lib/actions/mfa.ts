"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getProfile, requireAdmin } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/admin/audit";
import { postLoginPath, safeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import { allow } from "@/lib/utils/rate-limit";

// 2-step login for the admin (an authenticator app such as Google Authenticator). This is
// Supabase's built-in TOTP login step; the admin area (lib/auth/session.ts requireAdmin) asks for
// the code once it has been turned on.

export type TotpStart = { error?: string; factorId?: string; qr?: string; secret?: string };
export type TotpResult = { error?: string; done?: boolean };

const CODE_PATTERN = /^\d{6}$/;
const WRONG_CODE = "That code isn't right. Check the code in your app (it changes every 30 seconds) and try again.";
const TOO_MANY = "Too many tries. Please wait a few minutes and try again.";

// Step 1: create a secret and a QR code to scan with the authenticator app.
export async function startTotpEnrollment(): Promise<TotpStart> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: factors } = await supabase.auth.mfa.listFactors();
  if (factors?.totp?.length) return { error: "2-step login is already on." };
  // A set-up that was started but never finished would block a new one: clear it.
  for (const factor of factors?.all ?? []) {
    if (factor.factor_type === "totp" && factor.status === "unverified") {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
  }

  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `PaliaEats admin ${new Date().toISOString().slice(0, 10)}`,
    issuer: "PaliaEats",
  });
  if (error || !data) {
    return { error: "Could not start the set-up. 2-step login may need to be switched on in Supabase (Authentication → Multi-Factor)." };
  }
  return { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret };
}

// Step 2: the admin types the first code from the app, which proves the QR code was scanned.
export async function confirmTotpEnrollment(input: { factorId: string; code: string }): Promise<TotpResult> {
  const admin = await requireAdmin();
  const factorId = String(input?.factorId ?? "");
  const code = String(input?.code ?? "").replace(/\s/g, "");
  if (!factorId || !CODE_PATTERN.test(code)) return { error: WRONG_CODE };
  if (!(await allow(`totp-setup:${admin.id}`, 8, 600))) return { error: TOO_MANY };

  const supabase = await createClient();
  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError || !challenge) return { error: "Could not check the code. Please start again." };
  const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code });
  if (error) return { error: WRONG_CODE };

  await logAdminAction(admin, { action: "admin.2fa_on", summary: "Turned on 2-step login for the admin" });
  revalidatePath("/admin", "layout");
  return { done: true };
}

// The code check shown right after the password, for an admin who has 2-step login on.
export async function verifyTotpLogin(_prev: TotpResult | undefined, formData: FormData): Promise<TotpResult | undefined> {
  const profile = await getProfile();
  if (!profile) redirect("/login");
  const next = safeNextPath(String(formData.get("next") ?? ""));
  const code = String(formData.get("code") ?? "").replace(/\s/g, "");
  if (!CODE_PATTERN.test(code)) return { error: WRONG_CODE };
  if (!(await allow(`totp-login:${profile.id}`, 8, 600))) return { error: TOO_MANY };

  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp?.[0];
  if (!factor) redirect(postLoginPath(next, profile.role));

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId: factor.id });
  if (challengeError || !challenge) return { error: "Could not check the code. Please try again." };
  const { error } = await supabase.auth.mfa.verify({ factorId: factor.id, challengeId: challenge.id, code });
  if (error) return { error: WRONG_CODE };

  redirect(postLoginPath(next, profile.role));
}

// Turn 2-step login off again (the admin is already verified with a code to get here).
export async function disableTotp(): Promise<TotpResult> {
  const admin = await requireAdmin();
  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const factor = factors?.totp?.[0];
  if (!factor) return { done: true };

  const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id });
  if (error) return { error: "Could not turn it off. Please try again." };

  await logAdminAction(admin, { action: "admin.2fa_off", summary: "Turned off 2-step login for the admin" });
  revalidatePath("/admin", "layout");
  return { done: true };
}
