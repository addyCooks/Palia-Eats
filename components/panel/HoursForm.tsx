"use client";

import { keepValues } from "@/lib/forms";
import { useActionState } from "react";
import { updatePanelHours, type PanelHoursState } from "@/lib/actions/panel";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ClosedDaysField } from "@/components/restaurant/ClosedDaysField";

type HoursFormProps = {
  openingTime: string | null;
  closingTime: string | null;
  closedDays: number[];
};

// Postgres returns times as "10:00:00"; <input type="time"> wants "10:00".
const toInput = (time: string | null) => time?.slice(0, 5) ?? "";

export function HoursForm({ openingTime, closingTime, closedDays }: HoursFormProps) {
  const [state, formAction, pending] = useActionState<PanelHoursState, FormData>(
    updatePanelHours,
    undefined,
  );

  return (
    <form onSubmit={keepValues(formAction)}>
      <Card className="flex flex-col gap-4">
        <div>
          <h2 className="text-[17px] font-semibold">Opening hours</h2>
          <p className="text-sm text-stone-600">
            Customers can only order between these times, on the days you&apos;re open. Leave both times
            empty to be open all day.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Opens at" name="opening_time" type="time" defaultValue={toInput(openingTime)} />
          <Input label="Closes at" name="closing_time" type="time" defaultValue={toInput(closingTime)} />
        </div>
        <ClosedDaysField defaultClosed={closedDays} />

        {state?.error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state?.saved && (
          <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900">
            Hours saved.
          </p>
        )}
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save hours"}
        </Button>
      </Card>
    </form>
  );
}
