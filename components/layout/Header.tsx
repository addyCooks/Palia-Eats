import Link from "next/link";
import { MapPin } from "lucide-react";
import { getProfile } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { CartLink } from "@/components/cart/CartLink";
import { ThemeToggle } from "@/components/ThemeToggle";

function initials(name: string | null): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "•";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

// Top bar of every customer page. On phones and tablets the main links live in the floating
// tab bar at the bottom instead, so here we keep just the logo, area and a profile shortcut.
export async function Header() {
  const profile = await getProfile();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between gap-3 px-4">
        <div className="flex min-w-0 items-center gap-3">
          <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
            Palia<span className="text-brand-dark">Eats</span>
          </Link>
          <span className="hidden items-center gap-1 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-stone-600 sm:inline-flex">
            <MapPin className="size-3.5 text-brand-dark" aria-hidden />
            Delivering in Palia
          </span>
        </div>

        <nav className="flex items-center gap-1 text-sm font-medium">
          <ThemeToggle />

          {/* Laptop navigation (phones and tablets use the bottom tab bar) */}
          <span className="hidden items-center gap-1 lg:flex">
            <CartLink />
            {profile?.role === "admin" && (
              <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-muted">
                Admin
              </Link>
            )}
            {profile && (
              <>
                <Link href="/orders" className="rounded-lg px-3 py-2 hover:bg-muted">
                  Orders
                </Link>
                <Link href="/account" className="rounded-lg px-3 py-2 hover:bg-muted">
                  Account
                </Link>
                <form action={logout}>
                  <Button type="submit" variant="ghost" size="sm">
                    Log out
                  </Button>
                </form>
              </>
            )}
          </span>

          {profile ? (
            <Link
              href="/account"
              aria-label="Your account"
              className="flex size-10 items-center justify-center rounded-full border border-border bg-surface text-xs font-extrabold lg:hidden"
            >
              {initials(profile.full_name)}
            </Link>
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 hover:bg-muted">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-brand-dark px-4 py-2 font-semibold text-on-brand hover:bg-brand"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
