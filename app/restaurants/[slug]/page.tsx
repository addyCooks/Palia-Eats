import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getFavouriteState } from "@/lib/queries/favourites";
import { getActiveRestaurants, getPublicMenu, getRestaurantBySlug } from "@/lib/queries/public";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { LiveUpdates } from "@/components/LiveUpdates";
import { ClosedScreen } from "@/components/restaurant/ClosedScreen";
import { Storefront } from "@/components/storefronts/Storefront";

export async function generateMetadata({
  params,
}: PageProps<"/restaurants/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) return { title: "Restaurant not found" };

  const description =
    restaurant.tagline ?? restaurant.description ?? `Order online from ${restaurant.name}.`;

  return {
    title: restaurant.name,
    description,
    openGraph: {
      title: restaurant.name,
      description,
      images: restaurant.cover_url ? [restaurant.cover_url] : undefined,
    },
  };
}

export default async function RestaurantPage({ params, searchParams }: PageProps<"/restaurants/[slug]">) {
  const { slug } = await params;
  const { menu } = await searchParams;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  // Not taking orders: the closed screen first (v2 8f), unless they chose to see the menu.
  const status = getRestaurantStatus(restaurant);
  if (!status.canOrder && menu !== "1") {
    const openElsewhere = (await getActiveRestaurants()).filter(
      (other) => other.id !== restaurant.id && getRestaurantStatus(other).canOrder,
    ).length;
    return (
      <>
        {/* Opens the menu by itself when the restaurant switches orders back on */}
        <LiveUpdates tables={[{ table: "restaurants", filter: `id=eq.${restaurant.id}` }]} />
        <ClosedScreen restaurant={restaurant} status={status} openElsewhere={openElsewhere} />
      </>
    );
  }

  const [{ categories, items }, favourites] = await Promise.all([
    getPublicMenu(restaurant.id),
    getFavouriteState(restaurant.id),
  ]);

  return (
    <>
      {/* Instant updates for EVERY storefront design: when the restaurant opens, closes
          or marks a dish sold out, this page changes immediately. */}
      <LiveUpdates
        tables={[
          { table: "restaurants", filter: `id=eq.${restaurant.id}` },
          { table: "menu_items", filter: `restaurant_id=eq.${restaurant.id}` },
        ]}
      />
      <Storefront restaurant={restaurant} categories={categories} items={items} favourites={favourites} />
    </>
  );
}
