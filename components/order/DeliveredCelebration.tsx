"use client";

import { useEffect, useRef, useState } from "react";
import { Confetti } from "@/components/ui/Confetti";
import { ServedPlate } from "@/components/ui/FoodLoader";

const SHOW_AFTER_MS = 7000; // 7 seconds after the order turns "Delivered"
const ONLY_WITHIN_MS = 30 * 60_000; // don't celebrate orders delivered long ago

const read = (store: Storage, key: string) => {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
};
const write = (store: Storage, key: string, value: string) => {
  try {
    store.setItem(key, value);
  } catch {
    // storage blocked: the popup may simply show again
  }
};

// "Enjoy your meal!" on the order page, shortly after the order is delivered: confetti,
// a plate whose dome lifts, and a nudge to rate. Shown once per order.
export function DeliveredCelebration({
  orderId,
  delivered,
  deliveredAt,
  restaurantName,
  rated,
}: {
  orderId: string;
  delivered: boolean;
  deliveredAt: string | null;
  restaurantName: string;
  rated: boolean;
}) {
  const [open, setOpen] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!delivered) return;
    const key = `pe-enjoy-${orderId}`;
    if (read(localStorage, key)) return;
    const since = deliveredAt ? Date.now() - new Date(deliveredAt).getTime() : 0;
    if (since > ONLY_WITHIN_MS) return;

    const timer = window.setTimeout(() => {
      write(localStorage, key, "1");
      // The rating sheet waits for the next visit instead of popping up right after this.
      write(sessionStorage, `pe-celebrated-${orderId}`, "1");
      setOpen(true);
    }, Math.max(1200, SHOW_AFTER_MS - Math.max(0, since)));
    return () => window.clearTimeout(timer);
  }, [delivered, deliveredAt, orderId]);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  if (!open) return null;

  function rateNow() {
    setOpen(false);
    document.getElementById("rate")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <>
      <Confetti />
      <div
        className="anim-fade-in fixed inset-0 z-50 flex items-end justify-center bg-black/55 p-0 sm:items-center sm:p-6"
        onClick={(event) => event.target === event.currentTarget && setOpen(false)}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="enjoy-title"
          className="anim-pop-in flex w-full max-w-md flex-col items-center gap-3 rounded-t-[30px] bg-background px-7 pb-8 pt-7 text-center shadow-float sm:rounded-[30px]"
        >
          <ServedPlate className="size-44" />
          <span className="kicker">Delivered</span>
          <h2 id="enjoy-title" className="font-display text-[40px] leading-[1.05]">
            Enjoy your meal!
          </h2>
          <p className="max-w-xs text-pretty text-[15px] leading-relaxed text-stone-600">
            Your little moment of yum, delivered. Your food from {restaurantName} is here: enjoy every bite.
          </p>
          <div className="mt-3 flex w-full flex-col gap-2.5">
            {!rated && (
              <button
                type="button"
                onClick={rateNow}
                className="press h-[54px] rounded-[14px] bg-brand text-base font-bold text-on-brand shadow-saffron hover:bg-brand-dark"
              >
                Rate your meal
              </button>
            )}
            <button
              ref={closeRef}
              type="button"
              onClick={() => setOpen(false)}
              className="press h-12 rounded-[14px] text-[15px] font-semibold text-stone-600 hover:bg-muted"
            >
              Thanks!
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
