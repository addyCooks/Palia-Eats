import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, Phone } from "lucide-react";
import { requireUser } from "@/lib/auth/session";
import { getMyOrder } from "@/lib/queries/orders";
import { isUuid } from "@/lib/validation/menu";
import { formatPrice } from "@/lib/utils/format";
import { formatClock, formatDayLabel } from "@/lib/utils/time";
import { isOrderOverdue } from "@/lib/orders/overdue";
import { ACTIVE_STATUSES, ORDER_STATUS_LABELS, isCancelled } from "@/lib/orders/status";
import { LiveUpdates } from "@/components/LiveUpdates";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { RateOrder } from "@/components/order/RateOrder";
import { Stars } from "@/components/order/Stars";
import { ProblemPlate } from "@/components/ui/ProblemScreen";

export const metadata: Metadata = { title: "Your order" };

const HEADLINE: Record<string, string> = {
  pending: "Order placed",
  accepted: "Order placed",
  preparing: "Cooking",
  out_for_delivery: "On the way",
  delivered: "Delivered",
};

// Order tracking (v2 5d / 6d): dark status card, the four steps with their times, the
// rider, then the bill, the address and (once delivered) the rating.
export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  await requireUser(`/orders/${id}`);
  if (!isUuid(id)) notFound();

  const data = await getMyOrder(id);
  if (!data) notFound();
  const { order, events, rating } = data;

  const { placed } = await searchParams;
  const restaurant = order.restaurants;
  const address = order.delivery_address;
  const overdue = isOrderOverdue(order.status, order.placed_at);
  const active = ACTIVE_STATUSES.includes(order.status);
  const cancelled = isCancelled(order.status);
  const delivered = order.status === "delivered";
  const deliveredAt = events.find((event) => event.status === "delivered")?.at;
  const upi = order.customer_notes?.startsWith("Paying by UPI");

  return (
    <main className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-28 pt-4 sm:px-6 lg:px-12 lg:pb-14">
      {/* Live connection: the steps move the moment the restaurant updates the order */}
      {active && (
        <LiveUpdates
          tables={[
            { table: "orders", filter: `id=eq.${order.id}` },
            { table: "order_status_events", filter: `order_id=eq.${order.id}` },
          ]}
          fallbackSeconds={30}
        />
      )}

      <Link href="/orders" className="text-sm text-stone-500 hover:underline">
        ← My orders
      </Link>

      {/* Just placed (v2 11b): the dark "Order placed" moment, then the tracking below */}
      {placed === "1" && !cancelled && (
        <section
          role="status"
          className="mt-3 flex flex-col items-center gap-4 rounded-[28px] bg-[#16120D] px-7 py-10 text-center text-white dark:bg-[#1F1A14]"
        >
          <div aria-hidden className="relative mb-2 size-[180px]">
            <div className="absolute inset-0 rounded-full bg-[#2A241C]" />
            <div className="absolute inset-6 rounded-full border-2 border-dashed border-[#5C554B]" />
            <div className="absolute left-1/2 top-1/2 grid size-[84px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-brand text-on-brand">
              <Check className="size-10" strokeWidth={3} />
            </div>
          </div>
          <span className="text-xs font-semibold tracking-[2px] text-brand">ORDER #{order.order_number}</span>
          <h1 className="font-display text-[38px] leading-[1.05]">Order placed</h1>
          <p className="max-w-md text-[15px] leading-[1.55] text-[#D8D2C8]">
            {restaurant?.name ?? "The restaurant"} has your order and will start cooking in a minute. Keep{" "}
            {formatPrice(order.total)} ready for the rider (cash or UPI).
          </p>
          <a
            href="#track"
            className="mt-2 flex h-14 w-full max-w-sm items-center justify-center rounded-[14px] bg-brand text-base font-bold text-on-brand hover:bg-brand-dark"
          >
            Track order
          </a>
        </section>
      )}

      <div id="track" className="mt-4 grid scroll-mt-24 items-start gap-5 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-7">
        <div className="flex flex-col gap-[18px]">
          {/* Status */}
          <section className={`flex flex-col gap-2 rounded-[22px] p-7 ${cancelled ? "bg-red-100 text-red-800" : "bg-[#16120D] text-white dark:bg-[#1F1A14]"}`}>
            <span className={`text-[13px] font-semibold tracking-[1px] ${cancelled ? "" : "text-brand"}`}>
              ORDER #{order.order_number} · {ORDER_STATUS_LABELS[order.status].toUpperCase()}
            </span>
            {cancelled ? (
              <>
                <span className="font-display text-[44px] leading-none">Cancelled</span>
                <span className="text-sm">
                  {order.rejection_reason ? `Reason: ${order.rejection_reason}` : "The restaurant couldn't complete it."} Nothing
                  was charged.
                </span>
              </>
            ) : (
              <>
                <span className="text-sm text-[#D8D2C8]">{delivered ? "Delivered at" : "Status"}</span>
                <span className="font-display text-[52px] leading-none sm:text-[64px]">
                  {delivered && deliveredAt ? formatClock(deliveredAt) : HEADLINE[order.status]}
                </span>
                <span className="text-sm text-[#D8D2C8]">
                  {delivered
                    ? `${formatDayLabel(order.placed_at)} · enjoy your meal!`
                    : `Placed at ${formatClock(order.placed_at)} · ${restaurant?.name ?? ""}`}
                </span>
              </>
            )}
          </section>

          {overdue && (
            <div role="status" className="flex items-center gap-4 rounded-[22px] bg-amber-50 p-4 text-amber-900">
              <ProblemPlate glyph="!" tone="warm" small />
              <p className="text-sm">
                <strong className="block text-base">This is taking longer than usual.</strong>
                {restaurant?.phone ? (
                  <>
                    You can call {restaurant.name} on{" "}
                    <a href={`tel:${restaurant.phone}`} className="font-semibold underline">
                      {restaurant.phone}
                    </a>
                    .
                  </>
                ) : (
                  "Please give it a few more minutes."
                )}
              </p>
            </div>
          )}

          {!cancelled && (
            <section className="rounded-[22px] bg-surface p-6 shadow-card">
              <OrderTimeline status={order.status} events={events} restaurantName={restaurant?.name} />
              {active && (
                <p className="mt-3 text-xs text-stone-500">Updates by itself. No need to refresh.</p>
              )}
            </section>
          )}

          {order.riders && !cancelled && (
            <section className="flex items-center gap-3.5 rounded-[22px] bg-surface px-5 py-[18px] shadow-card">
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-amber-100 font-display text-xl text-amber-800">
                {order.riders.name.charAt(0)}
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate font-semibold">{order.riders.name}</span>
                <span className="text-[13px] text-stone-500">Your delivery partner</span>
              </span>
              {active && (
                <a
                  href={`tel:${order.riders.phone}`}
                  aria-label={`Call ${order.riders.name}`}
                  className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-on-brand"
                >
                  <Phone className="size-[18px]" aria-hidden />
                </a>
              )}
            </section>
          )}
        </div>

        <div className="flex flex-col gap-[18px]">
          {delivered && (
            <section id="rate" className="flex scroll-mt-24 flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card">
              <h2 className="font-display text-[26px] leading-none">{rating ? "Your rating" : "How was your food?"}</h2>
              {rating ? (
                <>
                  <Stars value={rating.stars} />
                  {rating.comment && <p className="text-sm text-stone-700">&ldquo;{rating.comment}&rdquo;</p>}
                </>
              ) : (
                <RateOrder orderId={order.id} restaurantName={restaurant?.name ?? "the restaurant"} />
              )}
            </section>
          )}

          <section className="flex flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{restaurant?.name ?? "Your order"}</h2>
              {restaurant && (
                <Link href={`/restaurants/${restaurant.slug}`} className="text-sm font-semibold text-accent hover:underline">
                  View menu
                </Link>
              )}
            </div>
            <ul className="flex flex-col gap-2 text-sm">
              {order.order_items.map((item) => (
                <li key={item.id} className="flex justify-between gap-3">
                  <span>
                    {item.quantity} × {item.item_name}
                  </span>
                  <span className="font-semibold tabular-nums">{formatPrice(item.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
              <div className="flex justify-between text-stone-600">
                <span>Item total</span>
                <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>Delivery fee</span>
                <span className="tabular-nums">{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Free"}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>{delivered ? "Paid" : "To pay"}</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </div>
              <p className="text-stone-600">
                {upi ? "UPI on delivery: scan the rider's QR with any UPI app." : "Cash on delivery (or UPI to the rider)."}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-1 rounded-[22px] bg-surface p-6 text-sm shadow-card">
            <h2 className="mb-1 text-lg font-semibold">Delivering to</h2>
            <p className="font-medium">{address.label}</p>
            <p className="whitespace-pre-line text-stone-700">{address.address_line}</p>
            {address.landmark && <p className="text-stone-500">Landmark: {address.landmark}</p>}
            <p className="text-stone-500">
              {order.customer_name} · {order.customer_phone}
            </p>
            {order.customer_notes && (
              <p className="mt-2 rounded-lg bg-muted p-2.5 text-stone-700">Note: {order.customer_notes}</p>
            )}
          </section>

          {restaurant?.phone && (active || cancelled) && (
            <a
              href={`tel:${restaurant.phone}`}
              className="flex h-[50px] items-center justify-center rounded-xl border-[1.5px] border-brand font-semibold text-accent hover:bg-amber-50"
            >
              Need help with this order? Call {restaurant.name}
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
