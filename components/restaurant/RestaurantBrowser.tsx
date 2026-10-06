"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { Restaurant } from "@/types/app";
import type { RestaurantStatus } from "@/lib/utils/hours";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";

export type BrowsableRestaurant = { restaurant: Restaurant; status: RestaurantStatus };

// The homepage list: search box, cuisine chips, and restaurants split into "open now" and
// "not taking orders right now" (those stay visible, just muted).
export function RestaurantBrowser({ items }: { items: BrowsableRestaurant[] }) {
  const [query, setQuery] = useState("");
  const [cuisine, setCuisine] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  // The "Search" tab links to /#search: focus the box when we arrive there.
  useEffect(() => {
    function focusIfRequested() {
      if (window.location.hash === "#search") searchRef.current?.focus();
    }
    focusIfRequested();
    window.addEventListener("hashchange", focusIfRequested);
    return () => window.removeEventListener("hashchange", focusIfRequested);
  }, []);

  // Cuisines, most common first
  const cuisines = useMemo(() => {
    const counts = new Map<string, number>();
    for (const { restaurant } of items) {
      for (const tag of restaurant.cuisine_tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([tag]) => tag);
  }, [items]);

  const needle = query.trim().toLowerCase();
  const visible = items.filter(({ restaurant }) => {
    if (cuisine && !restaurant.cuisine_tags.includes(cuisine)) return false;
    if (!needle) return true;
    return [restaurant.name, restaurant.tagline ?? "", ...restaurant.cuisine_tags].some((text) =>
      text.toLowerCase().includes(needle),
    );
  });

  const open = visible.filter(({ status }) => status.canOrder);
  const closed = visible.filter(({ status }) => !status.canOrder);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4">
        <label className="flex h-12 items-center gap-2.5 rounded-2xl bg-surface px-4 shadow-card focus-within:ring-2 focus-within:ring-brand/30">
          <Search className="size-[18px] shrink-0 text-stone-500" aria-hidden />
          <span className="sr-only">Search restaurants or cuisines</span>
          <input
            ref={searchRef}
            id="search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search restaurants or cuisines…"
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-stone-500"
          />
        </label>

        {cuisines.length > 0 && (
          <div
            role="group"
            aria-label="Filter by cuisine"
            className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4"
          >
            {[null, ...cuisines].map((tag) => {
              const active = tag === cuisine;
              return (
                <button
                  key={tag ?? "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCuisine(tag)}
                  className={`h-10 shrink-0 rounded-full border px-4 text-sm font-semibold transition-colors ${
                    active
                      ? "border-brand-dark bg-brand-dark text-on-brand"
                      : "border-border bg-surface hover:bg-muted"
                  }`}
                >
                  {tag ?? "All"}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {visible.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-10 text-center text-stone-500">
          No restaurants match that. Try another word or clear the filter.
        </p>
      ) : (
        <>
          {open.length > 0 && (
            <section aria-labelledby="open-now" className="flex flex-col gap-4">
              <h2 id="open-now" className="font-display text-2xl font-bold sm:text-[28px]">
                Open now
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {open.map(({ restaurant, status }) => (
                  <li key={restaurant.id}>
                    <RestaurantCard restaurant={restaurant} status={status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {closed.length > 0 && (
            <section aria-labelledby="closed-now" className="flex flex-col gap-4">
              <h2 id="closed-now" className="font-display text-2xl font-bold sm:text-[28px]">
                {open.length > 0 ? "Not taking orders right now" : "Restaurants"}
              </h2>
              <ul className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
                {closed.map(({ restaurant, status }) => (
                  <li key={restaurant.id}>
                    <RestaurantCard restaurant={restaurant} status={status} />
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  );
}
