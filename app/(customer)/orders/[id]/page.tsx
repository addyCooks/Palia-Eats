import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getMyOrder } from "@/lib/queries/orders";
import { isUuid } from "@/lib/validation/menu";
import { formatDateTime, formatPrice } from "@/lib/utils/format";
import { isOrderOverdue } from "@/lib/orders/overdue";
import { LiveUpdates } from "@/components/LiveUpdates";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Your order" };

export default async function OrderPage({
  params,
  searchParams,
}: PageProps<"/orders/[id]">) {
  const { id } = await params;
  await requireUser(`/orders/${id}`);
  if (!isUuid(id)) notFound();

  const order = await getMyOrder(id);
  if (!order) notFound();

  const { placed } = await searchParams;
  const restaurant = order.restaurants;
  const address = order.delivery_address;
  const overdue = isOrderOverdue(order.status, order.placed_at);
  const isActive = ["pending", "accepted", "preparing", "out_for_delivery"].includes(order.status);

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-8">

      {placed === "1" && (
        <p role="status" className="rounded-xl bg-green-50 p-4 text-green-900">
          <span className="font-semibold">Order placed!</span> {restaurant?.name ?? "The restaurant"} has
          received it and will start preparing it.
        </p>
      )}

      <div>
        <Link href="/orders" className="text-sm text-stone-500 hover:underline">
          ← My orders
        </Link>
        <div className="mt-2 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Order #{order.order_number}</h1>
            <p className="text-sm text-stone-500">Placed {formatDateTime(order.placed_at)}</p>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      {overdue && (
        <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          This is taking longer than usual.{" "}
          {restaurant?.phone ? (
            <>
              You can call {restaurant.name} on{" "}
              <a href={`tel:${restaurant.phone}`} className="font-semibold underline">
                {restaurant.phone}
              </a>
              .
            </>
          ) : (
            "Please try again in a few minutes."
          )}
        </p>
      )}

      {(order.status === "cancelled" || order.status === "rejected") ? (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          This order was cancelled.
          {order.rejection_reason ? ` Reason: ${order.rejection_reason}` : ""}
        </p>
      ) : (
        <Card>
          <OrderTimeline status={order.status} />
          {isActive && (
            <p className="mt-3 flex items-center justify-center gap-2 text-center text-xs text-stone-500">
              {/* Opens a live connection: the progress bar moves the moment the restaurant updates */}
              <LiveUpdates
                tables={[{ table: "orders", filter: `id=eq.${order.id}` }]}
                fallbackSeconds={30}
                showStatus
              />
              · updates instantly, no need to refresh
            </p>
          )}
        </Card>
      )}

      {restaurant && (
        <Card className="flex items-center justify-between gap-3 text-sm">
          <div>
            <p className="font-semibold">{restaurant.name}</p>
            <Link href={`/restaurants/${restaurant.slug}`} className="text-brand hover:underline">
              View menu
            </Link>
          </div>
          {restaurant.phone && (
            <a href={`tel:${restaurant.phone}`} className="font-medium text-brand hover:underline">
              Call {restaurant.phone}
            </a>
          )}
        </Card>
      )}

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">Items</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {order.order_items.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>
                {item.quantity} × {item.item_name}
              </span>
              <span>{formatPrice(item.line_total)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Subtotal</span>
            <span>{formatPrice(order.subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Delivery fee</span>
            <span>{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Free"}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(order.total)}</span>
          </div>
          <p className="text-stone-600">Pay in cash on delivery.</p>
        </div>
      </Card>

      <Card className="flex flex-col gap-1 text-sm">
        <h2 className="font-semibold">Delivering to</h2>
        <p className="font-medium">{address.label}</p>
        <p className="whitespace-pre-line text-stone-700">{address.address_line}</p>
        {address.landmark && <p className="text-stone-500">Landmark: {address.landmark}</p>}
        <p className="text-stone-500">
          {order.customer_name} · {order.customer_phone}
        </p>
        {order.customer_notes && (
          <p className="mt-2 rounded-lg bg-muted p-2 text-stone-700">Note: {order.customer_notes}</p>
        )}
      </Card>
    </main>
  );
}
