"use client";

import { useState, useTransition } from "react";
import { adminSetAccepting } from "@/lib/actions/restaurants";
import { markPayoutPaid } from "@/lib/actions/admin";

// "Pause orders" / "Resume orders" in the restaurant hero.
export function PauseOrdersButton({ restaurantId, accepting }: { restaurantId: string; accepting: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <span className="flex flex-col gap-1">
      <button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await adminSetAccepting({ restaurantId, accepting: !accepting });
            if (result.error) setError(result.error);
          })
        }
        className="inline-flex h-11 items-center rounded-xl bg-[#2A241C] px-[18px] text-sm font-semibold text-white hover:bg-[#3A3228] disabled:opacity-60"
      >
        {isPending ? "Updating…" : accepting ? "Pause orders" : "Resume orders"}
      </button>
      {error && <span className="text-xs text-[#FF8A7A]">{error}</span>}
    </span>
  );
}

export function MarkPaidButton({ restaurantId, weekStart, label }: { restaurantId: string; weekStart: string; label: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (!window.confirm(`Mark ${label} as settled with the restaurant?`)) return;
          startTransition(async () => {
            setError(null);
            const result = await markPayoutPaid({ restaurantId, weekStart });
            if (result.error) setError(result.error);
          });
        }}
        className="mt-1.5 h-11 rounded-xl bg-[#16120D] text-sm font-semibold text-white hover:bg-black disabled:opacity-60 dark:bg-[#2A241C]"
      >
        {isPending ? "Saving…" : "Mark this week paid"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
