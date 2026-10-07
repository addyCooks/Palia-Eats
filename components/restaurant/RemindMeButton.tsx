"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setOpenReminder } from "@/lib/actions/reminders";
import type { ReminderState } from "@/lib/queries/reminders";

// "Remind me at 11 AM" on the closed screen (v2 8f). Logged-in customers get one email
// when the restaurant opens; logged-out visitors are sent to log in first.
export function RemindMeButton({
  restaurantId,
  restaurantName,
  label,
  state,
}: {
  restaurantId: string;
  restaurantName: string;
  label: string;
  state: ReminderState;
}) {
  const router = useRouter();
  const [on, setOn] = useState(state.on);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Accounts made through WhatsApp have no email address to send a reminder to.
  if (state.signedIn && !state.email) return null;

  function change(next: boolean) {
    if (!state.signedIn) {
      const here = window.location.pathname + window.location.search;
      router.push(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await setOpenReminder({ restaurantId, on: next }).catch(() => ({ error: "failed" as const }));
      if (!result.error) return setOn(next);
      if (result.error === "login") return router.push("/login");
      setError("Couldn’t save that. Please try again.");
    });
  }

  if (on) {
    return (
      <div className="flex flex-col items-center gap-1" role="status">
        <span className="text-sm font-semibold text-foreground">
          ✓ We&apos;ll email you when {restaurantName} opens
        </span>
        {state.email && <span className="text-xs font-normal text-stone-500">to {state.email}</span>}
        <button
          type="button"
          onClick={() => change(false)}
          disabled={pending}
          className="mt-1 text-xs font-semibold text-accent hover:underline disabled:opacity-60"
        >
          Cancel reminder
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <button type="button" onClick={() => change(true)} disabled={pending} className="hover:underline disabled:opacity-60">
        {pending ? "Saving…" : label}
      </button>
      {error && (
        <span role="alert" className="text-xs font-normal text-red-700">
          {error}
        </span>
      )}
    </div>
  );
}
