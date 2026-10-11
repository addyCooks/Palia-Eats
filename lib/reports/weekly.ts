// Numbers for a restaurant's weekly summary email. Pure (no imports) so it can be tested on its
// own; the caller passes in the week's orders and dishes plus a way to turn a time into an
// Indian calendar day ("2026-10-05").

export type WeekOrder = { placed_at: string; total: number; status: string };
export type WeekItem = { item_name: string; quantity: number };

export type WeekSummary = {
  delivered: number;
  cancelled: number;
  sales: number; // money for delivered orders
  averageOrder: number;
  bestDay: { dayKey: string; sales: number; orders: number } | null;
  topDishes: { name: string; quantity: number }[];
};

export function summarizeWeek(
  orders: WeekOrder[],
  items: WeekItem[],
  dayKeyOf: (iso: string) => string,
): WeekSummary {
  const delivered = orders.filter((order) => order.status === "delivered");
  const cancelled = orders.filter((order) => order.status === "cancelled").length;
  const sales = delivered.reduce((sum, order) => sum + Number(order.total), 0);

  const perDay = new Map<string, { sales: number; orders: number }>();
  for (const order of delivered) {
    const key = dayKeyOf(order.placed_at);
    const day = perDay.get(key) ?? { sales: 0, orders: 0 };
    day.sales += Number(order.total);
    day.orders += 1;
    perDay.set(key, day);
  }
  let bestDay: WeekSummary["bestDay"] = null;
  for (const [dayKey, day] of perDay) {
    if (!bestDay || day.sales > bestDay.sales) bestDay = { dayKey, ...day };
  }

  const perDish = new Map<string, number>();
  for (const item of items) {
    // "Biryani (Half)" counts with "Biryani"
    const name = item.item_name.replace(/\s*\((half|full)\)\s*$/i, "");
    perDish.set(name, (perDish.get(name) ?? 0) + Number(item.quantity));
  }
  const topDishes = [...perDish.entries()]
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity || a.name.localeCompare(b.name))
    .slice(0, 3);

  return {
    delivered: delivered.length,
    cancelled,
    sales: Math.round(sales * 100) / 100,
    averageOrder: delivered.length ? Math.round(sales / delivered.length) : 0,
    bestDay,
    topDishes,
  };
}

// "+12%" / "-8%" against the week before; null when there was nothing to compare with.
export function percentChange(current: number, previous: number): number | null {
  if (!previous) return null;
  return Math.round(((current - previous) / previous) * 100);
}
