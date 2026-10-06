import type { Metadata } from "next";
import Link from "next/link";
import { Search } from "lucide-react";
import { getActiveRestaurants, getPublicDishes } from "@/lib/queries/public";
import { formatPrice } from "@/lib/utils/format";
import { dishPhoto, restaurantCover } from "@/lib/utils/placeholder";
import { DishPlateCard } from "@/components/menu/DishPlateCard";
import { RecentSearches, RememberSearch } from "@/components/search/RecentSearches";
import { Photo } from "@/components/ui/Photo";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

export const metadata: Metadata = { title: "Search" };

const SORTS = [
  { key: "relevance", label: "Relevance" },
  { key: "rating", label: "Rating" },
  { key: "fastest", label: "Fastest" },
  { key: "price", label: "Price: low" },
] as const;
type Sort = (typeof SORTS)[number]["key"];

const rupees = (amount: number) => formatPrice(amount).replace(/\.00$/, "");

export default async function SearchPage({ searchParams }: PageProps<"/search">) {
  const params = await searchParams;
  const raw = typeof params.q === "string" ? params.q.slice(0, 60) : "";
  const sortParam = typeof params.sort === "string" ? params.sort : "";
  const sort: Sort = SORTS.some((s) => s.key === sortParam) ? (sortParam as Sort) : "relevance";

  const [{ dishes, query }, restaurants] = await Promise.all([
    getPublicDishes({ search: raw, limit: raw.trim() ? 48 : 12 }),
    getActiveRestaurants(),
  ]);

  const needle = query.toLowerCase();
  const matchingRestaurants = needle
    ? restaurants.filter((r) =>
        [r.name, r.tagline ?? "", r.area ?? "", ...r.cuisine_tags].some((text) => text.toLowerCase().includes(needle)),
      )
    : [];

  const sorted = [...dishes].sort((a, b) => {
    if (sort === "rating") return Number(b.restaurants.rating_avg ?? 0) - Number(a.restaurants.rating_avg ?? 0);
    if (sort === "fastest") return (a.prep_minutes ?? 999) - (b.prep_minutes ?? 999);
    if (sort === "price") return a.price - b.price;
    return 0;
  });

  const sortHref = (key: Sort) =>
    `/search?${new URLSearchParams({ ...(query ? { q: query } : {}), ...(key !== "relevance" ? { sort: key } : {}) })}`;

  return (
    <main className="mx-auto flex w-full max-w-[1280px] flex-1 flex-col gap-5 px-4 pb-28 pt-6 sm:px-6 lg:px-12 lg:pb-12">
      <form action="/search" role="search">
        <label className="flex h-[52px] items-center gap-3 rounded-[14px] border-2 border-brand bg-surface pl-4 pr-2 text-base lg:h-[60px] lg:border-0 lg:pl-5 lg:text-lg lg:shadow-[0_4px_14px_rgba(120,70,0,.06)]">
          <Search className="size-5 shrink-0" aria-hidden />
          <span className="sr-only">Search dishes or restaurants</span>
          <input
            name="q"
            type="search"
            defaultValue={query}
            autoFocus={!query}
            placeholder="Search biryani, momos, thali…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent font-medium outline-none placeholder:font-normal placeholder:text-stone-500"
          />
          {query && (
            <Link href="/search" className="hidden text-[13px] text-stone-500 hover:text-foreground sm:block">
              Clear
            </Link>
          )}
          <button
            type="submit"
            className="hidden h-11 rounded-[10px] bg-brand px-5 text-[15px] font-bold text-on-brand hover:bg-brand-dark sm:block"
          >
            Search
          </button>
        </label>
      </form>

      {query ? <RememberSearch q={query} /> : <RecentSearches />}

      {query && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-base">
            <b className="font-semibold">
              {dishes.length} {dishes.length === 1 ? "dish" : "dishes"}
            </b>{" "}
            <span className="text-stone-600">
              and {matchingRestaurants.length} {matchingRestaurants.length === 1 ? "restaurant" : "restaurants"} for “{query}”
            </span>
          </p>
          <nav aria-label="Sort" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
            {SORTS.map((s) => (
              <Link
                key={s.key}
                href={sortHref(s.key)}
                aria-current={s.key === sort ? "page" : undefined}
                className={`flex h-9 shrink-0 items-center rounded-[10px] px-3.5 text-[13px] font-medium ${
                  s.key === sort ? "bg-deep text-brand" : "bg-surface text-stone-700"
                }`}
              >
                {s.label}
              </Link>
            ))}
          </nav>
        </div>
      )}

      {query && dishes.length === 0 && matchingRestaurants.length === 0 ? (
        <ProblemScreen
          glyph="?"
          title={`No dishes for “${query}”`}
          action={
            <Link href="/#restaurants" className={problemActionClass}>
              Browse menus
            </Link>
          }
          secondary={<Link href="/search">Clear search</Link>}
        >
          Try another dish, or browse what Palia&apos;s kitchens are cooking tonight.
        </ProblemScreen>
      ) : (
        <>
          {!query && <h2 className="text-[13px] font-semibold tracking-[.5px] text-stone-500">POPULAR RIGHT NOW</h2>}

          {/* Phones: compact "matches" list (v2 8b) */}
          <ul className="flex flex-col gap-2.5 sm:hidden">
            {matchingRestaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <Link
                  href={`/restaurants/${restaurant.slug}`}
                  className="flex items-center gap-3 rounded-2xl bg-surface py-2.5 pl-2.5 pr-3.5 shadow-card"
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-full">
                    <Photo src={restaurant.logo_url ?? restaurantCover(restaurant)} alt="" sizes="48px" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-semibold">{restaurant.name}</span>
                    <span className="truncate text-xs text-stone-500">Restaurant{restaurant.area ? ` · ${restaurant.area}` : ""}</span>
                  </span>
                  {restaurant.rating_avg !== null && (
                    <span className="text-sm font-bold">★ {Number(restaurant.rating_avg).toFixed(1)}</span>
                  )}
                </Link>
              </li>
            ))}
            {sorted.map((dish) => (
              <li key={dish.id}>
                <Link
                  href={`/restaurants/${dish.restaurants.slug}#dish-${dish.id}`}
                  className="flex items-center gap-3 rounded-2xl bg-surface py-2.5 pl-2.5 pr-3.5 shadow-card"
                >
                  <span className="relative size-12 shrink-0 overflow-hidden rounded-full">
                    <Photo src={dishPhoto(dish)} alt="" sizes="48px" />
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] font-semibold">{dish.name}</span>
                    <span className="truncate text-xs text-stone-500">{dish.restaurants.name}</span>
                  </span>
                  <span className="text-sm font-bold tabular-nums">{rupees(dish.price)}</span>
                </Link>
              </li>
            ))}
          </ul>

          {/* Laptops and tablets: plate cards (v2 8a) */}
          {matchingRestaurants.length > 0 && (
            <div className="hidden flex-wrap gap-2.5 sm:flex">
              {matchingRestaurants.map((restaurant) => (
                <Link
                  key={restaurant.id}
                  href={`/restaurants/${restaurant.slug}`}
                  className="flex h-11 items-center gap-2.5 rounded-xl bg-surface pl-1.5 pr-4 text-sm font-semibold shadow-card hover:bg-muted"
                >
                  <span className="relative size-8 overflow-hidden rounded-full">
                    <Photo src={restaurant.logo_url ?? restaurantCover(restaurant)} alt="" sizes="32px" />
                  </span>
                  {restaurant.name}
                </Link>
              ))}
            </div>
          )}
          <ul className="hidden grid-cols-2 gap-x-[22px] gap-y-[84px] pt-16 sm:grid md:grid-cols-3 lg:grid-cols-4">
            {sorted.map((dish) => (
              <li key={dish.id}>
                <DishPlateCard dish={dish} />
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
