"use client";

import Link from "next/link";
import { lineKey, lineName } from "@/lib/cart/cart";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "@/components/cart/useCart";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { useT } from "@/lib/i18n/client";

// "Your cart" card beside the menu on laptops (v2 5b). Phones get the floating cart bar.
export function CartPanel({ restaurantId }: { restaurantId: string }) {
  const t = useT();
  const { cart, count, subtotal, total, changeQuantity } = useCart();
  const mine = count > 0 && cart.restaurant?.id === restaurantId;

  return (
    <aside className="flex flex-col gap-4 rounded-[20px] bg-surface p-[22px] shadow-card">
      <h2 className="font-display text-[26px] leading-none">{t("cart.title")}</h2>
      {!mine ? (
        <p className="text-sm text-stone-500">
          {count > 0 ? t("cart.panel_other", { name: cart.restaurant?.name ?? "" }) : t("cart.panel_empty")}
        </p>
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {cart.items.map((item) => (
              <li key={lineKey(item)} className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="truncate text-sm font-semibold">{lineName(item)}</span>
                  <span className="text-[13px] text-stone-500 tabular-nums">{formatPrice(item.price)}</span>
                </div>
                <QuantityStepper
                  quantity={item.quantity}
                  itemName={lineName(item)}
                  onChange={(next) => changeQuantity(lineKey(item), next)}
                />
              </li>
            ))}
          </ul>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-sm text-stone-600">
            <span>{t("cart.delivery")}</span>
            <span className="tabular-nums">
              {cart.restaurant && cart.restaurant.deliveryFee > 0 ? formatPrice(cart.restaurant.deliveryFee) : t("cart.free")}
            </span>
          </div>
          <div className="flex justify-between text-[17px] font-bold">
            <span>{t("cart.total")}</span>
            <span className="tabular-nums">{formatPrice(total)}</span>
          </div>
          {cart.restaurant && subtotal < cart.restaurant.minOrderAmount && (
            <p className="text-xs text-amber-800">
              {t("cart.min_more", { amount: formatPrice(cart.restaurant.minOrderAmount - subtotal) })}
            </p>
          )}
          <Link
            href="/cart"
            className="flex h-[50px] items-center justify-center gap-2 rounded-xl bg-[#16120D] font-semibold text-white hover:bg-black dark:bg-[#2A241C]"
          >
            {t("cart.checkout")} <span className="text-brand">→</span>
          </Link>
        </>
      )}
    </aside>
  );
}
