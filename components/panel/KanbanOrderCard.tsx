import { MapPin } from "lucide-react";
import type { PanelOrder } from "@/lib/queries/panel";
import { addressPin, mapsLink } from "@/lib/utils/maps";
import { wholeRupees } from "@/lib/orders/stats";
import { minutesAgo } from "@/lib/utils/time";
import { OrderActions, type UpdateOrderStatus } from "@/components/order/OrderActions";

export function itemsLine(items: { item_name: string; quantity: number }[]): string {
  return items.map((item) => `${item.item_name}${item.quantity > 1 ? ` ×${item.quantity}` : ""}`).join(", ");
}

// One order on the live board: what to cook, for whom, and the button for the next step.
// Address and phone fold away so the board stays readable at a glance.
export function KanbanOrderCard({ order, updateStatus }: { order: PanelOrder; updateStatus: UpdateOrderStatus }) {
  const address = order.delivery_address;
  const pin = addressPin(address);
  const isNew = order.status === "pending" || order.status === "accepted";

  return (
    <article
      className={`flex flex-col gap-2.5 rounded-[14px] bg-surface p-3.5 shadow-card ${isNew ? "ring-2 ring-brand" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-bold tabular-nums">#{order.order_number}</span>
        <span className="text-xs text-stone-500">
          {order.channel === "whatsapp" && "WhatsApp · "}
          {minutesAgo(order.placed_at)}
        </span>
      </div>
      <p className="text-sm leading-[1.45] text-stone-700">{itemsLine(order.order_items)}</p>
      {order.customer_notes && (
        <p className="rounded-lg bg-amber-50 px-2.5 py-1.5 text-[13px] text-amber-900">
          <strong>Note:</strong> {order.customer_notes}
        </p>
      )}
      <div className="flex items-center justify-between gap-2 text-[13px] text-stone-600">
        <span className="min-w-0 truncate">{order.customer_name}</span>
        <span className="shrink-0 font-bold text-foreground">{wholeRupees(order.total)} · Cash</span>
      </div>
      <details className="group text-[13px]">
        <summary className="cursor-pointer list-none font-semibold text-accent marker:content-none">
          <span className="group-open:hidden">Address &amp; phone{pin ? " · 📍 pin" : ""}</span>
          <span className="hidden group-open:inline">Hide address</span>
        </summary>
        <div className="mt-1.5 flex flex-col gap-0.5 text-stone-700">
          <a href={`tel:${order.customer_phone}`} className="font-semibold text-accent hover:underline">
            {order.customer_phone}
          </a>
          <p className="whitespace-pre-line">{address.address_line}</p>
          {address.landmark && <p className="text-stone-500">Landmark: {address.landmark}</p>}
          {pin && (
            <a
              href={mapsLink(pin.lat, pin.lng)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1.5 font-semibold text-accent hover:underline"
            >
              <MapPin className="size-3.5" aria-hidden />
              Open location in Maps
            </a>
          )}
        </div>
      </details>
      <OrderActions orderId={order.id} status={order.status} updateStatus={updateStatus} compact />
    </article>
  );
}
