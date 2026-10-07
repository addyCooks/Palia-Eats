"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { setFavourite } from "@/lib/actions/favourites";

const LOOKS = {
  // Round white button on a cover photo (restaurant page, phones and laptops)
  cover: "size-10 rounded-full bg-white text-[#1F1B16] shadow-md",
  // Square button on a light card (dish sheet, favourites list)
  card: "size-[42px] rounded-xl bg-surface text-foreground shadow-card",
} as const;

// The ♡ that keeps a restaurant or a dish under Account → Favourites. It fills in
// straight away and saves in the background; logged-out visitors are sent to log in.
export function FavouriteButton({
  kind,
  id,
  name,
  initial,
  signedIn,
  look = "card",
  onChange,
  className = "",
}: {
  kind: "restaurant" | "dish";
  id: string;
  name: string;
  initial: boolean;
  signedIn: boolean;
  look?: keyof typeof LOOKS;
  onChange?: (on: boolean) => void;
  className?: string;
}) {
  const router = useRouter();
  const [on, setOn] = useState(initial);
  const [note, setNote] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function toLogin() {
    const here = window.location.pathname + window.location.search;
    router.push(`/login?next=${encodeURIComponent(here)}`);
  }

  function toggle() {
    if (!signedIn) return toLogin();
    const next = !on;
    setOn(next);
    onChange?.(next);
    setNote(null);
    startTransition(async () => {
      const result = await setFavourite({ kind, id, on: next }).catch(() => ({ error: "failed" as const }));
      if (!result.error) return;
      setOn(!next);
      onChange?.(!next);
      if (result.error === "login") return toLogin();
      setNote("Couldn’t save. Try again.");
      window.setTimeout(() => setNote(null), 2500);
    });
  }

  return (
    <span className={`relative inline-flex ${className}`}>
      <button
        type="button"
        onClick={toggle}
        aria-pressed={on}
        aria-label={on ? `Remove ${name} from favourites` : `Add ${name} to favourites`}
        title={on ? "In your favourites" : "Add to favourites"}
        className={`grid shrink-0 place-items-center transition-transform active:scale-90 ${LOOKS[look]}`}
      >
        <Heart
          className={`size-[18px] ${on ? (look === "cover" ? "text-[#C2410C]" : "text-[#C2410C] dark:text-[#FF7A45]") : ""}`}
          fill={on ? "currentColor" : "none"}
          strokeWidth={2}
          aria-hidden
        />
      </button>
      {note && (
        <span
          role="status"
          className="absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-full bg-black/80 px-3 py-1.5 text-xs font-semibold text-white"
        >
          {note}
        </span>
      )}
    </span>
  );
}
