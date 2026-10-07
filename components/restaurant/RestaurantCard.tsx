import Link from "next/link";
import type { Restaurant } from "@/types/app";
import { formatPrice } from "@/lib/utils/format";
import { formatTime, getRestaurantStatus, type RestaurantStatus } from "@/lib/utils/hours";
import { restaurantCover } from "@/lib/utils/placeholder";
import { ClosedBanner } from "@/components/restaurant/ClosedBanner";
import { Photo } from "@/components/ui/Photo";

// A restaurant tile (v2 5a): photo with a small dark tag, name with the rating pill,
// cuisines, then hours · area · cash on delivery. `status` can be passed in so a list
// works out "open or closed" once, on the server.
export function RestaurantCard({
  restaurant,
  status = getRestaurantStatus(restaurant),
}: {
  restaurant: Restaurant;
  status?: RestaurantStatus;
}) {
  const unavailable = !status.canOrder;
  const cuisines = restaurant.tagline ?? restaurant.cuisine_tags.join(" · ");
  const tag = unavailable
    ? null
    : restaurant.delivery_fee === 0
      ? "FREE DELIVERY"
      : restaurant.closing_time
        ? `OPEN TILL ${formatTime(restaurant.closing_time).toUpperCase()}`
        : "OPEN NOW";
  const meta = [
    restaurant.min_order_amount > 0 ? `Min ${formatPrice(restaurant.min_order_amount).replace(/\.00$/, "")}` : null,
    restaurant.area,
    "Cash on delivery",
  ].filter(Boolean) as string[];

  return (
    <Link
      href={`/restaurants/${restaurant.slug}`}
      // Not taking orders: the whole tile turns black and white
      className={`group flex flex-col overflow-hidden rounded-[18px] bg-surface shadow-[0_10px_30px_rgba(120,70,0,.07)] transition-[box-shadow,transform] duration-300 hover:-translate-y-1 hover:shadow-float active:scale-[.99] dark:shadow-none ${
        unavailable ? "grayscale" : ""
      }`}
    >
      <div className="relative h-40 w-full bg-[#16120D] sm:h-[180px]">
        <Photo
          src={restaurantCover(restaurant)}
          alt=""
          sizes="(min-width: 1024px) 400px, (min-width: 640px) 50vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {tag && (
          <span className="absolute left-3.5 top-3.5 flex h-[26px] items-center rounded-[7px] bg-[#16120D] px-2.5 text-xs font-semibold text-brand">
            {tag}
          </span>
        )}
        {unavailable && <ClosedBanner status={status} variant="card" />}
      </div>

      <div className="flex flex-col gap-1.5 px-5 pb-5 pt-[18px]">
        <div className="flex items-center justify-between gap-3">
          <h3 className="truncate text-[19px] font-semibold">{restaurant.name}</h3>
          {restaurant.rating_avg !== null && restaurant.rating_count > 0 && (
            <span className="flex h-[26px] shrink-0 items-center rounded-[7px] bg-amber-100 px-2 text-[13px] font-bold text-amber-800">
              ★ {Number(restaurant.rating_avg).toFixed(1)}
            </span>
          )}
        </div>
        {cuisines && <p className="line-clamp-1 text-sm text-stone-600">{cuisines}</p>}
        <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-stone-500">
          {meta.map((part, i) => (
            <span key={part} className="flex items-center gap-2">
              {i > 0 && <span className="size-1 rounded-full bg-brand" aria-hidden />}
              {part}
            </span>
          ))}
        </p>
      </div>
    </Link>
  );
}
