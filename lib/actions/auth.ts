"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";
import { getOrigin } from "@/lib/utils/origin";
import { postLoginPath, safeNextPath } from "@/lib/auth/redirect";
import { getT } from "@/lib/i18n/server";
import { looksLikeBot } from "@/lib/utils/bot-check";
import { allow, allowFromHere, keyFor } from "@/lib/utils/rate-limit";

export type AuthFormState = { error?: string; message?: string } | undefined;

const MIN_PASSWORD_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function login(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getT();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!email || !password) {
    return { error: t("auth.enter_email_password") };
  }

  // Stops someone guessing passwords: per connection, and per account being attacked.
  if (!(await allowFromHere("login", 40, 600)) || !(await allow(keyFor("login-email", email), 10, 600))) {
    return { error: t("auth.too_many") };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    if (error.code === "email_not_confirmed") {
      return { error: t("auth.confirm_email_first") };
    }
    return { error: t("auth.wrong_login") };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  redirect(postLoginPath(next, profile?.role ?? "customer"));
}

export async function signup(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getT();
  // A robot gets the same friendly answer a person would, and nothing is created.
  if (looksLikeBot(formData)) return { message: t("auth.signup_done") };

  const fullName = String(formData.get("fullName") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "");

  if (!fullName || !email || !password) {
    return { error: t("auth.fill_all") };
  }
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: t("auth.password_min", { n: MIN_PASSWORD_LENGTH }) };
  }
  if (!(await allowFromHere("signup", 6, 3600))) {
    return { error: t("auth.too_many") };
  }

  const origin = await getOrigin();
  const callbackNext = safeNextPath(next) ?? "/";

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(callbackNext)}`,
    },
  });

  if (error) {
    return { error: error.message };
  }

  // If email confirmation is switched off, Supabase logs the user in immediately.
  if (data.session) {
    redirect(postLoginPath(next, "customer"));
  }

  return {
    message: t("auth.signup_done"),
  };
}

// "Forgot password": emails a one-time link. The answer is always the same, whether or not an
// account exists for that address, so nobody can use this form to find out who has an account.
export async function forgotPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getT();
  if (looksLikeBot(formData)) return { message: t("auth.forgot.sent") };

  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 120) {
    return { error: t("auth.forgot.bad_email") };
  }
  if (!(await allowFromHere("forgot", 8, 3600)) || !(await allow(keyFor("forgot-email", email), 3, 3600))) {
    return { error: t("auth.too_many") };
  }

  const origin = await getOrigin();
  const supabase = await createClient();
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/reset-password")}`,
  });

  return { message: t("auth.forgot.sent") };
}

// Step 2: the person opened the emailed link (which logged them in) and now picks a password.
export async function resetPassword(
  _prev: AuthFormState,
  formData: FormData,
): Promise<AuthFormState> {
  const t = await getT();
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: t("auth.password_min", { n: MIN_PASSWORD_LENGTH }) };
  }
  if (password !== confirm) {
    return { error: t("auth.reset.mismatch") };
  }

  const user = await getCurrentUser();
  if (!user) return { error: t("auth.error_reset_link") };
  if (!(await allow(`reset-password:${user.id}`, 10, 3600))) return { error: t("auth.too_many") };

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: t("account.password.same") };
    return { error: t("auth.reset.failed") };
  }

  redirect("/account?notice=password");
}

export async function signInWithGoogle(formData: FormData) {
  const next = safeNextPath(String(formData.get("next") ?? "")) ?? "/";
  const origin = await getOrigin();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error || !data.url) {
    redirect("/login?error=google");
  }
  redirect(data.url);
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
