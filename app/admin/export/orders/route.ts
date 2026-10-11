import type { NextRequest } from "next/server";
import { requireAdmin } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/admin/audit";
import { getOrdersForExport } from "@/lib/queries/export";
import { toCsv } from "@/lib/utils/csv";
import { istDayStart, addDaysToKey, todayKeyIST, formatClock, istDateKey } from "@/lib/utils/time";
import { isUuid } from "@/lib/validation/menu";

// Admin -> Orders -> Download CSV. Orders placed between two days (Indian time), one row per
// order, opens in Excel or Google Sheets. Admins only; every download is written to Activity.
export const dynamic = "force-dynamic";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
const MAX_DAYS = 366;

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? (value[0] ?? null) : (value ?? null);
}

export async function GET(request: NextRequest) {
  const admin = await requireAdmin();
  const params = request.nextUrl.searchParams;

  const toRaw = params.get("to") ?? "";
  const to = DAY.test(toRaw) ? toRaw : todayKeyIST();
  const fromRaw = params.get("from") ?? "";
  let from = DAY.test(fromRaw) ? fromRaw : addDaysToKey(to, -29);
  if (from > to) from = to;
  if (new Date(to).getTime() - new Date(from).getTime() > MAX_DAYS * 86_400_000) from = addDaysToKey(to, -MAX_DAYS);
  const restaurantId = isUuid(params.get("restaurant") ?? "") ? params.get("restaurant") : null;

  const { rows, truncated } = await getOrdersForExport({
    fromIso: istDayStart(from),
    toIso: istDayStart(addDaysToKey(to, 1)),
    restaurantId,
  });

  const csv = toCsv(
    [
      "Order no",
      "Date",
      "Time",
      "Status",
      "Restaurant",
      "Customer",
      "Phone",
      "Address",
      "Items",
      "Subtotal",
      "Delivery fee",
      "Total",
      "Channel",
      "Cancelled by",
      "Cancel reason",
      "Rating",
      "Customer note",
    ],
    rows.map((order) => [
      order.order_number,
      istDateKey(order.placed_at),
      formatClock(order.placed_at),
      order.status,
      one(order.restaurants)?.name ?? "",
      order.customer_name,
      order.customer_phone,
      [order.delivery_address?.address_line, order.delivery_address?.landmark].filter(Boolean).join(", "),
      (order.order_items ?? []).map((item) => `${item.quantity} x ${item.item_name}`).join("; "),
      order.subtotal,
      order.delivery_fee,
      order.total,
      order.channel,
      order.cancelled_by ?? "",
      order.rejection_reason ?? "",
      one(order.order_ratings)?.stars ?? "",
      order.customer_notes ?? "",
    ]),
  );

  await logAdminAction(admin, {
    action: "export.orders",
    summary: `Downloaded ${rows.length} orders (${from} to ${to})${truncated ? ", stopped at the limit" : ""}`,
    details: { from, to, restaurantId, count: rows.length },
  });

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="paliaeats-orders-${from}-to-${to}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
