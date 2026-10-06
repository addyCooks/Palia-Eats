import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCustomer } from "@/lib/queries/admin";
import { isUuid } from "@/lib/validation/menu";
import { formatDateTime } from "@/lib/utils/format";
import { wholeRupees } from "@/lib/orders/stats";
import { isCancelled } from "@/lib/orders/status";
import { BlockCustomerButton } from "@/components/admin/BlockCustomerButton";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { itemsLine } from "@/components/panel/KanbanOrderCard";
import { Badge } from "@/components/ui/Badge";
import { Cell, DataRow, DataTable, Kpi, PageHeader, Panel, TableEmpty } from "@/components/ui/page";

export const metadata: Metadata = { title: "Customer" };

const COLUMNS = "90px minmax(0,1.1fr) minmax(0,2fr) 90px 110px 150px";

export default async function AdminCustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const customer = await getAdminCustomer(id);
  if (!customer) notFound();

  const { profile, email, addresses, orders } = customer;
  const spent = orders.filter((order) => !isCancelled(order.status)).reduce((sum, order) => sum + Number(order.total), 0);
  const name = profile.full_name ?? "No name yet";

  return (
    <>
      <PageHeader
        crumb={
          <>
            <Link href="/admin/customers" className="hover:underline">
              Customers
            </Link>{" "}
            › {name}
          </>
        }
        title={name}
        sub={
          <span className="flex flex-wrap items-center gap-2">
            {profile.is_blocked && <Badge tone="error">Blocked</Badge>}
            {profile.role === "admin" && <Badge tone="neutral">Admin</Badge>}
            {email ?? (profile.whatsapp_phone ? "WhatsApp customer" : "No email")}
            {profile.phone ? ` · ${profile.phone}` : ""}
            {profile.created_at ? ` · joined ${formatDateTime(profile.created_at)}` : ""}
          </span>
        }
      >
        {profile.role !== "admin" && (
          <BlockCustomerButton customerId={profile.id} blocked={Boolean(profile.is_blocked)} name={name} />
        )}
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi size="md" dark label="Orders" value={String(orders.length)} />
        <Kpi size="md" label="Spent" value={wholeRupees(spent)} delta="excluding cancelled" />
        <Kpi size="md" label="Cancelled" value={String(orders.filter((order) => isCancelled(order.status)).length)} />
        <Kpi
          size="md"
          label="Last order"
          value={orders[0] ? new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" }).format(new Date(orders[0].placed_at)) : "—"}
        />
      </div>

      <Panel title="Saved addresses">
        {addresses.length === 0 ? (
          <p className="text-sm text-stone-500">None saved.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {addresses.map((address) => (
              <li key={address.id} className="rounded-xl bg-background p-3.5 text-sm">
                <strong>{address.label}</strong>
                {address.is_default ? " (default)" : ""}
                <br />
                {address.address_line}
                {address.landmark ? `, near ${address.landmark}` : ""}
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <h2 className="font-display text-[30px] leading-none">Order history</h2>
      <DataTable
        columns={COLUMNS}
        headers={["ORDER", "RESTAURANT", "ITEMS", "TOTAL", "STATUS", "PLACED"]}
        empty={orders.length === 0 ? <TableEmpty>No orders yet.</TableEmpty> : undefined}
      >
        {orders.map((order) => (
          <DataRow key={order.id} columns={COLUMNS} href={`/admin/orders/${order.id}`}>
            <Cell strong>#{order.order_number}</Cell>
            <Cell strong>{order.restaurants?.name ?? "—"}</Cell>
            <Cell>{itemsLine(order.order_items)}</Cell>
            <Cell strong>{wholeRupees(order.total)}</Cell>
            <span>
              <OrderStatusBadge status={order.status} />
            </span>
            <Cell>{formatDateTime(order.placed_at)}</Cell>
          </DataRow>
        ))}
      </DataTable>
    </>
  );
}
