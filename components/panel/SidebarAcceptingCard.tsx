"use client";

import { useState, useTransition } from "react";
import { setAcceptingOrders } from "@/lib/actions/panel";
import { Toggle } from "@/components/ui/Toggle";

// The little card at the bottom of the panel sidebar: restaurant name and the
// "accepting orders" switch, always in reach on a laptop.
export function SidebarAcceptingCard({ name, accepting }: { name: string; accepting: boolean }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-2.5 rounded-[14px] bg-[#2A241C] p-3.5">
      <span className="truncate font-semibold">{name}</span>
      <label className="flex items-center justify-between gap-3 text-[13px] text-[#D8D2C8]">
        {isPending ? "Updating…" : accepting ? "Accepting orders" : "Orders paused"}
        <Toggle
          checked={accepting}
          disabled={isPending}
          label="Accepting orders"
          knob="dark"
          onChange={(next) => {
            setError(null);
            startTransition(async () => {
              const result = await setAcceptingOrders(next);
              if (result.error) setError(result.error);
            });
          }}
        />
      </label>
      {error && (
        <p role="alert" className="text-xs text-[#FF8A7A]">
          {error}
        </p>
      )}
    </div>
  );
}
