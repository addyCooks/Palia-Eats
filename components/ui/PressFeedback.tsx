"use client";

import { useEffect } from "react";

const PRESSABLE = 'a[href], button, [role="button"], [role="switch"], summary, [data-press]';

// Every link, button and card answers a tap: it sinks in a little and dims while the
// finger is down, then springs back. Big things (cards, rows) move less than small ones.
// One listener for the whole app, so nothing needs its own code. Add data-no-press to
// opt something out.
// Only `scale` and `opacity` are animated here, never `filter`: a closed restaurant's
// card is black and white through a CSS filter, and animating a filter on top of it would
// bring its colour back for as long as a finger is on the card.
export function PressFeedback() {
  useEffect(() => {
    if (typeof document.body.animate !== "function") return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)");

    function onDown(event: PointerEvent) {
      if (event.button !== 0 || reduce.matches) return;
      const element = (event.target as Element | null)?.closest<HTMLElement>(PRESSABLE);
      if (!element || element.closest("[data-no-press]")) return;
      if (element.matches(":disabled, [aria-disabled='true']")) return;

      const rect = element.getBoundingClientRect();
      const big = rect.width > 280 || rect.height > 140;
      const depth = big ? "0.985" : "0.94";
      let down: Animation | null = null;

      // The dip only starts if the finger stays down for a moment, so cards don't flicker
      // when a finger just lands on them to scroll the page.
      const timer = window.setTimeout(() => {
        down = element.animate(
          [
            { scale: "1", opacity: "1" },
            { scale: depth, opacity: "0.85" },
          ],
          { duration: 140, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" },
        );
      }, 70);

      const finish = () => {
        window.clearTimeout(timer);
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", abort);
        down?.cancel();
      };
      // Finger lifted: spring back with a tiny overshoot.
      function release() {
        finish();
        element!.animate(
          [
            { scale: depth, opacity: "0.85" },
            { scale: big ? "1.004" : "1.04", opacity: "1", offset: 0.45 },
            { scale: "1", opacity: "1" },
          ],
          { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      }
      // The touch turned into a scroll: ease back, no bounce.
      function abort() {
        const dipped = down !== null;
        finish();
        if (dipped) {
          element!.animate(
            [
              { scale: depth, opacity: "0.85" },
              { scale: "1", opacity: "1" },
            ],
            { duration: 180, easing: "ease-out" },
          );
        }
      }
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", abort);
    }

    document.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    return () => document.removeEventListener("pointerdown", onDown, { capture: true });
  }, []);

  return null;
}
