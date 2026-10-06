"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, ClipboardList, History, Settings, UtensilsCrossed } from "lucide-react";

const TABS = [
  { href: "/panel", label: "Orders", icon: ClipboardList },
  { href: "/panel/history", label: "History", icon: History },
  { href: "/panel/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/panel/sales", label: "Sales", icon: BarChart3 },
  { href: "/panel/settings", label: "Settings", icon: Settings },
] as const;

// The restaurant panel's bottom bar on phones and tablets: big, glanceable tabs (works on a
// phone or a tablet propped up in the kitchen). Laptops get the sidebar instead.
export function PanelNav({ newOrders = 0 }: { newOrders?: number }) {
  const pathname = usePathname();

  return (
    <nav aria-label="Panel" className="fixed inset-x-0 bottom-0 z-30 bg-chrome lg:hidden">
      <div className="mx-auto grid h-[76px] max-w-3xl grid-cols-5 px-2 pb-3 pt-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/panel" ? pathname === "/panel" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-semibold transition-colors ${
                active ? "text-brand" : "text-[#9C9386] hover:text-[#D8D2C8]"
              }`}
            >
              <Icon className="size-5" aria-hidden />
              {label}
              {href === "/panel" && newOrders > 0 && (
                <span className="absolute right-[calc(50%-20px)] top-1 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-brand px-1 text-[10px] font-bold text-on-brand">
                  {newOrders}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
