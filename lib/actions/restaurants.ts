"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { parseRestaurantForm, type RestaurantInput } from "@/lib/validation/restaurant";
import { createPanelToken } from "@/lib/panel/token";
import { getOrigin } from "@/lib/utils/origin";

export type RestaurantFormState = { error?: string; saved?: boolean } | undefined;
export type PanelKeyState = { error?: string; link?: string } | undefined;

// The public `restaurants` columns, built from the validated form.
function publicColumns(input: RestaurantInput, existingTheme: object = {}) {
  return {
    name: input.name,
    tagline: input.tagline,
    description: input.description,
    about: input.about,
    cuisine_tags: input.cuisine_tags,
    phone: input.phone,
    address_text: input.address_text,
    opening_time: input.opening_time,
    closing_time: input.closing_time,
    closed_days: input.closed_days,
    min_order_amount: input.min_order_amount,
    delivery_fee: input.delivery_fee,
    theme: { ...existingTheme, brand: input.brand, brandDark: input.brandDark },
    template_key: input.template_key,
    logo_url: input.logo_url,
    cover_url: input.cover_url,
    is_active: input.is_active,
    is_accepting_orders: input.is_accepting_orders,
    area: input.area,
  };
}

// The admin-only `restaurant_private` columns.
function privateColumns(input: RestaurantInput) {
  return {
    notification_email: input.notification_email,
    notification_phone: input.notification_phone,
    owner_name: input.owner_name,
    // COMMISSION OFF: commission_percent: input.commission_percent,
    // Made visible: no longer "setting up" (see 0015_restaurant_applications.sql)
    ...(input.is_active ? { setting_up: false } : {}),
  };
}

export async function createRestaurant(
  _prev: RestaurantFormState,
  formData: FormData,
): Promise<RestaurantFormState> {
  await requireAdmin();

  const parsed = parseRestaurantForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const input = parsed.data;

  const supabase = await createClient();
  const { data: created, error } = await supabase
    .from("restaurants")
    .insert({ slug: input.slug, ...publicColumns(input) })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { error: `The web address "${input.slug}" is already used. Pick another.` };
    }
    return { error: "Could not create the restaurant. Please try again." };
  }

  // A private row is created automatically by a database trigger; fill it in.
  await supabase.from("restaurant_private").update(privateColumns(input)).eq("restaurant_id", created.id);

  revalidatePath("/admin/restaurants");
  redirect(`/admin/restaurants/${created.id}`);
}

export async function updateRestaurant(
  _prev: RestaurantFormState,
  formData: FormData,
): Promise<RestaurantFormState> {
  await requireAdmin();

  const id = String(formData.get("restaurantId") ?? "");
  if (!id) return { error: "Missing restaurant." };

  const parsed = parseRestaurantForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const input = parsed.data;

  const supabase = await createClient();

  // Keep any theme settings we don't edit here (gallery, fonts, ...).
  const { data: current } = await supabase
    .from("restaurants")
    .select("slug, theme")
    .eq("id", id)
    .single();
  if (!current) return { error: "Restaurant not found." };

  const { error } = await supabase
    .from("restaurants")
    .update(publicColumns(input, current.theme ?? {}))
    .eq("id", id);
  if (error) return { error: "Could not save changes. Please try again." };

  const { error: privateError } = await supabase
    .from("restaurant_private")
    .update(privateColumns(input))
    .eq("restaurant_id", id);
  if (privateError) return { error: "Could not save notification details." };

  revalidatePath("/admin/restaurants", "layout");
  revalidatePath(`/restaurants/${current.slug}`);
  revalidatePath("/");
  return { saved: true };
}

// "Pause orders" / "Resume orders" on the restaurant detail page.
export async function adminSetAccepting(input: { restaurantId: string; accepting: boolean }): Promise<{ error?: string }> {
  await requireAdmin();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurants")
    .update({ is_accepting_orders: Boolean(input.accepting) })
    .eq("id", String(input?.restaurantId))
    .select("slug");
  if (error || !data?.length) return { error: "Could not change this. Please try again." };

  revalidatePath("/admin/restaurants", "layout");
  revalidatePath(`/restaurants/${data[0].slug}`);
  revalidatePath("/");
  return {};
}

// Creates a new panel link. Moving "valid since" to now cancels EVERY older link,
// including the ones already sitting in old order emails.
export async function generateRestaurantPanelKey(
  _prev: PanelKeyState,
  formData: FormData,
): Promise<PanelKeyState> {
  await requireAdmin();

  const id = String(formData.get("restaurantId") ?? "");
  if (!id) return { error: "Missing restaurant." };

  const now = new Date();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("restaurant_private")
    .update({
      panel_key_created_at: now.toISOString(),
      // A new secret live-ping channel too, so anyone with an old link stops getting pings
      realtime_topic: randomBytes(16).toString("hex"),
    })
    .eq("restaurant_id", id)
    .select("restaurant_id");

  if (error || !data?.length) {
    return { error: "Could not create the panel link. Please try again." };
  }

  revalidatePath(`/admin/restaurants/${id}`);
  const origin = await getOrigin();
  const token = createPanelToken(id, now, 180); // this link is good for about 6 months
  return { link: `${origin}/panel/enter/${token}` };
}
