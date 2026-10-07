"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import type { RatePromptOrder } from "@/lib/queries/orders";
import { RateOrder } from "@/components/order/RateOrder";
import { ServedPlate } from "@/components/ui/FoodLoader";

const read = (store: Storage, key: string) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};
const write = (key: string) => {
  try {
    localStorage.setItem(key, "1");
  } catch {
    // storage blocked: it may ask again next visit
  }
};

// "How was your meal?" A sheet that slides up to half the screen on the customer's next
// visit after a delivery they haven't rated. "Not now" hides it for that order for good.
export function RatePrompt({ order }: { order: RatePromptOrder | null }) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [show, setShow] = useState(false);
  const [thanked, setThanked] = useState(false);

  useEffect(() => {
    if (!order) return;
    // Not on the order page itself (it has its own rating box), nor while paying.
    if (pathname.startsWith(`/orders/${order.id}`) || pathname.startsWith("/checkout")) return;
    if (read(localStorage, `pe-rate-done-${order.id}`)) return;
    // The "Enjoy your meal!" visit: wait for the next one.
    if (read(sessionStorage, `pe-celebrated-${order.id}`)) return;
    const timer = window.setTimeout(() => setShow(true), 1400);
    return () => window.clearTimeout(timer);
  }, [order, pathname]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (show && dialog && !dialog.open) dialog.showModal();
  }, [show]);

  if (!order || !show) return null;

  function close() {
    if (order) write(`pe-rate-done-${order.id}`);
    dialogRef.current?.close();
    setShow(false);
  }

  return (
    <dialog
      ref={dialogRef}
      onClose={close}
      onClick={(event) => event.target === dialogRef.current && close()}
      aria-labelledby="rate-title"
      className="sheet m-0 mt-auto max-h-[80dvh] min-h-[50dvh] w-full max-w-none overflow-y-auto rounded-t-[30px] bg-background p-0 text-foreground backdrop:bg-black/50 sm:m-auto sm:min-h-0 sm:max-w-[460px] sm:rounded-[30px]"
    >
      <div className="flex flex-col items-center gap-3 px-6 pb-8 pt-3 text-center">
        <span className="h-[5px] w-11 rounded-full bg-stone-300 sm:hidden" aria-hidden />
        <ServedPlate className="size-28" />
        <span className="kicker">Order #{order.order_number}</span>
        <h2 id="rate-title" className="font-display text-[32px] leading-[1.08]">
          How was your little moment of yum?
        </h2>
        <p className="text-sm text-stone-600">
          Rate your meal from {order.restaurantName}. Your stars help them and other people in Palia.
        </p>
        <div className="mt-2 flex w-full justify-center text-left">
          <RateOrder
            orderId={order.id}
            restaurantName={order.restaurantName}
            onDone={() => {
              setThanked(true);
              write(`pe-rate-done-${order.id}`);
              window.setTimeout(close, 1800);
            }}
          />
        </div>
        {!thanked && (
          <button type="button" onClick={close} className="press mt-1 h-11 rounded-xl px-5 text-sm font-semibold text-stone-500 hover:bg-muted">
            Not now
          </button>
        )}
      </div>
    </dialog>
  );
}
