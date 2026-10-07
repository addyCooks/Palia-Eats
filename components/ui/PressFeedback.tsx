"use client";

import { useEffect } from "react";

const PRESSABLE = 'a[href], button, [role="button"], [role="switch"], summary, [data-press]';

// Every link, button and card answers a tap: it sinks in a little and dims while the
// finger is down, then springs back. Big things (cards, rows) move less than small ones.
// One listener for the whole app, so nothing needs its own code. Add data-no-press to
// opt something out.
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
      const down = element.animate(
        [
          { scale: "1", filter: "brightness(1)" },
          { scale: depth, filter: "brightness(0.92)" },
        ],
        { duration: 140, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)", fill: "forwards" },
      );

      const release = () => {
        window.removeEventListener("pointerup", release);
        window.removeEventListener("pointercancel", release);
        down.cancel();
        element.animate(
          [
            { scale: depth, filter: "brightness(0.92)" },
            { scale: big ? "1.004" : "1.04", filter: "brightness(1.03)", offset: 0.45 },
            { scale: "1", filter: "brightness(1)" },
          ],
          { duration: 420, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        );
      };
      window.addEventListener("pointerup", release);
      window.addEventListener("pointercancel", release);
    }

    document.addEventListener("pointerdown", onDown, { capture: true, passive: true });
    return () => document.removeEventListener("pointerdown", onDown, { capture: true });
  }, []);

  return null;
}
