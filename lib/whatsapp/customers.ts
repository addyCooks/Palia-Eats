import "server-only";
import { randomBytes } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { toNationalNumber } from "@/lib/whatsapp/phone";

export type BotCustomer = {
  id: string;
  name: string | null;
  phone: string | null; // 10-digit Indian mobile
};

type ProfileRow = { id: string; full_name: string | null; phone: string | null };

async function findByWhatsApp(waId: string): Promise<ProfileRow | null> {
  const { data } = await createAdminClient()
    .from("profiles")
    .select("id, full_name, phone")
    .eq("whatsapp_phone", waId)
    .maybeSingle();
  return data;
}

// WhatsApp customers have no website login. We keep a normal customer record for them
// (so orders, addresses and order history work exactly like for website customers),
// identified by their WhatsApp number. The login email is a made-up, undeliverable address
// and the password is random and thrown away: nobody can sign in to it.
export async function getOrCreateCustomer(
  waId: string,
  whatsAppName: string | null,
): Promise<BotCustomer | null> {
  const existing = await findByWhatsApp(waId);
  if (existing) return { id: existing.id, name: existing.full_name, phone: existing.phone };

  const national = toNationalNumber(waId);
  if (!national) return null; // we only deliver in India

  const admin = createAdminClient();
  const name = whatsAppName?.trim().slice(0, 80) || null;

  const { data, error } = await admin.auth.admin.createUser({
    email: `wa${waId}@whatsapp.invalid`,
    email_confirm: true,
    password: randomBytes(32).toString("base64url"),
    user_metadata: name ? { full_name: name } : {},
  });

  if (error || !data.user) {
    // Two messages from a new number can arrive at once: the other one may have won.
    const raced = await findByWhatsApp(waId);
    if (raced) return { id: raced.id, name: raced.full_name, phone: raced.phone };
    console.error("[whatsapp] Could not create customer:", error?.message);
    return null;
  }

  const { error: updateError } = await admin
    .from("profiles")
    .update({ whatsapp_phone: waId, whatsapp_opt_in: true, phone: national })
    .eq("id", data.user.id);
  if (updateError) {
    console.error("[whatsapp] Could not set up customer profile:", updateError.message);
    return null;
  }

  return { id: data.user.id, name, phone: national };
}

export async function setCustomerName(customerId: string, name: string): Promise<void> {
  await createAdminClient()
    .from("profiles")
    .update({ full_name: name.trim().slice(0, 80) })
    .eq("id", customerId);
}

export type SavedAddress = { id: string; address_line: string };

export async function getLastAddress(customerId: string): Promise<SavedAddress | null> {
  const { data } = await createAdminClient()
    .from("customer_addresses")
    .select("id, address_line")
    .eq("user_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data;
}

export async function createAddress(
  customerId: string,
  addressLine: string,
  phone: string | null,
): Promise<string | null> {
  const { data, error } = await createAdminClient()
    .from("customer_addresses")
    .insert({
      user_id: customerId,
      label: "WhatsApp",
      address_line: addressLine.slice(0, 300),
      phone,
      is_default: false,
    })
    .select("id")
    .single();
  if (error) {
    console.error("[whatsapp] Could not save address:", error.message);
    return null;
  }
  return data.id;
}
