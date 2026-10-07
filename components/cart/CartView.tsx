"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { lineKey, lineName } from "@/lib/cart/cart";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "@/components/cart/useCart";
import { useCartSync } from "@/components/cart/useCartSync";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { VegMark } from "@/components/menu/VegMark";

export function CartView() {
  const { cart, count, subtotal, total, changeQuantity, clearCart } = useCart();
  const { notices, status } = useCartSync();
  const restaurant = cart.restaurant;

  if (!restaurant || count === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-10">
        <ProblemScreen
          glyph={<ShoppingBag className="size-[34px]" strokeWidth={2} />}
          tone="dark"
          title="Hungry? Let's fix that."
          action={
            <Link href="/" className={problemActionClass}>
              Browse restaurants
            </Link>
          }
        >
          Your cart is empty. Your happy bite is just a tap away.
        </ProblemScreen>
        {notices.map((notice) => (
          <p key={notice} className="text-sm text-amber-800">
            {notice}
          </p>
        ))}
      </div>
    );
  }

  const shortfall = restaurant.minOrderAmount - subtotal;
  const belowMinimum = shortfall > 0;
  const closed = status !== null && !status.canOrder;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="font-display text-[38px] leading-none sm:text-[48px]">Your cart</h1>
        <p className="text-[15px] text-stone-600">
          From{" "}
          <Link href={`/restaurants/${restaurant.slug}`} className="font-semibold text-accent hover:underline">
            {restaurant.name}
          </Link>
        </p>
      </div>

      {notices.length > 0 && (
        <div role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          <p className="font-medium">We updated your cart:</p>
          <ul className="mt-1 list-disc pl-5">
            {notices.map((notice) => (
              <li key={notice}>{notice}</li>
            ))}
          </ul>
        </div>
      )}

      {closed && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {status?.label}. You can order when it opens.
        </p>
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <ul className="flex flex-col overflow-hidden rounded-[20px] bg-surface shadow-card">
          {cart.items.map((item) => (
            <li key={lineKey(item)} className="flex items-center gap-3 border-b border-muted px-5 py-4 last:border-b-0">
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <p className="flex items-center gap-2 text-[15px] font-semibold">
                  <VegMark isVeg={item.isVeg} />
                  <span className="truncate">{lineName(item)}</span>
                </p>
                <p className="text-[13px] text-stone-500">{formatPrice(item.price)} each</p>
              </div>
              <QuantityStepper
                quantity={item.quantity}
                itemName={lineName(item)}
                onChange={(next) => changeQuantity(lineKey(item), next)}
              />
              <span className="w-20 text-right text-[15px] font-semibold tabular-nums">
                {formatPrice(item.price * item.quantity)}
              </span>
            </li>
          ))}
        </ul>

        <aside className="flex flex-col gap-4 rounded-[20px] bg-surface p-[22px] shadow-card lg:sticky lg:top-24">
          <div className="flex justify-between text-sm text-stone-600">
            <span>Item total</span>
            <span className="tabular-nums">{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-stone-600">
            <span>Delivery</span>
            <span className="tabular-nums">{restaurant.deliveryFee > 0 ? formatPrice(restaurant.deliveryFee) : "Free"}</span>
          </div>
          <div className="h-px bg-border" />
          <div className="flex justify-between text-[17px] font-bold">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(total)}</span>
          </div>

          {belowMinimum && (
            <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
              Add {formatPrice(shortfall)} more to reach this restaurant&apos;s minimum order of{" "}
              {formatPrice(restaurant.minOrderAmount)}.
            </p>
          )}

          {belowMinimum || closed ? (
            <span
              aria-disabled
              className="flex h-[52px] cursor-not-allowed items-center justify-center rounded-xl bg-[#16120D] font-semibold text-white opacity-50 dark:bg-[#2A241C]"
            >
              Checkout
            </span>
          ) : (
            <Link
              href="/checkout"
              className="flex h-[52px] items-center justify-center gap-2 rounded-xl bg-[#16120D] font-semibold text-white hover:bg-black dark:bg-[#2A241C]"
            >
              Checkout <span className="text-brand">→</span>
            </Link>
          )}
          <p className="text-xs text-stone-500">Pay in cash or UPI when your order arrives. Final prices are confirmed at checkout.</p>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Remove everything from your cart?")) clearCart();
            }}
            className="self-center text-sm font-medium text-stone-500 hover:text-red-700 hover:underline"
          >
            Clear cart
          </button>
        </aside>
      </div>
    </div>
  );
}
