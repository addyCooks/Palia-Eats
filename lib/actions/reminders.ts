"use server";

import { getCurrentUser, getProfile } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/validation/menu";

type Result = { error?: "login" | "no_email" | "failed" };

// "Remind me when it opens" on the closed screen: one email when the restaurant opens
// again (sent by /api/cron/open-reminders). Asking twice is harmless.
export async function setOpenReminder(input: { restaurantId: string; on: boolean }): Promise<Result> {
  const profile = await getProfile();
  if (!profile) return { error: "login" };

  const restaurantId = String(input?.restaurantId);
  if (!isUuid(restaurantId)) return { error: "failed" };

  const supabase = await createClient();
  if (!input.on) {
    const { error } = await supabase
      .from("open_reminders")
      .delete()
      .eq("user_id", profile.id)
      .eq("restaurant_id", restaurantId);
    return error ? { error: "failed" } : {};
  }

  // WhatsApp-only accounts have no real email address to remind.
  const email = (await getCurrentUser())?.email;
  if (!email || email.endsWith(".invalid")) return { error: "no_email" };

  const { error } = await supabase
    .from("open_reminders")
    .upsert({ user_id: profile.id, restaurant_id: restaurantId }, { ignoreDuplicates: true });
  return error ? { error: "failed" } : {};
}
