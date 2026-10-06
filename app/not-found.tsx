import Link from "next/link";
import { EmptyState, SpilledIllustration } from "@/components/illustrations";

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <EmptyState
        tone="maroon"
        illustration={<SpilledIllustration />}
        title="Oops, that page spilled"
        action={
          <Link
            href="/"
            className="rounded-xl bg-[#F4B942] px-5 py-3 font-semibold text-[#1F1B16] hover:bg-[#f7c862]"
          >
            Back to PaliaEats
          </Link>
        }
      >
        <p className="font-mono text-xs tracking-widest text-[#F4B942]">404</p>
        That page doesn&apos;t exist, or it has moved.
      </EmptyState>
    </main>
  );
}
