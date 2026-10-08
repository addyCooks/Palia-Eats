"use server";

import { randomBytes } from "node:crypto";
import { after } from "next/server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import {
  emailApplicationApproved,
  emailApplicationReceived,
  emailApplicationRejected,
  emailNewApplication,
  type Application,
} from "@/lib/email/application-emails";
import { createPanelToken } from "@/lib/panel/token";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { slugify } from "@/lib/utils/format";
import { getOrigin } from "@/lib/utils/origin";
import { parseApplicationForm } from "@/lib/validation/application";
import { isUuid } from "@/lib/validation/menu";

// ------------------------------------------------------------------ public form

export type ApplyState = { error?: string; done?: { name: string; email: string } } | undefined;

const MAX_REQUESTS_PER_HOUR = 20; // all visitors together: stops a flood of junk

// "Add your restaurant": saved by the server (visitors can't touch the table).
export async function submitApplication(_prev: ApplyState, formData: FormData): Promise<ApplyState> {
  // Bots fill every field, including this hidden one. Pretend it worked.
  if (String(formData.get("website") ?? "").trim()) return { done: { name: "your restaurant", email: "" } };

  const parsed = parseApplicationForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const input = parsed.data;

  const admin = createAdminClient();
  const [{ count: samePhone }, { count: sameEmail }, { count: lastHour }] = await Promise.all([
    admin
      .from("restaurant_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("phone", input.phone),
    admin
      .from("restaurant_applications")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending")
      .eq("email", input.email),
    admin
      .from("restaurant_applications")
      .select("id", { count: "exact", head: true })
      .gte("created_at", new Date(Date.now() - 3_600_000).toISOString()),
  ]);
  if ((samePhone ?? 0) + (sameEmail ?? 0) > 0) {
    return { error: "We already have a request from this phone number or email. We'll be in touch soon." };
  }
  if ((lastHour ?? 0) >= MAX_REQUESTS_PER_HOUR) {
    return { error: "We're getting a lot of requests right now. Please try again in an hour." };
  }

  const { data, error } = await admin.from("restaurant_applications").insert(input).select("*").single();
  if (error || !data) return { error: "We couldn't send your request. Please try again." };

  after(async () => {
    await emailNewApplication(data as Application);
    await emailApplicationReceived(data as Application);
  });
  revalidatePath("/admin", "layout");
  return { done: { name: input.restaurant_name, email: input.email } };
}

// ------------------------------------------------------------------ admin

export type DecideState = { error?: string; approved?: { restaurantId: string; emailed: boolean } } | undefined;

// Approve: create the restaurant in "setting up" mode (hidden, panel works), and email
// the owner their panel link.
export async function approveApplication(_prev: DecideState, formData: FormData): Promise<DecideState> {
  const profile = await requireAdmin();
  const id = String(formData.get("applicationId") ?? "");
  if (!isUuid(id)) return { error: "Missing request." };

  const slug = slugify(String(formData.get("slug") ?? ""));
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug) || slug.length > 60) {
    return { error: "Pick a web address with letters, numbers and dashes (for example shahi-rasoi)." };
  }
  // COMMISSION OFF
  // const commission = Number(formData.get("commission_percent") ?? 8);
  // if (!Number.isFinite(commission) || commission < 0 || commission > 100) {
  //   return { error: "Commission must be between 0 and 100%." };
  // }

  // Claim the request first, so a double click can't create the restaurant twice.
  const now = new Date();
  const supabase = await createClient();
  const { data: app } = await supabase
    .from("restaurant_applications")
    .update({ status: "approved", decided_at: now.toISOString(), decided_by: profile.id })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (!app) return { error: "This request has already been handled." };
  const release = () =>
    supabase.from("restaurant_applications").update({ status: "pending", decided_at: null, decided_by: null }).eq("id", id);

  const { data: restaurant, error } = await supabase
    .from("restaurants")
    .insert({
      slug,
      name: app.restaurant_name,
      cuisine_tags: app.cuisines ?? [],
      phone: app.phone,
      address_text: app.address,
      area: app.area,
      opening_time: app.opening_time,
      closing_time: app.closing_time,
      is_active: false,
      is_accepting_orders: true,
    })
    .select("id")
    .single();
  if (error || !restaurant) {
    await release();
    if (error?.code === "23505") return { error: `The web address "${slug}" is already used. Pick another.` };
    return { error: "Could not create the restaurant. Please try again." };
  }

  // The private row is made by a database trigger: fill it in and open the panel.
  const { error: privateError } = await supabase
    .from("restaurant_private")
    .update({
      owner_name: app.owner_name,
      notification_email: app.email,
      notification_phone: app.phone,
      // COMMISSION OFF: commission_percent: Math.round(commission * 100) / 100,
      setting_up: true,
      panel_key_created_at: now.toISOString(),
      realtime_topic: randomBytes(16).toString("hex"),
    })
    .eq("restaurant_id", restaurant.id);
  if (privateError) return { error: "The restaurant was created but its details could not be saved. Open it and check." };

  await supabase.from("restaurant_applications").update({ restaurant_id: restaurant.id }).eq("id", id);

  const panelLink = `${await getOrigin()}/panel/enter/${createPanelToken(restaurant.id, now, 180)}`;
  const emailed = await emailApplicationApproved(app as Application, panelLink);

  revalidatePath("/admin", "layout");
  return { approved: { restaurantId: restaurant.id, emailed } };
}

export async function rejectApplication(_prev: DecideState, formData: FormData): Promise<DecideState> {
  const profile = await requireAdmin();
  const id = String(formData.get("applicationId") ?? "");
  if (!isUuid(id)) return { error: "Missing request." };
  const reason = String(formData.get("reason") ?? "").trim().slice(0, 300) || null;

  const supabase = await createClient();
  const { data: app } = await supabase
    .from("restaurant_applications")
    .update({ status: "rejected", decided_at: new Date().toISOString(), decided_by: profile.id, reject_reason: reason })
    .eq("id", id)
    .eq("status", "pending")
    .select("*")
    .maybeSingle();
  if (!app) return { error: "This request has already been handled." };

  after(() => emailApplicationRejected(app as Application, reason));
  revalidatePath("/admin", "layout");
  return {};
}

// "Make visible": a restaurant that was setting up goes on the website.
export async function adminMakeVisible(input: { restaurantId: string }): Promise<{ error?: string }> {
  await requireAdmin();
  const id = String(input?.restaurantId);
  if (!isUuid(id)) return { error: "Missing restaurant." };

  const supabase = await createClient();
  const { data, error } = await supabase.from("restaurants").update({ is_active: true }).eq("id", id).select("slug");
  if (error || !data?.length) return { error: "Could not change this. Please try again." };
  await supabase.from("restaurant_private").update({ setting_up: false }).eq("restaurant_id", id);

  revalidatePath("/admin", "layout");
  revalidatePath(`/restaurants/${data[0].slug}`);
  revalidatePath("/");
  return {};
}
