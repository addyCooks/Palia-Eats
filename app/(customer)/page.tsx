import { getProfile } from "@/lib/auth/session";
import { getActiveRestaurants } from "@/lib/queries/public";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { LiveUpdates } from "@/components/LiveUpdates";
import { HeroPlateIllustration } from "@/components/illustrations";
import { RestaurantBrowser } from "@/components/restaurant/RestaurantBrowser";

export default async function HomePage() {
  const [restaurants, profile] = await Promise.all([getActiveRestaurants(), getProfile()]);

  // Work out "open or closed" once, here on the server, so the list can't flicker.
  const items = restaurants.map((restaurant) => ({ restaurant, status: getRestaurantStatus(restaurant) }));
  const firstName = profile?.full_name?.trim().split(/\s+/)[0] ?? null;
  const kitchens = `${restaurants.length} local ${restaurants.length === 1 ? "kitchen" : "kitchens"}`;

  return (
    <main className="flex-1">
      {/* A restaurant opening or closing updates its tile instantly */}
      <LiveUpdates tables={[{ table: "restaurants" }]} />

      <section className="mx-auto grid w-full max-w-5xl items-center gap-5 px-4 pb-4 pt-6 md:grid-cols-[1.2fr_1fr] md:gap-8 md:pb-6 md:pt-10">
        <div>
          {firstName && (
            <h1 className="font-display text-[28px] font-extrabold leading-[1.05] tracking-tight md:hidden">
              Bhookh lagi hai, <span className="italic text-brand-dark">{firstName}?</span>
            </h1>
          )}
          <h1
            className={`font-display text-4xl font-extrabold leading-[0.98] tracking-tight md:block md:text-5xl lg:text-6xl ${
              firstName ? "hidden" : ""
            }`}
          >
            Palia&apos;s favourite food, <span className="italic text-brand-dark">at your door.</span>
          </h1>
          <p className="mt-3 text-[15px] text-stone-600">
            {restaurants.length > 0 ? `${kitchens} · ` : ""}Cash on Delivery
          </p>
        </div>

        <div className="hidden h-60 items-center justify-center rounded-[28px] bg-deep md:flex">
          <HeroPlateIllustration className="h-44 w-56" />
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 pb-10 pt-2">
        {restaurants.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-stone-500">
            Restaurants are joining soon. Check back shortly!
          </p>
        ) : (
          <RestaurantBrowser items={items} />
        )}
      </section>
    </main>
  );
}
