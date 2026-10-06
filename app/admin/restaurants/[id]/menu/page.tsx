import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAdminRestaurant } from "@/lib/queries/restaurants";
import { getAdminMenu } from "@/lib/queries/menu";
import { getWeeklyDishCounts } from "@/lib/queries/menu-stats";
import { adminSetItemAvailability } from "@/lib/actions/menu";
import { isUuid } from "@/lib/validation/menu";
import { AddCategoryForm, CategoryRow } from "@/components/admin/CategoryForms";
import { MenuTable } from "@/components/menu/MenuTable";
import { PageHeader } from "@/components/ui/page";

export const metadata: Metadata = { title: "Menu" };

export default async function AdminMenuPage({ params }: PageProps<"/admin/restaurants/[id]/menu">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const restaurant = await getAdminRestaurant(id);
  if (!restaurant) notFound();

  const [{ categories, items }, weekly] = await Promise.all([
    getAdminMenu(id),
    getWeeklyDishCounts(await createClient(), id),
  ]);
  const soldOut = items.filter((item) => !item.is_available).length;

  return (
    <>
      <PageHeader
        crumb={
          <>
            <Link href="/admin/restaurants" className="hover:underline">
              Restaurants
            </Link>{" "}
            ›{" "}
            <Link href={`/admin/restaurants/${id}`} className="hover:underline">
              {restaurant.name}
            </Link>
          </>
        }
        title="Menu"
        sub={`${items.length} ${items.length === 1 ? "dish" : "dishes"} · ${
          soldOut > 0 ? `${soldOut} marked out of stock` : "everything in stock"
        }`}
      >
        {categories.length > 0 && (
          <Link
            href={`/admin/restaurants/${id}/menu/items/new`}
            className="inline-flex h-[46px] items-center rounded-xl bg-brand px-5 font-bold text-on-brand hover:bg-brand-dark"
          >
            + Add dish
          </Link>
        )}
      </PageHeader>

      {categories.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
          Add a category below, then you can add dishes.
        </p>
      ) : (
        <MenuTable
          categories={categories}
          items={items}
          weekly={weekly}
          editHref={(itemId) => `/admin/restaurants/${id}/menu/items/${itemId}`}
          stockAction={adminSetItemAvailability}
        />
      )}

      <section className="flex flex-col gap-4 rounded-[18px] bg-surface p-5 shadow-card">
        <h2 className="text-[17px] font-semibold">Categories</h2>
        {categories.map((category) => (
          <CategoryRow key={category.id} restaurantId={id} category={category} />
        ))}
        <AddCategoryForm restaurantId={id} />
      </section>
    </>
  );
}
