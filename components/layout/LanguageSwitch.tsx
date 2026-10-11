"use client";

import { useTransition } from "react";
import { Languages } from "lucide-react";
import { setLanguage } from "@/lib/actions/language";
import { useLang, useT } from "@/lib/i18n/client";

// English <-> Hindi. Shows the name of the OTHER language ("हिन्दी" while reading English), in
// that language's own letters so anyone can find it.
export function LanguageSwitch({ variant = "pill", className = "" }: { variant?: "pill" | "icon" | "text"; className?: string }) {
  const lang = useLang();
  const t = useT();
  const [pending, startTransition] = useTransition();
  const next = lang === "hi" ? "en" : "hi";

  const base = pending ? "opacity-60" : "";
  const shared = {
    type: "button" as const,
    lang: next,
    disabled: pending,
    "aria-label": t("lang.switch_label"),
    title: t("lang.switch_to"),
    onClick: () => startTransition(() => setLanguage(next)),
  };

  if (variant === "icon") {
    return (
      <button
        {...shared}
        className={`${base} inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted ${className}`}
      >
        <Languages className="size-5" aria-hidden />
      </button>
    );
  }

  if (variant === "text") {
    return (
      <button {...shared} className={`${base} text-left font-semibold text-accent hover:underline ${className}`}>
        {t("lang.switch_to")}
      </button>
    );
  }

  return (
    <button
      {...shared}
      className={`${base} inline-flex h-9 items-center gap-1.5 rounded-full border border-border px-3 text-[13px] font-semibold text-foreground transition-colors hover:bg-muted ${className}`}
    >
      <Languages className="size-4 text-accent" aria-hidden />
      {t("lang.switch_to")}
    </button>
  );
}
