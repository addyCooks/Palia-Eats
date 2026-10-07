import Link from "next/link";
import type { Restaurant } from "@/types/app";
import { nextOpening, type RestaurantStatus } from "@/lib/utils/hours";
import { SeeMenuLink } from "@/components/restaurant/SeeMenuLink";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

// "Restaurant closed" (v2 8f): shown instead of the restaurant page while it isn't taking
// orders. Says when it opens again and points to kitchens that are open now. The menu
// can still be looked at (black and white, without ordering).
// The design's "Remind me at 11 AM" is left out: we don't send reminders.
export function ClosedScreen({
  restaurant,
  status,
  openElsewhere,
}: {
  restaurant: Restaurant;
  status: RestaurantStatus;
  openElsewhere: number;
}) {
  const paused = status.state === "paused";
  const when = paused ? null : nextOpening(restaurant);
  const others =
    openElsewhere > 0
      ? ` ${openElsewhere === 1 ? "One kitchen near you is" : `${openElsewhere} kitchens near you are`} open now.`
      : "";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 lg:py-16">
      <ProblemScreen
        glyph="z"
        tone="warm"
        title={paused ? `${restaurant.name} is taking a break` : `${restaurant.name} is closed`}
        action={
          <Link href="/#restaurants" className={problemActionClass}>
            {openElsewhere > 0 ? "See open restaurants" : "See all restaurants"}
          </Link>
        }
        secondary={<SeeMenuLink />}
      >
        {paused
          ? "They’ve paused new orders for a little while. Please check back soon."
          : when
            ? `They open again ${when}.`
            : "They’re closed for now."}
        {others}
      </ProblemScreen>
    </main>
  );
}
