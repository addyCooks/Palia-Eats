"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { getCurrentUser, getProfile, requireAdmin } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/admin/audit";
import { emailNewSupportRequest, emailSupportReceived, type SupportRow } from "@/lib/email/support-emails";
import { getT } from "@/lib/i18n/server";
import { getPanelRestaurant } from "@/lib/panel/session";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SUPPORT_STATUSES, type SupportStatus } from "@/lib/support/topics";
import { looksLikeBot } from "@/lib/utils/bot-check";
import { allow, allowFromHere, keyFor } from "@/lib/utils/rate-limit";
import { isUuid } from "@/lib/validation/menu";
import { parseHelpForm } from "@/lib/validation/support";

export type HelpState = { error?: string; done?: boolean } | undefined;

// Has this person just sent exactly this? (a double tap, or a refresh after sending)
async function isRepeat(match: { user_id?: string; restaurant_id?: string; contact_email?: string | null; contact_phone?: string | null }, message: string) {
  let query = createAdminClient()
    .from("support_requests")
    .select("id")
    .eq("message", message)
    .gte("created_at", new Date(Date.now() - 10 * 60_000).toISOString())
    .limit(1);
  if (match.user_id) query = query.eq("user_id", match.user_id);
  else if (match.restaurant_id) query = query.eq("restaurant_id", match.restaurant_id);
  else if (match.contact_email) query = query.eq("contact_email", match.contact_email);
  else if (match.contact_phone) query = query.eq("contact_phone", match.contact_phone);
  else return false;
  const { data } = await query;
  return Boolean(data?.length);
}

// "Send us a message" on the Help page. Open to everyone; logged-in customers are recognised
// and their order can be attached.
export async function sendHelpRequest(_prev: HelpState, formData: FormData): Promise<HelpState> {
  const t = await getT();
  // A robot gets the same friendly answer a person would, and nothing is saved.
  if (looksLikeBot(formData)) return { done: true };

  const parsed = parseHelpForm(formData, "customer");
  if (!parsed.ok) return { error: t(parsed.errorKey) };
  const input = parsed.data;

  const user = await getCurrentUser();
  const profile = user ? await getProfile() : null;

  const name = profile?.full_name?.trim() || input.name;
  const email = user?.email ?? input.email;
  const profilePhone = profile?.phone?.replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "") ?? null;
  const phone = input.phone ?? (profilePhone && /^[6-9]\d{9}$/.test(profilePhone) ? profilePhone : null);
  if (!user) {
    if (!name || name.length < 2) return { error: t("help.err.name") };
    if (!email && !phone) return { error: t("help.err.contact") };
  }

  if (!(await allowFromHere("help", 6, 3600)) || (user && !(await allow(`help-user:${user.id}`, 5, 3600)))) {
    return { error: t("auth.too_many") };
  }
  if (!user && email && !(await allow(keyFor("help-email", email), 3, 3600))) {
    return { error: t("auth.too_many") };
  }

  // An order number only counts when it is one of this customer's own orders.
  let orderId: string | null = null;
  let restaurantId: string | null = null;
  if (input.orderNumber && user) {
    const { data: order } = await (await createClient())
      .from("orders")
      .select("id, restaurant_id")
      .eq("order_number", input.orderNumber)
      .maybeSingle();
    if (!order) return { error: t("help.err.order_not_found") };
    orderId = order.id;
    restaurantId = order.restaurant_id;
  }
  const message = !user && input.orderNumber ? `[Order #${input.orderNumber}, not checked] ${input.message}` : input.message;

  if (await isRepeat({ user_id: user?.id, contact_email: email, contact_phone: phone }, message)) return { done: true };

  const { data: saved, error } = await createAdminClient()
    .from("support_requests")
    .insert({
      kind: "customer",
      user_id: user?.id ?? null,
      order_id: orderId,
      restaurant_id: restaurantId,
      name,
      contact_email: email,
      contact_phone: phone,
      topic: input.topic,
      message,
    })
    .select("id")
    .single();
  if (error || !saved) return { error: t("help.err.failed") };

  after(async () => {
    await emailNewSupportRequest({
      id: saved.id,
      kind: "customer",
      topic: input.topic,
      message,
      name,
      contact_email: email,
      contact_phone: phone,
      order_number: input.orderNumber && user ? input.orderNumber : null,
    } satisfies SupportRow);
    // A confirmation goes only to a signed-in customer's own address (never to an address
    // someone typed, so the form can't be used to send mail to strangers).
    if (user?.email) await emailSupportReceived(user.email, name ?? null, input.topic);
  });
  revalidatePath("/admin/support");
  return { done: true };
}

