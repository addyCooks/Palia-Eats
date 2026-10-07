import { getCurrentUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

// For the closed screen: can this visitor get an email reminder, and have they asked?
export type ReminderState = {
  signedIn: boolean;
  on: boolean;
  email: string | null; // null: logged out, or an account without a real email
};

export async function getReminderState(restaurantId: string): Promise<ReminderState> {
  const user = await getCurrentUser();
  if (!user) return { signedIn: false, on: false, email: null };

  const email = user.email && !user.email.endsWith(".invalid") ? user.email : null;
  const { data } = await (await createClient())
    .from("open_reminders")
    .select("restaurant_id")
    .eq("restaurant_id", restaurantId)
    .maybeSingle();
  return { signedIn: true, on: Boolean(data), email };
}
