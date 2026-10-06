import Link from "next/link";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

export default function RestaurantNotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-16">
      <ProblemScreen
        glyph="z"
        tone="warm"
        title="We couldn't find that restaurant"
        action={
          <Link href="/#restaurants" className={problemActionClass}>
            See open restaurants
          </Link>
        }
      >
        It may have moved or isn&apos;t available right now.
      </ProblemScreen>
    </main>
  );
}
