"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/components/cart/useCart";

// The dark "My cart" button with a saffron count (v2 nav). `compact` is the 44px square
// version for phones.
export function CartButton({ compact = false }: { compact?: boolean }) {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `My cart, ${count} items` : "My cart"}
      className={`relative flex items-center justify-center gap-2 bg-[#16120D] text-[13px] font-semibold text-white shadow-[0_8px_20px_rgba(0,0,0,.18)] transition-colors hover:bg-black dark:bg-[#2A241C] ${
        compact ? "size-11 rounded-xl" : "h-[42px] rounded-[10px] px-[18px]"
      }`}
    >
      <ShoppingBag className="size-4 text-brand" aria-hidden />
      {!compact && "My cart"}
      {count > 0 && (
        <span className="absolute -right-2 -top-2 grid h-5 min-w-5 place-items-center rounded-md bg-brand px-1 text-[11px] font-bold text-on-brand">
          {count}
        </span>
      )}
    </Link>
  );
}
