"use server";

import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/menu";

type Result = { error?: "login" | "failed" };

// Heart / un-heart a restaurant or a dish for the logged-in customer. The database only
// accepts the customer's own hearts, for restaurants and dishes on the website
// (see 0013_favourites.sql). Hearting twice is harmless.
export async function setFavourite(input: { kind: "restaurant" | "dish"; id: string; on: boolean }): Promise<Result> {
  const profile = await getProfile();
  if (!profile) return { error: "login" };

  const kind = input?.kind === "dish" ? "dish" : "restaurant";
  const id = String(input?.id);
  if (!isUuid(id)) return { error: "failed" };

  const supabase = await createClient();
  const table = kind === "dish" ? "favourite_dishes" : "favourite_restaurants";
  const column = kind === "dish" ? "menu_item_id" : "restaurant_id";

  const { error } = input.on
    ? await supabase.from(table).upsert({ user_id: profile.id, [column]: id }, { ignoreDuplicates: true })
    : await supabase.from(table).delete().eq("user_id", profile.id).eq(column, id);
  if (error) return { error: "failed" };

  revalidatePath("/account/favourites");
  return {};
}
