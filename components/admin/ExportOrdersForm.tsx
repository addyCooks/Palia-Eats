import { Download } from "lucide-react";
import { addDaysToKey, todayKeyIST } from "@/lib/utils/time";

// "Download CSV" on the orders page: pick the days, get a spreadsheet. A plain form (works
// without JavaScript); the file is made by /admin/export/orders.
export function ExportOrdersForm() {
  const today = todayKeyIST();
  return (
    <details className="relative">
      <summary className="inline-flex h-11 cursor-pointer list-none items-center gap-2 rounded-xl bg-surface px-4 text-sm font-semibold shadow-card marker:content-none hover:bg-muted">
        <Download className="size-4" aria-hidden />
        Download CSV
      </summary>
      <form
        action="/admin/export/orders"
        method="get"
        className="absolute right-0 top-12 z-30 flex w-[min(320px,calc(100vw-2rem))] flex-col gap-3 rounded-2xl bg-surface p-4 shadow-float"
      >
        <p className="text-sm text-stone-600">Orders placed between these days, one row per order.</p>
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-stone-600">
          From
          <input
            type="date"
            name="from"
            defaultValue={addDaysToKey(today, -29)}
            max={today}
            required
            className="h-11 rounded-xl border-[1.5px] border-border bg-surface px-3 text-[15px] font-normal text-foreground"
          />
        </label>
        <label className="flex flex-col gap-1 text-[13px] font-semibold text-stone-600">
          To
          <input
            type="date"
            name="to"
            defaultValue={today}
            max={today}
            required
            className="h-11 rounded-xl border-[1.5px] border-border bg-surface px-3 text-[15px] font-normal text-foreground"
          />
        </label>
        <button type="submit" className="press h-11 rounded-xl bg-brand text-sm font-bold text-on-brand hover:bg-brand-dark">
          Download
        </button>
      </form>
    </details>
  );
}
