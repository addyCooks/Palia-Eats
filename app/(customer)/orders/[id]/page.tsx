import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { getRealtimeToken, requireUser } from "@/lib/auth/session";
import { getMyOrder } from "@/lib/queries/orders";
import { isUuid } from "@/lib/validation/menu";
import { formatPrice } from "@/lib/utils/format";
import { addressLabel } from "@/lib/utils/address-label";
import { formatClock, formatDayLabel } from "@/lib/utils/time";
import { isOrderOverdue } from "@/lib/orders/overdue";
import { ACTIVE_STATUSES, isCancelled, statusLabel } from "@/lib/orders/status";
import { getLang, getT } from "@/lib/i18n/server";
import { LiveUpdates } from "@/components/LiveUpdates";
import { DeliveredCelebration } from "@/components/order/DeliveredCelebration";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { StatusArt } from "@/components/order/StatusArt";
import { Confetti } from "@/components/ui/Confetti";
import { RateOrder } from "@/components/order/RateOrder";
import { Stars } from "@/components/order/Stars";
import { ProblemPlate } from "@/components/ui/ProblemScreen";
import { OrderHelpCard } from "@/components/support/OrderHelpCard";
import { OrderPushCard } from "@/components/notifications/OrderPushCard";
import type { MessageKey } from "@/lib/i18n/messages";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("ord.meta_title") };
}

// The warm line under the big status word.
const TAGLINE: Record<string, MessageKey> = {
  pending: "ord.tagline.pending",
  accepted: "ord.tagline.pending",
  preparing: "ord.tagline.preparing",
  out_for_delivery: "ord.tagline.out_for_delivery",
  delivered: "ord.tagline.delivered",
};

