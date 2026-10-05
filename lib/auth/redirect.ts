import type { UserRole } from "@/types/app";

// Only allow redirecting to a path on our own site ("/orders", not "https://evil.com"
// or "//evil.com"). Prevents "open redirect" tricks through ?next=...
export function safeNextPath(next: string | null | undefined): string | null {
  if (!next) return null;
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return null;
  }
  return next;
}

// Where to send someone after logging in.
export function postLoginPath(next: string | null | undefined, role: UserRole) {
  return safeNextPath(next) ?? (role === "admin" ? "/admin" : "/");
}
