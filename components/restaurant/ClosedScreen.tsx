import Link from "next/link";
import type { Restaurant } from "@/types/app";
import type { ReminderState } from "@/lib/queries/reminders";
import { getT } from "@/lib/i18n/server";
import type { T } from "@/lib/i18n/messages";
import { nextOpening, type RestaurantStatus } from "@/lib/utils/hours";
import { RemindMeButton } from "@/components/restaurant/RemindMeButton";
import { SeeMenuLink } from "@/components/restaurant/SeeMenuLink";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

// "Remind me at 11 AM" / "Remind me at 6:30 PM" when it opens today or tomorrow. `whenEnglish` is the
// English wording of when it opens, used only to pick the clock time out of it.
function remindLabel(t: T, paused: boolean, whenEnglish: string | null): string {
  if (paused) return t("closed.remind_back");
  const time = whenEnglish?.match(/^(?:today|tomorrow) at (.+)$/)?.[1];
  return time ? t("closed.remind_at", { time: time.replace(":00 ", " ") }) : t("closed.remind_open");
}

// "Restaurant closed" (v2 8f): shown instead of the restaurant page while it isn't taking
// orders. Says when it opens again, points to kitchens that are open now, offers an
// email when it opens, and still lets people look at the menu (black and white).
export async function ClosedScreen({
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
  const t = await getT();
  const paused = status.state === "paused";
  const when = paused ? null : nextOpening(restaurant, new Date(), t);
  const whenEnglish = paused ? null : nextOpening(restaurant);
  const others =
    openElsewhere > 0 ? (openElsewhere === 1 ? t("closed.others_one") : t("closed.others_many", { n: openElsewhere })) : "";

  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-10 lg:py-16">
      <ProblemScreen
        glyph="z"
        tone="warm"
        title={paused ? t("closed.title_paused", { name: restaurant.name }) : t("closed.title_closed", { name: restaurant.name })}
        action={
          <Link href="/#restaurants" className={problemActionClass}>
            {openElsewhere > 0 ? t("closed.see_open") : t("closed.see_all")}
          </Link>
        }
        secondary={
          <div className="flex flex-col items-center gap-4">
            <RemindMeButton
              restaurantId={restaurant.id}
              restaurantName={restaurant.name}
              label={remindLabel(t, paused, whenEnglish)}
              state={reminder}
            />
            <span className="text-[13px] font-medium text-stone-500">
              <SeeMenuLink />
            </span>
          </div>
        }
      >
        {paused ? t("closed.paused_body") : when ? t("closed.opens_again", { when }) : t("closed.closed_now")}
        {others}
      </ProblemScreen>
    </main>
  );
}
