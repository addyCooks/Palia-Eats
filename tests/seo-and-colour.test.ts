// Tests for the structured data for Google (lib/seo/jsonld.ts) and the readable-text colour maths
// (lib/utils/color.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { restaurantJsonLd, siteJsonLd } from "../lib/seo/jsonld.ts";
import { contrast, readableOnDeep } from "../lib/utils/color.ts";

const restaurant = {
  name: "Brown Pizza",
  tagline: "Wood-fired, Palia style",
  description: null,
  cuisine_tags: ["Pizza", "Italian"],
  phone: "9876543210",
  address_text: "Main Chowk",
  area: "Main Chowk",
  logo_url: null,
  cover_url: "https://example.supabase.co/storage/v1/object/public/covers/brown.jpg",
  opening_time: "11:00:00",
  closing_time: "22:30:00",
  closed_days: [1], // closed on Mondays
};

test("a restaurant's structured data carries what the page shows", () => {
  const data = restaurantJsonLd({ url: "https://www.paliaeats.online/restaurants/brown-pizza", restaurant, rating: null });
  assert.equal(data["@type"], "Restaurant");
  assert.equal(data.name, "Brown Pizza");
  assert.deepEqual(data.servesCuisine, ["Pizza", "Italian"]);
  assert.equal(data.address.addressRegion, "Uttar Pradesh");
  // open every day except the closed one, with the opening hours
  const hours = data.openingHoursSpecification[0];
  assert.deepEqual(hours.dayOfWeek, ["Sunday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
  assert.equal(hours.opens, "11:00");
  assert.equal(hours.closes, "22:30");
});

test("stars are only included when the website itself shows them", () => {
  const without = restaurantJsonLd({ url: "https://x", restaurant, rating: null });
  assert.ok(!("aggregateRating" in without));
  const withStars = restaurantJsonLd({ url: "https://x", restaurant, rating: { avg: "4.6", count: 23 } });
  assert.equal(withStars.aggregateRating?.ratingValue, "4.6");
  assert.equal(withStars.aggregateRating?.ratingCount, 23);
});

test("the menu lists only dishes that are in stock, grouped by category", () => {
  const data = restaurantJsonLd({
    url: "https://x",
    restaurant,
    rating: null,
    categories: [
      { id: "c1", name: "Pizzas" },
      { id: "c2", name: "Empty shelf" },
    ],
    dishes: [
      { name: "Margherita", description: "Classic", price: 249, is_veg: true, is_available: true, category_id: "c1" },
      { name: "Sold out pizza", description: null, price: 399, is_veg: false, is_available: false, category_id: "c1" },
    ],
  });
  const sections = (data.hasMenu as { hasMenuSection: { name: string; hasMenuItem: { name: string; offers: { price: string } }[] }[] }).hasMenuSection;
  assert.equal(sections.length, 1);
  assert.equal(sections[0].name, "Pizzas");
  assert.deepEqual(sections[0].hasMenuItem.map((item) => item.name), ["Margherita"]);
  assert.equal(sections[0].hasMenuItem[0].offers.price, "249.00");
});

test("a restaurant open all day gets whole-day hours", () => {
  const data = restaurantJsonLd({
    url: "https://x",
    restaurant: { ...restaurant, opening_time: null, closing_time: null, closed_days: [] },
    rating: null,
  });
  const hours = data.openingHoursSpecification[0];
  assert.equal(hours.dayOfWeek.length, 7);
  assert.equal(hours.opens, "00:00");
  assert.equal(hours.closes, "23:59");
});

test("the site's own data describes the organisation and the search box", () => {
  const [org, site] = siteJsonLd("https://www.paliaeats.online");
  assert.equal(org["@type"], "Organization");
  assert.equal(site["@type"], "WebSite");
  assert.equal(
    (site as { potentialAction: { target: { urlTemplate: string } } }).potentialAction.target.urlTemplate,
    "https://www.paliaeats.online/search?q={search_term_string}",
  );
});

test("colour contrast follows the web accessibility rules", () => {
  assert.equal(Math.round(contrast("#000000", "#ffffff")), 21);
  assert.equal(contrast("#123456", "#123456"), 1);
});

test("a dark brand colour turns the chip text white; a bright one stays", () => {
  assert.equal(readableOnDeep("#f5a524"), "#f5a524"); // PaliaEats saffron is readable on the dark chip
  assert.equal(readableOnDeep("#7c2d12"), "#ffffff"); // a dark maroon is not
  assert.equal(readableOnDeep("#1e3a8a"), "#ffffff"); // neither is navy
});
