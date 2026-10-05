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
};

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
  if (!Number.isFinite(price) || price < 0) {
    return { ok: false, error: "Price must be a valid amount, like 199 or 99.50." };
  }

  const order = sortOrder(formData);
  if (order === null) return { ok: false, error: "Order must be a whole number." };

  const imageUrl = text(formData, "image_url");
  if (imageUrl && !isOwnImageUrl(imageUrl)) {
    return { ok: false, error: "Invalid image. Please upload it again." };
  }

  return {
    ok: true,
    data: {
      category_id: categoryId,
      name,
      description: text(formData, "description"),
      price: Math.round(price * 100) / 100,
      image_url: imageUrl,
      is_veg: formData.get("is_veg") === "on",
      is_available: formData.get("is_available") === "on",
      sort_order: order,
    },
  };
}
