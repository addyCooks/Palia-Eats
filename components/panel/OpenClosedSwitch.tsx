"use client";

import { useState, useTransition } from "react";
import { setAcceptingOrders } from "@/lib/actions/panel";
import type { RestaurantStatus } from "@/lib/utils/hours";
import { Button } from "@/components/ui/Button";

type OpenClosedSwitchProps = {
  accepting: boolean;
  status: RestaurantStatus;
};

// The big "we are open / closed for orders" button at the top of the panel.
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

  return (
    <div
      className={`flex flex-col gap-3 rounded-2xl border p-4 sm:flex-row sm:items-center sm:justify-between ${
        accepting ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"
      }`}
    >
      <div>
        <p className={`text-lg font-bold ${accepting ? "text-green-900" : "text-red-900"}`}>
          {accepting ? "We're OPEN for orders" : "We're CLOSED for orders"}
        </p>
        <p className="text-sm text-stone-700">
          {accepting
            ? status.state === "closed"
              ? `${status.label}. Customers can't order outside your opening hours.`
              : "Customers can place orders right now."
            : "Customers can see your menu but can't order."}
        </p>
        {error && (
          <p role="alert" className="mt-1 text-sm text-red-700">
            {error}
          </p>
        )}
      </div>
      <Button
        onClick={toggle}
        disabled={isPending}
        variant={accepting ? "danger" : "primary"}
        size="lg"
        className="shrink-0"
      >
        {isPending ? "Updating…" : accepting ? "Close for orders" : "Open for orders"}
      </Button>
    </div>
  );
}
