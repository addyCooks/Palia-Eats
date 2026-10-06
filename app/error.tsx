"use client";

import Link from "next/link";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

// Shown when something unexpected breaks while loading a page (often a patchy connection).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
