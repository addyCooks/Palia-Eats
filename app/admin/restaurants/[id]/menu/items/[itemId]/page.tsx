import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAdminMenu, getAdminMenuItem } from "@/lib/queries/menu";
import { isUuid } from "@/lib/validation/menu";
import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { DeleteItemButton } from "@/components/admin/DeleteItemButton";

export const metadata: Metadata = { title: "Edit dish" };

export default async function EditMenuItemPage({
  params,
}: PageProps<"/admin/restaurants/[id]/menu/items/[itemId]">) {
  const { id, itemId } = await params;
  if (!isUuid(id) || !isUuid(itemId)) notFound();

  const item = await getAdminMenuItem(id, itemId);
  if (!item) notFound();

  const { categories } = await getAdminMenu(id);

  return (
    <>
      <MenuItemForm restaurantId={id} categories={categories} item={item} backHref={`/admin/restaurants/${id}/menu`} />
      <DeleteItemButton restaurantId={id} itemId={item.id} itemName={item.name} />
    </>
  );
}
