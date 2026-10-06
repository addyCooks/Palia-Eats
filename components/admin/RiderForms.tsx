"use client";

import { keepValues } from "@/lib/forms";
import { useActionState, useState, useTransition } from "react";
import { createRider, setRiderActive, updateRider, type RiderFormState } from "@/lib/actions/admin";
import type { Rider } from "@/types/app";
import { Toggle } from "@/components/ui/Toggle";

type RestaurantOption = { id: string; name: string };

const fieldClass =
  "h-11 w-full rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-brand";

function RiderFields({ rider, restaurants }: { rider?: Rider; restaurants: RestaurantOption[] }) {
  return (
    <>
      <label className="flex min-w-0 flex-col gap-1 text-[13px] font-semibold text-stone-600">
        Name
        <input name="name" required maxLength={80} defaultValue={rider?.name} className={fieldClass} />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-[13px] font-semibold text-stone-600">
        Mobile
        <input
          name="phone"
          type="tel"
          inputMode="numeric"
          required
          placeholder="98765 43210"
          defaultValue={rider?.phone}
          className={fieldClass}
        />
      </label>
      <label className="flex min-w-0 flex-col gap-1 text-[13px] font-semibold text-stone-600">
        Works for
        <select name="restaurant_id" defaultValue={rider?.restaurant_id ?? ""} className={fieldClass}>
          <option value="">PaliaEats (any restaurant)</option>
          {restaurants.map((restaurant) => (
            <option key={restaurant.id} value={restaurant.id}>
              {restaurant.name} only
            </option>
          ))}
        </select>
      </label>
    </>
  );
}

function Message({ state }: { state: RiderFormState }) {
  if (state?.error) return <p role="alert" className="text-sm text-red-700">{state.error}</p>;
  if (state?.saved) return <p role="status" className="text-sm text-stone-600">Saved.</p>;
  return null;
}

export function AddRiderForm({ restaurants }: { restaurants: RestaurantOption[] }) {
  const [state, formAction, pending] = useActionState<RiderFormState, FormData>(createRider, undefined);
  return (
    <form action={formAction} className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr_auto] sm:items-end">
        <RiderFields restaurants={restaurants} />
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-xl bg-brand px-5 text-sm font-bold text-on-brand hover:bg-brand-dark disabled:opacity-60"
        >
          {pending ? "Adding…" : "Add rider"}
        </button>
      </div>
      <Message state={state} />
    </form>
  );
}

export function EditRiderForm({ rider, restaurants }: { rider: Rider; restaurants: RestaurantOption[] }) {
  const [state, formAction, pending] = useActionState<RiderFormState, FormData>(updateRider, undefined);
  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-3 pt-3">
      <input type="hidden" name="riderId" value={rider.id} />
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_1.2fr_auto] sm:items-end">
        <RiderFields rider={rider} restaurants={restaurants} />
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-xl bg-deep px-5 text-sm font-semibold text-brand disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save"}
        </button>
      </div>
      <Message state={state} />
    </form>
  );
}

export function RiderActiveToggle({ riderId, active, name }: { riderId: string; active: boolean; name: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <Toggle
        checked={active}
        disabled={isPending}
        label={`${name} is working`}
        onChange={(next) =>
          startTransition(async () => {
            setError(null);
            const result = await setRiderActive({ riderId, active: next });
            if (result.error) setError(result.error);
          })
        }
      />
      {error && <span className="text-xs text-red-700">{error}</span>}
    </span>
  );
}
