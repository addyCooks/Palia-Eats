import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelMenu } from "@/lib/queries/panel";
import { setPanelItemAvailability } from "@/lib/actions/panel";
import {
  panelCreateCategory,
  panelDeleteCategory,
  panelUpdateCategory,
} from "@/lib/actions/panel-menu";
import { AddCategoryForm, CategoryRow } from "@/components/admin/CategoryForms";
import { MenuTable } from "@/components/menu/MenuTable";
import { PageHeader } from "@/components/ui/page";

export const metadata: Metadata = { title: "Menu" };

const categoryActions = {
  create: panelCreateCategory,
  update: panelUpdateCategory,
  remove: panelDeleteCategory,
};

export default async function PanelMenuPage() {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const { categories, items, weekly } = await getPanelMenu(restaurant.id);
  const soldOut = items.filter((item) => !item.is_available).length;

  return (
    <>
      <PageHeader
        title="Menu"
        sub={`${items.length} ${items.length === 1 ? "dish" : "dishes"} · ${
          soldOut > 0 ? `${soldOut} marked out of stock` : "everything in stock"
        }`}
      >
        <Link
          href="/panel/menu/items/new"
          className="inline-flex h-[46px] items-center rounded-xl bg-brand px-5 font-bold text-on-brand hover:bg-brand-dark"
        >
          + Add dish
        </Link>
      </PageHeader>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
          No categories yet. Add one below (for example &ldquo;Biryani&rdquo;), then add your dishes.
        </p>
      ) : (
        <MenuTable
          categories={categories}
          items={items}
          weekly={weekly}
          editHref={(id) => `/panel/menu/items/${id}`}
          stockAction={setPanelItemAvailability}
        />
      )}

      <details className="group rounded-[18px] bg-surface p-5 shadow-card" open={categories.length === 0}>
        <summary className="cursor-pointer list-none text-[15px] font-semibold marker:content-none">
          Categories
          <span className="ml-2 text-sm font-normal text-stone-500 group-open:hidden">rename, reorder or add</span>
        </summary>
        <div className="mt-4 flex flex-col gap-4">
          {categories.map((category) => (
            <CategoryRow key={category.id} restaurantId={restaurant.id} category={category} actions={categoryActions} />
          ))}
          <AddCategoryForm restaurantId={restaurant.id} actions={categoryActions} />
        </div>
      </details>
    </>
  );
}
