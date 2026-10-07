"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal } from "lucide-react";
import {
  activeFilterCount,
  DIETS,
  matchesFilters,
  NO_FILTERS,
  searchHref,
  SORTS,
  type FilterableDish,
  type SearchFilters,
} from "@/lib/search/filters";

const STEP = 10;

// "Filters" button and the filters sheet (v2 8c): sort, diet, cuisine and a price range.
// The button at the bottom counts the matching dishes as you tap; it then opens the
// search with those filters in the address.
export function FiltersSheet({
  query,
  filters,
  dishes,
  cuisines,
  bounds,
}: {
  query: string;
  filters: SearchFilters;
  dishes: FilterableDish[];
  cuisines: string[];
  bounds: { low: number; high: number } | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<SearchFilters>(filters);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const count = activeFilterCount(filters);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
  }, [open]);

  function show() {
    setDraft(filters);
    setOpen(true);
  }

  function close() {
    dialogRef.current?.close();
    setOpen(false);
  }

  const low = bounds?.low ?? 0;
  const high = bounds?.high ?? 0;
  const minValue = Math.max(low, Math.min(draft.min ?? low, high));
  const maxValue = Math.min(high, Math.max(draft.max ?? high, low));

  // At the ends of the slider = no limit.
  const normalised: SearchFilters = {
    ...draft,
    min: bounds && minValue > low ? minValue : null,
    max: bounds && maxValue < high ? maxValue : null,
  };
  const matching = dishes.filter((dish) => matchesFilters(dish, normalised)).length;

  function apply() {
    close();
    router.push(searchHref(query, normalised));
  }

  const toggle = <K extends "diet" | "cuisine">(key: K, value: SearchFilters[K][number]) =>
    setDraft((current) => {
      const values = current[key] as string[];
      return {
        ...current,
        [key]: values.includes(value) ? values.filter((v) => v !== value) : [...values, value],
      };
    });

  const chip = (on: boolean) =>
    `flex h-[38px] items-center rounded-[10px] px-3.5 text-sm font-medium transition-colors ${
      on ? "bg-deep text-brand" : "bg-surface text-stone-700 shadow-card hover:bg-muted"
    }`;

  const pct = (value: number) => (high > low ? ((value - low) / (high - low)) * 100 : 0);
  const rupees = (value: number) => `₹${value}`;

  return (
    <>
      <button
        type="button"
        onClick={show}
        aria-haspopup="dialog"
        className={`flex h-9 shrink-0 items-center gap-2 rounded-[10px] px-3.5 text-[13px] font-medium ${
          count > 0 ? "bg-deep text-brand" : "bg-surface text-stone-700 shadow-card"
        }`}
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        Filters
        {count > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-md bg-brand px-1 text-[11px] font-bold text-on-brand">
            {count}
          </span>
        )}
      </button>

      {open && (
        <dialog
          ref={dialogRef}
          onClose={() => setOpen(false)}
          onClick={(event) => event.target === dialogRef.current && close()}
          aria-label="Filters"
          className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[30px] bg-background p-0 text-foreground backdrop:bg-black/50 sm:m-auto sm:max-w-[460px] sm:rounded-[30px]"
        >
          <div className="flex flex-col gap-[22px] px-[22px] pb-4 pt-3 sm:pt-6">
            <span className="h-[5px] w-11 self-center rounded-full bg-stone-300 sm:hidden" aria-hidden />
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-[30px] leading-none">Filters</h2>
              <button type="button" onClick={() => setDraft(NO_FILTERS)} className="text-sm font-semibold text-accent">
                Reset
              </button>
            </div>

            <div role="group" aria-label="Sort by" className="flex flex-col gap-2.5">
              <span className="text-[15px] font-semibold">Sort by</span>
              <div className="flex flex-wrap gap-2">
                {SORTS.map((sort) => (
                  <button
                    key={sort.key}
                    type="button"
                    aria-pressed={draft.sort === sort.key}
                    onClick={() => setDraft((current) => ({ ...current, sort: sort.key }))}
                    className={chip(draft.sort === sort.key)}
                  >
                    {sort.label}
                  </button>
                ))}
              </div>
            </div>

            <div role="group" aria-label="Diet" className="flex flex-col gap-2.5">
              <span className="text-[15px] font-semibold">Diet</span>
              <div className="flex flex-wrap gap-2">
                {DIETS.map((diet) => {
                  const on = draft.diet.includes(diet.key);
                  return (
                    <button key={diet.key} type="button" aria-pressed={on} onClick={() => toggle("diet", diet.key)} className={chip(on)}>
                      {diet.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {cuisines.length > 0 && (
              <div role="group" aria-label="Cuisine" className="flex flex-col gap-2.5">
                <span className="text-[15px] font-semibold">Cuisine</span>
                <div className="flex flex-wrap gap-2">
                  {cuisines.map((cuisine) => {
                    const on = draft.cuisine.includes(cuisine);
                    return (
                      <button key={cuisine} type="button" aria-pressed={on} onClick={() => toggle("cuisine", cuisine)} className={chip(on)}>
                        {cuisine}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {bounds && (
              <div className="flex flex-col gap-3">
                <div className="flex justify-between">
                  <span className="text-[15px] font-semibold">Price of a dish</span>
                  <span className="text-sm text-stone-600 tabular-nums">
                    {rupees(minValue)} – {rupees(maxValue)}
                  </span>
                </div>
                <div className="dual-range relative h-5">
                  <div className="absolute inset-x-0 top-2 h-1 rounded-full bg-[#E5E0D8] dark:bg-stone-300" aria-hidden />
                  <div
                    className="absolute top-2 h-1 bg-brand"
                    style={{ left: `${pct(minValue)}%`, right: `${100 - pct(maxValue)}%` }}
                    aria-hidden
                  />
                  <input
                    type="range"
                    min={low}
                    max={high}
                    step={STEP}
                    value={minValue}
                    aria-label="Lowest price"
                    aria-valuetext={rupees(minValue)}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, min: Math.min(Number(event.target.value), maxValue - STEP) }))
                    }
                  />
                  <input
                    type="range"
                    min={low}
                    max={high}
                    step={STEP}
                    value={maxValue}
                    aria-label="Highest price"
                    aria-valuetext={rupees(maxValue)}
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, max: Math.max(Number(event.target.value), minValue + STEP) }))
                    }
                  />
                </div>
              </div>
            )}
          </div>

          <div className="sticky bottom-0 bg-background/95 px-[22px] pb-6 pt-3 backdrop-blur">
            <button
              type="button"
              onClick={apply}
              disabled={matching === 0}
              className="flex h-14 w-full items-center justify-center rounded-[14px] bg-[#16120D] text-base font-semibold text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50 dark:bg-[#2A241C]"
            >
              {matching === 0 ? (
                "No dishes match"
              ) : (
                <>
                  Show {matching} {matching === 1 ? "dish" : "dishes"}
                  <span className="ml-2 text-brand" aria-hidden>
                    →
                  </span>
                </>
              )}
            </button>
          </div>
        </dialog>
      )}
    </>
  );
}
