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
const NEXT_STEP: Partial<Record<OrderStatus, { status: string; label: string; style: string }>> = {
  pending: { status: "preparing", label: "Accept order", style: "bg-brand text-on-brand hover:bg-brand-dark" },
  accepted: { status: "preparing", label: "Accept order", style: "bg-brand text-on-brand hover:bg-brand-dark" },
  preparing: {
    status: "out_for_delivery",
    label: "Handed to rider",
    style: "bg-[#16120D] text-white hover:bg-black dark:bg-[#F6F1E8] dark:text-[#16120D] dark:hover:bg-white",
  },
  out_for_delivery: { status: "delivered", label: "Mark delivered", style: "bg-amber-50 text-amber-800 hover:bg-amber-100" },
};

type OrderActionsProps = {
  orderId: string;
  status: OrderStatus;
  // The server action that saves the change. The restaurant panel and the admin each
  // pass their own, because each one checks permission in its own way.
  updateStatus: UpdateOrderStatus;
  // Compact: the 40px kanban button with a small "Cancel" link under it.
  compact?: boolean;
};

export function OrderActions({ orderId, status, updateStatus, compact }: OrderActionsProps) {
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

  if (compact) {
    return (
      <div className="flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => change(next.status)}
          disabled={isPending}
          className={`flex h-10 items-center justify-center rounded-[10px] text-sm font-semibold transition-colors disabled:opacity-60 ${next.style}`}
        >
          {isPending ? "Updating…" : next.label}
        </button>
        <button
          type="button"
          onClick={() => setCancelling(true)}
          disabled={isPending}
          className="self-center text-xs font-medium text-stone-500 hover:text-red-700 hover:underline"
        >
          Cancel order
        </button>
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
        <button
          type="button"
          onClick={() => change(next.status)}
          disabled={isPending}
          className={`inline-flex h-12 min-w-44 flex-1 items-center justify-center rounded-xl px-6 text-base font-semibold transition-colors disabled:opacity-60 ${next.style}`}
        >
          {isPending ? "Updating…" : next.label}
        </button>
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
