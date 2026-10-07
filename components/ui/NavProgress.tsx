"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// A thin saffron bar across the top of the screen from the moment a link (or a search) is
// tapped until the next page arrives, so a slow connection never feels like "nothing
// happened". The cursor shows "working" too.
export function NavProgress() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const barRef = useRef<HTMLDivElement>(null);
  const running = useRef<Animation | null>(null);
  const safety = useRef<number | undefined>(undefined);

  function finish() {
    const bar = barRef.current;
    window.clearTimeout(safety.current);
    delete document.documentElement.dataset.navigating;
    if (!bar || !running.current) return;
    running.current = null;
    bar.getAnimations().forEach((animation) => animation.cancel());
    bar.animate(
      [
        { transform: `scaleX(${bar.dataset.at ?? "0.8"})`, opacity: 1 },
        { transform: "scaleX(1)", opacity: 1, offset: 0.5 },
        { transform: "scaleX(1)", opacity: 0 },
      ],
      { duration: 450, easing: "ease-out", fill: "forwards" },
    );
  }

  // The new page is here (its address changed): finish the bar.
  useEffect(() => {
    finish();
  }, [pathname, search]);

  useEffect(() => {
    function start() {
      const bar = barRef.current;
      if (!bar || typeof bar.animate !== "function") return;
      document.documentElement.dataset.navigating = "";
      bar.getAnimations().forEach((animation) => animation.cancel());
      bar.dataset.at = "0.85";
      // Quick to a third, then a slow creep that never quite reaches the end.
      running.current = bar.animate(
        [
          { transform: "scaleX(0)", opacity: 1 },
          { transform: "scaleX(0.35)", opacity: 1, offset: 0.04 },
          { transform: "scaleX(0.85)", opacity: 1 },
        ],
        { duration: 9000, easing: "cubic-bezier(0.1, 0.7, 0.3, 1)", fill: "forwards" },
      );
      window.clearTimeout(safety.current);
      safety.current = window.setTimeout(finish, 15000);
    }

    function goesSomewhereElse(url: URL) {
      return url.origin === window.location.origin && (url.pathname !== window.location.pathname || url.search !== window.location.search);
    }

    function onClick(event: MouseEvent) {
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = (event.target as Element | null)?.closest<HTMLAnchorElement>("a[href]");
      if (!link || link.hasAttribute("download") || (link.target && link.target !== "_self")) return;
      if (goesSomewhereElse(new URL(link.href, window.location.href))) start();
    }

    function onSubmit(event: SubmitEvent) {
      const form = event.target as HTMLFormElement;
      // Search boxes and other plain "GET" forms go to a new page.
      if (form.method.toLowerCase() !== "get" || event.defaultPrevented) return;
      const url = new URL(form.action || window.location.href, window.location.href);
      url.search = new URLSearchParams(new FormData(form) as unknown as Record<string, string>).toString();
      if (goesSomewhereElse(url)) start();
    }

    document.addEventListener("click", onClick, { capture: true });
    document.addEventListener("submit", onSubmit);
    return () => {
      document.removeEventListener("click", onClick, { capture: true });
      document.removeEventListener("submit", onSubmit);
    };
  }, []);

  return <div ref={barRef} aria-hidden className="pe-progress" style={{ transform: "scaleX(0)" }} />;
}
