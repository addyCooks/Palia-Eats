import type { CSSProperties } from "react";
import type { OrderStatus } from "@/types/app";
import { CookingPot, DeliveryScooter } from "@/components/ui/FoodLoader";

// Light-on-dark colours for the scenes inside the dark status card.
const ON_DARK = {
  "--deep": "#F7F6F3",
  "--surface": "#16120D",
  "--color-stone-300": "#6B6357",
} as CSSProperties;

// The little moving scene in the order's status card: a pulsing ring while the
// restaurant looks at it, a cooking pot, a scooter on the road, then a tick.
export function StatusArt({ status }: { status: OrderStatus }) {
  return (
    <div aria-hidden style={ON_DARK} className="anim-pop-in grid shrink-0 place-items-center">
      {status === "preparing" ? (
        <CookingPot className="size-[104px]" />
      ) : status === "out_for_delivery" ? (
        <DeliveryScooter className="w-[150px]" />
      ) : status === "delivered" ? (
        <svg viewBox="0 0 80 80" className="size-[88px]">
          <circle cx="40" cy="40" r="34" fill="var(--brand)" className="anim-bump" />
          <path d="M25 41 l10 10 l20 -22" fill="none" stroke="#1A1206" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" className="pe-draw" />
        </svg>
      ) : (
        <span className="relative grid size-[84px] place-items-center">
          <span className="pe-ring absolute inset-2 rounded-full bg-brand/40" />
          <span className="pe-ring absolute inset-2 rounded-full bg-brand/30" style={{ animationDelay: "1s" }} />
          <span className="relative grid size-14 place-items-center rounded-full bg-brand font-display text-2xl text-on-brand">✓</span>
        </span>
      )}
    </div>
  );
}
