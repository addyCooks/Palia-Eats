"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type SidebarItem = {
  href: string;
  label: string;
  badge?: string;
  match?: "exact" | "prefix";
  // Other pages that belong under this item (e.g. the message log under Settings)
  also?: string[];
};

function isActive(pathname: string, item: SidebarItem) {
  if (item.also?.some((path) => pathname === path || pathname.startsWith(`${path}/`))) return true;
  if (item.match === "exact") return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}

// "PALIA · PARTNER" / "PALIA · ADMIN" over the "Eats" wordmark with a saffron dot.
export function SidebarWordmark({ kicker, href }: { kicker: string; href: string }) {
  return (
    <Link href={href} className="flex flex-col px-2 leading-none text-white">
      <span className="text-[9px] font-semibold tracking-[3px] text-brand">{kicker}</span>
      <span className="flex items-center gap-[3px] font-display text-[28px]">
        Eats
        <span className="size-2 rounded-full bg-brand" aria-hidden />
      </span>
    </Link>
  );
}

// The 240px dark sidebar of the restaurant panel and the admin, on laptops and tablets
// in landscape. Phones get a bottom bar (panel) or a scrolling top bar (admin) instead.
export function Sidebar({
  kicker,
  homeHref,
  items,
  footer,
}: {
  kicker: string;
  homeHref: string;
  items: SidebarItem[];
  footer?: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-7 overflow-y-auto bg-[#16120D] px-[18px] py-7 text-white lg:flex dark:bg-[#0E0C09]">
      <SidebarWordmark kicker={kicker} href={homeHref} />
      <nav aria-label="Main" className="flex flex-col gap-1">
        {items.map((item) => {
          const active = isActive(pathname, item);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex h-11 items-center justify-between rounded-[10px] px-3.5 text-sm font-medium transition-colors ${
                active ? "bg-brand text-on-brand" : "text-[#D8D2C8] hover:bg-white/5 hover:text-white"
              }`}
            >
              {item.label}
              {item.badge && <span className="text-xs font-bold">{item.badge}</span>}
            </Link>
          );
        })}
      </nav>
      {footer && <div className="mt-auto flex flex-col gap-3">{footer}</div>}
    </aside>
  );
}

// Phones and portrait tablets: the same links as a sideways-scrolling row of chips.
export function TopNav({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="scrollbar-none -mx-4 flex gap-1.5 overflow-x-auto px-4 pb-3">
      {items.map((item) => {
        const active = isActive(pathname, item);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex h-9 shrink-0 items-center gap-1.5 rounded-[10px] px-3.5 text-[13px] font-medium ${
              active ? "bg-brand text-on-brand" : "text-[#D8D2C8] hover:text-white"
            }`}
          >
            {item.label}
            {item.badge && (
              <span className={`text-xs font-bold ${active ? "" : "text-brand"}`}>{item.badge}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
