"use client";

import { Fragment, useEffect, useState, type CSSProperties } from "react";

// Each headline as two lines; laptops keep their own first headline (v2 4a).
// `snug`: a longer headline, set a little smaller on phones so it still fits on two lines.
const LINES: { phone: [string, string]; laptop: [string, string]; snug?: boolean }[] = [
  { phone: ["Hot & fresh,", "from Palia's kitchens"], laptop: ["Palia's Best Kitchens,", "Delivered Hot & Fresh"] },
  { phone: ["Your happy bite is", "just a tap away."], laptop: ["Your happy bite is", "just a tap away."] },
  { phone: ["Hungry?", "Let's fix that."], laptop: ["Hungry?", "Let's fix that."] },
  { phone: ["Made fresh for moments", "worth savoring."], laptop: ["Made Fresh for Moments", "Worth Savoring"], snug: true },
];

const EVERY_MS = 4200;

// One headline, word by word: each word flips in a little after the one before it.
function Words({ lines, mode }: { lines: [string, string]; mode: "in" | "out" | "still" }) {
  let n = 0;
  return (
    <span className={mode === "out" ? "pe-flip-out block" : "block"}>
      {lines.map((line, i) => {
        const words = line.split(" ");
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
      <span className="sr-only">Hot &amp; fresh, from Palia&apos;s kitchens</span>
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
