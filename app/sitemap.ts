import type { MetadataRoute } from "next";
import { getActiveRestaurants } from "@/lib/queries/public";

const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");

// Lists the homepage, the About page and every visible restaurant so search engines can find them.
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const restaurants = await getActiveRestaurants();

  return [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/about`, changeFrequency: "monthly", priority: 0.5 },
    ...restaurants.map((restaurant) => ({
      url: `${siteUrl}/restaurants/${restaurant.slug}`,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];
}
