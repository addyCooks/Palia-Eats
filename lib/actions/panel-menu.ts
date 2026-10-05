"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPanelRestaurant } from "@/lib/panel/session";
import { isUuid, parseCategoryForm, parseMenuItemForm } from "@/lib/validation/menu";
import type { MenuFormState } from "@/lib/actions/menu";

// Menu editing for the restaurant panel. The restaurant has no account, so these use the
// service-role client and EVERY query is limited to the restaurant found from the signed
// panel link. A restaurant id sent by the browser is never trusted.

const SESSION_EXPIRED = "Your session has expired. Please open the link from your email again.";
const MAX_PRICE = 100_000;

async function refresh(slug: string) {
  revalidatePath("/panel/menu");
  revalidatePath(`/restaurants/${slug}`);
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
  if (parsed.data.price > MAX_PRICE) return { error: "That price looks too high." };
  if (!(await categoryBelongsTo(restaurant.id, parsed.data.category_id))) {
    return { error: "Please choose a category." };
  }

  // Photos are uploaded by PaliaEats, so a new dish starts without one.
  const { error } = await createAdminClient()
    .from("menu_items")
    .insert({ restaurant_id: restaurant.id, ...parsed.data, image_url: null });
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
  if (parsed.data.price > MAX_PRICE) return { error: "That price looks too high." };
  if (!(await categoryBelongsTo(restaurant.id, parsed.data.category_id))) {
    return { error: "Please choose a category." };
  }

  // Keep the existing photo: the panel can't change it.
  const { image_url: _ignored, ...changes } = parsed.data;
  void _ignored;
  const { data, error } = await createAdminClient()
    .from("menu_items")
    .update(changes)
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
