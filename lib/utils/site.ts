// The public address of a restaurant's ordering page, built from the site's canonical
// address (NEXT_PUBLIC_SITE_URL, e.g. https://paliaeats.in once the domain is connected).
export function restaurantUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/restaurants/${slug}`;
}
