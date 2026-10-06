import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminMenu } from "@/lib/queries/menu";
import { isUuid } from "@/lib/validation/menu";
import { MenuItemForm } from "@/components/admin/MenuItemForm";

export const metadata: Metadata = { title: "Add dish" };

export default async function NewMenuItemPage({
  params,
  searchParams,
}: PageProps<"/admin/restaurants/[id]/menu/items/new">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const { category } = await searchParams;
  const defaultCategoryId = typeof category === "string" && isUuid(category) ? category : undefined;

  const { categories } = await getAdminMenu(id);

  if (categories.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-600">
        Create a category first, on the{" "}
        <Link href={`/admin/restaurants/${id}/menu`} className="font-semibold text-accent hover:underline">
          menu page
        </Link>
        .
      </p>
    );
  }

  return (
    <MenuItemForm
      restaurantId={id}
      categories={categories}
      defaultCategoryId={defaultCategoryId}
      backHref={`/admin/restaurants/${id}/menu`}
    />
  );
}
