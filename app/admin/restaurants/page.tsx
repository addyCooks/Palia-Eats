import type { Metadata } from "next";
import Link from "next/link";
import { getAdminRestaurants } from "@/lib/queries/restaurants";
import { formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Restaurants" };

export default async function AdminRestaurantsPage() {
  const restaurants = await getAdminRestaurants();

  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Restaurants</h1>
        <Link
          href="/admin/restaurants/new"
          className="rounded-xl bg-brand px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Add restaurant
        </Link>
      </div>

      {restaurants.length === 0 ? (
        <p className="mt-6 text-stone-600">No restaurants yet. Add your first one.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-3">
          {restaurants.map((restaurant) => (
            <li key={restaurant.id}>
              <Link href={`/admin/restaurants/${restaurant.id}`}>
                <Card className="flex flex-col gap-2 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold">{restaurant.name}</p>
                    <p className="text-sm text-stone-500">/restaurants/{restaurant.slug}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-stone-600">
                      Delivery {formatPrice(restaurant.delivery_fee)}
                    </span>
                    {!restaurant.restaurant_private?.notification_email && (
                      <Badge tone="danger">No order email set</Badge>
                    )}
                    <Badge tone={restaurant.is_active ? "success" : "danger"}>
                      {restaurant.is_active ? "Visible" : "Hidden"}
                    </Badge>
                    <Badge tone={restaurant.is_accepting_orders ? "success" : "warning"}>
                      {restaurant.is_accepting_orders ? "Accepting orders" : "Orders paused"}
                    </Badge>
                  </div>
                </Card>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
