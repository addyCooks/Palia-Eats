import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminRestaurantDetail } from "@/lib/queries/admin";
import { isUuid } from "@/lib/validation/menu";
import { compactRupees, formatMinutes, wholeRupees } from "@/lib/orders/stats";
// COMMISSION OFF: import { formatKeyRange, formatKeyShort, istDateKey } from "@/lib/utils/time";
import { restaurantAvatar } from "@/lib/utils/placeholder";
import { MIN_RATINGS_TO_SHOW } from "@/lib/utils/rating";
import { MakeVisibleButton, PauseOrdersButton } from "@/components/admin/RestaurantActions";  // COMMISSION OFF: MarkPaidButton
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
// COMMISSION OFF: import { Badge } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { Kpi, Panel } from "@/components/ui/page";

export const metadata: Metadata = { title: "Restaurant" };

export default async function AdminRestaurantPage({ params }: PageProps<"/admin/restaurants/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const detail = await getAdminRestaurantDetail(id);
  if (!detail) notFound();
  const { restaurant, ownerName, notificationEmail, settingUp, week } = detail; // COMMISSION OFF: commissionPercent, current, due

  const state = !restaurant.is_active
    ? settingUp
      ? "SETTING UP"
      : "PENDING"
    : restaurant.is_accepting_orders
      ? "LIVE"
      : "PAUSED";
  const joined = restaurant.created_at
    ? new Intl.DateTimeFormat("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(
        new Date(restaurant.created_at),
      )
    : null;
  const facts = [
    restaurant.area ?? restaurant.address_text,
    ownerName ? `Owner: ${ownerName}` : null,
    restaurant.phone,
    joined ? `Joined ${joined}` : null,
  ].filter(Boolean);

  return (
    <>
      <p className="text-[13px] text-stone-500">
        <Link href="/admin/restaurants" className="hover:underline">
          Restaurants
        </Link>{" "}
        › {restaurant.name}
      </p>

      {!notificationEmail && (
        <p role="alert" className="rounded-xl bg-red-100 p-4 text-sm text-red-800">
          <strong>No order email is set.</strong> This restaurant will NOT be told about new orders.{" "}
          <Link href={`/admin/restaurants/${id}/edit`} className="font-semibold underline">
            Add one
          </Link>
          .
        </p>
      )}

      <section className="flex flex-col gap-5 rounded-[20px] bg-[#16120D] p-6 text-white sm:flex-row sm:items-center sm:gap-[22px] dark:bg-[#1F1A14]">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-full sm:size-24">
          <Photo src={restaurantAvatar(restaurant)} alt={`${restaurant.name} logo`} sizes="96px" />
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="font-display text-[30px] leading-none sm:text-[36px]">{restaurant.name}</h1>
            <span
              className={`flex h-[26px] items-center rounded-[7px] px-2.5 text-xs font-bold ${
                state === "LIVE"
                  ? "bg-brand text-on-brand"
                  : state === "PAUSED"
                    ? "bg-[#2A241C] text-[#D8D2C8]"
                    : state === "SETTING UP"
                      ? "bg-[#3A2C14] text-brand"
                      : "bg-[#3A1A14] text-[#FF8A7A]"
              }`}
            >
              {state}
            </span>
          </div>
          <p className="text-sm text-[#D8D2C8]">{facts.join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2.5">
          {!restaurant.is_active && <MakeVisibleButton restaurantId={restaurant.id} name={restaurant.name} />}
          <PauseOrdersButton restaurantId={restaurant.id} accepting={restaurant.is_accepting_orders} />
          <Link
            href={`/admin/restaurants/${id}/menu`}
            className="inline-flex h-11 items-center rounded-xl bg-[#2A241C] px-[18px] text-sm font-semibold text-white hover:bg-[#3A3228]"
          >
            Menu
          </Link>
          <Link
            href={`/admin/restaurants/${id}/edit`}
            className="inline-flex h-11 items-center rounded-xl bg-brand px-[18px] text-sm font-bold text-on-brand hover:bg-brand-dark"
          >
            Edit details
          </Link>
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi size="md" label="Orders this week" value={String(week.orders)} />
        <Kpi size="md" label="Revenue this week" value={compactRupees(week.revenue)} />
        <Kpi
          size="md"
          label="Rating"
          value={restaurant.rating_avg !== null ? `★ ${Number(restaurant.rating_avg).toFixed(1)}` : "—"}
          delta={
            restaurant.rating_count > 0
              ? `${restaurant.rating_count} ${restaurant.rating_count === 1 ? "rating" : "ratings"}${restaurant.rating_count < MIN_RATINGS_TO_SHOW ? " · hidden from customers" : ""}`
              : "No ratings yet"
          }
        />
        <Kpi size="md" label="Avg prep time" value={formatMinutes(detail.avgPrep)} delta="last 30 days" />
      </div>

      <div className="grid items-start gap-4">{/* COMMISSION OFF: was a two-column grid (recent orders | payouts) */}
        <Panel title="Recent orders">
          {detail.recent.length === 0 ? (
            <p className="text-sm text-stone-500">No orders yet.</p>
          ) : (
            <ul className="-mt-1 flex flex-col">
              {detail.recent.map((order) => (
                <li key={order.id}>
                  <Link
                    href={`/admin/orders/${order.id}`}
                    className="grid h-[46px] grid-cols-[64px_minmax(0,1fr)_72px_auto] items-center gap-3 border-b border-muted text-sm hover:bg-background sm:grid-cols-[80px_minmax(0,1fr)_80px_110px]"
                  >
                    <span className="font-semibold">#{order.order_number}</span>
                    <span className="truncate text-stone-600">{order.customer_name}</span>
                    <span className="font-semibold">{wholeRupees(order.total)}</span>
                    <span>
                      <OrderStatusBadge status={order.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <Link href={`/admin/orders?q=${encodeURIComponent(restaurant.name)}`} className="text-sm font-semibold text-accent hover:underline">
            All orders from {restaurant.name} →
          </Link>
        </Panel>

{/* COMMISSION OFF: the weekly Payouts panel.
        <Panel title="Payouts">
          <ul className="flex flex-col gap-3.5">
            <li className="flex items-center justify-between gap-3 text-sm">
              <div className="flex flex-col">
                <span className="font-medium">This week ({formatKeyRange(current.weekStart, current.weekEnd)})</span>
                <span className="text-xs text-stone-500">So far · after {commissionPercent}% commission</span>
              </div>
              <span className="font-bold">{wholeRupees(current.net)}</span>
            </li>
            {due && due.gross > 0 && (
              <li className="flex items-center justify-between gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{formatKeyRange(due.weekStart, due.weekEnd)}</span>
                  <span className="text-xs text-stone-500">
                    Due now · {wholeRupees(due.gross)} sales − {wholeRupees(due.commission)} commission
                  </span>
                </div>
                <Badge tone="new">{wholeRupees(due.net)}</Badge>
              </li>
            )}
            {detail.payouts.map((payout) => (
              <li key={payout.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex flex-col">
                  <span className="font-medium">{formatKeyRange(payout.week_start, payout.week_end)}</span>
                  <span className="text-xs text-stone-500">
                    Paid {formatKeyShort(istDateKey(payout.paid_at))} · {Number(payout.commission_percent)}%
                    commission
                  </span>
                </div>
                <span className="font-bold">{wholeRupees(payout.net)}</span>
              </li>
            ))}
          </ul>
          {due && due.gross > 0 ? (
            <MarkPaidButton
              restaurantId={restaurant.id}
              weekStart={due.weekStart}
              label={formatKeyRange(due.weekStart, due.weekEnd)}
            />
          ) : (
            <p className="text-xs text-stone-500">Nothing due. Weeks run Monday to Sunday.</p>
          )}
        </Panel>
*/}
      </div>
    </>
  );
}
