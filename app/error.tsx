"use client";

import Link from "next/link";
import { Button } from "@/components/ui/Button";

// Shown when something unexpected breaks while loading a page.
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Something went wrong</h1>
      <p className="text-stone-600">
        We couldn&apos;t load this page. Please try again. If it keeps happening, come back in a few minutes.
      </p>
      <div className="flex gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/"
          className="inline-flex h-11 items-center rounded-xl border border-border px-5 font-medium hover:bg-muted"
        >
          Go home
        </Link>
      </div>
    </main>
  );
}
