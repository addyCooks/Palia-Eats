import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminRestaurant } from "@/lib/queries/restaurants";
import { getAdminMenu } from "@/lib/queries/menu";
import { setItemAvailability } from "@/lib/actions/menu";
import { isUuid } from "@/lib/validation/menu";
import { formatPrice } from "@/lib/utils/format";
import { AddCategoryForm, CategoryRow } from "@/components/admin/CategoryForms";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { MenuItem } from "@/types/app";

export const metadata: Metadata = { title: "Menu" };

export default async function AdminMenuPage({
  params,
}: PageProps<"/admin/restaurants/[id]/menu">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const restaurant = await getAdminRestaurant(id);
  if (!restaurant) notFound();

  const { categories, items } = await getAdminMenu(id);
  const itemsIn = (categoryId: string | null) =>
    items.filter((item) => item.category_id === categoryId);
  const uncategorized = itemsIn(null);

  return (
    <>
      <Link href={`/admin/restaurants/${id}`} className="text-sm text-stone-500 hover:underline">
        ← {restaurant.name}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">Menu</h1>

      <div className="flex flex-col gap-6">
        <Card className="flex flex-col gap-4">
          <h2 className="font-semibold">Categories</h2>
          {categories.map((category) => (
            <CategoryRow key={category.id} restaurantId={id} category={category} />
          ))}
          <AddCategoryForm restaurantId={id} />
        </Card>

        {categories.length === 0 && (
          <p className="text-stone-600">Add a category above, then you can add menu items.</p>
        )}

        {categories.map((category) => (
          <section key={category.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">{category.name}</h2>
              <Link
                href={`/admin/restaurants/${id}/menu/items/new?category=${category.id}`}
                className="rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Add item
              </Link>
            </div>
            <ItemList restaurantId={id} items={itemsIn(category.id)} />
          </section>
        ))}

        {uncategorized.length > 0 && (
          <section className="flex flex-col gap-3">
            <h2 className="text-lg font-semibold">No category</h2>
            <ItemList restaurantId={id} items={uncategorized} />
          </section>
        )}
      </div>
    </>
  );
}

function ItemList({ restaurantId, items }: { restaurantId: string; items: MenuItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-stone-500">No items yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item) => (
        <li key={item.id}>
          <Card className="flex items-center gap-3 p-3">
            <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
              {item.image_url && (
                <Image src={item.image_url} alt={item.name} fill unoptimized className="object-cover" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium">
                <span
                  aria-label={item.is_veg ? "Vegetarian" : "Non-vegetarian"}
                  className={`size-3 shrink-0 rounded-sm border-2 ${
                    item.is_veg ? "border-green-600 bg-green-600/30" : "border-red-600 bg-red-600/30"
                  }`}
                />
                <span className="truncate">{item.name}</span>
              </p>
              <p className="text-sm text-stone-600">
                {formatPrice(item.price)}
                {!item.is_available && (
                  <Badge tone="warning" className="ml-2">
                    Sold out
                  </Badge>
                )}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-1 sm:flex-row">
              <form action={setItemAvailability}>
                <input type="hidden" name="restaurantId" value={restaurantId} />
                <input type="hidden" name="itemId" value={item.id} />
                <input type="hidden" name="available" value={String(!item.is_available)} />
                <Button type="submit" variant="secondary" size="sm">
                  {item.is_available ? "Mark sold out" : "Mark available"}
                </Button>
              </form>
              <Link
                href={`/admin/restaurants/${restaurantId}/menu/items/${item.id}`}
                className="inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium hover:bg-muted"
              >
                Edit
              </Link>
            </div>
          </Card>
        </li>
      ))}
    </ul>
  );
}
