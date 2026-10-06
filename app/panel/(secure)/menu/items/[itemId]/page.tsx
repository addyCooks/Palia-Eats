import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelMenu } from "@/lib/queries/panel";
import {
  panelCreateItem,
  panelDeleteItem,
  panelUpdateItem,
  panelUploadDishPhoto,
} from "@/lib/actions/panel-menu";
import { isUuid } from "@/lib/validation/menu";
import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { DeleteItemButton } from "@/components/admin/DeleteItemButton";

export const metadata: Metadata = { title: "Edit dish" };

export default async function PanelEditItemPage({ params }: PageProps<"/panel/menu/items/[itemId]">) {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const { itemId } = await params;
  if (!isUuid(itemId)) notFound();

  // Loaded only from THIS restaurant's menu, so another restaurant's dish is a 404.
  const { categories, items } = await getPanelMenu(restaurant.id);
  const item = items.find((candidate) => candidate.id === itemId);
  if (!item) notFound();

  return (
    <>
      <MenuItemForm
        restaurantId={restaurant.id}
        categories={categories}
        item={item}
        actions={{ create: panelCreateItem, update: panelUpdateItem }}
        serverUpload={panelUploadDishPhoto}
        backHref="/panel/menu"
      />
      <DeleteItemButton
        restaurantId={restaurant.id}
        itemId={item.id}
        itemName={item.name}
        action={panelDeleteItem}
      />
    </>
  );
}
