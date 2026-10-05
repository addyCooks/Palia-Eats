import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminCustomer } from "@/lib/queries/admin";
import { isUuid } from "@/lib/validation/menu";
import { formatDateTime, formatPrice } from "@/lib/utils/format";
import { OrderStatusBadge } from "@/components/order/OrderStatusBadge";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Customer" };

export default async function AdminCustomerPage({ params }: PageProps<"/admin/customers/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const customer = await getAdminCustomer(id);
  if (!customer) notFound();

  const { profile, email, addresses, orders } = customer;
  const spent = orders
    .filter((order) => order.status !== "cancelled" && order.status !== "rejected")
    .reduce((sum, order) => sum + Number(order.total), 0);

  return (
    <>
      <Link href="/admin/customers" className="text-sm text-stone-500 hover:underline">
        ← All customers
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">{profile.full_name ?? "No name yet"}</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="flex flex-col gap-2">
          <h2 className="font-semibold">Details</h2>
          <dl className="grid grid-cols-[6rem_1fr] gap-y-1 text-sm">
            <dt className="text-stone-500">Email</dt>
            <dd className="break-all">{email ?? "-"}</dd>
            <dt className="text-stone-500">Phone</dt>
            <dd>{profile.phone ?? "-"}</dd>
            <dt className="text-stone-500">Role</dt>
            <dd className="capitalize">{profile.role}</dd>
            <dt className="text-stone-500">Joined</dt>
            <dd>{profile.created_at ? formatDateTime(profile.created_at) : "-"}</dd>
            <dt className="text-stone-500">Orders</dt>
            <dd>
              {orders.length} · {formatPrice(spent)} spent
            </dd>
          </dl>
        </Card>

        <Card className="flex flex-col gap-2">
          <h2 className="font-semibold">Saved addresses</h2>
          {addresses.length === 0 ? (
            <p className="text-sm text-stone-500">None saved.</p>
          ) : (
            <ul className="flex flex-col gap-2 text-sm">
              {addresses.map((address) => (
                <li key={address.id}>
                  <strong>{address.label}</strong>
                  {address.is_default ? " (default)" : ""}
                  <br />
                  {address.address_line}
                  {address.landmark ? `, near ${address.landmark}` : ""}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Order history</h2>
      {orders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-6 text-center text-stone-500">
          No orders yet.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {orders.map((order) => (
            <li key={order.id}>
              <Card className="flex flex-col gap-1 p-4">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold">
                    #{order.order_number} · {order.restaurants?.name ?? "Restaurant"}
                  </p>
                  <OrderStatusBadge status={order.status} />
                </div>
                <p className="text-sm text-stone-600">
                  {order.order_items.map((item) => `${item.quantity} × ${item.item_name}`).join(", ")}
                </p>
                <p className="text-sm text-stone-600">
                  {formatPrice(order.total)} · {formatDateTime(order.placed_at)}
                  {order.channel === "whatsapp" ? " · via WhatsApp" : ""}
                </p>
                {order.rejection_reason && (
                  <p className="text-sm text-red-700">
                    Cancelled
                    {order.cancelled_by ? ` by ${order.cancelled_by}` : ""}: {order.rejection_reason}
                  </p>
                )}
              </Card>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
