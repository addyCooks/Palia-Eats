import Image from "next/image";
import Link from "next/link";
import type { Restaurant } from "@/types/app";
import { formatPrice } from "@/lib/utils/format";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { ClosedBanner } from "@/components/restaurant/ClosedBanner";
import { StatusBadge } from "@/components/restaurant/StatusBadge";

// A restaurant tile on the PaliaEats homepage. Uses the restaurant's own brand color.
export function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const status = getRestaurantStatus(restaurant);
  const brand = restaurant.theme.brand ?? "#ea580c";
  const unavailable = !status.canOrder;

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      // Not taking orders: the whole tile turns black and white
      className={`group flex flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-sm transition-shadow hover:shadow-md ${
        unavailable ? "grayscale" : ""
      }`}
    >
      <div className="relative h-36 w-full" style={{ backgroundColor: brand }}>
        {restaurant.cover_url && (
          <Image
            src={restaurant.cover_url}
            alt=""
            fill
            sizes="(min-width: 640px) 50vw, 100vw"
            unoptimized
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        )}
        {unavailable && <ClosedBanner status={status} variant="card" />}
      </div>

      <div className="flex items-start gap-3 p-4">
        <div
          className="relative -mt-10 size-14 shrink-0 overflow-hidden rounded-xl border-2 border-surface bg-surface shadow-sm"
          style={{ backgroundColor: brand }}
        >
          {restaurant.logo_url ? (
            <Image src={restaurant.logo_url} alt="" fill sizes="56px" unoptimized className="object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center text-xl font-bold text-white">
              {restaurant.name.charAt(0)}
            </span>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h3 className="truncate text-lg font-semibold leading-tight">{restaurant.name}</h3>
          {restaurant.tagline && (
            <p className="line-clamp-1 text-sm text-stone-600">{restaurant.tagline}</p>
          )}
          {restaurant.cuisine_tags.length > 0 && (
            <p className="line-clamp-1 text-xs text-stone-500">
              {restaurant.cuisine_tags.join(" · ")}
            </p>
          )}
          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-stone-600">
            {/* The banner on the photo already says it when they're not taking orders */}
            {!unavailable && <StatusBadge status={status} />}
            <span>
              {restaurant.delivery_fee > 0
                ? `Delivery ${formatPrice(restaurant.delivery_fee)}`
                : "Free delivery"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
