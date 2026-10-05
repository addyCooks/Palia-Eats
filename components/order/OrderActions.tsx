"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/types/app";
import { Button } from "@/components/ui/Button";

export type UpdateOrderStatus = (input: {
  orderId: string;
  status: string;
  reason?: string;
}) => Promise<{ error?: string }>;

// The one button that moves an order to its next step, for each current status.
const NEXT_STEP: Partial<Record<OrderStatus, { status: string; label: string }>> = {
  pending: { status: "preparing", label: "Start cooking" },
  accepted: { status: "preparing", label: "Start cooking" },
  preparing: { status: "out_for_delivery", label: "Out for delivery" },
  out_for_delivery: { status: "delivered", label: "Mark delivered" },
};

type OrderActionsProps = {
  orderId: string;
  status: OrderStatus;
  // The server action that saves the change. The restaurant panel and the admin each
  // pass their own, because each one checks permission in its own way.
  updateStatus: UpdateOrderStatus;
};

export function OrderActions({ orderId, status, updateStatus }: OrderActionsProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const next = NEXT_STEP[status];
  if (!next) return null; // delivered or cancelled: nothing more to do

  function change(newStatus: string, reason?: string) {
    setError(null);
    startTransition(async () => {
      const result = await updateStatus({ orderId, status: newStatus, reason });
      if (result.error) {
        setError(result.error);
        router.refresh();
      }
    });
  }

  function cancel() {
    const reason = window.prompt(
      "Why are you cancelling this order? The customer will see this.",
      "",
    );
    if (reason === null) return; // pressed Cancel in the box
    change("cancelled", reason);
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button onClick={() => change(next.status)} disabled={isPending}>
          {isPending ? "Updating…" : next.label}
        </Button>
        <Button variant="ghost" onClick={cancel} disabled={isPending}>
          Cancel order
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
