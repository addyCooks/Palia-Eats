"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { makeT, type Lang, type T } from "@/lib/i18n/messages";

type I18n = { lang: Lang; t: T };

const I18nContext = createContext<I18n>({ lang: "en", t: makeT("en") });

// Mounted once in app/layout.tsx. The language is chosen on the server (from the cookie), so
// the first paint is already in the right language.
export function I18nProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  const value = useMemo<I18n>(() => ({ lang, t: makeT(lang) }), [lang]);
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

// In a client component:  const t = useT();  ...  {t("cart.empty")}
export function useT(): T {
  return useContext(I18nContext).t;
}

export function useLang(): Lang {
  return useContext(I18nContext).lang;
}
