import type { Metadata } from "next";
import Link from "next/link";
import { getAdminOrders, type AdminOrderFilter } from "@/lib/queries/admin";
import { adminUpdateOrderStatus } from "@/lib/actions/admin-orders";
import { LiveUpdates } from "@/components/LiveUpdates";
import { StaffOrderCard } from "@/components/order/StaffOrderCard";

export const metadata: Metadata = { title: "Orders" };

const TABS: { key: AdminOrderFilter; label: string }[] = [
  { key: "active", label: "Active" },
  { key: "done", label: "Delivered & cancelled" },
  { key: "all", label: "All" },
];

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const { show } = await searchParams;
  const filter: AdminOrderFilter = show === "all" || show === "done" ? show : "active";

  const orders = await getAdminOrders(filter);

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        <LiveUpdates tables={[{ table: "orders" }]} showStatus />
      </div>

      <nav aria-label="Order filter" className="mt-4 flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "active" ? "/admin/orders" : `/admin/orders?show=${tab.key}`}
            aria-current={tab.key === filter ? "page" : undefined}
            className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
              tab.key === filter
                ? "border-brand bg-brand text-on-brand"
                : "border-border bg-surface hover:bg-muted"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </nav>

      {orders.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
          No orders here yet.
        </p>
      ) : (
        <ul className="mt-6 grid gap-4 lg:grid-cols-2">
          {orders.map((order) => (
            <li key={order.id}>
              <StaffOrderCard
                order={order}
                restaurantName={order.restaurants?.name}
                updateStatus={adminUpdateOrderStatus}
              />
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs text-stone-500">Showing up to the latest 50 orders. Updates instantly.</p>
    </>
  );
}
