import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelOrders } from "@/lib/queries/panel";
import { updateOrderStatus } from "@/lib/actions/panel";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { formatClock, formatLongToday } from "@/lib/utils/time";
import { compactRupees, formatMinutes } from "@/lib/orders/stats";
import { OpenClosedSwitch } from "@/components/panel/OpenClosedSwitch";
import { LiveUpdates } from "@/components/LiveUpdates";
import { OrderAlerts } from "@/components/panel/OrderAlerts";
import { KanbanOrderCard } from "@/components/panel/KanbanOrderCard";
import { PageHeader } from "@/components/ui/page";

const COLUMNS = [
  { key: "new", name: "New", dot: "bg-[#C2410C]", statuses: ["pending", "accepted"], empty: "New orders appear here." },
  { key: "cooking", name: "Cooking", dot: "bg-brand", statuses: ["preparing"], empty: "Nothing cooking." },
  { key: "way", name: "On the way", dot: "bg-[#15803D]", statuses: ["out_for_delivery"], empty: "Nothing out for delivery." },
] as const;

export default async function PanelOrdersPage() {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const { active, stats } = await getPanelOrders(restaurant.id);
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

      <div className="grid items-start gap-4 lg:grid-cols-3 lg:gap-[18px]">
        {COLUMNS.map((column) => {
          const orders = active.filter((order) => (column.statuses as readonly string[]).includes(order.status));
          return (
            <section key={column.key} aria-label={column.name} className="flex flex-col gap-3 rounded-[18px] bg-muted p-3.5">
              <div className="flex items-center justify-between px-1.5 py-1">
                <h2 className="flex items-center gap-2 font-semibold">
                  <span className={`size-2.5 rounded-full ${column.dot}`} aria-hidden />
                  {column.name}
                </h2>
                <span className="grid h-6 min-w-6 place-items-center rounded-[7px] bg-surface px-2 text-xs font-bold">
                  {orders.length}
                </span>
              </div>
              {orders.length === 0 ? (
                <p className="px-1.5 pb-2 text-sm text-stone-500">{column.empty}</p>
              ) : (
                orders.map((order) => <KanbanOrderCard key={order.id} order={order} updateStatus={updateOrderStatus} />)
              )}
            </section>
          );
        })}
      </div>
    </>
  );
}
