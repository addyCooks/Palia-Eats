"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { assignRider } from "@/lib/actions/admin";

type RiderOption = { id: string; name: string; phone: string; restaurant_id: string | null };

// Choose who delivers an order. Only active riders of this restaurant or PaliaEats riders
// are offered (the database checks this again).
export function RiderPicker({
  orderId,
  current,
  riders,
  locked,
}: {
  orderId: string;
  current: { id: string; name: string; phone: string } | null;
  riders: RiderOption[];
  locked: boolean; // delivered or cancelled orders keep their rider
}) {
  const [choice, setChoice] = useState(current?.id ?? "");
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ error?: string; ok?: string } | null>(null);

  function save(riderId: string | null) {
    setMessage(null);
    startTransition(async () => {
      const result = await assignRider({ orderId, riderId });
      setMessage(result.error ? { error: result.error } : { ok: riderId ? "Rider assigned." : "Rider removed." });
      if (!riderId) setChoice("");
    });
  }

  return (
    <div className="flex flex-col gap-3">
      {current ? (
        <div className="flex items-center gap-3 rounded-xl bg-background p-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-amber-100 font-display text-xl text-amber-800">
            {current.name.charAt(0)}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{current.name}</p>
            <a href={`tel:${current.phone}`} className="text-sm text-accent hover:underline">
              {current.phone}
            </a>
          </div>
        </div>
      ) : (
        <p className="text-sm text-stone-500">No rider on this order yet.</p>
      )}

      {!locked &&
        (riders.length === 0 ? (
          <p className="text-sm text-stone-600">
            No riders yet.{" "}
            <Link href="/admin/riders" className="font-semibold text-accent hover:underline">
              Add a rider
            </Link>
          </p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="sr-only" htmlFor={`rider-${orderId}`}>
              Rider
            </label>
            <select
              id={`rider-${orderId}`}
              value={choice}
              onChange={(event) => setChoice(event.target.value)}
              className="h-11 min-w-0 flex-1 rounded-xl border-[1.5px] border-border bg-surface px-3 text-sm outline-none focus:border-brand"
            >
              <option value="">Choose a rider</option>
              {riders.map((rider) => (
                <option key={rider.id} value={rider.id}>
                  {rider.name} · {rider.phone}
                  {rider.restaurant_id ? " (restaurant's own)" : ""}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={isPending || !choice || choice === current?.id}
              onClick={() => save(choice)}
              className="h-11 rounded-xl bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-dark disabled:opacity-50"
            >
              {isPending ? "Saving…" : current ? "Change rider" : "Assign"}
            </button>
            {current && (
              <button
                type="button"
                disabled={isPending}
                onClick={() => save(null)}
                className="h-11 rounded-xl px-3 text-sm font-medium text-stone-600 hover:bg-muted"
              >
                Remove
              </button>
            )}
          </div>
        ))}
      {message?.error && (
        <p role="alert" className="text-sm text-red-700">
          {message.error}
        </p>
      )}
      {message?.ok && (
        <p role="status" className="text-sm text-stone-600">
          {message.ok}
        </p>
      )}
    </div>
  );
}
