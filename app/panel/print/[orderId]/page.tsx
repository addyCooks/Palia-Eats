import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPanelRestaurant } from "@/lib/panel/session";
import { isUuid } from "@/lib/validation/menu";
import { formatPrice } from "@/lib/utils/format";
import { formatClock, formatDayLabel } from "@/lib/utils/time";
import { PrintControls } from "@/components/panel/PrintControls";
import type { OrderItem, Order } from "@/types/app";

export const metadata: Metadata = { title: "Print order", robots: { index: false } };

// A kitchen slip for one order, made to print on a small receipt printer (80 mm paper) or on A4.
// Opened from the "Print" link on an order in the restaurant panel. Only the restaurant that owns
// the order can open it (the panel link identifies the restaurant).
export default async function PrintOrderPage({ params, searchParams }: PageProps<"/panel/print/[orderId]">) {
  const { orderId } = await params;
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");
  if (!isUuid(orderId)) notFound();

  const { data } = await createAdminClient()
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .eq("restaurant_id", restaurant.id)
    .maybeSingle();
  if (!data) notFound();
  const order = data as Order & { order_items: OrderItem[] };
  const address = order.delivery_address;
  const auto = (await searchParams).auto === "1";

  return (
    <main className="mx-auto w-full max-w-[340px] bg-white p-4 font-mono text-[13px] leading-snug text-black print:max-w-none print:p-0">
      {/* Fits 80 mm receipt paper; on a normal printer it prints at the top of the page */}
      <style>{`@page { size: 80mm auto; margin: 4mm; } @media print { body { background: #fff !important; } }`}</style>

      <PrintControls auto={auto} />

      <div className="text-center">
        <p className="text-[11px] tracking-[3px]">PALIAEATS</p>
        <p className="mt-1 text-base font-bold">{restaurant.name}</p>
      </div>

      <hr className="my-3 border-t border-dashed border-black" />

      <p className="text-center text-[28px] font-bold leading-none">#{order.order_number}</p>
      <p className="mt-1 text-center">
        {formatDayLabel(order.placed_at)} · {formatClock(order.placed_at)}
        {order.channel === "whatsapp" ? " · WhatsApp" : ""}
      </p>

      <hr className="my-3 border-t border-dashed border-black" />

      <ul className="flex flex-col gap-1">
        {order.order_items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3">
            <span className="min-w-0 break-words">
              <b>{item.quantity} x</b> {item.item_name}
            </span>
            <span className="shrink-0">{formatPrice(item.line_total)}</span>
          </li>
        ))}
      </ul>

      {order.customer_notes && (
        <p className="mt-3 border border-black p-1.5">
          <b>NOTE:</b> {order.customer_notes}
        </p>
      )}

      <hr className="my-3 border-t border-dashed border-black" />

      <p className="flex justify-between">
        <span>Items</span>
        <span>{formatPrice(order.subtotal)}</span>
      </p>
      <p className="flex justify-between">
        <span>Delivery</span>
        <span>{order.delivery_fee > 0 ? formatPrice(order.delivery_fee) : "Free"}</span>
      </p>
      <p className="mt-1 flex justify-between text-base font-bold">
        <span>TOTAL</span>
        <span>{formatPrice(order.total)}</span>
      </p>
      <p className="mt-1 text-center">Collect {formatPrice(order.total)} on delivery (cash or UPI)</p>

      <hr className="my-3 border-t border-dashed border-black" />

      <p className="font-bold">{order.customer_name}</p>
      <p>{order.customer_phone}</p>
      <p className="mt-1 whitespace-pre-line break-words">{address.address_line}</p>
      {address.landmark && <p>Landmark: {address.landmark}</p>}

      <hr className="my-3 border-t border-dashed border-black" />
      <p className="text-center text-[11px]">Thank you!  ·  paliaeats.online</p>
    </main>
  );
}
