import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelSales } from "@/lib/queries/panel";
import { ORDER_STATUS_LABELS } from "@/lib/orders/status";
import { formatDateTime } from "@/lib/utils/format";

// "Download report": this week's orders as a CSV file that opens in Excel / Google Sheets.
// Same panel cookie check as the pages (route handlers don't go through the layout).

function csvCell(value: string | number): string {
  const text = String(value);
  // Quote everything; neutralise spreadsheet formulas (=, +, -, @ at the start).
  const safe = /^[=+\-@\t\r]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export async function GET() {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) return new Response("Your session has expired.", { status: 401 });

  const sales = await getPanelSales(restaurant.id);
  const header = ["Order", "Placed", "Customer", "Items", "Status", "Total (₹)"];
  const lines = sales.orders.map((order) =>
    [
      `#${order.order_number}`,
      formatDateTime(order.placed_at),
      order.customer_name,
      order.order_items.map((item) => `${item.quantity} × ${item.item_name}`).join("; "),
      ORDER_STATUS_LABELS[order.status],
      Number(order.total).toFixed(2),
    ]
      .map(csvCell)
      .join(","),
  );

  const body = `﻿${[header.map(csvCell).join(","), ...lines].join("\r\n")}\r\n`;
  const filename = `${restaurant.slug}-sales-${sales.from}-to-${sales.to}.csv`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
