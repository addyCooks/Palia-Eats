import { en, type MessageKey } from "./en";
import { hi } from "./hi";
import { interpolate } from "./interpolate";

export type { MessageKey };
export type Lang = "en" | "hi";
export type T = (key: MessageKey, vars?: Record<string, string | number>) => string;

export const LANG_COOKIE = "pe-lang";
export const LANGS: Lang[] = ["en", "hi"];

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "hi";
}

// Returns a translate function for one language. A line missing in Hindi falls back to English.
export function makeT(lang: Lang): T {
  const table: Record<string, string> = lang === "hi" ? hi : en;
  return (key, vars) => interpolate(table[key] || en[key] || key, vars);
}
