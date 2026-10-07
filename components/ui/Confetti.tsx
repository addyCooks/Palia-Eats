"use client";

import { useEffect, useState, type CSSProperties } from "react";

const COLORS = ["#F5A524", "#C2410C", "#15803D", "#FDE7BC", "#16120D", "#FFB547"];

// A short burst of falling confetti over the whole screen (celebrations only).
function makeBits(pieces: number) {
  return Array.from({ length: pieces }, (_, i) => ({
    left: Math.random() * 100,
    size: 6 + Math.random() * 7,
    round: Math.random() > 0.6,
    color: COLORS[i % COLORS.length],
    delay: Math.random() * 0.6,
    fall: 2.2 + Math.random() * 1.6,
    drift: (Math.random() - 0.5) * 160,
    spin: 360 + Math.random() * 540,
  }));
}

export function Confetti({ pieces = 70 }: { pieces?: number }) {
  const [bits, setBits] = useState<ReturnType<typeof makeBits>>([]);
  // Random pieces are made in the browser only, so the server and browser agree.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- one burst on arrival
  useEffect(() => setBits(makeBits(pieces)), [pieces]);
  if (bits.length === 0) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] overflow-hidden">
      {bits.map((bit, i) => (
        <span
          key={i}
          className="pe-confetti-piece"
          style={
            {
              left: `${bit.left}%`,
              width: bit.size,
              height: bit.round ? bit.size : bit.size * 0.45,
              borderRadius: bit.round ? "50%" : 2,
              background: bit.color,
              "--delay": `${bit.delay}s`,
              "--fall": `${bit.fall}s`,
              "--drift": `${bit.drift}px`,
              "--spin": `${bit.spin}deg`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
}
