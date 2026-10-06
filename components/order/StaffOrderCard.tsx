import { formatDateTime, formatPrice } from "@/lib/utils/format";
import type { OrderItem, Order } from "@/types/app";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { OrderActions, type UpdateOrderStatus } from "@/components/order/OrderActions";
import { Card } from "@/components/ui/Card";

type StaffOrderCardProps = {
  order: Order & { order_items: OrderItem[] };
  updateStatus: UpdateOrderStatus;
  restaurantName?: string; // shown in the admin, where orders from every restaurant mix
};

// One order as the restaurant (or the admin) sees it: what to cook, who to deliver to,
// and the button for the next step.
export function StaffOrderCard({ order, updateStatus, restaurantName }: StaffOrderCardProps) {
  const address = order.delivery_address;
  const isNew = order.status === "pending";

  return (
    <Card className={`flex flex-col gap-3 rounded-[18px] border-0 p-4 shadow-card ${isNew ? "ring-2 ring-brand" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          {isNew && (
            <p className="mb-0.5 flex items-center gap-1.5 text-xs font-bold tracking-wide text-accent">
              <span className="size-2 animate-pulse rounded-full bg-brand" aria-hidden />
              NEW ORDER
            </p>
          )}
          <p className="text-lg font-bold">Order #{order.order_number}</p>
          {restaurantName && <p className="text-sm font-medium text-accent">{restaurantName}</p>}
          <p className="text-sm text-stone-500">{formatDateTime(order.placed_at)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <ul className="flex flex-col gap-1 border-y border-border py-3 text-base">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span>
              <strong>{item.quantity} ×</strong> {item.item_name}
            </span>
            <span className="text-stone-600">{formatPrice(item.line_total)}</span>
          </li>
        ))}
      </ul>

      {order.customer_notes && (
        <p className="rounded-lg bg-amber-50 p-2 text-sm text-amber-900">
          <strong>Note:</strong> {order.customer_notes}
        </p>
      )}

      <div className="text-sm">
        <p className="font-semibold">{order.customer_name}</p>
        <a href={`tel:${order.customer_phone}`} className="text-accent hover:underline">
          {order.customer_phone}
        </a>
        <p className="mt-1 whitespace-pre-line text-stone-700">{address.address_line}</p>
        {address.landmark && <p className="text-stone-500">Landmark: {address.landmark}</p>}
      </div>

      <div className="flex items-center justify-between text-sm">
        <span className="text-stone-600">Cash on delivery</span>
        <span className="text-lg font-bold tabular-nums">{formatPrice(order.total)}</span>
      </div>
      <p className="-mt-2 text-xs text-stone-500">
        Items {formatPrice(order.subtotal)} + delivery{" "}
        {order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "free"}
      </p>

      {order.rejection_reason && (
        <p className="text-sm text-red-700">Cancelled: {order.rejection_reason}</p>
      )}

      <OrderActions orderId={order.id} status={order.status} updateStatus={updateStatus} />
    </Card>
  );
}
