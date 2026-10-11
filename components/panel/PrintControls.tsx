"use client";

import { useEffect } from "react";

// The Print / Close buttons above the slip (not printed), and the automatic print dialog when
// the slip was opened from the panel's "Print" link.
export function PrintControls({ auto }: { auto: boolean }) {
  useEffect(() => {
    if (!auto) return;
    const timer = window.setTimeout(() => window.print(), 400);
    return () => window.clearTimeout(timer);
  }, [auto]);

  return (
    <div className="mb-4 flex gap-2 font-sans print:hidden">
      <button
        type="button"
        onClick={() => window.print()}
        className="h-10 flex-1 rounded-lg bg-black px-4 text-sm font-semibold text-white"
      >
        Print
      </button>
      <button
        type="button"
        onClick={() => window.close()}
        className="h-10 rounded-lg border border-black px-4 text-sm font-semibold"
      >
        Close
      </button>
    </div>
  );
}
