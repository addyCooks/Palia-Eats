import type { T } from "@/lib/i18n/messages";

// The support hours default to "10 AM to 10 PM". When that default is in use it is shown in the
// reader's language; a custom value set in NEXT_PUBLIC_SUPPORT_HOURS is shown exactly as typed.
export function localHours(t: T, hours: string): string {
  return hours === "10 AM to 10 PM" ? t("support.hours_default") : hours;
}
