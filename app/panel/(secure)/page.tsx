import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelOrders } from "@/lib/queries/panel";
import { updateOrderStatus } from "@/lib/actions/panel";
import { LiveUpdates } from "@/components/LiveUpdates";
import { OrderAlerts } from "@/components/panel/OrderAlerts";
import { StaffOrderCard } from "@/components/order/StaffOrderCard";

export default async function PanelOrdersPage() {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const { active, recent } = await getPanelOrders(restaurant.id);
  const newOrderCount = active.filter((order) => order.status === "pending").length;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold">
          Active orders{" "}
          <span className="text-base font-normal text-stone-500">({active.length})</span>
        </h1>
        <div className="flex items-center gap-3">
          {/* New orders and status changes arrive over a live connection */}
          <LiveUpdates panelTopic={restaurant.realtime_topic} showStatus />
          <OrderAlerts newOrderCount={newOrderCount} />
        </div>
      </div>

      {active.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
          No active orders right now. New orders appear here automatically.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {active.map((order) => (
            <li key={order.id}>
              <StaffOrderCard order={order} updateStatus={updateOrderStatus} />
            </li>
          ))}
        </ul>
      )}

      {recent.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-bold">Recent orders</h2>
          <ul className="flex flex-col gap-4">
            {recent.map((order) => (
              <li key={order.id}>
                <StaffOrderCard order={order} updateStatus={updateOrderStatus} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
