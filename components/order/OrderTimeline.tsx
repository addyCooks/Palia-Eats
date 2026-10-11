import type { OrderStatus, OrderStatusEvent } from "@/types/app";
import { formatClock } from "@/lib/utils/time";
import { say } from "@/lib/i18n/say";
import type { T } from "@/lib/i18n/messages";

const STEPS: { key: string; label: (t: T | undefined, restaurant?: string) => string; statuses: OrderStatus[] }[] = [
  { key: "placed", label: (t) => say(t, "tl.placed", "Order placed"), statuses: ["pending", "accepted"] },
  {
    key: "cooking",
    label: (t, r) => (r ? say(t, "tl.cooking_at", "Cooking at {name}", { name: r }) : say(t, "tl.cooking", "Cooking")),
    statuses: ["preparing"],
  },
  { key: "way", label: (t) => say(t, "tl.way", "On the way"), statuses: ["out_for_delivery"] },
  { key: "delivered", label: (t) => say(t, "tl.delivered", "Delivered"), statuses: ["delivered"] },
];

// The v2 tracking steps: Placed → Cooking → On the way → Delivered, each with the time it
// happened (from the order's status history).
export function OrderTimeline({
  status,
  events = [],
  restaurantName,
  t,
}: {
  status: OrderStatus;
  events?: OrderStatusEvent[];
  restaurantName?: string;
  // Given on customer pages (their language); the admin leaves it out (English).
  t?: T;
}) {
  const current = STEPS.findIndex((step) => step.statuses.includes(status));
  if (current === -1) return null; // cancelled: the page shows a message instead

  const timeOf = (statuses: OrderStatus[]) => {
    const event = events.find((e) => statuses.includes(e.status));
    return event ? formatClock(event.at) : null;
  };

  return (
    <ol aria-label={say(t, "tl.progress", "Order progress")} className="flex flex-col">
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
                className={`relative grid size-[26px] shrink-0 place-items-center rounded-full border-2 text-xs font-bold text-on-brand transition-colors duration-500 ${
                  next ? "border-[#D8D2C8] bg-surface dark:border-[#4A4136]" : "border-brand bg-brand"
                } ${now ? "ring-4 ring-brand/25" : ""}`}
              >
                {/* The current step breathes; finished steps get their tick with a little pop */}
                {now && <span className="pe-ring absolute inset-0 rounded-full bg-brand" aria-hidden />}
                {done ? <span key="tick" className="anim-bump">✓</span> : ""}
              </span>
              {!last && (
                <span className="relative h-[34px] w-0.5 overflow-hidden bg-border">
                  <span
                    className={`absolute inset-x-0 top-0 bg-brand transition-[height] duration-700 ease-out ${done ? "h-full" : "h-0"}`}
                  />
                </span>
              )}
            </div>
            <div className="flex flex-col gap-0.5 pt-0.5">
              <span className={`font-semibold ${next ? "text-stone-500" : ""}`}>{step.label(t, restaurantName)}</span>
              <span className="text-[13px] text-stone-500">{time ?? (now ? say(t, "tl.now", "Now") : next ? say(t, "tl.coming", "Coming up") : "")}</span>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
