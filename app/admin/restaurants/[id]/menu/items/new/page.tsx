import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminMenu } from "@/lib/queries/menu";
import { isUuid } from "@/lib/validation/menu";
import { MenuItemForm } from "@/components/admin/MenuItemForm";

export const metadata: Metadata = { title: "Add menu item" };

export default async function NewMenuItemPage({
  params,
  searchParams,
}: PageProps<"/admin/restaurants/[id]/menu/items/new">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { category } = await searchParams;
  const defaultCategoryId = typeof category === "string" && isUuid(category) ? category : undefined;

  const { categories } = await getAdminMenu(id);

  return (
    <>
      <Link href={`/admin/restaurants/${id}/menu`} className="text-sm text-stone-500 hover:underline">
        ← Menu
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">Add menu item</h1>
      {categories.length === 0 ? (
        <p className="text-stone-600">Create a category first, on the menu page.</p>
      ) : (
        <MenuItemForm restaurantId={id} categories={categories} defaultCategoryId={defaultCategoryId} />
      )}
    </>
  );
}
