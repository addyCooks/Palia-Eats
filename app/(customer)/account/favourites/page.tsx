import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyFavourites } from "@/lib/queries/favourites";
import { formatPrice } from "@/lib/utils/format";
import { dishPhoto } from "@/lib/utils/placeholder";
import { AccountCard } from "@/components/account/AccountCard";
import { FavouriteButton } from "@/components/favourites/FavouriteButton";
import { VegMark } from "@/components/menu/VegMark";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { Photo } from "@/components/ui/Photo";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

export const metadata: Metadata = { title: "Favourites" };

const rupees = (amount: number) => formatPrice(amount).replace(/\.00$/, "");

// Account → Favourites: the restaurants and dishes the customer hearted. Un-hearting
// here leaves the item in place (with an empty heart) until the page is opened again,
// so a mistaken tap is easy to undo.
export default async function FavouritesPage() {
  const profile = await requireUser("/account/favourites");
  const { restaurants, dishes } = await getMyFavourites();
  const empty = restaurants.length === 0 && dishes.length === 0;

  return (
    <main className="mx-auto grid w-full max-w-[1280px] flex-1 items-start gap-8 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-12 lg:pb-14 lg:pt-8">
      <div className="hidden lg:block">
        <AccountCard profile={profile} active="/account/favourites" />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <div className="flex flex-col gap-1">
          <Link href="/account" className="text-sm text-stone-500 hover:underline lg:hidden">
            ← My account
          </Link>
          <h1 className="font-display text-[34px] leading-none sm:text-[44px]">Favourites</h1>
        </div>

        {empty ? (
          <ProblemScreen
            glyph="♡"
            tone="warm"
            title="Nothing saved yet"
            action={
              <Link href="/#restaurants" className={problemActionClass}>
                Browse restaurants
              </Link>
            }
          >
            Tap the ♡ on a restaurant&apos;s cover photo, or on a dish, and it will wait for you here.
          </ProblemScreen>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="text-[13px] font-semibold tracking-[.5px] text-stone-500">DISHES</h2>
              {dishes.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-stone-500">
                  No dishes yet. Open a dish and tap the ♡ to keep it here.
                </p>
              ) : (
                <ul className="grid gap-3 xl:grid-cols-2">
                  {dishes.map((dish) => (
                    <li key={dish.id} className="flex items-center gap-3 rounded-2xl bg-surface py-2.5 pl-2.5 pr-3 shadow-card">
                      <Link
                        href={`/restaurants/${dish.restaurants.slug}#dish-${dish.id}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <span className={`relative size-14 shrink-0 overflow-hidden rounded-full ${dish.is_available ? "" : "grayscale"}`}>
                          <Photo src={dishPhoto(dish)} alt="" sizes="56px" />
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="flex min-w-0 items-center gap-2">
                            <VegMark isVeg={dish.is_veg} egg={dish.contains_egg} />
                            <span className="truncate text-[15px] font-semibold">{dish.name}</span>
                          </span>
                          <span className="truncate text-xs text-stone-500">
                            {dish.restaurants.name}
                            {dish.is_available ? "" : " · Sold out today"}
                          </span>
                        </span>
                        <span className="shrink-0 text-sm font-bold tabular-nums">{rupees(dish.price)}</span>
                      </Link>
                      <FavouriteButton kind="dish" id={dish.id} name={dish.name} initial signedIn />
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-[13px] font-semibold tracking-[.5px] text-stone-500">RESTAURANTS</h2>
              {restaurants.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-stone-500">
                  No restaurants yet. Tap the ♡ on a restaurant&apos;s cover photo to keep it here.
                </p>
              ) : (
                <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  {restaurants.map((restaurant) => (
                    <li key={restaurant.id} className="relative">
                      <RestaurantCard restaurant={restaurant} />
                      <FavouriteButton
                        kind="restaurant"
                        id={restaurant.id}
                        name={restaurant.name}
                        initial
                        signedIn
                        look="cover"
                        className="absolute right-3 top-3 z-10"
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </main>
  );
}
