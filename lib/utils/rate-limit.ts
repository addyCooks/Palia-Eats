import "server-only";
import { createHash } from "node:crypto";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientId } from "@/lib/utils/client-ip";

// Spam and brute-force protection. Every call counts one hit against a key in the database
// (public.hit_rate_limit) and says whether the caller is still under the limit.
// If the counter itself is unavailable we let the person through: a broken counter must never
// stop someone from ordering or logging in.
export async function allow(key: string, max: number, windowSeconds: number): Promise<boolean> {
  try {
    const { data, error } = await createAdminClient().rpc("hit_rate_limit", {
      p_key: key,
      p_max: max,
      p_window_seconds: windowSeconds,
    });
    if (error) return true;
    return data !== false;
  } catch {
    return true;
  }
}

// Same, but counted per visitor connection: allowFromHere("signup", 6, 3600).
export async function allowFromHere(scope: string, max: number, windowSeconds: number): Promise<boolean> {
  return allow(`${scope}:${await clientId()}`, max, windowSeconds);
}

// For keys built from something typed in (an email address): hashed, so the table never holds it.
export function keyFor(scope: string, value: string): string {
  return `${scope}:${createHash("sha256").update(value.trim().toLowerCase()).digest("hex").slice(0, 24)}`;
}

export const TOO_MANY = "Too many tries. Please wait a few minutes and try again.";
