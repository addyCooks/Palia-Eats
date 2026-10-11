"use client";

import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/messages";
import { CookingPot, LoadingLine } from "@/components/ui/FoodLoader";

// Shown while a page's data is on its way: a cooking pot with steam. It fills the whole
// space under the top bar, so the footer stays out of sight instead of jumping up.
// Customer pages pass `labelKey` (shown in the reader's language); the admin and the restaurant
// panel pass a plain English `label`.
export function PageLoading({ label, labelKey = "loading.default" }: { label?: string; labelKey?: MessageKey }) {
  const t = useT();
  return (
    <div
      role="status"
      aria-live="polite"
      className="anim-loader flex min-h-[70dvh] flex-1 flex-col items-center justify-center gap-4 py-16"
    >
      <CookingPot className="size-28" />
      <LoadingLine label={label ?? t(labelKey)} />
    </div>
  );
}
