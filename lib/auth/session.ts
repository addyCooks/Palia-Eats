import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/app";

// getUser() asks Supabase to verify the session, so it can be trusted.
// cache() makes repeated calls within one request free.
export const getCurrentUser = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  return data.user;
});

// The logged-in user's profile row (role, name, phone), or null if logged out.
export const getProfile = cache(async (): Promise<Profile | null> => {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, role, full_name, phone, whatsapp_opt_in")
    .eq("id", user.id)
    .single();

  return data;
});

// Use at the top of pages that need a logged-in user.
export async function requireUser(nextPath: string = "/") {
  const profile = await getProfile();
  if (!profile) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  return profile;
}

// Use at the top of every admin page / layout / server action.
export async function requireAdmin() {
  const profile = await getProfile();
  if (!profile) {
    redirect("/login?next=/admin");
  }
  if (profile.role !== "admin") {
    redirect("/");
  }
  return profile;
}
