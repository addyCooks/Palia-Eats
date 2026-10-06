"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Toggle } from "@/components/ui/Toggle";

// In-stock switch for one dish in a menu table. The server action is passed in, so the
// panel and the admin each use their own permission check.
export function StockToggle({
  itemId,
  available,
  name,
  action,
}: {
  itemId: string;
  available: boolean;
  name: string;
  action: (input: { itemId: string; available: boolean }) => Promise<{ error?: string }>;
}) {
  const [isPending, startTransition] = useTransition();
  const [shown, setShown] = useOptimistic(available);
  const [error, setError] = useState<string | null>(null);

  return (
    <span className="inline-flex items-center gap-2">
      <Toggle
        checked={shown}
        disabled={isPending}
        label={`${name} in stock`}
        onChange={(next) => {
          setError(null);
          startTransition(async () => {
            setShown(next);
            const result = await action({ itemId, available: next });
            if (result.error) setError(result.error);
          });
        }}
      />
      {error && (
        <span role="alert" className="text-xs text-red-600">
          {error}
        </span>
      )}
    </span>
  );
}
