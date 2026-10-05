import { DAY_NAMES } from "@/lib/utils/hours";

// Seven checkboxes: tick the weekdays the restaurant is closed.
// Submits as repeated "closed_days" values (0 = Sunday ... 6 = Saturday).
export function ClosedDaysField({ defaultClosed = [] }: { defaultClosed?: number[] }) {
  // Show Monday first, the way people read a week.
  const order = [1, 2, 3, 4, 5, 6, 0];
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-sm font-medium">Closed on (days off)</legend>
      <div className="flex flex-wrap gap-2">
        {order.map((day) => (
          <label
            key={day}
            className="flex cursor-pointer items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm has-[:checked]:border-red-300 has-[:checked]:bg-red-50"
          >
            <input type="checkbox" name="closed_days" value={day} defaultChecked={defaultClosed.includes(day)} />
            {DAY_NAMES[day].slice(0, 3)}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
