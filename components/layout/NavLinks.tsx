"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Wordmark } from "@/components/layout/Wordmark";
import { useT } from "@/lib/i18n/client";

const linkClass = (active: boolean) =>
  `border-b-2 pb-1 text-sm font-medium transition-colors hover:text-accent ${active ? "border-brand" : "border-transparent"}`;

// Middle of the laptop header: Menu · logo · Restaurants, underlined in saffron when active.
export function NavLinks() {
  const t = useT();
  const pathname = usePathname();
  return (
    <nav aria-label={t("nav.main")} className="flex items-center gap-12">
      <Link href="/#popular" className={linkClass(pathname === "/")}>
        {t("nav.menu")}
      </Link>
      <Wordmark />
      <Link href="/#restaurants" className={linkClass(pathname.startsWith("/restaurants"))}>
        {t("nav.restaurants")}
      </Link>
    </nav>
  );
}

export function OrdersLink({ loggedIn }: { loggedIn: boolean }) {
  const t = useT();
  const pathname = usePathname();
  return (
    <Link href={loggedIn ? "/orders" : "/login?next=/orders"} className={linkClass(pathname.startsWith("/orders"))}>
      {t("nav.my_orders")}
    </Link>
  );
}
