import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { getActiveRestaurants, getPublicDishes } from "@/lib/queries/public";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { LiveUpdates } from "@/components/LiveUpdates";
import { DishPlateCard } from "@/components/menu/DishPlateCard";
import { RestaurantBrowser } from "@/components/restaurant/RestaurantBrowser";
import { HeroHeadline } from "@/components/home/HeroHeadline";
import { CuisineFilterProvider, TopCuisineChips } from "@/components/home/CuisineFilter";
import { cuisinesByCount } from "@/lib/utils/cuisines";
import { getT } from "@/lib/i18n/server";
import { JsonLd } from "@/components/seo/JsonLd";
import { siteJsonLd } from "@/lib/seo/jsonld";

export default async function HomePage() {
  const t = await getT();
  const [restaurants, { dishes }] = await Promise.all([getActiveRestaurants(), getPublicDishes({ limit: 8 })]);

  // Work out "open or closed" once, here on the server, so the list can't flicker.
  const items = restaurants.map((restaurant) => ({ restaurant, status: getRestaurantStatus(restaurant, new Date(), t) }));
  const cuisines = cuisinesByCount(restaurants.map((restaurant) => restaurant.cuisine_tags));

  return (
    <main className="flex-1 pb-28 lg:pb-0">
      <JsonLd data={siteJsonLd((process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""))} />
      <CuisineFilterProvider>
        {/* A restaurant opening or closing updates its tile instantly */}
        <LiveUpdates tables={[{ table: "restaurants" }]} />

        {/* Hero (v2 4a / 4b) */}
        <section className="mx-auto w-full max-w-[1280px] px-4 pt-4 sm:px-6 lg:px-12 lg:pt-6">
          <div className="relative overflow-hidden rounded-none lg:rounded-[28px] lg:bg-background lg:px-20 lg:pb-16 lg:pt-12">
            <div className="flex flex-col gap-5 lg:items-center lg:gap-[22px] lg:text-center">
              <HeroHeadline className="font-display text-[38px] leading-[1.05] tracking-[-0.5px] sm:text-[52px] lg:text-[76px] lg:leading-[1.02] lg:tracking-[-1px]" />
              <p className="hidden max-w-[540px] text-pretty text-[17px] leading-[1.6] text-stone-600 lg:block">
                {t("home.sub")}
              </p>

              {/* Phones: search box and cuisine chips */}
              <form action="/search" className="lg:hidden">
                <label className="flex h-[50px] items-center gap-2.5 rounded-[14px] bg-surface pl-4 pr-1.5 shadow-card">
                  <Search className="size-[18px] shrink-0 text-stone-500" aria-hidden />
                  <span className="sr-only">{t("home.search_sr")}</span>
                  <input
                    name="q"
                    type="search"
                    placeholder={t("home.search_placeholder")}
                    className="min-w-0 flex-1 bg-transparent text-[15px] outline-none placeholder:text-stone-500"
                  />
                  <button type="submit" aria-label={t("nav.search")} className="grid size-[38px] place-items-center rounded-[10px] bg-brand text-on-brand">
                    <SlidersHorizontal className="size-4" aria-hidden />
                  </button>
                </label>
              </form>
              {cuisines.length > 0 && <TopCuisineChips cuisines={cuisines} />}
            </div>

            {dishes.length > 0 && (
              <section id="popular" aria-labelledby="popular-title" className="scroll-mt-28">
                <div className="mt-6 flex items-baseline justify-between lg:hidden">
                  <h2 id="popular-title" className="text-lg font-semibold">
                    {t("home.popular")}
                  </h2>
                  <Link href="/search" className="text-[13px] font-semibold text-accent">
                    {t("home.see_all")}
                  </Link>
                </div>
                {/* Phones: a sideways row. Laptops: four plates under the headline. */}
                <ul className="stagger scrollbar-none -mx-4 mt-2 flex gap-3 overflow-x-auto px-4 pb-4 pt-[41px] lg:mx-auto lg:mt-[110px] lg:grid lg:max-w-[860px] lg:grid-cols-4 lg:gap-[22px] lg:overflow-visible lg:p-0">
                  {dishes.slice(0, 4).map((dish, i) => (
                    <li key={dish.id} className="w-[134px] shrink-0 lg:w-auto">
                      <DishPlateCard dish={dish} highlight={i === 1} compact />
                    </li>
                  ))}
                  {dishes.slice(4).map((dish) => (
                    <li key={dish.id} className="w-[134px] shrink-0 lg:hidden">
                      <DishPlateCard dish={dish} compact />
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
              {t("home.soon")}
            </p>
          ) : (
            <RestaurantBrowser items={items} />
          )}
        </section>
      </CuisineFilterProvider>
    </main>
  );
}
