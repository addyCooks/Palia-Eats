import { customerTopicLabel, panelTopicLabel } from "@/lib/support/topics";

// Reads and checks the help form. Messages for the person are returned as translation keys
// (the caller translates them), so Hindi readers get Hindi errors.
export type HelpInput = {
  topic: string; // the English label
  message: string;
  orderNumber: number | null;
  name: string | null;
  email: string | null;
  phone: string | null;
};

export type HelpParse = { ok: true; data: HelpInput } | { ok: false; errorKey: HelpErrorKey };
export type HelpErrorKey = "help.err.topic" | "help.err.message" | "help.err.name" | "help.err.contact" | "help.err.order";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value: FormDataEntryValue | null, max: number): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function parseHelpForm(formData: FormData, who: "customer" | "restaurant"): HelpParse {
  const topic = (who === "customer" ? customerTopicLabel : panelTopicLabel)(clean(formData.get("topic"), 30));
  if (!topic) return { ok: false, errorKey: "help.err.topic" };

  // Keep the person's line breaks in the message itself.
  const message = String(formData.get("message") ?? "").replace(/\r\n/g, "\n").trim().slice(0, 1000);
  if (message.length < 5) return { ok: false, errorKey: "help.err.message" };

  const rawOrder = clean(formData.get("order"), 12).replace(/^#/, "");
  let orderNumber: number | null = null;
  if (rawOrder) {
    if (!/^\d{4,9}$/.test(rawOrder)) return { ok: false, errorKey: "help.err.order" };
    orderNumber = Number(rawOrder);
  }

  const name = clean(formData.get("name"), 80) || null;
  const email = clean(formData.get("email"), 120).toLowerCase() || null;
  const phone = clean(formData.get("phone"), 20).replace(/\D/g, "").replace(/^91(?=\d{10}$)/, "") || null;

  if (email && !EMAIL_PATTERN.test(email)) return { ok: false, errorKey: "help.err.contact" };
  if (phone && !/^[6-9]\d{9}$/.test(phone)) return { ok: false, errorKey: "help.err.contact" };

  return { ok: true, data: { topic, message, orderNumber, name, email, phone } };
}
