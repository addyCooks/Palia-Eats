import type { Metadata } from "next";
import { ADMIN_PAGE_SIZE, getAdminOrders, type AdminOrderFilter } from "@/lib/queries/admin";
import { wholeRupees } from "@/lib/orders/stats";
import { LiveUpdates } from "@/components/LiveUpdates";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
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

export const metadata: Metadata = { title: "Orders" };

const CHIPS: { key: AdminOrderFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "cooking", label: "Cooking" },
  { key: "way", label: "On the way" },
  { key: "delivered", label: "Delivered" },
  { key: "cancelled", label: "Cancelled" },
];

const COLUMNS = "100px minmax(0,1.3fr) minmax(0,1.3fr) minmax(0,1fr) 90px 110px";

export default async function AdminOrdersPage({ searchParams }: PageProps<"/admin/orders">) {
  const params = await searchParams;
  const search = param(params.q);
  const raw = param(params.status);
  const filter: AdminOrderFilter = CHIPS.some((chip) => chip.key === raw) ? (raw as AdminOrderFilter) : "all";
  const page = pageNumber(params.page);

  const { orders, total, today, restaurantsToday } = await getAdminOrders({ filter, search, page });
  const keep = { q: search || undefined, status: filter === "all" ? undefined : filter };

  return (
    <>
      <PageHeader
        title="All orders"
        sub={`${today} today across ${restaurantsToday} ${restaurantsToday === 1 ? "restaurant" : "restaurants"}`}
      >
        <LiveUpdates tables={[{ table: "orders" }]} showStatus />
        <SearchBox
          action="/admin/orders"
          value={search}
          placeholder="Order, customer or restaurant"
          keep={{ status: keep.status }}
        />
      </PageHeader>

      <FilterChips
        label="Filter orders"
        chips={CHIPS}
        active={filter}
        hrefFor={(key) => hrefWith("/admin/orders", keep, { status: key === "all" ? undefined : key, page: undefined })}
      />

      <DataTable
        columns={COLUMNS}
        headers={["ORDER", "RESTAURANT", "CUSTOMER", "RIDER", "TOTAL", "STATUS"]}
        empty={
          orders.length === 0 ? (
            <TableEmpty>{search || filter !== "all" ? "No orders match that." : "No orders yet."}</TableEmpty>
          ) : undefined
        }
        footer={
          <Pagination
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={total}
            hrefFor={(n) => hrefWith("/admin/orders", keep, { page: n > 1 ? String(n) : undefined })}
          />
        }
      >
        {orders.map((order) => (
          <DataRow key={order.id} columns={COLUMNS} href={`/admin/orders/${order.id}`}>
            <Cell strong>#{order.order_number}</Cell>
            <Cell strong>{order.restaurants?.name ?? "—"}</Cell>
            <Cell>
              {order.customer_name}
              {order.channel === "whatsapp" ? " · WhatsApp" : ""}
            </Cell>
            <Cell>{order.riders?.name ?? "—"}</Cell>
            <Cell strong>{wholeRupees(order.total)}</Cell>
            <span>
              <OrderStatusBadge status={order.status} />
            </span>
          </DataRow>
        ))}
      </DataTable>
      <p className="text-xs text-stone-500">Tap an order to move it along, cancel it or put a rider on it. Updates live.</p>
    </>
  );
}
