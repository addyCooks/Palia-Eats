import type { T } from "@/lib/i18n/messages";

// Saved addresses are named "Home", "Work" or "Other" (or anything the customer typed). The three
// standard names are stored in English and shown in the reader's language; a name the customer
// typed is shown exactly as typed.
export function addressLabel(label: string, t: T): string {
  if (label === "Home") return t("addr.home");
  if (label === "Work") return t("addr.work");
  if (label === "Other") return t("addr.other");
  return label;
}
