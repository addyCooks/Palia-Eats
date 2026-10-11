import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { LANG_COOKIE, isLang, makeT, type Lang, type T } from "@/lib/i18n/messages";

// The visitor's language, from their cookie (English when they never chose).
export const getLang = cache(async (): Promise<Lang> => {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : "en";
});

// In a server component:  const t = await getT();  ...  {t("cart.empty")}
export async function getT(): Promise<T> {
  return makeT(await getLang());
}
