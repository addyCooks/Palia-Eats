"use client";

import { useState, useTransition } from "react";
import { setPanelItemAvailability } from "@/lib/actions/panel";
import { Button } from "@/components/ui/Button";

export function ItemAvailabilityButton({ itemId, available }: { itemId: string; available: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        size="sm"
        variant={available ? "secondary" : "primary"}
        disabled={isPending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await setPanelItemAvailability({ itemId, available: !available });
            if (result.error) setError(result.error);
          });
        }}
      >
        {isPending ? "…" : available ? "Mark sold out" : "Mark available"}
      </Button>
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
}
