import "server-only";

// How customers (and restaurants) reach PaliaEats support: order pages, the footer, the About
// page and the restaurant panel.
//
//   SUPPORT_PHONE              the support WhatsApp number (10 digits, or with +91). SERVER ONLY on
//                              purpose: it is never written into a page or sent to the browser.
//                              The "WhatsApp us" buttons point at /support/whatsapp, which sends
//                              people to WhatsApp, so nobody sees the number on screen or in the
//                              page's code. Until it is set, only the email option shows.
//   NEXT_PUBLIC_SUPPORT_EMAIL  defaults to paliaeats@gmail.com
//   NEXT_PUBLIC_SUPPORT_HOURS  defaults to "10 AM to 10 PM"
//
// Not the same as NEXT_PUBLIC_WHATSAPP_NUMBER, which belongs to the ordering bot.

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL?.trim() || "paliaeats@gmail.com";
export const SUPPORT_HOURS = process.env.NEXT_PUBLIC_SUPPORT_HOURS?.trim() || "10 AM to 10 PM";

export type SupportContext = {
  orderNumber?: number | null;
  restaurantName?: string | null;
  // A restaurant asking about its orders panel (not a customer asking about an order)
  panel?: boolean;
};

// Digits with the country code ("918318634088"), or null when no usable number is set.
function phoneDigits(): string | null {
  let digits = (process.env.SUPPORT_PHONE ?? "").replace(/\D/g, "");
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 11 && digits.length <= 15 ? digits : null;
}

// A restaurant name that is safe to put in a link and a message (links can be crafted by anyone).
export function cleanName(raw: string | null | undefined): string {
  return (raw ?? "").replace(/[^\p{L}\p{N} '&.-]/gu, "").replace(/\s+/g, " ").trim().slice(0, 50);
}

export function supportMessage(context: SupportContext = {}): string {
  const name = cleanName(context.restaurantName);
  if (context.panel) {
    return name
      ? `Hi PaliaEats, I'm from ${name} and I need help with my restaurant panel.`
      : "Hi PaliaEats, I run a restaurant on PaliaEats and I need help with my panel.";
  }
  if (context.orderNumber) {
    return `Hi PaliaEats, I need help with order #${context.orderNumber}${name ? ` from ${name}` : ""}.`;
  }
  return "Hi PaliaEats, I need some help.";
}

function supportSubject(context: SupportContext): string {
  const name = cleanName(context.restaurantName);
  if (context.panel) return `Restaurant panel help${name ? `: ${name}` : ""}`;
  if (context.orderNumber) return `Help with order #${context.orderNumber}${name ? ` from ${name}` : ""}`;
  return "Help with PaliaEats";
}

// What our own redirect page needs to know (never the phone number).
function redirectQuery(context: SupportContext): string {
  const params = new URLSearchParams();
  if (context.panel) params.set("for", "panel");
  if (context.orderNumber) params.set("order", String(context.orderNumber));
  const name = cleanName(context.restaurantName);
  if (name) params.set("restaurant", name);
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function supportLinks(context: SupportContext = {}) {
  const ask = context.panel ? "How can we help?" : "What went wrong:";
  return {
    email: SUPPORT_EMAIL,
    emailHref: `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(supportSubject(context))}&body=${encodeURIComponent(
      `${supportMessage(context)}\n\n${ask}\n`,
    )}`,
    // Our own address, not the number: see /support/whatsapp. Null until a number is set.
    whatsappHref: phoneDigits() ? `/support/whatsapp${redirectQuery(context)}` : null,
    hours: SUPPORT_HOURS,
  };
}

// For /support/whatsapp: turns the link's parameters into the real WhatsApp address.
export function whatsappTarget(params: URLSearchParams): string | null {
  const digits = phoneDigits();
  if (!digits) return null;
  const order = Number(params.get("order") ?? "");
  const orderNumber = Number.isInteger(order) && order > 0 && order < 1_000_000_000 ? order : null;
  const text = supportMessage({
    orderNumber,
    restaurantName: params.get("restaurant"),
    panel: params.get("for") === "panel",
  });
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}
