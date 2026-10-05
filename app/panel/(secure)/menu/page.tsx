import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getPanelMenu } from "@/lib/queries/panel";
import { formatPrice } from "@/lib/utils/format";
import { VegMark } from "@/components/menu/VegMark";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { ItemAvailabilityButton } from "@/components/panel/ItemAvailabilityButton";

export default async function PanelMenuPage() {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const { categories, items } = await getPanelMenu(restaurant.id);

  return (
    <>
      <div>
        <h1 className="text-xl font-bold">Menu availability</h1>
        <p className="text-sm text-stone-600">
          Out of something? Mark it sold out and customers can&apos;t order it. To change prices or
          add dishes, contact PaliaEats.
        </p>
      </div>

      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category_id === category.id);
        if (categoryItems.length === 0) return null;
        return (
          <section key={category.id} className="flex flex-col gap-3">
            <h2 className="text-lg font-bold">{category.name}</h2>
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
                    <ItemAvailabilityButton itemId={item.id} available={item.is_available} />
                  </Card>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </>
  );
}
