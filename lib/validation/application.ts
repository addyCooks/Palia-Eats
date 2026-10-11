import type { T } from "@/lib/i18n/messages";
import { say } from "@/lib/i18n/say";
import { normalizePhone } from "@/lib/validation/account";

// The public "Add your restaurant" form (see 0015_restaurant_applications.sql).

export type ApplicationInput = {
  restaurant_name: string;
  owner_name: string;
  phone: string; // 10-digit mobile
  email: string;
  area: string;
  address: string;
  cuisines: string[];
  opening_time: string | null; // "10:00"
  closing_time: string | null;
  fssai: string | null; // 14 digits
  message: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

function text(formData: FormData, key: string, max: number): string {
  return String(formData.get(key) ?? "").trim().replace(/\s+/g, " ").slice(0, max);
}

export function parseApplicationForm(
  formData: FormData,
  t?: T,
): { ok: true; data: ApplicationInput } | { ok: false; error: string } {
  const restaurant_name = text(formData, "restaurant_name", 80);
  const owner_name = text(formData, "owner_name", 80);
  const phone = normalizePhone(String(formData.get("phone") ?? ""));
  const email = text(formData, "email", 120).toLowerCase();
  const area = text(formData, "area", 60);
  const address = String(formData.get("address") ?? "").trim().slice(0, 300);
  const cuisines = [
    ...new Set(
      String(formData.get("cuisines") ?? "")
        .split(",")
        .map((c) => c.trim().replace(/\s+/g, " ").slice(0, 30))
        .filter(Boolean),
    ),
  ].slice(0, 10);
  const opening = String(formData.get("opening_time") ?? "").trim();
  const closing = String(formData.get("closing_time") ?? "").trim();
  const fssai = String(formData.get("fssai") ?? "").replace(/\s/g, "");
  const message = String(formData.get("message") ?? "").trim().slice(0, 600);

  if (restaurant_name.length < 2) return { ok: false, error: say(t, "val.rest_name", "Please enter the restaurant's name.") };
  if (owner_name.length < 2) return { ok: false, error: say(t, "val.owner_name", "Please enter the owner's name.") };
  if (!phone) return { ok: false, error: say(t, "val.phone", "Enter a valid 10-digit mobile number.") };
  if (!EMAIL_PATTERN.test(email)) return { ok: false, error: say(t, "val.email_panel", "Enter a valid email address. Your panel link is sent there.") };
  if (area.length < 2) return { ok: false, error: say(t, "val.area", "Please enter the area (for example Main Chowk).") };
  if (address.length < 5) return { ok: false, error: say(t, "val.address", "Please enter the full address.") };
  if ((opening && !TIME_PATTERN.test(opening)) || (closing && !TIME_PATTERN.test(closing))) {
    return { ok: false, error: say(t, "val.hours", "Please check the opening hours.") };
  }
  if (fssai && !/^\d{14}$/.test(fssai)) return { ok: false, error: say(t, "val.fssai", "The FSSAI licence number has 14 digits.") };

  return {
    ok: true,
    data: {
      restaurant_name,
      owner_name,
      phone,
      email,
      area,
      address,
      cuisines,
      opening_time: opening || null,
      closing_time: closing || null,
      fssai: fssai || null,
      message: message || null,
    },
  };
}
