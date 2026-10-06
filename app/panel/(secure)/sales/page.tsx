import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelSales } from "@/lib/queries/panel";
import { compactRupees, percentChange, signed, wholeRupees } from "@/lib/orders/stats";
import { formatKeyRange } from "@/lib/utils/time";
import { Bars, Kpi, PageHeader, Panel } from "@/components/ui/page";

export const metadata: Metadata = { title: "Sales" };

export default async function PanelSalesPage() {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const sales = await getPanelSales(restaurant.id);
  const { current: now, previous: before } = sales;
  const cancelledShare = now.all > 0 ? `${((now.cancelled / now.all) * 100).toFixed(1)}% of orders` : "None this week";
  const top = sales.topDishes[0]?.sold ?? 1;
  const best = Math.max(...sales.days.map((day) => day.revenue));

  return (
    <>
      <PageHeader title="Sales" sub={`${restaurant.name} · ${formatKeyRange(sales.from, sales.to)}`}>
        <a
          href="/panel/sales/report"
          download
          className="inline-flex h-11 items-center rounded-xl bg-surface px-[18px] text-sm font-semibold shadow-card hover:bg-muted"
        >
          Download report
        </a>
      </PageHeader>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
        <Kpi
          dark
          label="Revenue"
          value={compactRupees(now.revenue)}
          delta={percentChange(now.revenue, before.revenue, "vs last week") || "Delivered orders"}
        />
        <Kpi label="Orders" value={String(now.orders)} delta={signed(now.orders - before.orders)} />
        <Kpi
          label="Avg order"
          value={wholeRupees(now.avgOrder)}
          delta={before.avgOrder ? signed(now.avgOrder - before.avgOrder, "₹") : undefined}
        />
        <Kpi label="Cancelled" value={String(now.cancelled)} delta={cancelledShare} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <Panel title="Daily sales">
          <Bars
            height={220}
            bars={sales.days.map((day) => ({
              label: day.label,
              value: day.revenue,
              display: day.revenue > 0 ? compactRupees(day.revenue) : "₹0",
              tone: best > 0 && day.revenue >= best * 0.75 ? "high" : "low",
            }))}
          />
        </Panel>
        <Panel title="Top dishes">
          {sales.topDishes.length === 0 ? (
            <p className="text-sm text-stone-500">No dishes sold this week yet.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {sales.topDishes.map((dish) => (
                <li key={dish.name} className="flex flex-col gap-1.5">
                  <div className="flex justify-between gap-3 text-sm">
                    <span className="truncate font-medium">{dish.name}</span>
                    <span className="shrink-0 text-stone-600">{dish.sold} sold</span>
                  </div>
                  <div className="h-1.5 rounded-[3px] bg-muted">
                    <div className="h-full rounded-[3px] bg-brand" style={{ width: `${Math.round((dish.sold / top) * 100)}%` }} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <p className="text-xs text-stone-500">
        Last 7 days compared with the 7 days before. Revenue counts delivered orders (cash or UPI collected).
      </p>
    </>
  );
}
