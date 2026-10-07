import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { countNewPanelOrders } from "@/lib/queries/panel";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { PanelNav } from "@/components/panel/PanelNav";
import { SetupBanner } from "@/components/panel/SetupBanner";
import { SidebarAcceptingCard } from "@/components/panel/SidebarAcceptingCard";
import { Sidebar } from "@/components/shell/Sidebar";
import { ThemeToggle } from "@/components/ThemeToggle";

// Every page in the panel passes through here: no valid link/cookie, no entry.
export default async function PanelLayout({ children }: LayoutProps<"/panel">) {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const status = getRestaurantStatus(restaurant);
  const live = status.canOrder && !restaurant.setting_up;
  const newOrders = await countNewPanelOrders(restaurant.id);

  const items = [
    { href: "/panel", label: "Live orders", match: "exact" as const, badge: newOrders > 0 ? String(newOrders) : undefined },
    { href: "/panel/history", label: "Order history" },
    { href: "/panel/menu", label: "Menu" },
    { href: "/panel/sales", label: "Sales" },
    { href: "/panel/settings", label: "Settings", also: ["/panel/share"] },
  ];

  return (
    <div className="flex min-h-full flex-1 bg-background">
      <Sidebar
        kicker="PALIA · PARTNER"
        homeHref="/panel"
        items={items}
        footer={
          <>
            {!restaurant.setting_up && (
              <SidebarAcceptingCard name={restaurant.name} accepting={restaurant.is_accepting_orders} />
            )}
            <ThemeToggle className="self-start text-[#D8D2C8] hover:bg-white/10" />
          </>
        }
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Phones and tablets: a dark bar on top and the tab bar at the bottom */}
        <header className="bg-chrome text-white lg:hidden">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-3 px-4 pb-4 pt-5">
            <div className="min-w-0">
              <p className="text-[9px] font-semibold tracking-[3px] text-brand">PALIA · PARTNER</p>
              <p className="truncate font-display text-[22px] leading-tight">{restaurant.name}</p>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span
                className={`flex h-[30px] items-center gap-2 rounded-full px-3 text-xs font-bold ${
                  live ? "bg-brand text-on-brand" : "bg-[#2A241C] text-[#D8D2C8]"
                }`}
              >
                <span className={`size-[7px] rounded-full ${live ? "bg-[#1A1206]" : "bg-[#D8D2C8]"}`} aria-hidden />
                {restaurant.setting_up
                  ? "Setting up"
                  : restaurant.is_accepting_orders
                    ? live
                      ? "Accepting"
                      : "Closed now"
                    : "Paused"}
              </span>
              <ThemeToggle className="text-white hover:bg-white/10" />
            </div>
          </div>
        </header>

        <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-5 px-4 py-5 pb-28 lg:max-w-none lg:gap-6 lg:px-8 lg:py-7 lg:pb-10">
          {restaurant.setting_up && <SetupBanner name={restaurant.name} />}
          {children}
        </main>
        <PanelNav newOrders={newOrders} />
      </div>
    </div>
  );
}
