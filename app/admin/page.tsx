import type { Metadata } from "next";
import Link from "next/link";
import { countRecentNotificationProblems, getAdminDashboard, type DashboardRange } from "@/lib/queries/admin";
import { compactRupees, formatMinutes, percentChange, signed } from "@/lib/orders/stats";
import { formatClock, formatLongToday } from "@/lib/utils/time";
import { LiveUpdates } from "@/components/LiveUpdates";
import { getRealtimeToken } from "@/lib/auth/session";
import { Bars, Kpi, PageHeader, Panel, param } from "@/components/ui/page";

export const metadata: Metadata = { title: "Admin" };

const RANGES: { key: DashboardRange; label: string; compare: string }[] = [
  { key: "today", label: "Today", compare: "vs last week" },
  { key: "week", label: "Week", compare: "vs previous week" },
  { key: "month", label: "Month", compare: "vs previous 30 days" },
];

export default async function AdminHomePage({ searchParams }: PageProps<"/admin">) {
  const raw = param((await searchParams).range);
  const range = RANGES.find((r) => r.key === raw) ?? RANGES[0];

  const [stats, problems] = await Promise.all([getAdminDashboard(range.key), countRecentNotificationProblems()]);
  const peak = Math.max(1, ...stats.hourBars.map((bar) => bar.orders));
  const deliveryDelta =
    stats.delivery.now !== null && stats.delivery.before !== null
      ? `${signed(stats.delivery.now - stats.delivery.before)} min`
      : undefined;

  return (
    <>
      {/* The numbers change the moment an order is placed or updated */}
      <LiveUpdates tables={[{ table: "orders" }]} accessToken={await getRealtimeToken()} />

      <PageHeader
        title={range.key === "today" ? "Today in Palia" : range.key === "week" ? "This week in Palia" : "This month in Palia"}
        sub={`${formatLongToday()} · updated ${formatClock(new Date().toISOString())}`}
      >
        <nav aria-label="Time range" className="flex rounded-[10px] bg-surface p-[3px] shadow-card">
          {RANGES.map((r) => (
            <Link
              key={r.key}
              href={r.key === "today" ? "/admin" : `/admin?range=${r.key}`}
              aria-current={r.key === range.key ? "page" : undefined}
              className={`flex h-[34px] items-center rounded-lg px-3.5 text-[13px] font-semibold ${
                r.key === range.key ? "bg-deep text-brand" : "text-stone-600 hover:text-foreground"
              }`}
            >
              {r.label}
            </Link>
          ))}
        </nav>
      </PageHeader>

      {(stats.activeOrders > 0 || problems > 0) && (
        <div className="flex flex-wrap gap-2.5">
          {stats.activeOrders > 0 && (
            <Link
              href="/admin/orders"
              className="inline-flex h-10 items-center gap-2 rounded-xl bg-amber-50 px-4 text-sm font-semibold text-amber-900 hover:bg-amber-100"
            >
              <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden />
              {stats.activeOrders} {stats.activeOrders === 1 ? "order" : "orders"} in progress →
            </Link>
          )}
          {problems > 0 && (
            <Link
              href="/admin/notifications?show=problems"
              className="inline-flex h-10 items-center rounded-xl bg-red-100 px-4 text-sm font-semibold text-red-700 hover:bg-red-200"
            >
              {problems} email / WhatsApp {problems === 1 ? "problem" : "problems"} in the last 24 h →
            </Link>
          )}
        </div>
      )}

      <div className="stagger grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi
          dark
          size="md"
          label="Orders"
          value={String(stats.orders.now)}
          delta={percentChange(stats.orders.now, stats.orders.before, range.compare) || "No earlier orders to compare"}
        />
        <Kpi
          size="md"
          label="Revenue"
          value={compactRupees(stats.revenue.now)}
          delta={percentChange(stats.revenue.now, stats.revenue.before, range.compare) || undefined}
        />
        <Kpi
          size="md"
          label="Active restaurants"
          value={`${stats.restaurants.open} / ${stats.restaurants.total}`}
          delta={
            stats.restaurants.total - stats.restaurants.open > 0
              ? `${stats.restaurants.total - stats.restaurants.open} closed right now`
              : "All open"
          }
        />
        <Kpi size="md" label="Avg delivery" value={formatMinutes(stats.delivery.now)} delta={deliveryDelta} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Orders by hour">
          <Bars
            bars={stats.hourBars.map((bar) => ({
              label: bar.label,
              value: bar.orders,
              display: bar.orders > 0 ? String(bar.orders) : undefined,
              tone: bar.orders >= peak * 0.9 && bar.orders > 0 ? "hot" : bar.orders >= peak * 0.5 && bar.orders > 0 ? "high" : "low",
            }))}
          />
        </Panel>
        <Panel title="Top restaurants">
          {stats.topRestaurants.length === 0 ? (
            <p className="text-sm text-stone-500">No orders in this period yet.</p>
          ) : (
            <ol className="flex flex-col gap-3">
              {stats.topRestaurants.map((restaurant, i) => (
                <li key={restaurant.name} className="flex items-center gap-3 text-sm">
                  <span className="grid size-[26px] shrink-0 place-items-center rounded-[7px] bg-amber-50 text-xs font-bold text-amber-800">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{restaurant.name}</span>
                  <span className="shrink-0 text-stone-600">
                    {restaurant.orders} {restaurant.orders === 1 ? "order" : "orders"}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Panel>
      </div>
      <p className="text-xs text-stone-500">
        Orders and revenue leave out cancelled orders. Avg delivery is from placing the order to delivery.
      </p>
    </>
  );
}
