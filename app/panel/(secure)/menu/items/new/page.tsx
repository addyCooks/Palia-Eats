import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelMenu } from "@/lib/queries/panel";
import { panelCreateItem, panelUpdateItem, panelUploadDishPhoto } from "@/lib/actions/panel-menu";
import { isUuid } from "@/lib/validation/menu";
import { MenuItemForm } from "@/components/admin/MenuItemForm";

export const metadata: Metadata = { title: "Add dish" };

export default async function PanelNewItemPage({ searchParams }: PageProps<"/panel/menu/items/new">) {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const { categories } = await getPanelMenu(restaurant.id);
  const params = await searchParams;
  const wanted = typeof params.category === "string" ? params.category : "";
  const defaultCategoryId =
    isUuid(wanted) && categories.some((category) => category.id === wanted) ? wanted : undefined;

  if (categories.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-600">
        Add a category first, on the{" "}
        <Link href="/panel/menu" className="font-semibold text-accent hover:underline">
          menu page
        </Link>
        .
      </p>
    );
  }

  return (
    <MenuItemForm
      restaurantId={restaurant.id}
      categories={categories}
      defaultCategoryId={defaultCategoryId}
      actions={{ create: panelCreateItem, update: panelUpdateItem }}
      serverUpload={panelUploadDishPhoto}
      backHref="/panel/menu"
    />
  );
}
