"use client";

import Link from "next/link";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "@/components/cart/useCart";
import { useCartSync } from "@/components/cart/useCartSync";
import { QuantityStepper } from "@/components/cart/QuantityStepper";
import { VegMark } from "@/components/menu/VegMark";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function CartView() {
  const { cart, count, subtotal, total, changeQuantity, clearCart } = useCart();
  const { notices, status } = useCartSync();
  const restaurant = cart.restaurant;

  if (!restaurant || count === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        {notices.map((notice) => (
          <p key={notice} className="text-sm text-amber-800">
            {notice}
          </p>
        ))}
        <p className="text-stone-600">Pick something tasty from one of our restaurants.</p>
        <Link
          href="/"
          className="rounded-xl bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
        >
          Browse restaurants
        </Link>
      </div>
    );
  }

  const shortfall = restaurant.minOrderAmount - subtotal;
  const belowMinimum = shortfall > 0;
  const closed = status !== null && !status.canOrder;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Your cart</h1>
        <p className="mt-1 text-stone-600">
          From{" "}
          <Link href={`/restaurants/${restaurant.slug}`} className="font-medium text-brand hover:underline">
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

      <ul className="flex flex-col gap-3">
        {cart.items.map((item) => (
          <li key={item.menuItemId}>
            <Card className="flex items-center gap-3 p-3">
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <p className="flex items-center gap-2 font-medium">
                  <VegMark isVeg={item.isVeg} />
                  <span className="truncate">{item.name}</span>
                </p>
                <p className="text-sm text-stone-600">{formatPrice(item.price)} each</p>
              </div>
              <div className="flex flex-col items-end gap-1">
                <QuantityStepper
                  quantity={item.quantity}
                  itemName={item.name}
                  onChange={(next) => changeQuantity(item.menuItemId, next)}
                />
                <span className="text-sm font-semibold">
                  {formatPrice(item.price * item.quantity)}
                </span>
              </div>
            </Card>
          </li>
        ))}
      </ul>

      <Card className="flex flex-col gap-2 text-sm">
        <div className="flex justify-between">
          <span className="text-stone-600">Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-stone-600">Delivery fee</span>
          <span>{restaurant.deliveryFee > 0 ? formatPrice(restaurant.deliveryFee) : "Free"}</span>
        </div>
        <div className="mt-1 flex justify-between border-t border-border pt-3 text-base font-bold">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
        <p className="text-xs text-stone-500">
          Pay in cash when your order arrives. Final prices are confirmed at checkout.
        </p>
      </Card>

      {belowMinimum && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
          Add {formatPrice(shortfall)} more to reach this restaurant&apos;s minimum order of{" "}
          {formatPrice(restaurant.minOrderAmount)}.
        </p>
      )}

      <div className="flex flex-col gap-3">
        {belowMinimum || closed ? (
          <Button size="lg" disabled>
            Proceed to checkout
          </Button>
        ) : (
          <Link
            href="/checkout"
            className="inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 text-lg font-medium text-white hover:bg-brand-dark"
          >
            Proceed to checkout
          </Link>
        )}
        <Button
          variant="ghost"
          onClick={() => {
            if (window.confirm("Remove everything from your cart?")) clearCart();
          }}
        >
          Clear cart
        </Button>
      </div>
    </div>
  );
}
