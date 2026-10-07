"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, Home, Search, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/useCart";

const TABS = [
  { href: "/", label: "Home", icon: Home, match: (p: string) => p === "/" },
  { href: "/search", label: "Search", icon: Search, match: (p: string) => p.startsWith("/search") },
  { href: "/orders", label: "Orders", icon: ClipboardList, match: (p: string) => p.startsWith("/orders") },
  { href: "/cart", label: "Cart", icon: ShoppingBag, match: (p: string) => p.startsWith("/cart") },
] as const;

// The floating dark pill of tabs at the bottom of customer pages on phones and tablets
// (v2 "PE Tabbar"): the active tab expands with a saffron fill and its name. The cart is
// the last tab, with its item count; the account button lives in the top bar. On
// laptops the header carries the same links instead.
export function BottomTabBar() {
  const pathname = usePathname();
  const { count } = useCart();

  // Checkout and the cart have their own big button at the bottom, so no tabs there.
  if (pathname.startsWith("/checkout") || pathname.startsWith("/cart")) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-6 left-1/2 z-30 flex h-16 -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#16120D] px-2 shadow-[0_10px_30px_rgba(0,0,0,.22)] lg:hidden dark:bg-[#2A241C]"
    >
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = match(pathname);
        return (
          <Link
            key={label}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            data-cart-target={label === "Cart" ? "" : undefined}
            className={`press relative flex h-12 min-w-12 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-all duration-500 ${
              active ? "bg-brand px-[18px] text-on-brand" : "text-[#A39B90] hover:text-white"
            }`}
          >
            <Icon className="size-[19px]" strokeWidth={1.9} aria-hidden />
            {active && <span className="anim-fade-in">{label}</span>}
            {label === "Cart" && count > 0 && (
              <span
                key={count}
                className="anim-bump absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1 text-[11px] font-bold text-on-brand ring-2 ring-[#16120D] dark:ring-[#2A241C]"
              >
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
