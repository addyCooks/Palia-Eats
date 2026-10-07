import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { getActiveRestaurants, getPublicDishes } from "@/lib/queries/public";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { LiveUpdates } from "@/components/LiveUpdates";
import { DishPlateCard } from "@/components/menu/DishPlateCard";
import { RestaurantBrowser } from "@/components/restaurant/RestaurantBrowser";

export default async function HomePage() {
  const [restaurants, { dishes }] = await Promise.all([getActiveRestaurants(), getPublicDishes({ limit: 8 })]);

  // Work out "open or closed" once, here on the server, so the list can't flicker.
  const items = restaurants.map((restaurant) => ({ restaurant, status: getRestaurantStatus(restaurant) }));
  const cuisines = [...new Set(restaurants.flatMap((restaurant) => restaurant.cuisine_tags))].slice(0, 6);

  return (
    <main className="flex-1 pb-28 lg:pb-0">
      {/* A restaurant opening or closing updates its tile instantly */}
      <LiveUpdates tables={[{ table: "restaurants" }]} />

      {/* Hero (v2 4a / 4b) */}
      <section className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 lg:px-12 lg:pt-6">
        <div className="relative overflow-hidden rounded-none lg:rounded-[28px] lg:bg-background lg:px-20 lg:pb-16 lg:pt-12">
          <div className="flex flex-col gap-5 lg:items-center lg:gap-[22px] lg:text-center">
            <h1 className="font-display text-[38px] leading-[1.05] tracking-[-0.5px] sm:text-[52px] lg:text-[76px] lg:leading-[1.02] lg:tracking-[-1px]">
              <span className="lg:hidden">
                Hot &amp; fresh,
                <br />
                from Palia&apos;s kitchens
              </span>
              <span className="hidden lg:inline">
                Palia&apos;s Best Kitchens,
                <br />
                Delivered Hot &amp; Fresh
              </span>
            </h1>
            <p className="hidden max-w-[540px] text-pretty text-[17px] leading-[1.6] text-stone-600 lg:block">
              Biryani from the chowk, thali from your mohalla, momos from station road. Order from local restaurants and
              pay cash when it arrives.
            </p>

            {/* Phones: search box and cuisine chips */}
            <form action="/search" className="lg:hidden">
              <label className="flex h-[50px] items-center gap-2.5 rounded-[14px] bg-surface pl-4 pr-1.5 shadow-card">
                <Search className="size-[18px] shrink-0 text-stone-500" aria-hidden />
                <span className="sr-only">Search dishes or restaurants</span>
                <input
                  name="q"
                  type="search"
                  placeholder="Search biryani, momos…"
                  className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-stone-500"
                />
                <button type="submit" aria-label="Search" className="grid size-[38px] place-items-center rounded-[10px] bg-brand text-on-brand">
                  <SlidersHorizontal className="size-4" aria-hidden />
                </button>
              </label>
            </form>
            {cuisines.length > 0 && (
              <nav aria-label="Cuisines" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
                <Link href="/#restaurants" className="flex h-9 shrink-0 items-center rounded-[10px] bg-deep px-4 text-sm font-medium text-brand">
                  All
                </Link>
                {cuisines.map((cuisine) => (
                  <Link
                    key={cuisine}
                    href={`/search?q=${encodeURIComponent(cuisine)}`}
                    className="flex h-9 shrink-0 items-center rounded-[10px] bg-surface px-4 text-sm font-medium text-stone-700"
                  >
                    {cuisine}
                  </Link>
                ))}
              </nav>
            )}
          </div>

          {dishes.length > 0 && (
            <section id="popular" aria-labelledby="popular-title" className="scroll-mt-28">
              <div className="mt-6 flex items-baseline justify-between lg:hidden">
                <h2 id="popular-title" className="text-lg font-semibold">
                  Popular today
                </h2>
                <Link href="/search" className="text-[13px] font-semibold text-accent">
                  See all
                </Link>
              </div>
              {/* Phones: a sideways row. Laptops: four plates under the headline. */}
              <ul className="stagger scrollbar-none -mx-4 mt-2 flex gap-3.5 overflow-x-auto px-4 pb-4 pt-12 lg:mx-auto lg:mt-[110px] lg:grid lg:max-w-[860px] lg:grid-cols-4 lg:gap-[22px] lg:overflow-visible lg:p-0">
                {dishes.slice(0, 4).map((dish, i) => (
                  <li key={dish.id} className="w-[156px] shrink-0 lg:w-auto">
                    <DishPlateCard dish={dish} highlight={i === 1} />
                  </li>
                ))}
                {dishes.slice(4).map((dish) => (
                  <li key={dish.id} className="w-[156px] shrink-0 lg:hidden">
                    <DishPlateCard dish={dish} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </section>

      <section id="restaurants" className="mx-auto w-full max-w-[1280px] scroll-mt-24 px-4 pb-12 pt-8 sm:px-6 lg:px-12 lg:pt-14">
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
