import { normalizePhone } from "@/lib/validation/account";

// WhatsApp identifies people by number with country code and no "+": "919876543210".

// A customer's 10-digit Indian mobile -> WhatsApp number.
export function toWhatsAppNumber(rawPhone: string | null | undefined): string | null {
  if (!rawPhone) return null;
  const national = normalizePhone(rawPhone);
  return national ? `91${national}` : null;
}

// WhatsApp number -> 10-digit Indian mobile (null for numbers from other countries).
export function toNationalNumber(waId: string): string | null {
  return waId.length === 12 && waId.startsWith("91") ? normalizePhone(waId) : null;
}
