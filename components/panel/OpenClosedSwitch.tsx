"use client";

import { useState, useTransition } from "react";
import { setAcceptingOrders } from "@/lib/actions/panel";
import type { RestaurantStatus } from "@/lib/utils/hours";

type OpenClosedSwitchProps = {
  accepting: boolean;
  status: RestaurantStatus;
};

// The big "accepting orders / paused" switch. One tap flips it, and customers see the change
// straight away.
export function OpenClosedSwitch({ accepting, status }: OpenClosedSwitchProps) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function toggle() {
    setError(null);
    startTransition(async () => {
      const result = await setAcceptingOrders(!accepting);
      if (result.error) setError(result.error);
    });
  }

  const subtitle = accepting
    ? status.state === "closed"
      ? `${status.label}. Customers can't order outside your opening hours.`
      : "Customers can order right now. Tap to pause."
    : "Customers can see your menu but can't order. Tap to resume.";

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        role="switch"
        aria-checked={accepting}
        onClick={toggle}
        disabled={isPending}
        className={`flex w-full items-center justify-between gap-4 rounded-[18px] p-[18px] text-left text-white transition-colors disabled:opacity-70 ${
          accepting ? "bg-[#1F9D55]" : "bg-[#4A3F36]"
        }`}
      >
        <span>
          <span className="block text-lg font-extrabold">{accepting ? "Accepting orders" : "Paused"}</span>
          <span className="block text-sm opacity-90">{isPending ? "Updating…" : subtitle}</span>
        </span>
        <span
          className={`flex h-[34px] w-[60px] shrink-0 rounded-full bg-white/30 p-[3px] ${
            accepting ? "justify-end" : "justify-start"
          }`}
          aria-hidden
        >
          <span className="size-7 rounded-full bg-white" />
        </span>
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
