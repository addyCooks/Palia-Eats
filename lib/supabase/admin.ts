import "server-only";
import { createClient } from "@supabase/supabase-js";

// Supabase client with the SERVICE-ROLE key. It BYPASSES Row Level Security.
//
// Rules:
// - Server-only: the "server-only" import above makes the build fail if any
//   Client Component ever imports this file.
// - Use it only in Server Actions / Route Handlers for: admin tasks and the
//   restaurant panel (always scoped to a restaurant found from its secret key).
// - Never use it for ordinary customer reads/writes.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
}
