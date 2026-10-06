"use client";

import Link from "next/link";
import { EmptyState, NoInternetIllustration } from "@/components/illustrations";
import { Button } from "@/components/ui/Button";

// Shown when something unexpected breaks while loading a page (often a patchy connection).
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <EmptyState
        illustration={<NoInternetIllustration />}
        title="We couldn't load this page"
        action={
          <div className="flex gap-3">
            <Button onClick={reset}>Try again</Button>
            <Link
              href="/"
              className="inline-flex h-11 items-center rounded-xl border border-[#EFE6DA] bg-white px-5 font-medium text-[#1F1B16] hover:bg-[#F7F1E8]"
            >
              Go home
            </Link>
          </div>
        }
      >
        Please try again. If it keeps happening, check your connection or come back in a few minutes.
      </EmptyState>
    </main>
  );
}
