"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Receipt, Search, ShoppingBag, User } from "lucide-react";
import { useCart } from "@/components/cart/useCart";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/#search", label: "Search", icon: Search, match: () => false },
  { href: "/cart", label: "Cart", icon: ShoppingBag, match: (p: string) => p.startsWith("/cart") },
  { href: "/orders", label: "Orders", icon: Receipt, match: (p: string) => p.startsWith("/orders") },
  { href: "/account", label: "Account", icon: User, match: (p: string) => p.startsWith("/account") },
] as const;

// The floating pill of tabs at the bottom of customer pages on phones and tablets.
// The active tab shows its name; the others are icons on small phones (labels from 768px up).
// On laptops the header carries the same links instead.
export function BottomTabBar() {
  const pathname = usePathname();
  const { count } = useCart();

  // Checkout needs full attention (and its own big button), so no tabs there.
  if (pathname.startsWith("/checkout")) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-2.5 bottom-3.5 z-30 flex justify-between gap-1 rounded-full border border-border bg-surface p-1.5 shadow-float md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:justify-center lg:hidden"
    >
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        const badge = label === "Cart" && count > 0 ? count : null;
        return (
          <Link
            key={label}
            href={href}
            aria-label={badge ? `${label}, ${badge} items` : label}
            aria-current={active ? "page" : undefined}
            className={`relative flex h-12 items-center justify-center gap-2 rounded-full text-sm font-bold transition-colors ${
              active
                ? "bg-brand-dark px-5 text-on-brand"
                : "w-12 text-stone-500 hover:bg-muted md:w-auto md:px-4"
            }`}
          >
            <Icon className="size-[18px]" aria-hidden />
            <span className={active ? "" : "hidden md:inline"}>{label}</span>
            {badge && (
              <span className="absolute right-1 top-1 flex min-w-4 items-center justify-center rounded-full bg-brand px-1 text-[10px] font-extrabold leading-4 text-on-brand md:static md:ml-0.5">
                {badge}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
