"use client";

import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Restaurant } from "@/types/app";
import type { RestaurantStatus } from "@/lib/utils/hours";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";
import { useCuisineFilter } from "@/components/home/CuisineFilter";
import { cuisinesByCount } from "@/lib/utils/cuisines";

export type BrowsableRestaurant = { restaurant: Restaurant; status: RestaurantStatus };

// "Restaurants in Palia" (v2 5a): title, then the cards. Restaurants not taking orders stay
// visible (black and white) after the open ones.
// Laptops: a search box and cuisine chips sit above the list. Phones: the home page's chips
// at the top do the filtering (one set of filters per screen), and a "Showing: Pizza" note
// here says what is filtered, with a way to clear it.
export function RestaurantBrowser({ items }: { items: BrowsableRestaurant[] }) {
  const [query, setQuery] = useState("");
  const { cuisine, setCuisine } = useCuisineFilter();

  const cuisines = useMemo(() => cuisinesByCount(items.map(({ restaurant }) => restaurant.cuisine_tags)), [items]);

  const needle = query.trim().toLowerCase();
  const visible = items
    .filter(({ restaurant }) => {
      if (cuisine && !restaurant.cuisine_tags.includes(cuisine)) return false;
      if (!needle) return true;
      return [restaurant.name, restaurant.tagline ?? "", restaurant.area ?? "", ...restaurant.cuisine_tags].some((text) =>
        text.toLowerCase().includes(needle),
      );
    })
    .sort((a, b) => Number(b.status.canOrder) - Number(a.status.canOrder));
  const openCount = items.filter(({ status }) => status.canOrder).length;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-[34px] leading-none sm:text-[44px] lg:text-[52px]">Restaurants in Palia</h2>
          <p className="text-[15px] text-stone-600 sm:text-base">
            {openCount > 0
              ? `${openCount} ${openCount === 1 ? "kitchen" : "kitchens"} delivering to Palia Kalan right now`
              : "No kitchen is taking orders right now. Have a look at their menus."}
          </p>
        </div>
        <label className="hidden h-12 w-full items-center gap-2.5 rounded-xl bg-surface pl-4 pr-1.5 shadow-[0_4px_14px_rgba(120,70,0,.06)] focus-within:ring-2 focus-within:ring-brand/30 lg:flex lg:w-[360px]">
          <Search className="size-4 shrink-0 text-stone-500" aria-hidden />
          <span className="sr-only">Search restaurants</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search restaurants"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-500"
          />
        </label>
      </div>

      {cuisines.length > 0 && (
        <div role="group" aria-label="Filter by cuisine" className="hidden flex-wrap gap-2.5 lg:flex">
          {[null, ...cuisines].map((tag) => {
            const active = tag === cuisine;
            return (
              <button
                key={tag ?? "all"}
                type="button"
                aria-pressed={active}
                onClick={() => setCuisine(tag)}
                className={`h-[38px] shrink-0 rounded-[10px] px-4 text-sm font-medium transition-colors ${
                  active ? "bg-deep text-brand" : "bg-surface text-stone-700 hover:bg-muted"
                }`}
              >
                {tag ?? "All"}
              </button>
            );
          })}
        </div>
      )}

      {cuisine && (
        <div role="status" className="anim-pop-in flex items-center gap-2 self-start rounded-full bg-surface py-1.5 pl-4 pr-1.5 text-sm shadow-card lg:hidden">
          <span>
            Showing <b>{cuisine}</b>
          </span>
          <button
            type="button"
            onClick={() => setCuisine(null)}
            className="flex h-8 items-center gap-1 rounded-full bg-deep px-3 text-[13px] font-semibold text-brand"
          >
            <X className="size-3.5" aria-hidden />
            Clear
          </button>
        </div>
      )}

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-stone-500">
          No restaurants match that. Try another word or clear the filter.
        </p>
      ) : (
        <ul className="stagger grid gap-4 sm:grid-cols-2 sm:gap-[22px] lg:grid-cols-3">
          {visible.map(({ restaurant, status }) => (
            <li key={restaurant.id}>
              <RestaurantCard restaurant={restaurant} status={status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
