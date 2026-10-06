"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import {
  isUuid,
  parseCategoryForm,
  parseMenuItemForm,
} from "@/lib/validation/menu";

export type MenuFormState = { error?: string; saved?: boolean } | undefined;

const menuPath = (restaurantId: string) => `/admin/restaurants/${restaurantId}/menu`;

// Also refresh the public storefront if the restaurant exists.
async function refreshStorefront(restaurantId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("restaurants")
    .select("slug")
    .eq("id", restaurantId)
    .maybeSingle();
  if (data) revalidatePath(`/restaurants/${data.slug}`);
}

function readRestaurantId(formData: FormData): string | null {
  const id = String(formData.get("restaurantId") ?? "");
  return isUuid(id) ? id : null;
}

// ---------------------------------------------------------------- categories

export async function createCategory(
  _prev: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  await requireAdmin();
  const restaurantId = readRestaurantId(formData);
  if (!restaurantId) return { error: "Missing restaurant." };

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_categories")
    .insert({ restaurant_id: restaurantId, ...parsed.data });
  if (error) return { error: "Could not add the category. Please try again." };

  revalidatePath(menuPath(restaurantId));
  await refreshStorefront(restaurantId);
  return { saved: true };
}

export async function updateCategory(
  _prev: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  await requireAdmin();
  const restaurantId = readRestaurantId(formData);
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!restaurantId || !isUuid(categoryId)) return { error: "Missing category." };

  const parsed = parseCategoryForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_categories")
    .update(parsed.data)
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId);
  if (error) return { error: "Could not save the category." };

  revalidatePath(menuPath(restaurantId));
  await refreshStorefront(restaurantId);
  return { saved: true };
}

export async function deleteCategory(
  _prev: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  await requireAdmin();
  const restaurantId = readRestaurantId(formData);
  const categoryId = String(formData.get("categoryId") ?? "");
  if (!restaurantId || !isUuid(categoryId)) return { error: "Missing category." };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_categories")
    .delete()
    .eq("id", categoryId)
    .eq("restaurant_id", restaurantId);

  if (error) {
    // 23503 = foreign key violation: the category still has items
    if (error.code === "23503") {
      return { error: "Move or delete this category's items first." };
    }
    return { error: "Could not delete the category." };
  }

  revalidatePath(menuPath(restaurantId));
  await refreshStorefront(restaurantId);
  return { saved: true };
}

// --------------------------------------------------------------------- items

export async function createMenuItem(
  _prev: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  await requireAdmin();
  const restaurantId = readRestaurantId(formData);
  if (!restaurantId) return { error: "Missing restaurant." };

  const parsed = parseMenuItemForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .insert({ restaurant_id: restaurantId, ...parsed.data });
  if (error) return { error: "Could not add the item. Please try again." };

  revalidatePath(menuPath(restaurantId));
  await refreshStorefront(restaurantId);
  redirect(menuPath(restaurantId));
}

export async function updateMenuItem(
  _prev: MenuFormState,
  formData: FormData,
): Promise<MenuFormState> {
  await requireAdmin();
  const restaurantId = readRestaurantId(formData);
  const itemId = String(formData.get("itemId") ?? "");
  if (!restaurantId || !isUuid(itemId)) return { error: "Missing item." };

  const parsed = parseMenuItemForm(formData);
  if (!parsed.ok) return { error: parsed.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .update(parsed.data)
    .eq("id", itemId)
    .eq("restaurant_id", restaurantId);
  if (error) return { error: "Could not save the item. Please try again." };

  revalidatePath(menuPath(restaurantId));
  await refreshStorefront(restaurantId);
  return { saved: true };
}

export async function deleteMenuItem(formData: FormData) {
  await requireAdmin();
  const restaurantId = readRestaurantId(formData);
  const itemId = String(formData.get("itemId") ?? "");
  if (!restaurantId || !isUuid(itemId)) throw new Error("Missing item.");

  const supabase = await createClient();
  const { error } = await supabase
    .from("menu_items")
    .delete()
    .eq("id", itemId)
    .eq("restaurant_id", restaurantId);
  if (error) throw new Error("Could not delete the item.");

  revalidatePath(menuPath(restaurantId));
  await refreshStorefront(restaurantId);
  redirect(menuPath(restaurantId));
}

// The in-stock switch in the admin's menu table.
export async function adminSetItemAvailability(input: {
  itemId: string;
  available: boolean;
}): Promise<{ error?: string }> {
  await requireAdmin();
  if (!isUuid(String(input?.itemId))) return { error: "Missing item." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("menu_items")
    .update({ is_available: Boolean(input.available) })
    .eq("id", input.itemId)
    .select("restaurant_id");
  if (error || !data?.length) return { error: "Could not update the item." };

  revalidatePath(menuPath(data[0].restaurant_id));
  await refreshStorefront(data[0].restaurant_id);
  return {};
}
