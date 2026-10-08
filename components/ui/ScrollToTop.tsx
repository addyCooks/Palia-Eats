"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

// Whenever the screen changes (a tab, a link, a redirect, a new filter or page of results),
// the new screen starts at its top. This runs before the browser paints, so the new screen
// never shows up scrolled halfway down and then jumps.
// Left alone on purpose: the first load, links to an anchor (#restaurants, #dish-...), and the
// browser's Back / Forward buttons (they return you to where you were).
export function ScrollToTop() {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const last = useRef<string | null>(null);
  const goingBackOrForward = useRef(false);

  useEffect(() => {
    const onPop = () => {
      goingBackOrForward.current = true;
    };
    // Any fresh click means it is not Back / Forward any more.
    const onClick = () => {
      goingBackOrForward.current = false;
    };
    window.addEventListener("popstate", onPop);
    document.addEventListener("click", onClick, { capture: true });
    return () => {
      window.removeEventListener("popstate", onPop);
      document.removeEventListener("click", onClick, { capture: true });
    };
  }, []);

  useLayoutEffect(() => {
    const here = `${pathname}?${search}`;
    const previous = last.current;
    last.current = here;
    if (previous === null || previous === here) return;

    if (goingBackOrForward.current) {
      goingBackOrForward.current = false;
      return;
    }
    if (window.location.hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname, search]);

  return null;
}
