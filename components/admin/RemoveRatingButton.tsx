"use client";

import { useState, useTransition } from "react";
import { removeRating } from "@/lib/actions/admin";

// Removes one rating. The restaurant's average and count update straight away, and the
// customer can't bring it back (they may be asked to rate again if the order is recent).
export function RemoveRatingButton({
  orderId,
  stars,
  restaurant,
}: {
  orderId: string;
  stars: number;
  restaurant: string;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          if (
            !window.confirm(
              `Remove this ${stars}★ rating from ${restaurant}? Its average updates right away. This can't be undone.`,
            )
          ) {
            return;
          }
          setError(null);
          startTransition(async () => {
            const result = await removeRating({ orderId });
            if (result.error) setError(result.error);
          });
        }}
        className="inline-flex h-11 items-center rounded-xl bg-[#16120D] px-[18px] text-sm font-semibold text-white hover:bg-black disabled:opacity-60 dark:bg-[#2A241C]"
      >
        {isPending ? "Removing…" : "Remove rating"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
