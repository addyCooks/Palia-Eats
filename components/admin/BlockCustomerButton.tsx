"use client";

import { useState, useTransition } from "react";
import { setCustomerBlocked } from "@/lib/actions/admin";

// Block / unblock. A blocked customer can still log in and see past orders, but can't
// place new ones (the database refuses them, on the website and on WhatsApp).
export function BlockCustomerButton({ customerId, blocked, name }: { customerId: string; blocked: boolean; name: string }) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        disabled={isPending}
        onClick={() => {
          const question = blocked
            ? `Unblock ${name}? They will be able to order again.`
            : `Block ${name}? They won't be able to place new orders.`;
          if (!window.confirm(question)) return;
          setError(null);
          startTransition(async () => {
            const result = await setCustomerBlocked({ customerId, blocked: !blocked });
            if (result.error) setError(result.error);
          });
        }}
        className={`inline-flex h-11 items-center rounded-xl px-[18px] text-sm font-semibold disabled:opacity-60 ${
          blocked ? "bg-brand text-on-brand hover:bg-brand-dark" : "bg-red-100 text-red-700 hover:bg-red-200"
        }`}
      >
        {isPending ? "Saving…" : blocked ? "Unblock customer" : "Block customer"}
      </button>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}
