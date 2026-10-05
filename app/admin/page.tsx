import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOverview } from "@/lib/queries/admin";
import { formatPrice } from "@/lib/utils/format";
import { LiveUpdates } from "@/components/LiveUpdates";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const stats = await getAdminOverview();

  const tiles = [
    { label: "Active orders now", value: String(stats.activeOrders), href: "/admin/orders" },
    { label: "Orders today", value: String(stats.ordersToday), href: "/admin/orders?show=all" },
    { label: "Sales today", value: formatPrice(stats.salesToday), note: "excluding cancelled" },
    { label: "Orders, all time", value: String(stats.totalOrders), href: "/admin/orders?show=all" },
    { label: "Restaurants", value: String(stats.restaurants), href: "/admin/restaurants" },
    { label: "Customers", value: String(stats.customers) },
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
    </>
  );
}
