"use server";

import { cookies } from "next/headers";
import { LANG_COOKIE, isLang } from "@/lib/i18n/messages";

// Remembers the visitor's language for a year. Setting a cookie in a server action makes
// Next.js re-draw the current page, so the switch is instant.
export async function setLanguage(lang: string): Promise<void> {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    httpOnly: false,
  });
}
