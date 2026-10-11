"use client";

import { useT } from "@/lib/i18n/client";

// First thing a keyboard user reaches: jumps past the header and menus to the page's content.
// Every page has one <main>, so we focus that.
export function SkipLink() {
  const t = useT();
  return (
    <a
      href="#main"
      className="skip-link"
      onClick={(event) => {
        const main = document.querySelector("main");
        if (!main) return;
        event.preventDefault();
        main.setAttribute("tabindex", "-1");
        main.focus();
        main.scrollIntoView();
      }}
    >
      {t("a11y.skip")}
    </a>
  );
}
