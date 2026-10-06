import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelHistory, HISTORY_PAGE_SIZE, type HistoryFilter } from "@/lib/queries/panel";
import { wholeRupees } from "@/lib/orders/stats";
import { addDaysToKey, formatClock, formatDayLabel, istDateKey, todayKeyIST } from "@/lib/utils/time";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { itemsLine } from "@/components/panel/KanbanOrderCard";
import {
  Cell,
  DataRow,
  DataTable,
  FilterChips,
  PageHeader,
  Pagination,
  SearchBox,
  TableEmpty,
  hrefWith,
  pageNumber,
  param,
} from "@/components/ui/page";

export const metadata: Metadata = { title: "Order history" };

const CHIPS: { key: HistoryFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
  { key: "week", label: "This week" },
];

const COLUMNS = "100px minmax(0,1.2fr) minmax(0,2fr) 90px 110px 130px";

// "Today 8:12 PM", "Yesterday 7:58 PM", "Sun, 5 Oct"
function when(iso: string): string {
  const key = istDateKey(iso);
  const today = todayKeyIST();
  if (key === today) return `Today ${formatClock(iso)}`;
  if (key === addDaysToKey(today, -1)) return `Yesterday ${formatClock(iso)}`;
  return formatDayLabel(iso);
}

export default async function PanelHistoryPage({ searchParams }: PageProps<"/panel/history">) {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const params = await searchParams;
  const search = param(params.q);
  const rawFilter = param(params.show);
  const filter: HistoryFilter = CHIPS.some((chip) => chip.key === rawFilter) ? (rawFilter as HistoryFilter) : "all";
  const page = pageNumber(params.page);

  const { orders, total, allTime, firstOrderAt, searching } = await getPanelHistory(restaurant.id, {
    search,
    filter,
    page,
  });

  const keep = { q: search || undefined, show: filter === "all" ? undefined : filter };
  const sub =
    allTime === 0
      ? "No orders yet"
      : `${allTime.toLocaleString("en-IN")} ${allTime === 1 ? "order" : "orders"}${
          firstOrderAt
            ? ` since ${new Intl.DateTimeFormat("en-IN", { timeZone: "Asia/Kolkata", month: "long" }).format(new Date(firstOrderAt))}`
            : ""
        }`;
  const emptyText = searching || filter !== "all" ? "No orders match that." : "No orders yet. They will show up here.";

  return (
    <>
      <PageHeader title="Order history" sub={sub}>
        <SearchBox
          action="/panel/history"
          value={search}
          placeholder="Order number or customer"
          keep={{ show: keep.show }}
        />
      </PageHeader>

      <FilterChips
        label="Filter orders"
        chips={CHIPS}
        active={filter}
        hrefFor={(key) => hrefWith("/panel/history", keep, { show: key === "all" ? undefined : key, page: undefined })}
      />

      {/* Laptop: a table */}
      <div className="hidden md:block">
        <DataTable
          columns={COLUMNS}
          headers={["ORDER", "CUSTOMER", "ITEMS", "TOTAL", "STATUS", "TIME"]}
          empty={orders.length === 0 ? <TableEmpty>{emptyText}</TableEmpty> : undefined}
          footer={
            <Pagination
              page={page}
              pageSize={HISTORY_PAGE_SIZE}
              total={total}
              hrefFor={(n) => hrefWith("/panel/history", keep, { page: n > 1 ? String(n) : undefined })}
            />
          }
        >
          {orders.map((order) => (
            <DataRow key={order.id} columns={COLUMNS}>
              <Cell strong>#{order.order_number}</Cell>
              <Cell strong>{order.customer_name}</Cell>
              <Cell>
                <span title={itemsLine(order.order_items)}>{itemsLine(order.order_items)}</span>
              </Cell>
              <Cell strong>{wholeRupees(order.total)}</Cell>
              <span>
                <OrderStatusBadge status={order.status} />
              </span>
              <Cell>{when(order.placed_at)}</Cell>
            </DataRow>
          ))}
        </DataTable>
      </div>

      {/* Phone: cards */}
      <div className="flex flex-col gap-2.5 md:hidden">
        {orders.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">{emptyText}</p>
        ) : (
          orders.map((order) => (
            <article key={order.id} className="flex flex-col gap-1.5 rounded-2xl bg-surface p-3.5 shadow-card">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-bold tabular-nums">#{order.order_number}</span>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-sm font-semibold">{itemsLine(order.order_items)}</p>
              <div className="flex items-center justify-between gap-3 text-[13px] text-stone-600">
                <span className="min-w-0 truncate">
                  {order.customer_name} · {when(order.placed_at)}
                  {order.channel === "whatsapp" ? " · WhatsApp" : ""}
                </span>
                <b className="shrink-0 tabular-nums text-foreground">{wholeRupees(order.total)}</b>
              </div>
              {order.rejection_reason && <p className="text-xs text-red-700">Cancelled: {order.rejection_reason}</p>}
            </article>
          ))
        )}
        <div className="rounded-2xl bg-surface shadow-card">
          <Pagination
            page={page}
            pageSize={HISTORY_PAGE_SIZE}
            total={total}
            hrefFor={(n) => hrefWith("/panel/history", keep, { page: n > 1 ? String(n) : undefined })}
          />
        </div>
      </div>
    </>
  );
}
