import Link from "next/link";
import { MapPin, UserRound } from "lucide-react";
import { getProfile } from "@/lib/auth/session";
import { logout } from "@/lib/actions/auth";
import { CartButton } from "@/components/cart/CartButton";
import { NavLinks, OrdersLink } from "@/components/layout/NavLinks";
import { Wordmark } from "@/components/layout/Wordmark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SubmitButton } from "@/components/ui/SubmitButton";

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

// Top bar of the customer pages (v2 "PE Nav"): location and the cart on the left, Menu ·
// logo · Restaurants in the middle, My orders and the account on the right.
// Phones get the location, the logo and the account; the cart is in the bottom tab bar.
export async function Header({ className = "" }: { className?: string }) {
  const profile = await getProfile();
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? null;

  return (
    <header className={`sticky top-0 z-30 bg-background/90 backdrop-blur ${className}`}>
      {/* Laptop */}
      <div className="mx-auto hidden h-[90px] w-full max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center px-12 lg:grid">
        <div className="flex items-center gap-7">
          <DeliveringTo />
          <CartButton />
        </div>

        <NavLinks />

        <div className="flex items-center justify-end gap-4">
          <OrdersLink loggedIn={Boolean(profile)} />
          <ThemeToggle />
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
              <div className="anim-pop-in absolute right-0 top-11 z-40 flex w-48 flex-col rounded-2xl bg-surface p-1.5 text-sm shadow-float">
                <Link href="/account" className="rounded-lg px-3 py-2 hover:bg-muted">
                  My account
                </Link>
                <Link href="/account/addresses" className="rounded-lg px-3 py-2 hover:bg-muted">
                  Saved addresses
                </Link>
                <Link href="/account/favourites" className="rounded-lg px-3 py-2 hover:bg-muted">
                  Favourites
                </Link>
                {profile.role === "admin" && (
                  <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-muted">
                    Admin
                  </Link>
                )}
                <form action={logout}>
                  <SubmitButton pendingText="Logging out…" className="w-full rounded-lg px-3 py-2 text-left text-accent hover:bg-muted">
                    Log out
                  </SubmitButton>
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
      </div>

      {/* Phones and tablets */}
      <div className="flex h-16 items-center justify-between gap-3 px-4 lg:hidden">
        <DeliveringTo />
        <Wordmark size="sm" />
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href={profile ? "/account" : "/login"}
            aria-label={profile ? "My account" : "Log in"}
            className="press grid size-11 place-items-center rounded-xl bg-[#16120D] font-display text-lg text-brand shadow-[0_8px_20px_rgba(0,0,0,.18)] dark:bg-[#2A241C]"
          >
            {firstName ? firstName.charAt(0).toUpperCase() : <UserRound className="size-[18px]" aria-hidden />}
          </Link>
        </div>
      </div>
    </header>
  );
}
