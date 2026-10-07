"use client";

import { useState, useTransition } from "react";
import { panelReadyToGoLive } from "@/lib/actions/panel";

// Shown in the panel of a newly approved restaurant that isn't on the website yet.
export function SetupBanner({ name }: { name: string }) {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function ready() {
    setError(null);
    startTransition(async () => {
      const result = await panelReadyToGoLive().catch(() => ({ error: "Something went wrong. Please try again." }));
      if (result.error) return setError(result.error);
      setSent(true);
    });
  }

  return (
    <section className="flex flex-col gap-3 rounded-[18px] border-2 border-brand bg-amber-50 p-5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-1">
        <h2 className="font-display text-2xl leading-tight">Welcome! {name} isn&apos;t on PaliaEats yet</h2>
        <p className="text-sm text-stone-700">
          Add your menu (categories, then dishes) and check your hours in Settings. When it&apos;s ready, tell us and
          we&apos;ll show you to customers.
        </p>
        {error && (
          <p role="alert" className="text-sm font-semibold text-red-700">
            {error}
          </p>
        )}
      </div>
      {sent ? (
        <p role="status" className="shrink-0 text-sm font-semibold text-green-700">
          ✓ Sent. We&apos;ll check and switch you on.
        </p>
      ) : (
        <button
          type="button"
          onClick={ready}
          disabled={pending}
          className="h-12 shrink-0 rounded-[14px] bg-[#16120D] px-5 text-[15px] font-semibold text-white hover:bg-black disabled:opacity-60 dark:bg-[#2A241C]"
        >
          {pending ? "Sending…" : "My menu is ready"}
        </button>
      )}
    </section>
  );
}
