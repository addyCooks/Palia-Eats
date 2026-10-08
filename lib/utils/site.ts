// The public address of a restaurant's ordering page, built from the site's canonical
// address (NEXT_PUBLIC_SITE_URL, e.g. https://paliaeats.in once the domain is connected).
export function restaurantUrl(slug: string): string {
  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return `${base}/restaurants/${slug}`;
}

// A WhatsApp link that opens a chat with PaliaEats and sends "order <slug>", which makes the
// bot open that restaurant's menu. Needs NEXT_PUBLIC_WHATSAPP_NUMBER (digits, with country
// code, e.g. 919876543210). Returns null until that is set.
export function restaurantWhatsAppUrl(slug: string): string | null {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  if (number.length < 8) return null;
  return `https://wa.me/${number}?text=${encodeURIComponent(`order ${slug}`)}`;
}

// A WhatsApp link that opens a chat with PaliaEats ("hi"), or null until
// NEXT_PUBLIC_WHATSAPP_NUMBER is set.
export function whatsAppChatUrl(): string | null {
  const number = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  return number.length >= 8 ? `https://wa.me/${number}?text=${encodeURIComponent("hi")}` : null;
}
