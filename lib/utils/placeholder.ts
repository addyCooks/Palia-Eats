// Stand-in photos (public/placeholders) for dishes and restaurants that don't have their
// own picture yet. A dish gets the closest match by name; anything else gets a steady
// pick (the same dish always shows the same photo).

const PHOTOS = {
  butterChicken: "/placeholders/butter-chicken.jpg",
  wings: "/placeholders/chicken-wings.jpg",
  chinese: "/placeholders/chinese-platter.jpg",
  sweets: "/placeholders/gulab-jamun.jpg",
  pasta: "/placeholders/pasta.jpg",
} as const;

const ALL = Object.values(PHOTOS);

const KEYWORDS: [RegExp, string][] = [
  [/gulab|jamun|rasgull|rasmalai|kheer|halwa|phirni|sweet|dessert|mithai|ladoo|laddu|barfi|jalebi|ice ?cream|kulfi|cake|shake|lassi/i, PHOTOS.sweets],
  [/noodle|chow ?mein|manchurian|momo|chilli|chili|fried rice|hakka|schezwan|szechuan|spring roll|chinese|dim ?sum|thukpa/i, PHOTOS.chinese],
  [/pasta|penne|spaghetti|macaroni|pizza|margherita|farmhouse|pepperoni|cheese|sandwich|burger|garlic bread|fries|wrap|roll/i, PHOTOS.pasta],
  [/drink|cola|soda|juice|coffee|chai|tea|water|mojito|lemonade/i, PHOTOS.sweets],
  [/wing|tikka|tandoor|kebab|kabab|seekh|fry|fried|lollipop|65|grill|bbq|roast|leg|drumstick/i, PHOTOS.wings],
  [/curry|masala|butter|paneer|dal|daal|korma|kadai|kadhai|biryani|pulao|rice|thali|chicken|mutton|egg|naan|roti|paratha|sabzi|kofta|chana|rajma|keema|handi/i, PHOTOS.butterChicken],
];

function hash(text: string): number {
  let h = 0;
  for (let i = 0; i < text.length; i++) h = (h * 31 + text.charCodeAt(i)) >>> 0;
  return h;
}

export function placeholderForDish(name: string, id = ""): string {
  for (const [pattern, photo] of KEYWORDS) {
    if (pattern.test(name)) return photo;
  }
  return ALL[hash(id || name) % ALL.length];
}

export function dishPhoto(item: { image_url: string | null; name: string; id?: string }): string {
  return item.image_url || placeholderForDish(item.name, item.id);
}

type CoverSource = { cover_url: string | null; id: string; name?: string; cuisine_tags?: string[]; tagline?: string | null };

// A restaurant's cover, else a stand-in that suits its name and cuisines (a pizza place
// gets the pasta/pizza photo), else a steady pick.
export function restaurantCover(restaurant: CoverSource): string {
  if (restaurant.cover_url) return restaurant.cover_url;
  const words = [restaurant.name, ...(restaurant.cuisine_tags ?? []), restaurant.tagline].filter(Boolean).join(" ");
  for (const [pattern, photo] of KEYWORDS) {
    if (words && pattern.test(words)) return photo;
  }
  return ALL[hash(restaurant.id) % ALL.length];
}

// Round avatar for a restaurant: its logo, else its cover, else a stand-in photo.
export function restaurantAvatar(restaurant: CoverSource & { logo_url: string | null }): string {
  return restaurant.logo_url || restaurantCover(restaurant);
}

export const isPlaceholder = (src: string) => src.startsWith("/placeholders/");
