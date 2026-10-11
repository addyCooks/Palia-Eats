// Structured data ("JSON-LD") that tells Google what a page is: a restaurant, its menu, its hours.
// Pure (no imports) so it can be tested on its own. Only facts that are already on the page go in:
// the rating appears only when the website itself shows it (5 or more ratings).

type RestaurantFacts = {
  name: string;
  tagline: string | null;
  description: string | null;
  cuisine_tags: string[];
  phone: string | null;
  address_text: string | null;
  area: string | null;
  logo_url: string | null;
  cover_url: string | null;
  opening_time: string | null;
  closing_time: string | null;
  closed_days: number[]; // 0 = Sunday ... 6 = Saturday
};

type CategoryFacts = { id: string; name: string };
type DishFacts = { name: string; description: string | null; price: number; is_veg: boolean; is_available: boolean; category_id: string | null };

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function hhmm(time: string | null, fallback: string): string {
  return time ? time.slice(0, 5) : fallback;
}

export function restaurantJsonLd(input: {
  url: string;
  restaurant: RestaurantFacts;
  rating: { avg: string; count: number } | null;
  categories?: CategoryFacts[];
  dishes?: DishFacts[];
}) {
  const { url, restaurant, rating } = input;
  const openDays = DAY_NAMES.filter((_, index) => !restaurant.closed_days.includes(index));
  const images = [restaurant.cover_url, restaurant.logo_url].filter((value): value is string => Boolean(value));

  const sections = (input.categories ?? [])
    .map((category) => ({
      "@type": "MenuSection",
      name: category.name,
      hasMenuItem: (input.dishes ?? [])
        .filter((dish) => dish.is_available && dish.category_id === category.id)
        .map((dish) => ({
          "@type": "MenuItem",
          name: dish.name,
          ...(dish.description ? { description: dish.description } : {}),
          ...(dish.is_veg ? { suitableForDiet: "https://schema.org/VegetarianDiet" } : {}),
          offers: { "@type": "Offer", price: dish.price.toFixed(2), priceCurrency: "INR" },
        })),
    }))
    .filter((section) => section.hasMenuItem.length > 0);

  return {
    "@context": "https://schema.org",
    "@type": "Restaurant",
    "@id": url,
    url,
    name: restaurant.name,
    ...(restaurant.tagline || restaurant.description ? { description: restaurant.tagline ?? restaurant.description } : {}),
    ...(images.length ? { image: images } : {}),
    ...(restaurant.cuisine_tags.length ? { servesCuisine: restaurant.cuisine_tags } : {}),
    ...(restaurant.phone ? { telephone: restaurant.phone } : {}),
    address: {
      "@type": "PostalAddress",
      ...(restaurant.address_text ? { streetAddress: restaurant.address_text } : {}),
      addressLocality: restaurant.area ?? "Palia",
      addressRegion: "Uttar Pradesh",
      addressCountry: "IN",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: openDays,
        opens: hhmm(restaurant.opening_time, "00:00"),
        closes: hhmm(restaurant.closing_time, "23:59"),
      },
    ],
    ...(rating ? { aggregateRating: { "@type": "AggregateRating", ratingValue: rating.avg, ratingCount: rating.count, bestRating: "5", worstRating: "1" } } : {}),
    ...(sections.length ? { hasMenu: { "@type": "Menu", hasMenuSection: sections } } : {}),
    potentialAction: {
      "@type": "OrderAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: url,
        actionPlatform: ["https://schema.org/DesktopWebPlatform", "https://schema.org/MobileWebPlatform"],
      },
      deliveryMethod: "http://purl.org/goodrelations/v1#DeliveryModeOwnFleet",
    },
  };
}

// The site itself: who we are, and how to search it.
export function siteJsonLd(origin: string) {
  return [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: "PaliaEats",
      url: origin,
      logo: `${origin}/brand/paliaeats-logo.png`,
      description: "Palia's own food app: order from local restaurants and pay cash or UPI at your door.",
      areaServed: { "@type": "City", name: "Palia", containedInPlace: { "@type": "AdministrativeArea", name: "Uttar Pradesh, India" } },
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "PaliaEats",
      url: origin,
      potentialAction: {
        "@type": "SearchAction",
        target: { "@type": "EntryPoint", urlTemplate: `${origin}/search?q={search_term_string}` },
        "query-input": "required name=search_term_string",
      },
    },
  ];
}
