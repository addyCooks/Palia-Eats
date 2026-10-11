import { AUTO_CANCEL_AFTER_MINUTES } from "@/lib/orders/auto-cancel";

// Details used by the Privacy, Terms and Refund pages. EDIT THESE, they are PaliaEats' promises:
// the grievance officer is the person customers can complain to by law (India's Consumer
// Protection (E-Commerce) Rules, 2020 ask for a name, contact and designation).
export const LEGAL = {
  // Shown at the top of each page. Change it whenever you change the wording.
  updated: "11 October 2026",
  officerName: "The PaliaEats founder",
  officerTitle: "Grievance Officer",
  place: "Palia, Uttar Pradesh, India",
  // We acknowledge a complaint within 48 hours and resolve it within one month.
  acknowledgeHours: 48,
  resolveDays: 30,
  // Orders nobody answers are cancelled after this long (set in lib/orders/auto-cancel.ts).
  autoCancelMinutes: AUTO_CANCEL_AFTER_MINUTES,
  // How long after a delivery a customer can report a problem with it.
  reportWithinHours: 24,
} as const;
