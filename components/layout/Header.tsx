import Link from "next/link";
import { MapPin } from "lucide-react";
import { getProfile } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { CartButton } from "@/components/cart/CartButton";
import { NavLinks, OrdersLink } from "@/components/layout/NavLinks";
import { Wordmark } from "@/components/layout/Wordmark";
import { ThemeToggle } from "@/components/ThemeToggle";

function DeliveringTo() {
  return (
    <span className="flex items-center gap-2 text-[13px]">
      <MapPin className="size-[18px] text-accent" aria-hidden />
      <span className="flex flex-col leading-[1.15]">
        <span className="text-[10px] text-stone-500">Delivering to</span>
        <span className="font-semibold">Palia Kalan</span>
      </span>
    </span>
  );
}

// Top bar of the customer pages (v2 "PE Nav"): location and account on the left, Menu ·
// logo · Restaurants in the middle, My orders and the dark cart button on the right.
// Phones get just the location, the logo and the cart; the tab bar carries the rest.
export async function Header({ className = "" }: { className?: string }) {
  const profile = await getProfile();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? null;

  return (
    <header className={`sticky top-0 z-30 bg-background/90 backdrop-blur ${className}`}>
      {/* Laptop */}
      <div className="mx-auto hidden h-[90px] w-full max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center px-12 lg:grid">
        <div className="flex items-center gap-7">
          <DeliveringTo />
          {profile ? (
            <details className="relative">
              <summary className="flex cursor-pointer list-none items-center gap-2 text-[13px] marker:content-none">
                <span className="grid size-7 place-items-center rounded-full bg-amber-100 text-xs font-bold text-amber-800">
                  {(firstName ?? "•").charAt(0).toUpperCase()}
                </span>
                <span className="flex flex-col leading-[1.15]">
                  <span className="text-[10px] text-stone-500">Logged in</span>
                  <span className="font-semibold">{firstName ?? "Your account"} ▾</span>
                </span>
              </summary>
              <div className="absolute left-0 top-11 z-40 flex w-48 flex-col rounded-2xl bg-surface p-1.5 text-sm shadow-float">
                <Link href="/account" className="rounded-lg px-3 py-2 hover:bg-muted">
                  My account
                </Link>
                <Link href="/account/addresses" className="rounded-lg px-3 py-2 hover:bg-muted">
                  Saved addresses
                </Link>
                {profile.role === "admin" && (
                  <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-muted">
                    Admin
                  </Link>
                )}
                <form action={logout}>
                  <button type="submit" className="w-full rounded-lg px-3 py-2 text-left text-accent hover:bg-muted">
                    Log out
                  </button>
                </form>
              </div>
            </details>
          ) : (
            <Link href="/login" className="flex items-center gap-2 text-[13px] font-semibold hover:text-accent">
              <span className="grid size-7 place-items-center rounded-full bg-amber-100 text-amber-800">→</span>
              Log in
            </Link>
          )}
        </div>

        <NavLinks />

        <div className="flex items-center justify-end gap-4">
          <OrdersLink loggedIn={Boolean(profile)} />
          <ThemeToggle />
          <CartButton />
        </div>
      </div>

      {/* Phones and tablets */}
      <div className="flex h-16 items-center justify-between gap-3 px-4 lg:hidden">
        <DeliveringTo />
        <Wordmark size="sm" />
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <CartButton compact />
        </div>
      </div>
    </header>
  );
}
