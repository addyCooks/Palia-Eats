import type { OrderStatus, OrderStatusEvent } from "@/types/app";
import { formatClock } from "@/lib/utils/time";

const STEPS: { key: string; label: (restaurant?: string) => string; statuses: OrderStatus[] }[] = [
  { key: "placed", label: () => "Order placed", statuses: ["pending", "accepted"] },
  { key: "cooking", label: (r) => (r ? `Cooking at ${r}` : "Cooking"), statuses: ["preparing"] },
  { key: "way", label: () => "On the way", statuses: ["out_for_delivery"] },
  { key: "delivered", label: () => "Delivered", statuses: ["delivered"] },
];

// The v2 tracking steps: Placed → Cooking → On the way → Delivered, each with the time it
// happened (from the order's status history).
export function OrderTimeline({
  status,
  events = [],
  restaurantName,
}: {
  status: OrderStatus;
  events?: OrderStatusEvent[];
  restaurantName?: string;
}) {
  const current = STEPS.findIndex((step) => step.statuses.includes(status));
  if (current === -1) return null; // cancelled: the page shows a message instead

  const timeOf = (statuses: OrderStatus[]) => {
    const event = events.find((e) => statuses.includes(e.status));
    return event ? formatClock(event.at) : null;
  };

  return (
    <ol aria-label="Order progress" className="flex flex-col">
      {STEPS.map((step, index) => {
        const done = index < current || (index === current && status === "delivered");
        const now = index === current && !done;
        const next = index > current;
        const time = timeOf(step.statuses);
        const last = index === STEPS.length - 1;
        return (
          <li key={step.key} className="flex gap-4" aria-current={now ? "step" : undefined}>
            <div className="flex flex-col items-center">
              <span
                className={`grid size-[26px] shrink-0 place-items-center rounded-full border-2 text-xs font-bold text-on-brand ${
                  next ? "border-[#D8D2C8] bg-surface dark:border-[#4A4136]" : "border-brand bg-brand"
                } ${now ? "ring-4 ring-brand/25" : ""}`}
              >
                {done ? "✓" : ""}
              </span>
              {!last && <span className={`h-[34px] w-0.5 ${done ? "bg-brand" : "bg-border"}`} />}
            </div>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span className={`font-semibold ${next ? "text-stone-500" : ""}`}>{step.label(restaurantName)}</span>
              <span className="text-[13px] text-stone-500">{time ?? (now ? "Now" : next ? "Coming up" : "")}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
