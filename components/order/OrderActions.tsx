"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/types/app";
import { Button } from "@/components/ui/Button";
import { CANCEL_REASONS, MAX_REASON_LENGTH, OTHER_REASON } from "@/lib/orders/cancel-reasons";

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
  const [cancelling, setCancelling] = useState(false);
  const [choice, setChoice] = useState<string>(CANCEL_REASONS[0]);
  const [otherText, setOtherText] = useState("");

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

  const reasonToSend = choice === OTHER_REASON ? otherText.trim() : choice;

  function confirmCancel() {
    if (!reasonToSend) {
      setError("Please type a reason.");
      return;
    }
    setCancelling(false);
    change("cancelled", reasonToSend);
  }

  if (cancelling) {
    return (
      <div className="flex flex-col gap-2 rounded-xl border border-red-200 bg-red-50 p-3">
        <label className="text-sm font-medium text-red-800" htmlFor={`cancel-${orderId}`}>
          Why are you cancelling? The customer will see this.
        </label>
        <select
          id={`cancel-${orderId}`}
          value={choice}
          onChange={(e) => setChoice(e.target.value)}
          className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
        >
          {CANCEL_REASONS.map((reason) => (
            <option key={reason} value={reason}>
              {reason}
            </option>
          ))}
          <option value={OTHER_REASON}>{OTHER_REASON}…</option>
        </select>
        {choice === OTHER_REASON && (
          <input
            value={otherText}
            onChange={(e) => setOtherText(e.target.value)}
            maxLength={MAX_REASON_LENGTH}
            placeholder="Type the reason"
            className="rounded-lg border border-border bg-surface px-3 py-2 text-sm"
          />
        )}
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" onClick={confirmCancel} disabled={isPending}>
            Confirm cancellation
          </Button>
          <Button variant="ghost" onClick={() => { setCancelling(false); setError(null); }}>
            Keep order
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

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        <Button size="lg" className="min-w-44 flex-1" onClick={() => change(next.status)} disabled={isPending}>
          {isPending ? "Updating…" : next.label}
        </Button>
        <Button size="lg" variant="ghost" onClick={() => setCancelling(true)} disabled={isPending}>
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
