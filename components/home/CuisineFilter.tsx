"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type CuisineFilter = { cuisine: string | null; setCuisine: (cuisine: string | null) => void };

const Context = createContext<CuisineFilter | null>(null);

// The home page has one set of cuisine chips (at the top on phones, above the list on
// laptops). This shares the chosen cuisine between the chips and the restaurant list.
export function CuisineFilterProvider({ children }: { children: ReactNode }) {
  const [cuisine, setCuisine] = useState<string | null>(null);
  return <Context.Provider value={{ cuisine, setCuisine }}>{children}</Context.Provider>;
}

export function useCuisineFilter(): CuisineFilter {
  const shared = useContext(Context);
  const [cuisine, setCuisine] = useState<string | null>(null);
  return shared ?? { cuisine, setCuisine };
}

// Phones: the chips under the search box at the top of the home page. Picking one filters
// "Restaurants in Palia" and glides down to it.
export function TopCuisineChips({ cuisines }: { cuisines: string[] }) {
  const { cuisine, setCuisine } = useCuisineFilter();

  function choose(tag: string | null) {
    setCuisine(tag);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    document.getElementById("restaurants")?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  return (
    <div role="group" aria-label="Filter restaurants by cuisine" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 lg:hidden">
      {[null, ...cuisines].map((tag) => {
        const active = tag === cuisine;
        return (
          <button
            key={tag ?? "all"}
            type="button"
            aria-pressed={active}
            onClick={() => choose(tag)}
            className={`flex h-9 shrink-0 items-center rounded-[10px] px-4 text-sm font-medium transition-colors ${
              active ? "bg-deep text-brand" : "bg-surface text-stone-700"
            }`}
          >
            {tag ?? "All"}
          </button>
        );
      })}
    </div>
  );
}
