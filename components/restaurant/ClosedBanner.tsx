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
      <div className="absolute inset-x-0 top-0 bg-black px-4 py-3 text-center text-base font-bold uppercase tracking-wide text-white">
        {status.label}
      </div>
    );
  }

  return (
    <div role="status" className="bg-black px-4 py-5 text-center text-white">
      <p className="text-xl font-bold uppercase tracking-wide sm:text-2xl">{status.label}</p>
      <p className="mt-1 text-sm text-white/80">
        You can look at the menu, but ordering is switched off until they&apos;re back.
      </p>
    </div>
  );
}
