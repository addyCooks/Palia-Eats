"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, MapPin } from "lucide-react";
import { placeOrder } from "@/lib/actions/orders";
import { lineKey, lineName } from "@/lib/cart/cart";
import { formatPrice } from "@/lib/utils/format";
import { useCart } from "@/components/cart/useCart";
import { useCartSync } from "@/components/cart/useCartSync";
import { Textarea } from "@/components/ui/Textarea";
import { useT } from "@/lib/i18n/client";
import { CookingPot } from "@/components/ui/FoodLoader";
import type { Address } from "@/types/app";

type CheckoutViewProps = {
  addresses: Address[];
  profilePhone: string | null;
  initialAddressId?: string;
};

const UPI_NOTE = "Paying by UPI on delivery.";

export function CheckoutView({ addresses, profilePhone, initialAddressId }: CheckoutViewProps) {
  const t = useT();
  const PAYMENTS = [
    { key: "cash", name: t("common.cod"), note: t("co.pay_cash_note") },
    { key: "upi", name: t("co.pay_upi"), note: t("co.pay_upi_note") },
  ] as const;
  const router = useRouter();
  const { cart, count, subtotal, total, clearCart } = useCart();
  const [isPending, startTransition] = useTransition();

  const [addressId, setAddressId] = useState(
    () =>
      addresses.find((a) => a.id === initialAddressId)?.id ??
      (addresses.find((a) => a.is_default) ?? addresses[0])?.id ??
      "",
  );
  const [payment, setPayment] = useState<"cash" | "upi">("cash");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState(false);

  // Compare the saved cart with the live menu (prices, sold-out items, delivery fee).
  const { notices, status, checking, refresh: refreshCart } = useCartSync();

  const restaurant = cart.restaurant;
  const selectedAddress = addresses.find((a) => a.id === addressId);
  const hasPhone = Boolean(selectedAddress?.phone ?? profilePhone);

  if (placed) {
    return <p className="py-16 text-center text-lg font-medium">{t("co.placed")}</p>;
  }

  if (checking) {
    return <p className="py-16 text-center text-stone-600">{t("co.checking")}</p>;
  }

  if (!restaurant || count === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center">
        <h1 className="font-display text-[38px]">{t("co.empty")}</h1>
        {notices.map((notice) => (
          <p key={notice} className="text-sm text-amber-800">
            {notice}
          </p>
        ))}
        <Link href="/" className="inline-flex h-[52px] items-center rounded-xl bg-brand px-6 font-bold text-on-brand hover:bg-brand-dark">
          {t("cart.browse")}
        </Link>
      </div>
    );
  }

  const shortfall = restaurant.minOrderAmount - subtotal;
  const canOrder = status ? status.canOrder : true;

  let blocker: string | null = null;
  if (!canOrder) blocker = status?.label ?? t("co.blocker_closed");
  else if (shortfall > 0) blocker = t("co.blocker_min", { amount: formatPrice(shortfall) });
  else if (!selectedAddress) blocker = t("co.blocker_address");
  else if (!hasPhone) blocker = t("co.blocker_phone");

  // Open restaurant, enough in the cart, but nowhere to deliver yet.
  const needsAddress = blocker !== null && canOrder && shortfall <= 0 && !selectedAddress;

  function handlePlaceOrder() {
    if (!restaurant) return;
    setError(null);
    // The rider needs to know to bring the UPI QR code.
    const fullNotes = payment === "upi" ? [UPI_NOTE, notes.trim()].filter(Boolean).join(" ") : notes;

    startTransition(async () => {
      const result = await placeOrder({
        restaurantId: restaurant.id,
        items: cart.items.map((item) => ({ id: item.menuItemId, quantity: item.quantity, variant: item.variant })),
        addressId,
        notes: fullNotes,
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
    <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-8">
      <div className="flex flex-col gap-5">
        <h1 className="font-display text-[38px] leading-none sm:text-[48px]">{t("co.title")}</h1>

        {notices.length > 0 && (
          <div role="status" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            <p className="font-medium">{t("cart.updated")}</p>
            <ul className="mt-1 list-disc pl-5">
              {notices.map((notice) => (
                <li key={notice}>{notice}</li>
              ))}
            </ul>
          </div>
        )}

        {status && !status.canOrder && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {t("co.closed_note", { label: status.label })}
          </p>
        )}

        {/* Delivery address */}
        <section className="flex flex-col gap-4 rounded-[20px] bg-surface p-5 shadow-card sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("co.address_title")}</h2>
            <Link href="/account/addresses?next=/checkout" className="text-sm font-semibold text-accent hover:underline">
              {addresses.length === 0 ? t("co.add") : t("co.add_or_change")}
            </Link>
          </div>
          {addresses.length === 0 ? (
            <p className="text-sm text-stone-600">
              {t("co.no_address")}{" "}
              <Link href="/account/addresses?next=/checkout" className="font-semibold text-accent hover:underline">
                {t("co.add_address")}
              </Link>
            </p>
          ) : (
            <fieldset className="flex flex-col gap-2.5">
              <legend className="sr-only">{t("co.choose_address")}</legend>
              {addresses.map((address, index) => {
                const on = address.id === addressId;
                const Icon = index === 0 ? Home : MapPin;
                return (
                  <label
                    key={address.id}
                    className={`flex cursor-pointer items-center gap-4 rounded-[14px] border-2 p-4 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 ${
                      on ? "border-brand bg-amber-50/60" : "border-border hover:bg-background"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      value={address.id}
                      checked={on}
                      onChange={() => setAddressId(address.id)}
                      className="sr-only"
                    />
                    <span
                      className={`grid size-11 shrink-0 place-items-center rounded-xl ${on ? "bg-brand text-on-brand" : "bg-muted text-stone-600"}`}
                    >
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <span className="flex min-w-0 flex-col gap-0.5">
                      <span className="font-semibold">{address.label}</span>
                      <span className="text-stone-600">
                        {address.address_line}
                        {address.landmark ? `, ${t("co.near", { landmark: address.landmark })}` : ""}
                        {(address.phone ?? profilePhone) ? ` · ${address.phone ?? profilePhone}` : ""}
                      </span>
                    </span>
                  </label>
                );
              })}
            </fieldset>
          )}
        </section>

        {/* Payment: always on delivery */}
        <section className="flex flex-col gap-3.5 rounded-[20px] bg-surface p-5 shadow-card sm:p-6">
          <h2 className="text-lg font-semibold">{t("co.payment")}</h2>
          <fieldset className="flex flex-col gap-2.5">
            <legend className="sr-only">{t("co.how_pay")}</legend>
            {PAYMENTS.map((option) => {
              const on = payment === option.key;
              return (
                <label
                  key={option.key}
                  className={`flex cursor-pointer items-center gap-3.5 rounded-[14px] border-2 p-4 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 ${
                    on ? "border-brand bg-amber-50/60" : "border-border hover:bg-background"
                  }`}
                >
                  <input
                    type="radio"
                    name="payment"
                    value={option.key}
                    checked={on}
                    onChange={() => setPayment(option.key)}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${on ? "border-accent" : "border-stone-300"}`}
                  >
                    <span className={`size-2.5 rounded-full ${on ? "bg-accent" : ""}`} />
                  </span>
                  <span className="flex flex-col gap-0.5">
                    <span className="font-semibold">{option.name}</span>
                    <span className="text-[13px] text-stone-600">{option.note}</span>
                  </span>
                </label>
              );
            })}
          </fieldset>
        </section>

        <Textarea
          label={t("co.note_label")}
          name="notes"
          placeholder={t("co.note_placeholder")}
          maxLength={payment === "upi" ? 300 - UPI_NOTE.length - 1 : 300}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
        />
      </div>

      {/* Order summary */}
      <aside className="flex flex-col gap-4 rounded-[20px] bg-surface p-5 shadow-card sm:p-6 lg:sticky lg:top-24 lg:mt-[68px]">
        <div className="flex flex-col">
          <span className="font-semibold">{restaurant.name}</span>
          <Link href={`/restaurants/${restaurant.slug}`} className="text-[13px] text-stone-500 hover:underline">
            {t("co.add_more")}
          </Link>
        </div>
        <div className="h-px bg-border" />
        <ul className="flex flex-col gap-2.5 text-sm">
          {cart.items.map((item) => (
            <li key={lineKey(item)} className="flex justify-between gap-3">
              <span className="min-w-0">
                {item.quantity} × {lineName(item)}
              </span>
              <span className="shrink-0 font-semibold tabular-nums">{formatPrice(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="h-px bg-border" />
        <div className="flex justify-between text-sm text-stone-600">
          <span>{t("cart.item_total")}</span>
          <span className="tabular-nums">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-stone-600">
          <span>{t("co.delivery_fee")}</span>
          <span className="tabular-nums">{restaurant.deliveryFee > 0 ? formatPrice(restaurant.deliveryFee) : t("cart.free")}</span>
        </div>
        <div className="flex justify-between text-xl font-bold">
          <span>{t("co.to_pay")}</span>
          <span className="tabular-nums">{formatPrice(total)}</span>
        </div>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {error}
          </p>
        )}
        {blocker && !error && !needsAddress && (
          <p role="status" className="text-sm text-stone-600">
            {blocker}
          </p>
        )}

        {needsAddress ? (
          // No address yet: the main button takes them to add one, then straight back here.
          <Link
            href="/account/addresses?next=/checkout"
            className="press flex h-[54px] items-center justify-center gap-2 rounded-xl bg-brand text-base font-bold text-on-brand shadow-saffron hover:bg-brand-dark"
          >
            <MapPin className="size-5" aria-hidden />
            {t("co.add_delivery_btn")}
          </Link>
        ) : (
          <button
            type="button"
            disabled={isPending || blocker !== null}
            onClick={handlePlaceOrder}
            className={`press flex h-[54px] items-center justify-center gap-3 rounded-xl text-base font-bold transition-colors disabled:cursor-not-allowed disabled:shadow-none ${
              isPending
                ? "bg-[#16120D] text-white dark:bg-[#2A241C]"
                : "bg-brand text-on-brand shadow-saffron hover:bg-brand-dark disabled:opacity-50"
            }`}
          >
            {isPending ? (
              <>
                <CookingPot className="size-9" />
                {t("co.placing")}
              </>
            ) : (
              t("co.place", { amount: formatPrice(total) })
            )}
          </button>
        )}
      </aside>
    </div>
  );
}
