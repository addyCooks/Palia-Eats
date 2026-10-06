export type CategoryInput = {
  name: string;
  sort_order: number;
};

export type MenuItemInput = {
  category_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  is_veg: boolean;
  is_available: boolean;
  sort_order: number;
  is_bestseller: boolean;
  contains_egg: boolean;
  prep_minutes: number | null;
  half_price: number | null;
};

export const MAX_PRICE = 100_000;

type Result<T> = { ok: true; data: T } | { ok: false; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID_PATTERN.test(value);

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

function sortOrder(formData: FormData): number | null {
  const raw = String(formData.get("sort_order") ?? "").trim();
  if (raw === "") return 0;
  const value = Number(raw);
  return Number.isInteger(value) ? value : null;
}

// Only accept images that live in our own Supabase Storage bucket.
export function isOwnImageUrl(url: string): boolean {
  const prefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/restaurant-media/`;
  return url.startsWith(prefix);
}

export function parseCategoryForm(formData: FormData): Result<CategoryInput> {
  const name = text(formData, "name");
  if (!name) return { ok: false, error: "Category name is required." };

  const order = sortOrder(formData);
  if (order === null) return { ok: false, error: "Order must be a whole number." };

  return { ok: true, data: { name, sort_order: order } };
}

export function parseMenuItemForm(formData: FormData): Result<MenuItemInput> {
  const name = text(formData, "name");
  if (!name) return { ok: false, error: "Item name is required." };

  const categoryId = text(formData, "category_id");
  if (!categoryId || !isUuid(categoryId)) {
    return { ok: false, error: "Please choose a category." };
  }

  const price = Number(String(formData.get("price") ?? "").trim());
  if (String(formData.get("price") ?? "").trim() === "" || !Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Price must be a valid amount, like 199 or 99.50." };
  }
  if (price > MAX_PRICE) return { ok: false, error: "That price looks too high." };

  // Optional half plate: empty = this dish has no half plate.
  const halfRaw = String(formData.get("half_price") ?? "").trim();
  const halfPrice = halfRaw === "" ? null : Number(halfRaw);
  if (halfPrice !== null && (!Number.isFinite(halfPrice) || halfPrice < 0 || halfPrice > MAX_PRICE)) {
    return { ok: false, error: "Half plate price must be a valid amount, or leave it empty." };
  }
  if (halfPrice !== null && halfPrice >= price) {
    return { ok: false, error: "The half plate should cost less than the full plate." };
  }

  // Optional prep time in minutes (1 to 240).
  const prepRaw = String(formData.get("prep_minutes") ?? "").trim();
  const prep = prepRaw === "" ? null : Number(prepRaw);
  if (prep !== null && (!Number.isInteger(prep) || prep < 1 || prep > 240)) {
    return { ok: false, error: "Prep time must be between 1 and 240 minutes, or leave it empty." };
  }

  const order = sortOrder(formData);
  if (order === null) return { ok: false, error: "Order must be a whole number." };

  const imageUrl = text(formData, "image_url");
  if (imageUrl && !isOwnImageUrl(imageUrl)) {
    return { ok: false, error: "Invalid image. Please upload it again." };
  }

  // Diet: veg, non-veg or egg (egg dishes are not veg).
  const diet = String(formData.get("diet") ?? "veg");
  if (!["veg", "nonveg", "egg"].includes(diet)) return { ok: false, error: "Please choose veg, non-veg or egg." };

  return {
    ok: true,
    data: {
      category_id: categoryId,
      name: name.slice(0, 120),
      description: text(formData, "description")?.slice(0, 600) ?? null,
      price: Math.round(price * 100) / 100,
      image_url: imageUrl,
      is_veg: diet === "veg",
      contains_egg: diet === "egg",
      is_available: formData.get("is_available") === "on",
      is_bestseller: formData.get("is_bestseller") === "on",
      prep_minutes: prep,
      half_price: halfPrice === null ? null : Math.round(halfPrice * 100) / 100,
      sort_order: order,
    },
  };
}
