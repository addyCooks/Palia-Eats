import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminRestaurant } from "@/lib/queries/restaurants";
import { isUuid } from "@/lib/validation/menu";
import { RestaurantForm } from "@/components/admin/RestaurantForm";
import { PanelKeyCard } from "@/components/admin/PanelKeyCard";
import { ShareCard } from "@/components/restaurant/ShareCard";
import { PageHeader } from "@/components/ui/page";

export const metadata: Metadata = { title: "Edit restaurant" };

export default async function EditRestaurantPage({ params }: PageProps<"/admin/restaurants/[id]/edit">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();

  const restaurant = await getAdminRestaurant(id);
  if (!restaurant) notFound();

  return (
    <>
      <PageHeader
        crumb={
          <>
            <Link href="/admin/restaurants" className="hover:underline">
              Restaurants
            </Link>{" "}
            ›{" "}
            <Link href={`/admin/restaurants/${id}`} className="hover:underline">
              {restaurant.name}
            </Link>{" "}
            › Edit
          </>
        }
        title="Edit details"
      />
      <div className="grid items-start gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <RestaurantForm restaurant={restaurant} />
        <div className="flex flex-col gap-5">
          <PanelKeyCard
            restaurantId={restaurant.id}
            createdAt={restaurant.restaurant_private?.panel_key_created_at ?? null}
          />
          <ShareCard name={restaurant.name} slug={restaurant.slug} />
        </div>
      </div>
    </>
  );
}
