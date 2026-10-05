import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { OpenClosedSwitch } from "@/components/panel/OpenClosedSwitch";

// Every page in the panel passes through here: no valid link/cookie, no entry.
export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const status = getRestaurantStatus(restaurant);

  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 w-full max-w-3xl items-center justify-between gap-3 px-4">
          <p className="truncate font-bold">{restaurant.name}</p>
          <nav className="flex items-center gap-1 text-sm">
            <Link href="/panel" className="rounded-lg px-3 py-2 hover:bg-muted">
              Orders
            </Link>
            <Link href="/panel/menu" className="rounded-lg px-3 py-2 hover:bg-muted">
              Menu
            </Link>
            <Link
              href={`/restaurants/${restaurant.slug}`}
              className="rounded-lg px-3 py-2 text-stone-500 hover:bg-muted"
              target="_blank"
            >
              My page ↗
            </Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-6">
        <OpenClosedSwitch accepting={restaurant.is_accepting_orders} status={status} />
        {children}
      </main>
    </>
  );
}
