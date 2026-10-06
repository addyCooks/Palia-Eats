import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { PanelNav } from "@/components/panel/PanelNav";
import { ThemeToggle } from "@/components/ThemeToggle";

// Every page in the panel passes through here: no valid link/cookie, no entry.
export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const status = getRestaurantStatus(restaurant);
  const live = status.canOrder;

  return (
    <div className="flex min-h-full flex-1 flex-col bg-muted">
      <header className="bg-chrome text-white">
        <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pb-4 pt-5">
          <p className="truncate font-display text-[22px] font-extrabold">{restaurant.name}</p>
          <div className="flex shrink-0 items-center gap-1">
            <span
              className={`flex h-[34px] items-center gap-2 rounded-full px-3 text-[13px] font-extrabold ${
                live ? "bg-[#1F9D55]" : "bg-[#4A3F36]"
              }`}
            >
              <span className="size-[7px] rounded-full bg-white" aria-hidden />
              {restaurant.is_accepting_orders ? (live ? "Accepting" : "Closed now") : "Paused"}
            </span>
            <ThemeToggle className="text-white hover:bg-white/10" />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-5 pb-28">{children}</main>
      <PanelNav />
    </div>
  );
}
