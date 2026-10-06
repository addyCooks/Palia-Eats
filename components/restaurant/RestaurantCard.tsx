import Image from "next/image";
import Link from "next/link";
import type { Restaurant } from "@/types/app";
import { formatPrice } from "@/lib/utils/format";
import { getRestaurantStatus, type RestaurantStatus } from "@/lib/utils/hours";
import { ClosedBanner } from "@/components/restaurant/ClosedBanner";
import { StatusBadge } from "@/components/restaurant/StatusBadge";

// A restaurant tile on the PaliaEats homepage. Uses the restaurant's own brand color.
// Small phones get a compact list row (80px picture); from 640px up it is a full card.
// `status` can be passed in so a list computes "open or closed" once, on the server.
export function RestaurantCard({
  restaurant,
  status = getRestaurantStatus(restaurant),
}: {
  restaurant: Restaurant;
  status?: RestaurantStatus;
}) {
  const brand = restaurant.theme.brand ?? "#ea580c";
  const unavailable = !status.canOrder;

  const fee =
    restaurant.delivery_fee > 0 ? `Delivery ${formatPrice(restaurant.delivery_fee)}` : "Free delivery";
  const minimum = restaurant.min_order_amount > 0 ? ` · Min ${formatPrice(restaurant.min_order_amount)}` : "";
  const cuisines = restaurant.cuisine_tags.join(" · ");

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      // Not taking orders: the whole tile turns black and white
      className={`group block overflow-hidden rounded-[18px] bg-surface shadow-card transition-shadow hover:shadow-float ${
        unavailable ? "grayscale" : ""
      }`}
    >
      {/* ---- Compact row (phones) ---- */}
      <div className="flex items-center gap-3 p-2 sm:hidden">
        <div className="relative size-20 shrink-0 overflow-hidden rounded-xl" style={{ backgroundColor: brand }}>
          {restaurant.cover_url ? (
            <Image src={restaurant.cover_url} alt="" fill sizes="80px" unoptimized className="object-cover" />
          ) : (
            <span className="flex size-full items-center justify-center font-display text-3xl font-extrabold text-white">
              {restaurant.name.charAt(0)}
            </span>
          )}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="truncate text-base font-bold leading-tight">{restaurant.name}</h3>
          {cuisines && <p className="truncate text-xs text-stone-500">{cuisines}</p>}
          <p className="truncate text-xs font-medium text-stone-600">
            {fee}
            {minimum}
          </p>
          <div className="mt-1">
            {unavailable ? (
              <span className="text-xs font-extrabold uppercase tracking-wide">● {status.label}</span>
            ) : (
              <StatusBadge status={status} />
            )}
          </div>
        </div>
      </div>

      {/* ---- Full card (640px and up) ---- */}
      <div className="hidden flex-col sm:flex">
        <div className="relative h-40 w-full" style={{ backgroundColor: brand }}>
          {restaurant.cover_url && (
            <Image
              src={restaurant.cover_url}
              alt=""
              fill
              sizes="(min-width: 1024px) 33vw, 50vw"
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
              <span className="flex size-full items-center justify-center font-display text-2xl font-extrabold text-white">
                {restaurant.name.charAt(0)}
              </span>
            )}
          </div>

          <div className="flex min-w-0 flex-1 flex-col gap-1">
            <h3 className="truncate font-display text-xl font-bold leading-tight">{restaurant.name}</h3>
            {restaurant.tagline && <p className="line-clamp-1 text-sm text-stone-600">{restaurant.tagline}</p>}
            {cuisines && <p className="line-clamp-1 text-xs text-stone-500">{cuisines}</p>}
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-600">
              {/* The banner on the photo already says it when they're not taking orders */}
              {!unavailable && <StatusBadge status={status} />}
              <span>
                {fee}
                {minimum}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
