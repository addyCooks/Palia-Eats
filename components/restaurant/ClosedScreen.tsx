import Link from "next/link";
import type { Restaurant } from "@/types/app";
import type { ReminderState } from "@/lib/queries/reminders";
import { nextOpening, type RestaurantStatus } from "@/lib/utils/hours";
import { RemindMeButton } from "@/components/restaurant/RemindMeButton";
import { SeeMenuLink } from "@/components/restaurant/SeeMenuLink";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

// "Remind me at 11 AM" / "Remind me at 6:30 PM" when it opens today or tomorrow.
function remindLabel(paused: boolean, when: string | null): string {
  if (paused) return "Remind me when they’re back";
  const time = when?.match(/^(?:today|tomorrow) at (.+)$/)?.[1];
  return time ? `Remind me at ${time.replace(":00 ", " ")}` : "Remind me when they open";
}

// "Restaurant closed" (v2 8f): shown instead of the restaurant page while it isn't taking
// orders. Says when it opens again, points to kitchens that are open now, offers an
// email when it opens, and still lets people look at the menu (black and white).
export function ClosedScreen({
  restaurant,
  status,
  openElsewhere,
  reminder,
}: {
  restaurant: Restaurant;
  status: RestaurantStatus;
  openElsewhere: number;
  reminder: ReminderState;
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
        secondary={
          <div className="flex flex-col items-center gap-4">
            <RemindMeButton
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              label={remindLabel(paused, when)}
              state={reminder}
            />
            <span className="text-[13px] font-medium text-stone-500">
              <SeeMenuLink />
            </span>
          </div>
        }
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
