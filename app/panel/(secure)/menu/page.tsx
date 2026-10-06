import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelMenu } from "@/lib/queries/panel";
import {
  panelCreateCategory,
  panelDeleteCategory,
  panelUpdateCategory,
} from "@/lib/actions/panel-menu";
import { formatPrice } from "@/lib/utils/format";
import { VegMark } from "@/components/menu/VegMark";
import { AddCategoryForm, CategoryRow } from "@/components/admin/CategoryForms";
import { Card } from "@/components/ui/Card";
import { ItemAvailabilityButton } from "@/components/panel/ItemAvailabilityButton";

const categoryActions = {
  create: panelCreateCategory,
  update: panelUpdateCategory,
  remove: panelDeleteCategory,
};

export default async function PanelMenuPage() {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const { categories, items } = await getPanelMenu(restaurant.id);
  const soldOut = items.filter((item) => !item.is_available).length;
  const brand = "var(--brand)";

  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-extrabold">Menu</h1>
          <p className="text-sm text-stone-500">
            {soldOut > 0 ? `${soldOut} sold out` : "Everything is available"}
          </p>
        </div>
        <Link
          href="/panel/menu/items/new"
          className="inline-flex h-10 items-center rounded-xl bg-brand-dark px-4 text-sm font-bold text-on-brand hover:bg-brand"
        >
          + Item
        </Link>
      </div>

      {categories.length > 1 && (
        <nav aria-label="Jump to a category" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4">
          {categories.map((category) => (
            <a
              key={category.id}
              href={`#cat-${category.id}`}
              className="flex h-9 shrink-0 items-center rounded-full bg-chrome px-3.5 text-[13px] font-bold text-[#D8CCBC] hover:text-white"
            >
              {category.name}
            </a>
          ))}
        </nav>
      )}

      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category_id === category.id);
        return (
          <section key={category.id} id={`cat-${category.id}`} className="flex scroll-mt-4 flex-col gap-2.5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">{category.name}</h2>
              <Link
                href={`/panel/menu/items/new?category=${category.id}`}
                className="text-sm font-bold text-brand-dark hover:underline"
              >
                + Add dish
              </Link>
            </div>
            {categoryItems.length === 0 ? (
              <p className="text-sm text-stone-500">No dishes yet.</p>
            ) : (
              <ul className="flex flex-col gap-2.5">
                {categoryItems.map((item) => (
                  <li key={item.id}>
                    <Card
                      className={`flex flex-col gap-2.5 rounded-[18px] border-0 p-3 shadow-card ${
                        item.is_available ? "" : "opacity-90"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`relative size-14 shrink-0 overflow-hidden rounded-xl ${
                            item.is_available ? "" : "grayscale"
                          }`}
                          style={{ backgroundColor: brand }}
                        >
                          {item.image_url ? (
                            <Image src={item.image_url} alt="" fill sizes="56px" unoptimized className="object-cover" />
                          ) : (
                            <span className="flex size-full items-center justify-center font-display text-xl font-extrabold text-white">
                              {item.name.charAt(0)}
                            </span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="flex items-center gap-1.5 text-[15px] font-bold">
                            <VegMark isVeg={item.is_veg} />
                            <span className="truncate">{item.name}</span>
                          </p>
                          <p className="mt-0.5 text-sm font-extrabold tabular-nums">
                            {formatPrice(item.price)}{" "}
                            <Link
                              href={`/panel/menu/items/${item.id}`}
                              className="ml-1 text-xs font-bold text-brand-dark hover:underline"
                            >
                              Edit
                            </Link>
                          </p>
                        </div>
                      </div>
                      <ItemAvailabilityButton itemId={item.id} available={item.is_available} />
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}

      {categories.length === 0 && (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
          No categories yet. Add one below, then add your dishes.
        </p>
      )}

      <details className="group rounded-[18px] bg-surface p-4 shadow-card">
        <summary className="cursor-pointer list-none text-[15px] font-bold marker:content-none">
          Edit categories
          <span className="ml-2 text-sm font-normal text-stone-500 group-open:hidden">rename, reorder or add</span>
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          {categories.map((category) => (
            <CategoryRow
              key={category.id}
              restaurantId={restaurant.id}
              category={category}
              actions={categoryActions}
            />
          ))}
          <AddCategoryForm restaurantId={restaurant.id} actions={categoryActions} />
        </div>
      </details>
    </>
  );
}
