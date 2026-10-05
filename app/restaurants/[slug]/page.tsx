import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicMenu, getRestaurantBySlug } from "@/lib/queries/public";
import { LiveUpdates } from "@/components/LiveUpdates";
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

export default async function RestaurantPage({ params }: PageProps<"/restaurants/[slug]">) {
  const { slug } = await params;

  const restaurant = await getRestaurantBySlug(slug);
  if (!restaurant) notFound();

  const { categories, items } = await getPublicMenu(restaurant.id);

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
      <Storefront restaurant={restaurant} categories={categories} items={items} />
    </>
  );
}
