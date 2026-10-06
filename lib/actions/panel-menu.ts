"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPanelRestaurant } from "@/lib/panel/session";
import { isOwnImageUrl, isUuid, parseCategoryForm, parseMenuItemForm } from "@/lib/validation/menu";
import { detectImageType, MAX_UPLOAD_BYTES } from "@/lib/validation/image";
import type { MenuFormState } from "@/lib/actions/menu";

// Menu editing for the restaurant panel. The restaurant has no account, so these use the
// service-role client and EVERY query is limited to the restaurant found from the signed
// panel link. A restaurant id sent by the browser is never trusted.

const SESSION_EXPIRED = "Your session has expired. Please open the link from your email again.";
const BUCKET = "restaurant-media";

async function refresh(slug: string) {
  revalidatePath("/panel/menu");
  revalidatePath(`/restaurants/${slug}`);
}

// A photo is only accepted if it sits in THIS restaurant's own folder of our bucket.
function photoBelongsTo(restaurantId: string, url: string | null): boolean {
  if (!url) return true;
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${restaurantId}/`;
  return isOwnImageUrl(url) && url.startsWith(prefix) && !url.slice(prefix.length).includes("..");
}

// Dish photo upload from the panel (the browser can't upload directly: no account).
// The file is checked by its actual bytes, not by the name or type the browser claims.
export async function panelUploadDishPhoto(formData: FormData): Promise<{ url?: string; error?: string }> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: SESSION_EXPIRED };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { error: "Please choose a photo." };
  if (file.size > MAX_UPLOAD_BYTES) return { error: "That photo is too large. Maximum size is 2 MB." };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = detectImageType(bytes);
  if (!type) return { error: "Please choose a JPG, PNG or WebP photo." };

  const path = `${restaurant.id}/menu/${randomUUID()}.${type.extension}`;
  const storage = createAdminClient().storage.from(BUCKET);
  const { error } = await storage.upload(path, bytes, { contentType: type.mime, upsert: false });
  if (error) return { error: "Upload failed. Please try again." };

  return { url: storage.getPublicUrl(path).data.publicUrl };
}

// ---------------------------------------------------------------- categories

export async function panelCreateCategory(
  _prev: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: SESSION_EXPIRED };

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { error } = await createAdminClient()
    .from("menu_categories")
    .insert({ restaurant_id: restaurant.id, ...parsed.data });
  if (error) return { error: "Could not add the category. Please try again." };

  await refresh(restaurant.slug);
  return { saved: true };
}

export async function panelUpdateCategory(
  _prev: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: SESSION_EXPIRED };

  const categoryId = String(formData.get("categoryId") ?? "");
  if (!isUuid(categoryId)) return { error: "Missing category." };

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const { data, error } = await createAdminClient()
    .from("menu_categories")
    .update(parsed.data)
    .eq("id", categoryId)
    .eq("restaurant_id", restaurant.id)
    .select("id");
  if (error || !data?.length) return { error: "Could not save the category." };

  await refresh(restaurant.slug);
  return { saved: true };
}

export async function panelDeleteCategory(
  _prev: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: SESSION_EXPIRED };

  const categoryId = String(formData.get("categoryId") ?? "");
  if (!isUuid(categoryId)) return { error: "Missing category." };

  const { error } = await createAdminClient()
    .from("menu_categories")
    .delete()
    .eq("id", categoryId)
    .eq("restaurant_id", restaurant.id);

  if (error) {
    // 23503 = foreign key violation: the category still has items
    if (error.code === "23503") return { error: "Move or delete this category's items first." };
    return { error: "Could not delete the category." };
  }

  await refresh(restaurant.slug);
  return { saved: true };
}

// --------------------------------------------------------------------- items

// A dish may only go into one of THIS restaurant's categories.
async function categoryBelongsTo(restaurantId: string, categoryId: string): Promise<boolean> {
  const { data } = await createAdminClient()
    .from("menu_categories")
    .select("id")
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  return Boolean(data);
}

export async function panelCreateItem(
  _prev: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: SESSION_EXPIRED };

  const parsed = parseMenuItemForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  if (!photoBelongsTo(restaurant.id, parsed.data.image_url)) return { error: "Invalid photo. Please upload it again." };
  if (!(await categoryBelongsTo(restaurant.id, parsed.data.category_id))) {
    return { error: "Please choose a category." };
  }

  const { error } = await createAdminClient()
    .from("menu_items")
    .insert({ restaurant_id: restaurant.id, ...parsed.data });
  if (error) return { error: "Could not add the item. Please try again." };

  await refresh(restaurant.slug);
  redirect("/panel/menu");
}

export async function panelUpdateItem(
  _prev: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return { error: SESSION_EXPIRED };

  const itemId = String(formData.get("itemId") ?? "");
  if (!isUuid(itemId)) return { error: "Missing item." };

  const parsed = parseMenuItemForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  if (!(await categoryBelongsTo(restaurant.id, parsed.data.category_id))) {
    return { error: "Please choose a category." };
  }

  // The photo may stay as it was (even one PaliaEats uploaded), or be one this restaurant
  // just uploaded into its own folder.
  const { data: current } = await createAdminClient()
    .from("menu_items")
    .select("image_url")
    .eq("id", itemId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  const photo = parsed.data.image_url;
  if (photo && photo !== current?.image_url && !photoBelongsTo(restaurant.id, photo)) {
    return { error: "Invalid photo. Please upload it again." };
  }

  const { data, error } = await createAdminClient()
    .from("menu_items")
    .update(parsed.data)
    .eq("id", itemId)
    .eq("restaurant_id", restaurant.id)
    .select("id");
  if (error || !data?.length) return { error: "Could not save the item. Please try again." };

  await refresh(restaurant.slug);
  return { saved: true };
}

export async function panelDeleteItem(formData: FormData): Promise<void> {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const itemId = String(formData.get("itemId") ?? "");
  if (!isUuid(itemId)) throw new Error("Missing item.");

  const { error } = await createAdminClient()
    .from("menu_items")
    .delete()
    .eq("id", itemId)
    .eq("restaurant_id", restaurant.id);
  if (error) throw new Error("Could not delete the item.");

  await refresh(restaurant.slug);
  redirect("/panel/menu");
}
