"use client";

import { useState, useTransition } from "react";
import { setWeeklySummary } from "@/lib/actions/panel";
import { Panel } from "@/components/ui/page";
import { Toggle } from "@/components/ui/Toggle";

// "Weekly summary email": every Monday morning the restaurant gets last week's orders, sales and
// most-ordered dishes. This switch turns it off and on.
export function SummaryEmailCard({ enabled }: { enabled: boolean }) {
  const [on, setOn] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function change(next: boolean) {
    setError(null);
    setOn(next);
    startTransition(async () => {
      const result = await setWeeklySummary(next);
      if (result.error) {
        setOn(!next);
        setError(result.error);
      }
    });
  }

  return (
    <Panel title="Weekly summary email">
      <div className="-mt-2 flex items-start justify-between gap-4">
        <p className="text-sm text-stone-600">
          Every Monday morning we email you last week&apos;s orders, sales and your most-ordered dishes.
        </p>
        <Toggle checked={on} onChange={change} disabled={pending} label="Weekly summary email" />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </Panel>
  );
}
