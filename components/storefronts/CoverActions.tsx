"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { ChevronLeft, Share2, ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/useCart";
import { useT } from "@/lib/i18n/client";

const circle =
  "relative flex size-10 items-center justify-center rounded-full bg-white text-[#1F1B16] shadow-md transition-transform active:scale-95";

// The round buttons floating on a storefront's cover photo: back, share, extras passed
// in (the favourite heart), cart.
export function CoverActions({ name, children }: { name: string; children?: ReactNode }) {
  const t = useT();
  const { count } = useCart();
  const [note, setNote] = useState<string | null>(null);

  async function share() {
    const url = window.location.href;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: name, text: t("cover.share_text", { name }), url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setNote(t("cover.link_copied"));
      window.setTimeout(() => setNote(null), 2000);
    } catch {
      // The share sheet was closed: nothing to do.
    }
  }

  return (
    <div className="absolute inset-x-0 top-0 z-10 flex items-start justify-between p-4">
      <Link href="/" className={circle} aria-label={t("cover.back")}>
        <ChevronLeft className="size-5" aria-hidden />
      </Link>
      <div className="flex items-center gap-2">
        {note && (
          <span role="status" className="rounded-full bg-black/70 px-3 py-1.5 text-xs font-semibold text-white">
            {note}
          </span>
        )}
        <button type="button" onClick={share} className={circle} aria-label={t("cover.share")}>
          <Share2 className="size-[18px]" aria-hidden />
        </button>
        {children}
        <Link href="/cart" data-cart-target className={circle} aria-label={count > 0 ? t("cover.cart_items", { n: count }) : t("nav.cart")}>
          <ShoppingBag className="size-[18px]" aria-hidden />
          {count > 0 && (
            <span key={count} className="anim-bump absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-md bg-brand px-1 text-[11px] font-bold text-on-brand">
              {count}
            </span>
          )}
        </Link>
      </div>
    </div>
  );
}
