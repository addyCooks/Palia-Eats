import Link from "next/link";
import { EmptyState, SpilledIllustration } from "@/components/illustrations";

export default function RestaurantNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <EmptyState
        tone="maroon"
        illustration={<SpilledIllustration />}
        title="We couldn't find that restaurant"
        action={
          <Link
            href="/"
            className="rounded-xl bg-[#F4B942] px-5 py-3 font-semibold text-[#1F1B16] hover:bg-[#f7c862]"
          >
            See all restaurants
          </Link>
        }
      >
        It may have moved or isn&apos;t available right now.
      </EmptyState>
    </main>
  );
}
