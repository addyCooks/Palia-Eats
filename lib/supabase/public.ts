import { createClient } from "@supabase/supabase-js";

// A Supabase client with no login cookies, for pages that are the same for everyone (link
// preview pictures). Acts as an anonymous visitor, so it can only read what the public website
// can read. Because it never touches cookies, such pages can be built once and cached.
export function createPublicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
