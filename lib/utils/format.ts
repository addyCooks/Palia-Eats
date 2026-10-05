// Prices are stored in the database as numeric(10,2), e.g. 10.99.
// Supabase returns numeric columns as JS numbers, so we format them for display.
const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  minimumFractionDigits: 2,
});

export function formatPrice(amount: number): string {
  return inr.format(amount);
}

// "5 Oct 2026, 1:42 pm" in Indian time, whatever time zone the server runs in.
export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(iso));
}

// Turns "Brown Pizza & Co." into "brown-pizza-co" (used for restaurant URLs).
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
