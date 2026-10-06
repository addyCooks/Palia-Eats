"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";

// Short double beep using the browser's audio (no sound file needed).
function beep() {
  try {
    const context = new AudioContext();
    [0, 0.25].forEach((delay) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.value = 0.2;
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(context.currentTime + delay);
      oscillator.stop(context.currentTime + delay + 0.15);
    });
  } catch {
    // audio not available: ignore
  }
}

// Beeps when a new order arrives and shows the count in the browser tab title.
// (The list itself updates over the live connection, see LiveUpdates.)
export function OrderAlerts({ newOrderCount }: { newOrderCount: number }) {
  const [soundOn, setSoundOn] = useState(false);
  const previousCount = useRef(newOrderCount);

  // Beep when the number of brand-new orders goes up.
  useEffect(() => {
    if (soundOn && newOrderCount > previousCount.current) beep();
    previousCount.current = newOrderCount;
  }, [newOrderCount, soundOn]);

  // Show the count in the browser tab title, e.g. "(2) New orders".
  useEffect(() => {
    document.title = newOrderCount > 0 ? `(${newOrderCount}) New orders · PaliaEats` : "Orders · PaliaEats";
  }, [newOrderCount]);

  return (
    <Button
      variant="secondary"
      size="sm"
      className="h-10 rounded-[10px] bg-surface"
      onClick={() => {
        if (!soundOn) beep(); // also lets the browser allow sound later
        setSoundOn(!soundOn);
      }}
    >
      {soundOn ? "🔔 Sound alerts on" : "🔕 Turn on sound alerts"}
    </Button>
  );
}
