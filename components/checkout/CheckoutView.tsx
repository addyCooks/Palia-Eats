"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { placeOrder } from "@/lib/actions/orders";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "@/components/cart/useCart";
import { useCartSync } from "@/components/cart/useCartSync";
import { VegMark } from "@/components/menu/VegMark";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Textarea } from "@/components/ui/Textarea";
import type { Address } from "@/types/app";

type CheckoutViewProps = {
  addresses: Address[];
  profilePhone: string | null;
  initialAddressId?: string;
};

export function CheckoutView({ addresses, profilePhone, initialAddressId }: CheckoutViewProps) {
  const router = useRouter();
  const { cart, count, subtotal, total, clearCart } = useCart();
  const [isPending, startTransition] = useTransition();

  const [addressId, setAddressId] = useState(
    () =>
      addresses.find((a) => a.id === initialAddressId)?.id ??
      (addresses.find((a) => a.is_default) ?? addresses[0])?.id ??
      "",
  );
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  // Compare the saved cart with the live menu (prices, sold-out items, delivery fee).
  const { notices, status, checking, refresh: refreshCart } = useCartSync();

  const restaurant = cart.restaurant;
  const selectedAddress = addresses.find((a) => a.id === addressId);
  const hasPhone = Boolean(selectedAddress?.phone ?? profilePhone);

  if (placed) {
    return <p className="py-16 text-center text-lg font-medium">Order placed! Taking you to your order…</p>;
  }

  if (checking) {
    return <p className="py-16 text-center text-stone-600">Checking your cart…</p>;
  }

  if (!restaurant || count === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        {notices.map((notice) => (
          <p key={notice} className="text-sm text-amber-800">
            {notice}
          </p>
        ))}
        <Link href="/" className="rounded-xl bg-brand px-5 py-3 font-medium text-on-brand hover:bg-brand-dark">
          Browse restaurants
        </Link>
      </div>
    );
  }

  const shortfall = restaurant.minOrderAmount - subtotal;
  const canOrder = status ? status.canOrder : true;

  let blocker: string | null = null;
  if (!canOrder) blocker = status?.label ?? "This restaurant can't take orders right now.";
  else if (shortfall > 0) blocker = `Add ${formatPrice(shortfall)} more to reach the minimum order.`;
  else if (!selectedAddress) blocker = "Add a delivery address to continue.";
  else if (!hasPhone) blocker = "Add a mobile number to your account or to this address.";

  function handlePlaceOrder() {
    if (!restaurant) return;
    setError(null);

    startTransition(async () => {
      const result = await placeOrder({
        restaurantId: restaurant.id,
        items: cart.items.map((item) => ({ id: item.menuItemId, quantity: item.quantity })),
        addressId,
        notes,
        expectedTotal: total,
      });

      if ("orderId" in result) {
        setPlaced(true);
        clearCart();
        router.push(`/orders/${result.orderId}?placed=1`);
        return;
      }

      setError(result.error);
      if (result.refreshCart) await refreshCart();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Checkout</h1>
        <p className="mt-1 text-stone-600">
          Ordering from{" "}
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

      {status && !status.canOrder && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {status.label}. You can come back when it opens.
        </p>
      )}

      {/* Delivery address */}
      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">Delivery address</h2>
        {addresses.length === 0 ? (
          <p className="text-sm text-stone-600">
            You haven&apos;t saved an address yet.{" "}
            <Link
              href="/account/addresses?next=/checkout"
              className="font-medium text-brand hover:underline"
            >
              Add an address
            </Link>
          </p>
        ) : (
          <>
            <fieldset className="flex flex-col gap-2">
              <legend className="sr-only">Choose a delivery address</legend>
              {addresses.map((address) => (
                <label
                  key={address.id}
                  className={`flex cursor-pointer gap-3 rounded-xl border p-3 text-sm ${
                    address.id === addressId ? "border-brand bg-brand/5" : "border-border"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    value={address.id}
                    checked={address.id === addressId}
                    onChange={() => setAddressId(address.id)}
                    className="mt-1 accent-brand"
                  />
                  <span>
                    <span className="font-medium">{address.label}</span>
                    <span className="block whitespace-pre-line text-stone-700">{address.address_line}</span>
                    {address.landmark && (
                      <span className="block text-stone-500">Landmark: {address.landmark}</span>
                    )}
                  </span>
                </label>
              ))}
            </fieldset>
            <Link
              href="/account/addresses?next=/checkout"
              className="text-sm font-medium text-brand hover:underline"
            >
              Add or change addresses
            </Link>
          </>
        )}
      </Card>

      {/* Order summary */}
      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">Your order</h2>
        <ul className="flex flex-col gap-2 text-sm">
          {cart.items.map((item) => (
            <li key={item.menuItemId} className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2">
                <VegMark isVeg={item.isVeg} />
                <span className="truncate">
                  {item.quantity} × {item.name}
                </span>
              </span>
              <span>{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <span className="text-stone-600">Subtotal</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-stone-600">Delivery fee</span>
            <span>{restaurant.deliveryFee > 0 ? formatPrice(restaurant.deliveryFee) : "Free"}</span>
          </div>
          <div className="flex justify-between text-base font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </Card>

      <Textarea
        label="Note for the restaurant (optional)"
        name="notes"
        placeholder="Less spicy, ring the bell, etc."
        maxLength={300}
        value={notes}
        onChange={(event) => setNotes(event.target.value)}
      />

      <Card className="flex items-center justify-between text-sm">
        <div>
          <p className="font-semibold">Pay on delivery</p>
          <p className="text-stone-600">Pay in cash when your order arrives.</p>
        </div>
      </Card>

      {error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {error}
        </p>
      )}
      {blocker && !error && (
        <p role="status" className="text-sm text-stone-600">
          {blocker}
        </p>
      )}

      <Button size="lg" disabled={isPending || blocker !== null} onClick={handlePlaceOrder}>
        {isPending ? "Placing your order…" : `Place order · ${formatPrice(total)}`}
      </Button>
    </div>
  );
}