// The same, for a restaurant using its panel (it has no account: the panel link identifies it).
export async function sendPanelHelpRequest(_prev: HelpState, formData: FormData): Promise<HelpState> {
  if (looksLikeBot(formData)) return { done: true };
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: "Your session has expired. Please open the link from your email again." };

  const parsed = parseHelpForm(formData, "restaurant");
  if (!parsed.ok) {
    return {
      error:
        parsed.errorKey === "help.err.topic"
          ? "Please choose what it's about."
          : parsed.errorKey === "help.err.message"
            ? "Please write a few words about what you need."
            : "Please check the phone number or email.",
    };
  }
  const input = parsed.data;
  if (!(await allow(`help-panel:${restaurant.id}`, 6, 3600))) return { error: "Too many messages. Please wait a little and try again." };
  if (await isRepeat({ restaurant_id: restaurant.id }, input.message)) return { done: true };

  const admin = createAdminClient();
  const { data: priv } = await admin
    .from("restaurant_private")
    .select("notification_email, notification_phone")
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  const email = input.email ?? priv?.notification_email ?? null;
  const rawPhone = input.phone ?? priv?.notification_phone ?? null;
  const phone = rawPhone && /^[6-9]\d{9}$/.test(rawPhone) ? rawPhone : null;

  const { data: saved, error } = await admin
    .from("support_requests")
    .insert({
      kind: "restaurant",
      restaurant_id: restaurant.id,
      name: restaurant.name,
      contact_email: email,
      contact_phone: phone,
      topic: input.topic,
      message: input.message,
    })
    .select("id")
    .single();
  if (error || !saved) return { error: "We couldn't send your message. Please try again, or use WhatsApp or email." };

  after(() =>
    emailNewSupportRequest({
      id: saved.id,
      kind: "restaurant",
      topic: input.topic,
      message: input.message,
      name: restaurant.name,
      contact_email: email,
      contact_phone: phone,
      restaurant_name: restaurant.name,
    }),
  );
  revalidatePath("/admin/support");
  return { done: true };
}

// ---------------------------------------------------------------------- admin inbox

export type SupportUpdateState = { error?: string; saved?: boolean } | undefined;

// Admin: mark a request answered / closed / open again, and keep a private note.
export async function updateSupportRequest(_prev: SupportUpdateState, formData: FormData): Promise<SupportUpdateState> {
  const admin = await requireAdmin();
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "") as SupportStatus;
  const note = String(formData.get("note") ?? "").trim().slice(0, 600);
  if (!isUuid(id) || !SUPPORT_STATUSES.includes(status)) return { error: "That change isn't allowed." };

  const now = new Date().toISOString();
  const service = createAdminClient();
  const { data: current } = await service.from("support_requests").select("status, answered_at").eq("id", id).maybeSingle();
  if (!current) return { error: "Request not found." };

  const { error } = await service
    .from("support_requests")
    .update({
      status,
      admin_note: note || null,
      handled_by: admin.id,
      answered_at: status === "open" ? null : (current.answered_at ?? now),
    })
    .eq("id", id);
  if (error) return { error: "Could not save. Please try again." };

  if (current.status !== status) {
    await logAdminAction(admin, {
      action: "support.status",
      summary: `Marked a help request ${status}`,
      targetType: "support_request",
      targetId: id,
    });
  }
  revalidatePath("/admin/support", "layout");
  return { saved: true };
}
