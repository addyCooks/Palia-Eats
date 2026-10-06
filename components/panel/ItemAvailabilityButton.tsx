"use client";

import { useState, useTransition } from "react";
import { setPanelItemAvailability } from "@/lib/actions/panel";

// One big, glanceable button per dish: green "Available", or red "Sold out" (tap to restock).
// A tap flips it, and customers see the change straight away.
export function ItemAvailabilityButton({ itemId, available }: { itemId: string; available: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        aria-pressed={!available}
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await setPanelItemAvailability({ itemId, available: !available });
            if (result.error) setError(result.error);
          });
        }}
        className={`flex h-[52px] w-full items-center justify-center gap-2.5 rounded-[14px] text-[15px] font-extrabold transition-colors disabled:opacity-60 ${
          available ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"
        }`}
      >
        <span className="size-[9px] rounded-full bg-current" aria-hidden />
        {isPending ? "Updating…" : available ? "Available · tap if sold out" : "Sold out · tap to restock"}
      </button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
