import Link from "next/link";
import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelMenu } from "@/lib/queries/panel";
import {
  panelCreateCategory,
  panelDeleteCategory,
  panelUpdateCategory,
} from "@/lib/actions/panel-menu";
import { formatPrice } from "@/lib/utils/format";
import { VegMark } from "@/components/menu/VegMark";
import { AddCategoryForm, CategoryRow } from "@/components/admin/CategoryForms";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ItemAvailabilityButton } from "@/components/panel/ItemAvailabilityButton";

const categoryActions = {
  create: panelCreateCategory,
  update: panelUpdateCategory,
  remove: panelDeleteCategory,
};

export default async function PanelMenuPage() {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const { categories, items } = await getPanelMenu(restaurant.id);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold">Menu</h1>
        <p className="text-sm text-stone-600">
          Out of something? Mark it sold out and customers can&apos;t order it. You can also add
          dishes, change prices and organise categories. Changes show on your page straight away.
        </p>
      </div>

      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">Categories</h2>
        {categories.map((category) => (
          <CategoryRow
            key={category.id}
            restaurantId={restaurant.id}
            category={category}
            actions={categoryActions}
          />
        ))}
        <AddCategoryForm restaurantId={restaurant.id} actions={categoryActions} />
      </Card>

      {categories.length === 0 && (
        <p className="text-stone-600">Add a category above, then you can add dishes.</p>
      )}

      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category_id === category.id);
        return (
          <section key={category.id} className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">{category.name}</h2>
              <Link
                href={`/panel/menu/items/new?category=${category.id}`}
                className="rounded-xl bg-brand px-3 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                Add dish
              </Link>
            </div>
            {categoryItems.length === 0 ? (
              <p className="text-sm text-stone-500">No dishes yet.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {categoryItems.map((item) => (
                  <li key={item.id}>
                    <Card className="flex items-center justify-between gap-3 p-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 font-medium">
                          <VegMark isVeg={item.is_veg} />
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
                      <div className="flex shrink-0 items-center gap-1">
                        <ItemAvailabilityButton itemId={item.id} available={item.is_available} />
                        <Link
                          href={`/panel/menu/items/${item.id}`}
                          className="inline-flex h-9 items-center justify-center rounded-xl px-3 text-sm font-medium hover:bg-muted"
                        >
                          Edit
                        </Link>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        );
      })}
    </>
  );
}
