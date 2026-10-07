import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelOrders } from "@/lib/queries/panel";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { formatClock, formatLongToday } from "@/lib/utils/time";
import { compactRupees, formatMinutes } from "@/lib/orders/stats";
import { OpenClosedSwitch } from "@/components/panel/OpenClosedSwitch";
import { LiveUpdates } from "@/components/LiveUpdates";
import { OrderAlerts } from "@/components/panel/OrderAlerts";
import { KanbanBoard } from "@/components/panel/KanbanBoard";
import { PageHeader } from "@/components/ui/page";

export default async function PanelOrdersPage() {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const { active, delivered, stats } = await getPanelOrders(restaurant.id);
  const newOrderCount = active.filter((order) => order.status === "pending").length;
  const now = new Date().toISOString();

  const figures = [
    { label: "Today", value: String(stats.orders) },
    { label: "Sales", value: compactRupees(stats.sales) },
    { label: "Avg prep", value: formatMinutes(stats.avgPrep) },
  ];

  return (
    <>
      {/* On a laptop the sidebar has this switch; on a phone it sits on top */}
      <div className="lg:hidden">
        <OpenClosedSwitch
          accepting={restaurant.is_accepting_orders}
          status={getRestaurantStatus(restaurant)}
          settingUp={restaurant.setting_up}
        />
      </div>

      <PageHeader title="Live orders" sub={`${formatLongToday()} · ${formatClock(now)}`}>
        {figures.map((figure) => (
          <div key={figure.label} className="flex min-w-[88px] flex-col rounded-[14px] bg-surface px-4 py-2.5 shadow-card">
            <span className="text-xs text-stone-500">{figure.label}</span>
            <span className="text-[22px] font-bold tabular-nums">{figure.value}</span>
          </div>
        ))}
      </PageHeader>

      <div className="flex flex-wrap items-center justify-end gap-3">
        {/* New orders and status changes arrive over a live connection */}
        <LiveUpdates panelTopic={restaurant.realtime_topic} showStatus />
        <OrderAlerts newOrderCount={newOrderCount} />
      </div>

      <KanbanBoard orders={[...active, ...delivered]} />
    </>
  );
}
