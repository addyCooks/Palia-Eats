import { slugify } from "@/lib/utils/format";
import { isOwnImageUrl } from "@/lib/validation/menu";

export type RestaurantInput = {
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  about: string | null;
  cuisine_tags: string[];
  phone: string | null;
  address_text: string | null;
  opening_time: string | null;
  closing_time: string | null;
  min_order_amount: number;
  delivery_fee: number;
  brand: string;
  brandDark: string;
  template_key: string | null;
  logo_url: string | null;
  cover_url: string | null;
  notification_email: string | null;
  notification_phone: string | null;
  is_active: boolean;
  is_accepting_orders: boolean;
};

type ParseResult =
  | { ok: true; data: RestaurantInput }
  | { ok: false; error: string };

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

function money(formData: FormData, key: string): number | null {
  const raw = String(formData.get(key) ?? "").trim();
  if (raw === "") return 0;
  const value = Number(raw);
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100) / 100; // keep 2 decimal places
}

// Reads the admin's restaurant form and checks every field.
export function parseRestaurantForm(formData: FormData): ParseResult {
  const name = text(formData, "name");
  if (!name) return { ok: false, error: "Restaurant name is required." };

  const slug = text(formData, "slug") ?? slugify(name);
  if (!SLUG_PATTERN.test(slug)) {
    return {
      ok: false,
      error: "Web address can only use lowercase letters, numbers and dashes.",
    };
  }

  const minOrder = money(formData, "min_order_amount");
  const deliveryFee = money(formData, "delivery_fee");
  if (minOrder === null || deliveryFee === null) {
    return {
      ok: false,
      error: "Minimum order and delivery fee must be valid amounts, like 30 or 49.50.",
    };
  }

  const brand = text(formData, "brand") ?? "#ea580c";
  const brandDark = text(formData, "brandDark") ?? brand;
  if (!COLOR_PATTERN.test(brand) || !COLOR_PATTERN.test(brandDark)) {
    return { ok: false, error: "Brand colors must be valid colors." };
  }

  const notificationEmail = text(formData, "notification_email");
  if (notificationEmail && !EMAIL_PATTERN.test(notificationEmail)) {
    return { ok: false, error: "The notification email doesn't look right." };
  }

  const logoUrl = text(formData, "logo_url");
  const coverUrl = text(formData, "cover_url");
  if ((logoUrl && !isOwnImageUrl(logoUrl)) || (coverUrl && !isOwnImageUrl(coverUrl))) {
    return { ok: false, error: "Invalid image. Please upload it again." };
  }

  const cuisineTags = String(formData.get("cuisine_tags") ?? "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  return {
    ok: true,
    data: {
      name,
      slug,
      tagline: text(formData, "tagline"),
      description: text(formData, "description"),
      about: text(formData, "about"),
      cuisine_tags: cuisineTags,
      phone: text(formData, "phone"),
      address_text: text(formData, "address_text"),
      opening_time: text(formData, "opening_time"),
      closing_time: text(formData, "closing_time"),
      min_order_amount: minOrder,
      delivery_fee: deliveryFee,
      brand,
      brandDark,
      template_key: text(formData, "template_key"),
      logo_url: logoUrl,
      cover_url: coverUrl,
      notification_email: notificationEmail,
      notification_phone: text(formData, "notification_phone"),
      is_active: formData.get("is_active") === "on",
      is_accepting_orders: formData.get("is_accepting_orders") === "on",
    },
  };
}
