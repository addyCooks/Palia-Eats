"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { sendAccountDeletedEmail } from "@/lib/email/account-emails";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getT } from "@/lib/i18n/server";
import { allow } from "@/lib/utils/rate-limit";
import { isUuid } from "@/lib/validation/menu";
import { parseAddressForm, parseProfileForm } from "@/lib/validation/account";

export type AccountFormState = { error?: string; saved?: boolean } | undefined;

const MIN_PASSWORD_LENGTH = 8;

const MAX_ADDRESSES = 10;
const ADDRESSES_PATH = "/account/addresses";

// ------------------------------------------------------------------- profile

export async function updateProfile(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const profile = await requireUser("/account");

  const parsed = parseProfileForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone,
      whatsapp_opt_in: parsed.data.whatsapp_opt_in,
    })
    .eq("id", profile.id);
  if (error) return { error: "Could not save your details. Please try again." };

  revalidatePath("/account");
  return { saved: true };
}

// Change password from the account page. The current password is checked first, so someone
// who borrows an unlocked phone can't lock the owner out.
export async function changePassword(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const t = await getT();
  const profile = await requireUser("/account");
  const user = await getCurrentUser();

  const current = String(formData.get("current") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");

  if (!user?.email || !current) return { error: t("auth.fill_all") };
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { error: t("auth.password_min", { n: MIN_PASSWORD_LENGTH }) };
  }
  if (password !== confirm) return { error: t("auth.reset.mismatch") };
  if (password === current) return { error: t("account.password.same") };
  if (!(await allow(`change-password:${profile.id}`, 8, 3600))) return { error: t("auth.too_many") };

  const supabase = await createClient();
  const { error: wrongPassword } = await supabase.auth.signInWithPassword({ email: user.email, password: current });
  if (wrongPassword) return { error: t("account.password.wrong_current") };

  const { error } = await supabase.auth.updateUser({ password });
  if (error) {
    if (error.code === "same_password") return { error: t("account.password.same") };
    return { error: t("auth.reset.failed") };
  }
  return { saved: true };
}

// ----------------------------------------------------------------- addresses

// Only one address can be the default; clear the old one first.
async function clearDefault(userId: string, exceptId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("customer_addresses")
    .update({ is_default: false })
    .eq("user_id", userId)
    .eq("is_default", true);
  if (exceptId) query = query.neq("id", exceptId);
  await query;
}

export async function createAddress(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const profile = await requireUser(ADDRESSES_PATH);

  const parsed = parseAddressForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { count } = await supabase
    .from("customer_addresses")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) >= MAX_ADDRESSES) {
    return { error: `You can save up to ${MAX_ADDRESSES} addresses. Delete one first.` };
  }

  // Your first address is the default automatically.
  const makeDefault = parsed.data.is_default || count === 0;
  if (makeDefault) await clearDefault(profile.id);

  const { data: created, error } = await supabase
    .from("customer_addresses")
    .insert({ user_id: profile.id, ...parsed.data, is_default: makeDefault })
    .select("id")
    .single();
  if (error || !created) return { error: "Could not save the address. Please try again." };

  revalidatePath(ADDRESSES_PATH);

  // Added while checking out? Go straight back to checkout with this address chosen.
  if (String(formData.get("next") ?? "") === "/checkout") {
    redirect(`/checkout?address=${created.id}`);
  }
  return { saved: true };
}

export async function updateAddress(
  _prev: AccountFormState,
  formData: FormData,
): Promise<AccountFormState> {
  const profile = await requireUser(ADDRESSES_PATH);

  const addressId = String(formData.get("addressId") ?? "");
  if (!isUuid(addressId)) return { error: "Missing address." };

  const parsed = parseAddressForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("customer_addresses")
    .select("is_default")
    .eq("id", addressId)
    .eq("user_id", profile.id)
    .maybeSingle();
  if (!existing) return { error: "Address not found." };

  // The current default stays the default (you change it by choosing another one).
  const makeDefault = parsed.data.is_default || existing.is_default;
  if (makeDefault) await clearDefault(profile.id, addressId);

  const { error } = await supabase
    .from("customer_addresses")
    .update({ ...parsed.data, is_default: makeDefault })
    .eq("id", addressId)
    .eq("user_id", profile.id);
  if (error) return { error: "Could not save the address. Please try again." };

  revalidatePath(ADDRESSES_PATH);
  redirect(ADDRESSES_PATH);
}

export async function setDefaultAddress(formData: FormData) {
  const profile = await requireUser(ADDRESSES_PATH);

  const addressId = String(formData.get("addressId") ?? "");
  if (!isUuid(addressId)) throw new Error("Missing address.");

  const supabase = await createClient();
  await clearDefault(profile.id, addressId);
  const { error } = await supabase
    .from("customer_addresses")
    .update({ is_default: true })
    .eq("id", addressId)
    .eq("user_id", profile.id);
  if (error) throw new Error("Could not change the default address.");

  revalidatePath(ADDRESSES_PATH);
}

export async function deleteAddress(formData: FormData) {
  const profile = await requireUser(ADDRESSES_PATH);

  const addressId = String(formData.get("addressId") ?? "");
  if (!isUuid(addressId)) throw new Error("Missing address.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("customer_addresses")
    .delete()
    .eq("id", addressId)
    .eq("user_id", profile.id);
  if (error) throw new Error("Could not delete the address.");

  // If the default was deleted, promote the newest remaining address.
  const { data: remaining } = await supabase
    .from("customer_addresses")
    .select("id, is_default")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });
  if (remaining?.length && !remaining.some((address) => address.is_default)) {
    await supabase
      .from("customer_addresses")
      .update({ is_default: true })
      .eq("id", remaining[0].id)
      .eq("user_id", profile.id);
  }

  revalidatePath(ADDRESSES_PATH);
}

// ------------------------------------------------------------- delete my account

export type DeleteAccountState = { error?: string } | undefined;

// "Delete my account". Wipes the personal details copied onto old orders (the orders themselves
// stay, for the restaurants' sales records), then deletes the login, which also removes the
// profile, addresses, favourites and notification settings. Refused while an order is still
// on its way.
export async function deleteAccount(
  _prev: DeleteAccountState,
  formData: FormData,
): Promise<DeleteAccountState> {
  const t = await getT();
  const profile = await requireUser("/account");
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  if (profile.role === "admin") return { error: t("account.delete.admin") };
  if (String(formData.get("confirm") ?? "").trim().toUpperCase() !== "DELETE") {
    return { error: t("account.delete.type_delete") };
  }
  if (!(await allow(`delete-account:${user.id}`, 5, 3600))) return { error: t("auth.too_many") };

  const admin = createAdminClient();
  const { error: eraseError } = await admin.rpc("erase_customer", { p_uid: user.id });
  if (eraseError) {
    return { error: eraseError.message.includes("active_order") ? t("account.delete.active_order") : t("account.delete.failed") };
  }
  const { error: deleteError } = await admin.auth.admin.deleteUser(user.id);
  if (deleteError) return { error: t("account.delete.failed") };

  const email = user.email;
  const name = profile.full_name;
  if (email) after(() => sendAccountDeletedEmail(email, name));

  // The login no longer exists: clear this browser's cookies too.
  await (await createClient()).auth.signOut({ scope: "local" });
  redirect("/goodbye");
}
