import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelMenu } from "@/lib/queries/panel";
import { panelCreateItem, panelUpdateItem } from "@/lib/actions/panel-menu";
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

  return (
    <>
      <Link href="/panel/menu" className="text-sm text-stone-500 hover:underline">
        ← Menu
      </Link>
      <h1 className="text-xl font-bold">Add a dish</h1>
      {categories.length === 0 ? (
        <p className="text-stone-600">Add a category first, on the menu page.</p>
      ) : (
        <MenuItemForm
          restaurantId={restaurant.id}
          categories={categories}
          defaultCategoryId={defaultCategoryId}
          actions={{ create: panelCreateItem, update: panelUpdateItem }}
          allowImage={false}
        />
      )}
    </>
  );
}
