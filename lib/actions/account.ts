"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/menu";
import { parseAddressForm, parseProfileForm } from "@/lib/validation/account";

export type AccountFormState = { error?: string; saved?: boolean } | undefined;

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
