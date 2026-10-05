import Link from "next/link";
import { getProfile } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { CartLink } from "@/components/cart/CartLink";

export async function Header() {
  const profile = await getProfile();

  return (
    <header className="border-b border-border bg-surface">
      <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Palia<span className="text-brand">Eats</span>
        </Link>

        <nav className="flex items-center gap-2 text-sm">
          <CartLink />
          {profile ? (
            <>
              {profile.role === "admin" && (
                <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-muted">
                  Admin
                </Link>
              )}
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
          ) : (
            <>
              <Link href="/login" className="rounded-lg px-3 py-2 hover:bg-muted">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-brand px-4 py-2 font-medium text-white hover:bg-brand-dark"
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
