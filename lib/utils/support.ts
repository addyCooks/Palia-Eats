// How customers reach PaliaEats support (order pages, the footer, the About page).
//
//   NEXT_PUBLIC_SUPPORT_EMAIL  defaults to paliaeats@gmail.com
//   NEXT_PUBLIC_SUPPORT_PHONE  a phone / WhatsApp number (10 digits, or with +91). Until it is set,
//                              only the email option shows; with it, "WhatsApp us" and "Call us" appear.
//   NEXT_PUBLIC_SUPPORT_HOURS  optional, e.g. "10 AM to 10 PM" ("We reply 10 AM to 10 PM")
//
// These are public by nature (they are shown to every customer), so none of them is a secret.
// Not the same as NEXT_PUBLIC_WHATSAPP_NUMBER, which belongs to the ordering bot.

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "paliaeats@gmail.com";

export type SupportContext = { orderNumber?: number; restaurantName?: string | null };

// Digits with the country code ("919876543210"), or null when no usable number is set.
function supportDigits(): string | null {
  let digits = (process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

function prettyPhone(digits: string): string {
  return digits.length === 12 && digits.startsWith("91")
    ? `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
    : `+${digits}`;
}

export function supportLinks(context: SupportContext = {}) {
  const digits = supportDigits();
  const about = context.orderNumber
    ? `order #${context.orderNumber}${context.restaurantName ? ` from ${context.restaurantName}` : ""}`
    : null;
  const message = about ? `Hi PaliaEats, I need help with ${about}.` : "Hi PaliaEats, I need some help.";
  const subject = about ? `Help with ${about}` : "Help with PaliaEats";

  return {
    email: SUPPORT_EMAIL,
    emailHref: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(`${message}\n\nWhat went wrong:\n`)}`,
    whatsappHref: digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null,
    callHref: digits ? `tel:+${digits}` : null,
    phoneDisplay: digits ? prettyPhone(digits) : null,
    hours: process.env.NEXT_PUBLIC_SUPPORT_HOURS?.trim() || null,
  };
}
