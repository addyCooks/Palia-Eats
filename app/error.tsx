"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";
import { reportClientError } from "@/lib/monitoring/report-client";

// Shown when something unexpected breaks while loading a page (often a patchy connection).
export default function PageError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    reportClientError(error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <ProblemScreen
        glyph="!"
        tone="dark"
        title="We couldn't load this page"
        action={
          <button type="button" onClick={reset} className={problemActionClass}>
            Try again
          </button>
        }
        secondary={<Link href="/">Go home</Link>}
      >
        Check your mobile data or Wi-Fi and try again. Your cart is saved.
      </ProblemScreen>
    </main>
  );
}
