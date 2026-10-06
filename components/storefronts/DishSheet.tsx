"use client";

import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { isOtherRestaurant, lineKey, toCartRestaurant, type PlateSize } from "@/lib/cart/cart";
import { formatPrice } from "@/lib/utils/format";
import { dishPhoto } from "@/lib/utils/placeholder";
import { useCart } from "@/components/cart/useCart";
import { VegMark } from "@/components/menu/VegMark";
import { Photo } from "@/components/ui/Photo";
import type { MenuItem, Restaurant } from "@/types/app";

const rupees = (amount: number) => formatPrice(amount).replace(/\.00$/, "");

// The dish screen (v2 6b): big plate photo, name, description, Half / Full choice,
// quantity and "Add to cart · ₹240". A bottom sheet on phones, a centred card on laptops.
export function DishSheet({
  item,
  restaurant,
  canOrder,
  onClose,
}: {
  item: MenuItem;
  restaurant: Restaurant;
  canOrder: boolean;
  onClose: () => void;
}) {
  const { cart, addItem, changeQuantity } = useCart();
  const [size, setSize] = useState<PlateSize>("full");
  const [quantity, setQuantity] = useState(1);
  const dialogRef = useRef<HTMLDialogElement>(null);

  // Open as a modal once. No close() on cleanup: closing fires onClose, which would
  // dismiss the sheet; removing the element is enough.
  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
  }, []);

  const price = size === "half" && item.half_price !== null ? item.half_price : item.price;
  const kicker = [restaurant.name, item.is_bestseller ? "Bestseller" : null].filter(Boolean).join(" · ");

  function add() {
    const switching = isOtherRestaurant(cart, restaurant.id);
    if (switching) {
      const ok = window.confirm(
        `Your cart has items from ${cart.restaurant?.name}. Start a new cart with ${restaurant.name}?`,
      );
      if (!ok) return;
    }
    const key = lineKey({ menuItemId: item.id, variant: size });
    const already = switching ? 0 : (cart.items.find((line) => lineKey(line) === key)?.quantity ?? 0);
    // addItem adds one plate (and starts the cart for this restaurant); then set the
    // chosen amount on top of what was already there.
    addItem(toCartRestaurant(restaurant), { id: item.id, name: item.name, price, isVeg: item.is_veg, variant: size });
    if (quantity > 1) changeQuantity(key, already + quantity);
    onClose();
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      onClick={(event) => event.target === dialogRef.current && onClose()}
      aria-label={item.name}
      className="m-0 mt-auto max-h-[92dvh] w-full max-w-none overflow-y-auto rounded-t-[30px] bg-background p-0 text-foreground backdrop:bg-black/50 sm:m-auto sm:max-w-[440px] sm:rounded-[30px]"
    >
      <div className="relative flex flex-col items-center gap-3 px-[22px] pb-28 pt-6 text-center">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-5 top-5 grid size-[42px] place-items-center rounded-xl bg-surface shadow-card"
        >
          <X className="size-[18px]" aria-hidden />
        </button>
        <div className="relative mt-6 size-[220px] overflow-hidden rounded-full shadow-[0_24px_50px_rgba(0,0,0,.25)] sm:size-[250px]">
          <Photo src={dishPhoto(item)} alt={item.name} sizes="250px" />
        </div>
        <span className="kicker mt-3">{kicker}</span>
        <h2 className="flex items-center gap-2 font-display text-[32px] leading-[1.05] sm:text-[34px]">
          {item.name}
        </h2>
        <div className="flex items-center gap-2 text-[13px] text-stone-500">
          <VegMark isVeg={item.is_veg} egg={item.contains_egg} />
          {item.is_veg ? "Veg" : item.contains_egg ? "Contains egg" : "Non-veg"}
          {item.prep_minutes && (
            <>
              <span className="size-1 rounded-full bg-brand" aria-hidden />
              Ready in about {item.prep_minutes} min
            </>
          )}
        </div>
        {item.description && <p className="text-pretty text-sm leading-[1.55] text-stone-600">{item.description}</p>}

        {item.half_price !== null && (
          <div role="radiogroup" aria-label="Plate size" className="mt-1 flex w-full gap-2.5">
            {(
              [
                { key: "half", name: "Half", price: item.half_price },
                { key: "full", name: "Full", price: item.price },
              ] as const
            ).map((option) => {
              const on = size === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  onClick={() => setSize(option.key)}
                  className={`flex h-[58px] flex-1 flex-col items-center justify-center rounded-[14px] border-[1.5px] ${
                    on ? "border-deep bg-deep text-brand" : "border-border bg-surface"
                  }`}
                >
                  <span className="text-sm font-semibold">{option.name}</span>
                  <span className="text-xs opacity-75">{rupees(option.price)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 flex gap-2.5 bg-background/95 px-5 pb-6 pt-3 backdrop-blur">
        {canOrder && item.is_available ? (
          <>
            <div className="flex h-[58px] items-center rounded-[14px] bg-surface text-lg font-semibold shadow-card">
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                aria-label="One less"
                className="h-full w-11 text-accent"
              >
                −
              </button>
              <span className="w-6 text-center tabular-nums" aria-live="polite">
                {quantity}
              </span>
              <button
                type="button"
                onClick={() => setQuantity((q) => Math.min(20, q + 1))}
                aria-label="One more"
                className="h-full w-11 text-accent"
              >
                +
              </button>
            </div>
            <button
              type="button"
              onClick={add}
              className="flex h-[58px] flex-1 items-center justify-center rounded-[14px] bg-brand text-base font-bold text-on-brand shadow-saffron hover:bg-brand-dark"
            >
              Add to cart · {rupees(price * quantity)}
            </button>
          </>
        ) : (
          <p className="flex h-[58px] flex-1 items-center justify-center rounded-[14px] bg-muted text-sm font-semibold text-stone-600">
            {item.is_available ? "Not taking orders right now" : "Sold out today"}
          </p>
        )}
      </div>
    </dialog>
  );
}
