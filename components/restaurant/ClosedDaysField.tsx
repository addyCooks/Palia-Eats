import { DAY_NAMES } from "@/lib/utils/hours";

// Seven checkboxes: tick the weekdays the restaurant is closed.
// Submits as repeated "closed_days" values (0 = Sunday ... 6 = Saturday).
export function ClosedDaysField({ defaultClosed = [] }: { defaultClosed?: number[] }) {
  // Show Monday first, the way people read a week.
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 text-[13px] font-semibold text-stone-600">Closed on (days off)</legend>
      <div className="flex flex-wrap gap-2">
        {order.map((day) => (
          <label
            key={day}
            className="flex h-[38px] cursor-pointer items-center rounded-[10px] border-[1.5px] border-border px-3.5 text-sm transition-colors has-[:checked]:border-deep has-[:checked]:bg-deep has-[:checked]:font-semibold has-[:checked]:text-brand has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40"
          >
            <input
              type="checkbox"
              name="closed_days"
              value={day}
              defaultChecked={defaultClosed.includes(day)}
              className="sr-only"
            />
            {DAY_NAMES[day].slice(0, 3)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
