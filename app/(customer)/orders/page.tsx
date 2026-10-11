import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyOrders } from "@/lib/queries/orders";
import { ACTIVE_STATUSES } from "@/lib/orders/status";
import { getLang, getT } from "@/lib/i18n/server";
import type { Lang, T } from "@/lib/i18n/messages";
import { wholeRupees } from "@/lib/orders/stats";
import { addDaysToKey, formatClock, formatDayLabel, istDateKey, todayKeyIST } from "@/lib/utils/time";
import { dishPhoto } from "@/lib/utils/placeholder";
import { LiveUpdates } from "@/components/LiveUpdates";
import { getRealtimeToken } from "@/lib/auth/session";
import { AccountCard } from "@/components/account/AccountCard";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { ReorderButton } from "@/components/order/ReorderButton";
import { itemsLine } from "@/components/panel/KanbanOrderCard";
import { Photo } from "@/components/ui/Photo";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("account.nav.orders") };
}

// "Today, 8:12 PM" / "Yesterday, 1:40 PM" / "Sun, 28 Sep"
function when(iso: string, t: T, lang: Lang) {
  const key = istDateKey(iso);
  if (key === todayKeyIST()) return t("orders.today", { time: formatClock(iso) });
  if (key === addDaysToKey(todayKeyIST(), -1)) return t("orders.yesterday", { time: formatClock(iso) });
  return formatDayLabel(iso, lang);
}

export default async function OrdersPage() {
  const t = await getT();
  const lang = await getLang();
  const profile = await requireUser("/orders");
  const orders = await getMyOrders();

  return (
    <main className="mx-auto grid w-full max-w-[1280px] flex-1 items-start gap-8 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-12 lg:pb-14 lg:pt-8">
      <LiveUpdates tables={[{ table: "orders", filter: `customer_id=eq.${profile.id}` }]} accessToken={await getRealtimeToken()} />
      <div className="hidden lg:block">
        <AccountCard profile={profile} active="/orders" />
      </div>

      <section className="flex flex-col gap-4">
        <h1 className="font-display text-[34px] leading-none sm:text-[44px]">{t("account.nav.orders")}</h1>

        {orders.length === 0 ? (
          <ProblemScreen
            glyph="+"
            title={t("orders.none_title")}
            action={
              <Link href="/" className={problemActionClass}>
                {t("cart.browse")}
              </Link>
            }
          >
            {t("orders.none_body")}
          </ProblemScreen>
        ) : (
          <ul className="stagger flex flex-col gap-3 sm:gap-4">
            {orders.map((order) => {
              const live = ACTIVE_STATUSES.includes(order.status);
              const first = order.order_items[0];
              const photo = dishPhoto({
                image_url: first?.menu_items?.image_url ?? null,
                name: first?.item_name ?? order.restaurants?.name ?? "",
              });
              return (
                <li
                  key={order.id}
                  className="flex flex-col gap-3 rounded-[18px] bg-surface p-3.5 shadow-card sm:flex-row sm:items-center sm:gap-[18px] sm:rounded-[20px] sm:p-5"
                >
                  <Link href={`/orders/${order.id}`} className="flex min-w-0 flex-1 items-center gap-3 sm:gap-[18px]">
                    <span className="relative size-[54px] shrink-0 overflow-hidden rounded-full shadow-[0_8px_18px_rgba(0,0,0,.14)] sm:size-[72px]">
                      <Photo src={photo} alt="" sizes="72px" />
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col gap-1">
                      <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <span className="truncate text-base font-semibold sm:text-[17px]">
                          {order.restaurants?.name ?? t("orders.restaurant")}
                        </span>
                        <OrderStatusBadge status={order.status} translate={t} />
                      </span>
                      <span className="line-clamp-1 text-sm text-stone-600">{itemsLine(order.order_items)}</span>
                      <span className="text-[13px] text-stone-500">
                        {when(order.placed_at, t, lang)} · {wholeRupees(order.total)} · {t("orders.cash")}
                      </span>
                    </span>
                  </Link>
                  {live ? (
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex h-10 shrink-0 items-center justify-center rounded-[10px] bg-brand px-[18px] text-sm font-semibold text-on-brand hover:bg-brand-dark"
                    >
                      {t("orders.track")}
                    </Link>
                  ) : order.status === "delivered" && !order.rated ? (
                    <Link
                      href={`/orders/${order.id}#rate`}
                      className="flex h-10 shrink-0 items-center justify-center rounded-[10px] bg-amber-50 px-[18px] text-sm font-semibold text-amber-800 hover:bg-amber-100"
                    >
                      {t("orders.rate")}
                    </Link>
                  ) : (
                    <ReorderButton
                      restaurantId={order.restaurant_id}
                      lines={order.order_items.map((item) => ({
                        menu_item_id: item.menu_item_id,
                        quantity: item.quantity,
                        variant: item.variant ?? "full",
                      }))}
                    />
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
