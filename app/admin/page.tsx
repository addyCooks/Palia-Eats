import type { Metadata } from "next";
import Link from "next/link";
import {
  countRecentNotificationProblems,
  getAdminBreakdown,
  getAdminOverview,
} from "@/lib/queries/admin";
import { formatPrice } from "@/lib/utils/format";
import { LiveUpdates } from "@/components/LiveUpdates";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const [stats, breakdown, problems] = await Promise.all([
    getAdminOverview(),
    getAdminBreakdown(),
    countRecentNotificationProblems(),
  ]);

  const tiles = [
    { label: "Active orders now", value: String(stats.activeOrders), href: "/admin/orders" },
    { label: "Orders today", value: String(stats.ordersToday), href: "/admin/orders?show=all" },
    { label: "Sales today", value: formatPrice(stats.salesToday), note: "excluding cancelled" },
    { label: "Orders, all time", value: String(stats.totalOrders), href: "/admin/orders?show=all" },
    { label: "Restaurants", value: String(stats.restaurants), href: "/admin/restaurants" },
    { label: "Customers", value: String(stats.customers), href: "/admin/customers" },
    {
      label: "Email problems (24h)",
      value: String(problems),
      href: "/admin/notifications",
      note: problems > 0 ? "needs a look" : "all good",
    },
  ];

  return (
    <>
      {/* The numbers change the moment an order is placed or updated */}
      <LiveUpdates tables={[{ table: "orders" }]} />
      <h1 className="text-2xl font-bold">Overview</h1>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {tiles.map((tile) => {
          const content = (
            <Card className="flex h-full flex-col gap-1 transition-colors hover:bg-muted">
              <span className="text-sm text-stone-600">{tile.label}</span>
              <span className="text-2xl font-bold">{tile.value}</span>
              {tile.note && <span className="text-xs text-stone-500">{tile.note}</span>}
            </Card>
          );
          return (
            <li key={tile.label}>
              {tile.href ? <Link href={tile.href}>{content}</Link> : content}
            </li>
          );
        })}
      </ul>

      <h2 className="mb-3 mt-10 text-lg font-semibold">Last 30 days</h2>
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-3">
          <h3 className="font-semibold">By restaurant</h3>
          {breakdown.restaurants.length === 0 ? (
            <p className="text-sm text-stone-500">No orders yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {breakdown.restaurants.map((row) => (
                <li key={row.name} className="flex items-center justify-between gap-3">
                  <span className="truncate font-medium">{row.name}</span>
                  <span className="shrink-0 text-stone-600">
                    {row.orders} {row.orders === 1 ? "order" : "orders"} · {formatPrice(row.sales)}
                    {row.cancelled > 0 ? ` · ${row.cancelled} cancelled` : ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="flex flex-col gap-3">
          <h3 className="font-semibold">By channel</h3>
          {breakdown.channels.length === 0 ? (
            <p className="text-sm text-stone-500">No orders yet.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {breakdown.channels.map((row) => (
                <li key={row.channel} className="flex items-center justify-between gap-3">
                  <span className="font-medium">{row.channel === "whatsapp" ? "WhatsApp" : "Website"}</span>
                  <span className="text-stone-600">
                    {row.orders} {row.orders === 1 ? "order" : "orders"} · {formatPrice(row.sales)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
      <p className="mt-3 text-xs text-stone-500">Sales exclude cancelled orders.</p>
    </>
  );
}
