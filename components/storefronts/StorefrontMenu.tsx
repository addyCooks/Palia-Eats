"use client";

import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import type { MenuCategory, MenuItem, Restaurant } from "@/types/app";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { CartPanel } from "@/components/cart/CartPanel";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { DishSheet } from "@/components/storefronts/DishSheet";

type Section = { category: MenuCategory; items: MenuItem[] };

// The menu part of a storefront: search, a veg-only switch, categories that follow your
// scrolling, the dishes and (on laptops) the cart beside them. Dishes keep the
// restaurant's own accent color.
export function StorefrontMenu({
  restaurant,
  sections,
  canOrder,
}: {
  restaurant: Restaurant;
  sections: Section[];
  canOrder: boolean;
}) {
  const [query, setQuery] = useState("");
  const [vegOnly, setVegOnly] = useState(false);
  const [active, setActive] = useState<string | null>(sections[0]?.category.id ?? null);
  const [openItem, setOpenItem] = useState<MenuItem | null>(null);
  const tabsRef = useRef<HTMLDivElement>(null);

  const needle = query.trim().toLowerCase();
  const visible = sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) => {
        if (vegOnly && !item.is_veg) return false;
        if (!needle) return true;
        return `${item.name} ${item.description ?? ""}`.toLowerCase().includes(needle);
      }),
    }))
    .filter((section) => section.items.length > 0);

  // Highlight the category currently under the sticky bar.
  const visibleKey = visible.map((s) => s.category.id).join(",");
  useEffect(() => {
    const elements = visibleKey
      .split(",")
      .filter(Boolean)
      .map((id) => document.getElementById(`category-${id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const top = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (top) setActive(top.target.id.replace("category-", ""));
      },
      { rootMargin: "-150px 0px -65% 0px" },
    );
    elements.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [visibleKey]);

  // Arriving from a dish card elsewhere (/restaurants/x#dish-<id>): open that dish.
  useEffect(() => {
    const id = window.location.hash.match(/^#dish-([0-9a-f-]{36})$/i)?.[1];
    const item = id ? sections.flatMap((s) => s.items).find((candidate) => candidate.id === id) : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reads the address once on arrival
    if (item) setOpenItem(item);
  }, [sections]);

  // Keep the active chip in view in the sideways-scrolling row (phones).
  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>('[aria-current="true"]');
    tab?.scrollIntoView({ block: "nearest", inline: "center" });
  }, [active]);

  const searchAndVeg = (
    <div className="flex items-center gap-2">
      <label className="flex h-11 min-w-0 flex-1 items-center gap-2 rounded-xl bg-surface px-3.5 shadow-card focus-within:ring-2 focus-within:ring-brand/30">
        <Search className="size-4 shrink-0 text-stone-500" aria-hidden />
        <span className="sr-only">Search this menu</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search this menu"
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-500"
        />
      </label>
      <button
        type="button"
        role="switch"
        aria-checked={vegOnly}
        onClick={() => setVegOnly((value) => !value)}
        className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-surface px-3 text-[13px] font-semibold shadow-card"
      >
        Veg only
        <span
          className={`relative h-[22px] w-10 rounded-full transition-colors ${vegOnly ? "bg-[#15803D]" : "bg-[#D8D2C8] dark:bg-[#4A4136]"}`}
          aria-hidden
        >
          <span className={`absolute top-[3px] size-4 rounded-full bg-white transition-[left] ${vegOnly ? "left-[21px]" : "left-[3px]"}`} />
        </span>
      </button>
    </div>
  );

  const countOf = (categoryId: string) => visible.find((s) => s.category.id === categoryId)?.items.length ?? 0;

  return (
    <div className="lg:grid lg:grid-cols-[200px_minmax(0,1fr)_320px] lg:items-start lg:gap-8">
      {/* Laptop: category list on the left */}
      {sections.length > 1 && (
        <nav aria-label="Menu categories" className="sticky top-24 hidden flex-col gap-1 lg:flex">
          {visible.map(({ category }) => {
            const on = category.id === active;
            return (
              <a
                key={category.id}
                href={`#category-${category.id}`}
                aria-current={on ? "true" : undefined}
                onClick={() => setActive(category.id)}
                className={`flex h-[42px] items-center justify-between rounded-[10px] px-3.5 text-sm transition-colors ${
                  on ? "bg-deep font-semibold text-brand" : "font-medium text-stone-700 hover:bg-surface"
                }`}
              >
                {category.name}
                <span className="text-xs opacity-70">{countOf(category.id)}</span>
              </a>
            );
          })}
        </nav>
      )}

      <div className={`flex min-w-0 flex-col ${sections.length > 1 ? "" : "lg:col-span-2"}`}>
        {/* Sticky controls (phones: with category chips) */}
        <div className="sticky top-0 z-20 -mx-4 flex flex-col gap-3 bg-background/95 px-4 pb-3 pt-4 backdrop-blur lg:static lg:mx-0 lg:bg-transparent lg:px-0 lg:pt-0 lg:backdrop-blur-none">
          {searchAndVeg}
          {sections.length > 1 && (
            <nav aria-label="Menu categories" className="lg:hidden">
              <div ref={tabsRef} className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
                {visible.map(({ category }) => {
                  const on = category.id === active;
                  return (
                    <a
                      key={category.id}
                      href={`#category-${category.id}`}
                      aria-current={on ? "true" : undefined}
                      onClick={() => setActive(category.id)}
                      className={`flex h-9 shrink-0 items-center whitespace-nowrap rounded-[10px] px-3.5 text-sm font-medium transition-colors ${
                        on ? "bg-deep text-brand" : "bg-surface text-stone-700"
                      }`}
                    >
                      {category.name}
                    </a>
                  );
                })}
              </div>
            </nav>
          )}
        </div>

        {sections.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
            The menu is coming soon.
          </p>
        ) : visible.length === 0 ? (
          <p className="mt-6 rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
            Nothing matches that. Try a different word{vegOnly ? " or turn off Veg only" : ""}.
          </p>
        ) : (
          visible.map(({ category, items }) => (
            <section key={category.id} id={`category-${category.id}`} className="flex scroll-mt-36 flex-col gap-3 pt-5 lg:scroll-mt-24 lg:gap-[18px]">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="font-display text-2xl lg:text-[30px]">{category.name}</h2>
                <span className="text-[13px] text-stone-500">
                  {items.length} {items.length === 1 ? "dish" : "dishes"}
                </span>
              </div>
              <ul className="flex flex-col gap-3 lg:gap-[18px]">
                {items.map((item) => (
                  <MenuItemCard
                    key={item.id}
                    item={item}
                    onOpen={() => setOpenItem(item)}
                    action={
                      <AddToCartButton
                        restaurant={restaurant}
                        item={item}
                        canOrder={canOrder}
                        onChooseSize={() => setOpenItem(item)}
                      />
                    }
                  />
                ))}
              </ul>
            </section>
          ))
        )}
      </div>

      {/* Laptop: the cart beside the menu */}
      <div className="sticky top-24 hidden lg:block">
        <CartPanel restaurantId={restaurant.id} />
      </div>

      {openItem && (
        <DishSheet item={openItem} restaurant={restaurant} canOrder={canOrder} onClose={() => setOpenItem(null)} />
      )}
    </div>
  );
}
