"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ClipboardList, History, Settings, UtensilsCrossed } from "lucide-react";

const TABS = [
  { href: "/panel", label: "Orders", icon: ClipboardList },
  { href: "/panel/menu", label: "Menu", icon: UtensilsCrossed },
  { href: "/panel/history", label: "History", icon: History },
  { href: "/panel/settings", label: "Settings", icon: Settings },
] as const;

// The restaurant panel's bottom bar: four big, glanceable tabs (works on a phone or a tablet
// propped up in the kitchen).
export function PanelNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Panel" className="fixed inset-x-0 bottom-0 z-30 bg-chrome">
      <div className="mx-auto grid h-[76px] max-w-3xl grid-cols-4 px-2 pb-3 pt-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/panel" ? pathname === "/panel" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-bold transition-colors ${
                active ? "text-[#F07A3A]" : "text-[#8F8478] hover:text-[#D8CCBC]"
              }`}
            >
              <Icon className="size-5" aria-hidden />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
