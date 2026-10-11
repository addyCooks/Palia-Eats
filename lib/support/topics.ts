// What a help request can be about. Pure (no imports) so it can be tested on its own.
// The person picks a code; what we save (and the admin reads) is the English label.

export const CUSTOMER_TOPICS = [
  { code: "order_problem", label: "Problem with an order" },
  { code: "payment", label: "Payment or prices" },
  { code: "restaurant", label: "About a restaurant" },
  { code: "account", label: "My account or login" },
  { code: "suggestion", label: "A suggestion" },
  { code: "other", label: "Something else" },
] as const;

export const PANEL_TOPICS = [
  { code: "orders", label: "Restaurant panel: orders" },
  { code: "menu", label: "Restaurant panel: menu or prices" },
  { code: "hours", label: "Restaurant panel: opening hours" },
  { code: "emails", label: "Restaurant panel: emails or alerts" },
  { code: "other", label: "Restaurant panel: something else" },
] as const;

export type CustomerTopicCode = (typeof CUSTOMER_TOPICS)[number]["code"];

export function customerTopicLabel(code: string): string | null {
  return CUSTOMER_TOPICS.find((topic) => topic.code === code)?.label ?? null;
}

export function panelTopicLabel(code: string): string | null {
  return PANEL_TOPICS.find((topic) => topic.code === code)?.label ?? null;
}

export type SupportStatus = "open" | "answered" | "closed";
export const SUPPORT_STATUSES: SupportStatus[] = ["open", "answered", "closed"];
