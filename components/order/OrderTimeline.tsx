import type { OrderStatus } from "@/types/app";

const STEPS = [
  { label: "Order placed", statuses: ["pending", "accepted"] },
  { label: "Cooking", statuses: ["preparing"] },
  { label: "Out for delivery", statuses: ["out_for_delivery"] },
  { label: "Delivered", statuses: ["delivered"] },
];

// The four-step progress bar on the customer's order page.
export function OrderTimeline({ status }: { status: OrderStatus }) {
  const current = STEPS.findIndex((step) => step.statuses.includes(status));
  if (current === -1) return null; // cancelled: the page shows a message instead

  return (
    <ol aria-label="Order progress" className="flex items-start">
      {STEPS.map((step, index) => {
        const done = index < current || (index === current && status === "delivered");
        const active = index === current && !done;
        return (
          <li key={step.label} className="flex flex-1 flex-col items-center gap-2 text-center">
            <div className="flex w-full items-center">
              <span className={`h-1 flex-1 ${index === 0 ? "opacity-0" : done || active ? "bg-brand" : "bg-border"}`} />
              <span
                aria-current={active ? "step" : undefined}
                className={`flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-bold ${
                  done
                    ? "bg-brand text-on-brand"
                    : active
                      ? "bg-brand text-on-brand ring-4 ring-brand/25"
                      : "bg-border text-stone-500"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span
                className={`h-1 flex-1 ${index === STEPS.length - 1 ? "opacity-0" : done ? "bg-brand" : "bg-border"}`}
              />
            </div>
            <span className={`text-xs ${active ? "font-semibold" : "text-stone-600"}`}>{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}
