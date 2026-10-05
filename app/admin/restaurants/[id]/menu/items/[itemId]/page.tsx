import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminMenu, getAdminMenuItem } from "@/lib/queries/menu";
import { isUuid } from "@/lib/validation/menu";
import { MenuItemForm } from "@/components/admin/MenuItemForm";
import { DeleteItemButton } from "@/components/admin/DeleteItemButton";

export const metadata: Metadata = { title: "Edit menu item" };

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
      <Link href={`/admin/restaurants/${id}/menu`} className="text-sm text-stone-500 hover:underline">
        ← Menu
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">{item.name}</h1>
      <div className="flex flex-col gap-6">
        <MenuItemForm restaurantId={id} categories={categories} item={item} />
        <DeleteItemButton restaurantId={id} itemId={item.id} itemName={item.name} />
      </div>
    </>
  );
}