// Order tracking (v2 5d / 6d): dark status card, the four steps with their times, the
// rider, then the bill, the address and (once delivered) the rating.
export default async function OrderPage({ params, searchParams }: PageProps<"/orders/[id]">) {
  const t = await getT();
  const lang = await getLang();
  const { id } = await params;
  await requireUser(`/orders/${id}`);
  if (!isUuid(id)) notFound();

  const data = await getMyOrder(id);
  if (!data) notFound();
  const { order, events, rating } = data;
  const accessToken = await getRealtimeToken();

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
          accessToken={accessToken}
          fallbackSeconds={10}
        />
      )}

      <DeliveredCelebration
        orderId={order.id}
        delivered={delivered}
        deliveredAt={deliveredAt ?? null}
        restaurantName={restaurant?.name ?? t("order_help.the_restaurant")}
        rated={Boolean(rating)}
      />

      <Link href="/orders" className="text-sm text-stone-500 hover:underline">
        {t("ord.back")}
      </Link>

      {/* Just placed (v2 11b): the dark "Order placed" moment, then the tracking below */}
      {placed === "1" && !cancelled && (
        <section
          role="status"
          className="anim-pop-in mt-3 flex flex-col items-center gap-4 rounded-[28px] bg-[#16120D] px-7 py-10 text-center text-white dark:bg-[#1F1A14]"
        >
          <Confetti pieces={60} />
          <div aria-hidden className="relative mb-2 size-[180px]">
            <div className="absolute inset-0 rounded-full bg-[#2A241C]" />
            <div className="pe-ring absolute inset-6 rounded-full bg-brand/25" />
            <div className="absolute inset-6 rounded-full border-2 border-dashed border-[#5C554B]" />
            <svg viewBox="0 0 84 84" className="anim-bump absolute left-1/2 top-1/2 size-[84px] -translate-x-1/2 -translate-y-1/2">
              <circle cx="42" cy="42" r="42" fill="var(--brand)" />
              <path d="M26 43 l11 11 l22 -24" fill="none" stroke="#1A1206" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="pe-draw" />
            </svg>
          </div>
          <span className="text-xs font-semibold tracking-[2px] text-brand">{t("ord.placed_kicker", { n: order.order_number })}</span>
          <h1 className="font-display text-[38px] leading-[1.05]">{t("ord.placed_title")}</h1>
          <p className="-mt-2 font-display text-[22px] italic leading-snug text-brand">{t("ord.tagline.pending")}</p>
          <p className="max-w-md text-[15px] leading-[1.55] text-[#D8D2C8]">
            {t("ord.placed_body", { name: restaurant?.name ?? t("ord.restaurant_fallback"), total: formatPrice(order.total) })}
          </p>
          <a
            href="#track"
            className="mt-2 flex h-14 w-full max-w-sm items-center justify-center rounded-[14px] bg-brand text-base font-bold text-on-brand hover:bg-brand-dark"
          >
            {t("orders.track")}
          </a>
        </section>
      )}

      <div id="track" className="mt-4 grid scroll-mt-24 items-start gap-5 lg:grid-cols-[420px_minmax(0,1fr)] lg:gap-7">
        <div className="flex flex-col gap-[18px]">
          {/* Status */}
          <section
            key={order.status}
            className={`anim-pop-in relative flex flex-col gap-2 overflow-hidden rounded-[22px] p-7 ${cancelled ? "bg-red-100 text-red-800" : "bg-[#16120D] text-white dark:bg-[#1F1A14]"}`}
          >
            <div className="flex items-start justify-between gap-3">
              <span className={`pt-1 text-[13px] font-semibold tracking-[1px] ${cancelled ? "" : "text-brand"}`}>
                {t("ord.status_line", { n: order.order_number, status: statusLabel(t, order.status) }).toUpperCase()}
              </span>
              {!cancelled && <StatusArt status={order.status} />}
            </div>
            {cancelled ? (
              <>
                <span className="font-display text-[44px] leading-none">{t("status.cancelled")}</span>
                <span className="text-sm">
                  {order.rejection_reason ? t("ord.cancel_reason", { reason: order.rejection_reason }) : t("ord.cancel_default")}{" "}
                  {t("ord.nothing_charged")}
                </span>
              </>
            ) : (
              <>
                <span className="text-sm text-[#D8D2C8]">{delivered ? t("ord.delivered_at") : t("ord.status")}</span>
                <span className="font-display text-[52px] leading-none sm:text-[64px]">
                  {delivered && deliveredAt ? formatClock(deliveredAt) : order.status === "pending" || order.status === "accepted" ? t("ord.placed_title") : statusLabel(t, order.status)}
                </span>
                {TAGLINE[order.status] && (
                  <span className="anim-fade-up font-display text-[22px] italic leading-snug text-brand" style={{ animationDelay: "250ms" }}>
                    {t(TAGLINE[order.status])}
                  </span>
                )}
                <span className="text-sm text-[#D8D2C8]">
                  {delivered
                    ? t("ord.delivered_line", { day: formatDayLabel(order.placed_at, lang) })
                    : t("ord.placed_line", { time: formatClock(order.placed_at), name: restaurant?.name ?? "" })}
                </span>
              </>
            )}
          </section>

          {overdue && (
            <div role="status" className="flex items-center gap-4 rounded-[22px] bg-amber-50 p-4 text-amber-900">
              <ProblemPlate glyph="!" tone="warm" small />
              <p className="text-sm">
                <strong className="block text-base">{t("ord.overdue_title")}</strong>
                {restaurant?.phone ? (
                  <>
                    {t("ord.overdue_call", { name: restaurant.name })}{" "}
                    <a href={`tel:${restaurant.phone}`} className="font-semibold underline">
                      {restaurant.phone}
                    </a>
                    .
                  </>
                ) : (
                  t("ord.overdue_wait")
                )}
              </p>
            </div>
          )}

          {!cancelled && (
            <section className="rounded-[22px] bg-surface p-6 shadow-card">
              <OrderTimeline status={order.status} events={events} restaurantName={restaurant?.name} t={t} />
              {active && (
                <p className="mt-3 text-xs text-stone-500">{t("ord.auto_update")}</p>
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
                <span className="text-[13px] text-stone-500">{t("ord.partner")}</span>
              </span>
              {active && (
                <a
                  href={`tel:${order.riders.phone}`}
                  aria-label={t("ord.call", { name: order.riders.name })}
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
              <h2 className="font-display text-[26px] leading-none">{rating ? t("rate.your_rating") : t("ord.how_food")}</h2>
              {rating ? (
                <>
                  <Stars value={rating.stars} />
                  {rating.comment && <p className="text-sm text-stone-700">&ldquo;{rating.comment}&rdquo;</p>}
                </>
              ) : (
                <RateOrder orderId={order.id} restaurantName={restaurant?.name ?? t("order_help.the_restaurant")} />
              )}
            </section>
          )}

          <section className="flex flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">{restaurant?.name ?? t("ord.your_order")}</h2>
              {restaurant && (
                <Link href={`/restaurants/${restaurant.slug}`} className="text-sm font-semibold text-accent hover:underline">
                  {t("ord.view_menu")}
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
                <span>{t("cart.item_total")}</span>
                <span className="tabular-nums">{formatPrice(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-stone-600">
                <span>{t("co.delivery_fee")}</span>
                <span className="tabular-nums">{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : t("cart.free")}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>{delivered ? t("ord.paid") : t("ord.to_pay")}</span>
                <span className="tabular-nums">{formatPrice(order.total)}</span>
              </div>
              <p className="text-stone-600">
                {upi ? t("ord.upi_note") : t("ord.cash_note")}
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-1 rounded-[22px] bg-surface p-6 text-sm shadow-card">
            <h2 className="mb-1 text-lg font-semibold">{t("ord.delivering_to")}</h2>
            <p className="font-medium">{addressLabel(address.label, t)}</p>
            <p className="whitespace-pre-line text-stone-700">{address.address_line}</p>
            {typeof address.lat === "number" && <p className="font-medium text-accent">{t("ord.pin_shared")}</p>}
            {address.landmark && <p className="text-stone-500">{t("ord.landmark", { landmark: address.landmark })}</p>}
            <p className="text-stone-500">
              {order.customer_name} · {order.customer_phone}
            </p>
            {order.customer_notes && (
              <p className="mt-2 rounded-lg bg-muted p-2.5 text-stone-700">{t("ord.note", { note: order.customer_notes })}</p>
            )}
          </section>

          {active && <OrderPushCard />}

          <OrderHelpCard
            orderNumber={order.order_number}
            restaurantName={restaurant?.name ?? null}
            restaurantPhone={restaurant?.phone ?? null}
            active={active}
            cancelled={cancelled}
          />
        </div>
      </div>
    </main>
  );
}
