"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/messages";

// Each headline as two lines (the words live in lib/i18n); laptops keep their own first headline
// (v2 4a). `snug`: a longer headline, set a little smaller on phones so it still fits on two lines.
type Pair = [MessageKey, MessageKey];
const LINES: { phone: Pair; laptop: Pair; snug?: boolean }[] = [
  { phone: ["hero.1.a", "hero.1.b"], laptop: ["hero.1.lap.a", "hero.1.lap.b"] },
  { phone: ["hero.2.a", "hero.2.b"], laptop: ["hero.2.a", "hero.2.b"] },
  { phone: ["hero.3.a", "hero.3.b"], laptop: ["hero.3.a", "hero.3.b"] },
  { phone: ["hero.4.a", "hero.4.b"], laptop: ["hero.4.lap.a", "hero.4.lap.b"], snug: true },
];

const EVERY_MS = 4200;

// One headline, word by word: each word flips in a little after the one before it.
function Words({ lines, mode }: { lines: Pair; mode: "in" | "out" | "still" }) {
  const t = useT();
  let n = 0;
  return (
    <span className={mode === "out" ? "pe-flip-out block" : "block"}>
      {lines.map((key, i) => {
        const words = t(key).split(" ");
        return (
          <span key={i} className="block">
            {words.map((word, j) => (
              <Fragment key={j}>
                {j > 0 && " "}
                <span className={mode === "in" ? "pe-flip-word" : "inline-block"} style={{ "--w": n++ } as CSSProperties}>
                  {word}
                </span>
              </Fragment>
            ))}
          </span>
        );
      })}
    </span>
  );
}

// The big home-page headline. It changes every few seconds: the old line flips up and
// away while the new one flips in word by word. All headlines share one spot, so the
// page never jumps. Screen readers hear the first headline only.
export function HeroHeadline({ className }: { className?: string }) {
  const t = useT();
  const [{ index, previous }, setState] = useState<{ index: number; previous: number | null }>({
    index: 0,
    previous: null,
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (document.visibilityState !== "visible") return;
      setState(({ index: current }) => ({ index: (current + 1) % LINES.length, previous: current }));
    }, EVERY_MS);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <h1 className={className}>
      <span className="sr-only">{t("hero.sr")}</span>
      <span aria-hidden className="pe-flip-stack">
        {LINES.map((line, i) => {
          if (i !== index && i !== previous) {
            // Hidden, but still holding its space so the tallest headline sets the height.
            return (
              <span key={i} className={line.snug ? "invisible text-[0.8em]" : "invisible"}>
                <Words lines={line.phone} mode="still" />
              </span>
            );
          }
          const out = i === previous;
          return (
            <span key={`${i}-${out ? "out" : "in"}`}>
              <span className={line.snug ? "text-[0.8em] lg:hidden" : "lg:hidden"}>
                <Words lines={line.phone} mode={out ? "out" : "in"} />
              </span>
              <span className="hidden lg:block">
                <Words lines={line.laptop} mode={out ? "out" : "in"} />
              </span>
            </span>
          );
        })}
      </span>
    </h1>
  );
}
