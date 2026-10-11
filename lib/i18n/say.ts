import type { MessageKey, T } from "@/lib/i18n/messages";

// Words that are shown in two kinds of places: customer pages (which pass a translator `t` and get
// the reader's language) and the admin, the restaurant panel and the WhatsApp bot (which pass
// nothing and stay in English). `english` is the fallback text.
export function say(t: T | undefined, key: MessageKey, english: string, vars?: Record<string, string | number>): string {
  if (t) return t(key, vars);
  return english.replace(/\{(\w+)\}/g, (whole, name: string) => (vars && name in vars ? String(vars[name]) : whole));
}
