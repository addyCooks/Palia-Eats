"use client";

import { useState } from "react";
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

// Checkout and the cart have their own big button at the bottom, so no tabs there.
export function hidesTabBar(pathname: string): boolean {
  return pathname.startsWith("/checkout") || pathname.startsWith("/cart");
}

// One slow, soft curve for the whole tab change.
const MORPH = "duration-700 ease-[cubic-bezier(0.4,0,0.2,1)]";

// The floating dark pill of tabs at the bottom of customer pages on phones and tablets
// (v2 "PE Tabbar"): the active tab expands with a saffron fill and its name. The old tab
// folds away while the new one opens (the name slides open instead of popping in), and it
// starts the moment you tap, without waiting for the next page to arrive. The cart is the
// last tab, with its item count; the account button lives in the top bar. On laptops the
// header carries the same links instead.
export function BottomTabBar() {
  const pathname = usePathname();
  const { count } = useCart();
  // The tab just tapped, while its page is still on the way (ignored once the page changes).
  const [tapped, setTapped] = useState<{ href: string; from: string } | null>(null);

  if (hidesTabBar(pathname)) return null;

  const pendingHref = tapped && tapped.from === pathname ? tapped.href : null;

  return (
    <nav
      aria-label="Main"
      className="fixed bottom-6 left-1/2 z-30 flex h-16 -translate-x-1/2 items-center gap-1.5 rounded-full bg-[#16120D] px-2 shadow-[0_10px_30px_rgba(0,0,0,.22)] lg:hidden dark:bg-[#2A241C]"
    >
      {TABS.map(({ href, label, icon: Icon, match }) => {
        const active = pendingHref ? href === pendingHref : match(pathname);
        return (
          <Link
            key={label}
            href={href}
            aria-label={label}
            aria-current={active ? "page" : undefined}
            data-cart-target={label === "Cart" ? "" : undefined}
            onClick={() => setTapped({ href, from: pathname })}
            // (no `press` class here: it would override this transition with a faster one)
            className={`relative flex h-12 items-center justify-center rounded-full text-sm font-semibold transition-[background-color,color,padding] ${MORPH} ${
              active ? "bg-brand px-[18px] text-on-brand" : "px-[14.5px] text-[#A39B90] hover:text-white"
            }`}
          >
            <Icon className="size-[19px] shrink-0" strokeWidth={1.9} aria-hidden />
            {/* The name opens like a drawer (width 0 -> its own width) and fades in as it goes.
                52px is a little wider than the longest name, so the drawer ends at its natural size. */}
            <span
              aria-hidden
              className={`overflow-hidden whitespace-nowrap transition-[max-width,margin,opacity] ${MORPH} ${
                active ? "ml-2 max-w-[52px] opacity-100" : "ml-0 max-w-0 opacity-0"
              }`}
            >
              {label}
            </span>
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
