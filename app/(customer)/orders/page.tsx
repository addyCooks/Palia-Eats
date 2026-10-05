import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyOrders } from "@/lib/queries/orders";
import { formatDateTime, formatPrice } from "@/lib/utils/format";
import { LiveUpdates } from "@/components/LiveUpdates";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "My orders" };

export default async function OrdersPage() {
  const profile = await requireUser("/orders");
  const orders = await getMyOrders();

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8">
      <LiveUpdates tables={[{ table: "orders", filter: `customer_id=eq.${profile.id}` }]} />
      <h1 className="text-2xl font-bold">My orders</h1>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <p className="text-stone-600">You haven&apos;t placed any orders yet.</p>
          <Link href="/" className="rounded-xl bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark">
            Browse restaurants
          </Link>
        </div>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {orders.map((order) => (
            <li key={order.id}>
              <Link href={`/orders/${order.id}`}>
                <Card className="flex flex-col gap-2 transition-colors hover:bg-muted">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{order.restaurants?.name ?? "Restaurant"}</p>
                      <p className="text-sm text-stone-500">
                        Order #{order.order_number} · {formatDateTime(order.placed_at)}
                      </p>
                    </div>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="text-sm text-stone-600">
                    {order.order_items.map((item) => `${item.quantity} × ${item.item_name}`).join(", ")}
                  </p>
                  <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
