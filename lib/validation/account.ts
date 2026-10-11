import type { T } from "@/lib/i18n/messages";
import { say } from "@/lib/i18n/say";

type Result<D> = { ok: true; data: D } | { ok: false; error: string };

export type ProfileInput = {
  full_name: string;
  phone: string | null;
  whatsapp_opt_in: boolean;
};

export type AddressInput = {
  label: string;
  address_line: string;
  landmark: string | null;
  phone: string | null;
  is_default: boolean;
  latitude: number | null;
  longitude: number | null;
};

function text(formData: FormData, key: string): string | null {
  const value = String(formData.get(key) ?? "").trim();
  return value === "" ? null : value;
}

// Accepts "98765 43210", "+91 98765-43210", "919876543210" ... and returns the
// 10-digit mobile number, or null if it isn't a valid Indian mobile number.
export function normalizePhone(raw: string): string | null {
  let digits = raw.replace(/[\s\-()]/g, "");
  if (digits.startsWith("+91") && digits.length === 13) digits = digits.slice(3);
  else if (digits.startsWith("91") && digits.length === 12) digits = digits.slice(2);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

const phoneError = (t?: T) => say(t, "val.phone", "Enter a valid 10-digit mobile number.");

export function parseProfileForm(formData: FormData, t?: T): Result<ProfileInput> {
  const fullName = text(formData, "full_name");
  if (!fullName) return { ok: false, error: say(t, "val.name", "Please enter your name.") };
  if (fullName.length > 80) return { ok: false, error: say(t, "val.name_long", "That name is too long.") };

  const rawPhone = text(formData, "phone");
  let phone: string | null = null;
  if (rawPhone) {
    phone = normalizePhone(rawPhone);
    if (!phone) return { ok: false, error: phoneError(t) };
  }

  const optIn = formData.get("whatsapp_opt_in") === "on";
  if (optIn && !phone) {
    return { ok: false, error: say(t, "val.wa_phone", "Add your mobile number to get WhatsApp updates.") };
  }

  return { ok: true, data: { full_name: fullName, phone, whatsapp_opt_in: optIn } };
}

export function parseAddressForm(formData: FormData, t?: T): Result<AddressInput> {
  const label = text(formData, "label");
  if (!label) return { ok: false, error: say(t, "val.addr_label", "Give this address a name, like Home or Work.") };
  if (label.length > 30) return { ok: false, error: say(t, "val.addr_label_long", "The address name is too long.") };

  const addressLine = text(formData, "address_line");
  if (!addressLine) return { ok: false, error: say(t, "val.address", "Please enter the full address.") };
  if (addressLine.length > 300) return { ok: false, error: say(t, "val.addr_long", "The address is too long.") };

  const landmark = text(formData, "landmark");
  if (landmark && landmark.length > 100) return { ok: false, error: say(t, "val.landmark_long", "The landmark is too long.") };

  const rawPhone = text(formData, "phone");
  let phone: string | null = null;
  if (rawPhone) {
    phone = normalizePhone(rawPhone);
    if (!phone) return { ok: false, error: phoneError(t) };
  }

  const pin = parsePin(formData);

  return {
    ok: true,
    data: {
      label,
      address_line: addressLine,
      landmark,
      phone,
      is_default: formData.get("is_default") === "on",
      latitude: pin?.latitude ?? null,
      longitude: pin?.longitude ?? null,
    },
  };
}

// The optional "use my current location" pin. Anything odd is simply dropped (the pin
// is a helper for the rider, never required).
function parsePin(formData: FormData): { latitude: number; longitude: number } | null {
  const lat = Number(text(formData, "latitude") ?? NaN);
  const lng = Number(text(formData, "longitude") ?? NaN);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return null;
  // About 10 cm is plenty: keep 6 decimals.
  return { latitude: Math.round(lat * 1e6) / 1e6, longitude: Math.round(lng * 1e6) / 1e6 };
}
