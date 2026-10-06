import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Search } from "lucide-react";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelHistory } from "@/lib/queries/panel";
import { formatPrice } from "@/lib/utils/format";
import { formatClock, formatDayLabel, istDateKey, todayKeyIST } from "@/lib/utils/time";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "History" };

export default async function PanelHistoryPage({ searchParams }: PageProps<"/panel/history">) {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q : "";
  const { stats, orders, searching } = await getPanelHistory(restaurant.id, search);

  // Group the list by Indian calendar day: "Today", then earlier days.
  const todayKey = todayKeyIST();
  const groups: { key: string; label: string; orders: typeof orders }[] = [];
  for (const order of orders) {
    const key = istDateKey(order.placed_at);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: key === todayKey ? "Today" : formatDayLabel(order.placed_at), orders: [] };
      groups.push(group);
    }
    group.orders.push(order);
  }

  const figures = [
    { label: "Today", value: String(stats.orders) },
    { label: "Collected", value: formatPrice(stats.collected) },
    { label: "Cancelled", value: String(stats.cancelled) },
  ];

  return (
    <>
      <h1 className="font-display text-2xl font-extrabold">History</h1>

      <form role="search" className="flex gap-2">
        <label className="flex h-12 flex-1 items-center gap-2.5 rounded-xl bg-surface px-3.5 shadow-card focus-within:ring-2 focus-within:ring-brand/30">
          <Search className="size-4 shrink-0 text-stone-500" aria-hidden />
          <span className="sr-only">Search by order number, name or phone</span>
          <input
            name="q"
            defaultValue={search}
            placeholder="Order number, name or phone"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-500"
          />
        </label>
        <button
          type="submit"
          className="h-12 rounded-xl bg-brand-dark px-5 text-sm font-bold text-on-brand hover:bg-brand"
        >
          Search
        </button>
      </form>

      <dl className="grid grid-cols-3 gap-2 rounded-2xl bg-chrome p-4 text-white">
        {figures.map((figure) => (
          <div key={figure.label}>
            <dt className="text-[11px] text-[#B8AC9D]">{figure.label}</dt>
            <dd className="text-lg font-extrabold tabular-nums">{figure.value}</dd>
          </div>
        ))}
      </dl>
      <p className="-mt-3 text-xs text-stone-500">
        Today&apos;s numbers. &ldquo;Collected&rdquo; is the cash on delivered orders.
      </p>

      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
          {searching ? "No orders match that search." : "No orders yet. They will show up here."}
        </p>
      ) : (
        groups.map((group) => (
          <section key={group.key} className="flex flex-col gap-2.5">
            <h2 className="text-xs font-extrabold tracking-wider text-stone-500">{group.label.toUpperCase()}</h2>
            <ul className="flex flex-col gap-2.5">
              {group.orders.map((order) => (
                <li key={order.id}>
                  <Card className="flex flex-col gap-1.5 rounded-2xl border-0 p-3.5 shadow-card">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-bold tabular-nums">#{order.order_number}</span>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-sm font-semibold">
                      {order.order_items.map((item) => `${item.quantity}× ${item.item_name}`).join(", ")}
                    </p>
                    <div className="flex items-center justify-between gap-3 text-[13px] text-stone-600">
                      <span className="min-w-0 truncate">
                        {order.customer_name} · {formatClock(order.placed_at)}
                        {order.channel === "whatsapp" ? " · WhatsApp" : ""}
                      </span>
                      <b className="shrink-0 tabular-nums text-foreground">{formatPrice(order.total)}</b>
                    </div>
                    {order.rejection_reason && (
                      <p className="text-xs text-red-700">Cancelled: {order.rejection_reason}</p>
                    )}
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
      <p className="text-xs text-stone-500">Showing up to the latest 80 orders.</p>
    </>
  );
}
