"use client";

import { useT } from "@/lib/i18n/client";

// Read-only star rating, e.g. ★★★★☆ for 4.
export function Stars({ value, size = "md" }: { value: number; size?: "sm" | "md" }) {
  const t = useT();
  const rounded = Math.round(value);
  return (
    <span
      role="img"
      aria-label={t("stars.aria", { n: value })}
      className={`inline-flex gap-0.5 ${size === "sm" ? "text-sm" : "text-xl"} leading-none`}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} aria-hidden className={n <= rounded ? "text-brand" : "text-stone-300"}>
          ★
        </span>
      ))}
    </span>
  );
}
