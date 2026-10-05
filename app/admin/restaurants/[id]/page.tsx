import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminRestaurant } from "@/lib/queries/restaurants";
import { RestaurantForm } from "@/components/admin/RestaurantForm";
import { PanelKeyCard } from "@/components/admin/PanelKeyCard";

export const metadata: Metadata = { title: "Edit restaurant" };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function EditRestaurantPage({
  params,
}: PageProps<"/admin/restaurants/[id]">) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) notFound();

  const restaurant = await getAdminRestaurant(id);
  if (!restaurant) notFound();

  return (
    <>
      <Link href="/admin/restaurants" className="text-sm text-stone-500 hover:underline">
        ← All restaurants
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">{restaurant.name}</h1>
      <div className="flex flex-col gap-6">
        <Link
          href={`/admin/restaurants/${restaurant.id}/menu`}
          className="rounded-2xl border border-border bg-surface p-4 font-semibold shadow-sm hover:bg-muted"
        >
          Manage menu →
        </Link>
        <PanelKeyCard
          restaurantId={restaurant.id}
          createdAt={restaurant.restaurant_private?.panel_key_created_at ?? null}
        />
        <RestaurantForm restaurant={restaurant} />
      </div>
    </>
  );
}
