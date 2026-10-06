import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminOrder } from "@/lib/queries/admin";
import { adminUpdateOrderStatus } from "@/lib/actions/admin-orders";
import { isUuid } from "@/lib/validation/menu";
import { formatDateTime } from "@/lib/utils/format";
import { ACTIVE_STATUSES } from "@/lib/orders/status";
import { LiveUpdates } from "@/components/LiveUpdates";
import { RiderPicker } from "@/components/admin/RiderPicker";
import { OrderTimeline } from "@/components/order/OrderTimeline";
import { StaffOrderCard } from "@/components/order/StaffOrderCard";
import { Stars } from "@/components/order/Stars";
import { PageHeader, Panel } from "@/components/ui/page";

export const metadata: Metadata = { title: "Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const data = await getAdminOrder(id);
  if (!data) notFound();
  const { order, events, rating, riders } = data;
  const open = ACTIVE_STATUSES.includes(order.status);

  return (
    <>
      <LiveUpdates tables={[{ table: "orders", filter: `id=eq.${order.id}` }]} />
      <PageHeader
        crumb={
          <>
            <Link href="/admin/orders" className="hover:underline">
              Orders
            </Link>{" "}
            › #{order.order_number}
          </>
        }
        title={`Order #${order.order_number}`}
        sub={`${order.restaurants?.name ?? "Restaurant"} · placed ${formatDateTime(order.placed_at)}${
          order.channel === "whatsapp" ? " · via WhatsApp" : ""
        }`}
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <StaffOrderCard order={order} updateStatus={adminUpdateOrderStatus} restaurantName={order.restaurants?.name} />

        <div className="flex flex-col gap-5">
          <Panel title="Rider">
            <RiderPicker orderId={order.id} current={order.riders} riders={riders} locked={!open} />
          </Panel>
          <Panel title="Progress">
            {order.status === "cancelled" || order.status === "rejected" ? (
              <p className="text-sm text-red-700">
                Cancelled{order.cancelled_by ? ` by the ${order.cancelled_by}` : ""}
                {order.rejection_reason ? `: ${order.rejection_reason}` : "."}
              </p>
            ) : (
              <OrderTimeline status={order.status} events={events} restaurantName={order.restaurants?.name} />
            )}
          </Panel>
          {rating && (
            <Panel title="Customer rating">
              <Stars value={rating.stars} />
              {rating.comment && <p className="text-sm text-stone-700">&ldquo;{rating.comment}&rdquo;</p>}
            </Panel>
          )}
          <Link href={`/admin/customers/${order.customer_id}`} className="text-sm font-semibold text-accent hover:underline">
            See this customer →
          </Link>
        </div>
      </div>
    </>
  );
}
