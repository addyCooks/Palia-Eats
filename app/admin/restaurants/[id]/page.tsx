import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminRestaurant } from "@/lib/queries/restaurants";
import { RestaurantForm } from "@/components/admin/RestaurantForm";
import { PanelKeyCard } from "@/components/admin/PanelKeyCard";
import { ShareCard } from "@/components/restaurant/ShareCard";

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
        {!restaurant.restaurant_private?.notification_email && (
          <p role="alert" className="rounded-xl bg-red-50 p-4 text-sm text-red-800">
            <strong>No order email is set.</strong> This restaurant will NOT be told about new orders. Add a
            notification email in the form below.
          </p>
        )}
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
        <ShareCard name={restaurant.name} slug={restaurant.slug} />
        <RestaurantForm restaurant={restaurant} />
      </div>
    </>
  );
}
