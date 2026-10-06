import type { RestaurantStatus } from "@/lib/utils/hours";

type ClosedBannerProps = {
  status: RestaurantStatus;
  // "card": a strip across the top of a restaurant tile on the homepage
  // "page": a full-width notice at the top of the restaurant's own page
  variant: "card" | "page";
};

// Big, black-and-white notice shown when a restaurant is not taking orders
// (switched off by the restaurant, or outside its opening hours).
export function ClosedBanner({ status, variant }: ClosedBannerProps) {
  if (variant === "card") {
    return (
      <div className="absolute inset-x-0 top-0 bg-[#16120D]/90 px-4 py-2.5 text-center text-xs font-semibold uppercase tracking-[2px] text-white">
        {status.label}
      </div>
    );
  }

  return (
    <div role="status" className="bg-[#16120D] px-4 py-5 text-center text-white">
      <p className="font-display text-[26px] leading-tight sm:text-[30px]">{status.label}</p>
      <p className="mt-1 text-sm text-[#D8D2C8]">
        You can look at the menu, but ordering is switched off until they&apos;re back.
      </p>
    </div>
  );
}
