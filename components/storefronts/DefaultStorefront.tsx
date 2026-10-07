import type { CSSProperties } from "react";
import type { StorefrontProps } from "@/components/storefronts/types";
import { formatPrice } from "@/lib/utils/format";
import { describeClosedDays, formatTime, getRestaurantStatus } from "@/lib/utils/hours";
import { restaurantCover } from "@/lib/utils/placeholder";
import { CartBar } from "@/components/cart/CartBar";
import { ClosedBanner } from "@/components/restaurant/ClosedBanner";
import { FavouriteButton } from "@/components/favourites/FavouriteButton";
import { CoverActions } from "@/components/storefronts/CoverActions";
import { StorefrontMenu } from "@/components/storefronts/StorefrontMenu";
import { Photo } from "@/components/ui/Photo";

const rupees = (amount: number) => formatPrice(amount).replace(/\.00$/, "");

// The standard restaurant website (v2 5b on laptops, 6a on phones). Accent colors come
// from the restaurant's own theme.
export function DefaultStorefront({ restaurant, categories, items, favourites }: StorefrontProps) {
  const status = getRestaurantStatus(restaurant);
  const brand = restaurant.theme.brand ?? "#f5a524";
  const brandDark = restaurant.theme.brandDark ?? brand;

  // Overriding these variables re-colors every `bg-brand` / `text-accent` below. Text on a
  // restaurant's own color stays white (they picked a color for white text); PaliaEats'
  // saffron keeps its dark text.
  const isSaffron = brand.toLowerCase() === "#f5a524";
  const themeStyle = {
    "--brand": brand,
    "--brand-dark": brandDark,
    "--on-brand": isSaffron ? "#1a1206" : "#ffffff",
    "--accent-text": isSaffron ? undefined : brandDark,
  } as CSSProperties;

  const sections = categories
    .map((category) => ({
      category,
      items: items.filter((item) => item.category_id === category.id),
    }))
    .filter((section) => section.items.length > 0);

  // Not taking orders (switched off, or outside opening hours): the page goes black and white.
  const unavailable = !status.canOrder;
  const closedDays = describeClosedDays(restaurant.closed_days);
  const kicker = [
    restaurant.area,
    restaurant.closing_time && status.canOrder ? `Open till ${formatTime(restaurant.closing_time)}` : status.label,
  ]
    .filter(Boolean)
    .join(" · ");
  const subtitle = restaurant.tagline ?? restaurant.cuisine_tags.join(" · ");
  const rating =
    restaurant.rating_avg !== null && restaurant.rating_count > 0
      ? { avg: Number(restaurant.rating_avg).toFixed(1), count: restaurant.rating_count }
      : null;
  const facts = [
    restaurant.delivery_fee > 0 ? `Delivery ${rupees(restaurant.delivery_fee)}` : "Free delivery",
    restaurant.min_order_amount > 0 ? `Min ${rupees(restaurant.min_order_amount)}` : null,
    restaurant.opening_time && restaurant.closing_time
      ? `${formatTime(restaurant.opening_time)} – ${formatTime(restaurant.closing_time)}`
      : null,
  ].filter(Boolean) as string[];
  const cover = restaurantCover(restaurant);

  return (
    <div style={themeStyle} className="storefront flex flex-1 flex-col bg-background">
      {/* Everything except the floating cart bar. The grayscale filter lives on this
          wrapper only, because a filter would break the cart bar's fixed position. */}
      <div className={`flex flex-1 flex-col ${unavailable ? "grayscale" : ""}`}>
        {unavailable && <ClosedBanner status={status} variant="page" />}

        {/* Phones: cover photo with round buttons, and an info card floating over it */}
        <div className="relative h-[250px] w-full bg-[#16120D] lg:hidden">
          <Photo src={cover} alt="" sizes="100vw" priority />
          <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent" />
          <CoverActions name={restaurant.name}>
            <FavouriteButton
              kind="restaurant"
              id={restaurant.id}
              name={restaurant.name}
              initial={favourites.restaurant}
              signedIn={favourites.signedIn}
              look="cover"
            />
          </CoverActions>
        </div>
        <header className="relative mx-4 -mt-10 flex flex-col gap-2 rounded-[20px] bg-surface p-[18px] shadow-float lg:hidden">
          <div className="flex items-start justify-between gap-3">
            <h1 className="font-display text-[28px] leading-none">{restaurant.name}</h1>
            {rating && (
              <span className="flex h-7 shrink-0 items-center rounded-[7px] bg-brand px-2.5 text-[13px] font-bold text-on-brand">
                ★ {rating.avg}
              </span>
            )}
          </div>
          {(subtitle || restaurant.area) && (
            <p className="text-[13px] text-stone-600">{[subtitle, restaurant.area].filter(Boolean).join(" · ")}</p>
          )}
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-stone-500">
            {[...facts, "Cash on delivery"].map((fact, i) => (
              <span key={fact} className="flex items-center gap-2">
                {i > 0 && <span className="size-1 rounded-full bg-brand" aria-hidden />}
                {fact}
              </span>
            ))}
          </p>
          {closedDays && <p className="text-xs text-stone-500">{closedDays}</p>}
        </header>

        {/* Laptops: dark hero with the cover on the right */}
        <section className="relative mx-auto mt-2 hidden h-[260px] w-full max-w-[1280px] overflow-hidden rounded-[22px] bg-[#16120D] text-white lg:block lg:w-[calc(100%-96px)]">
          <div className="absolute inset-y-0 right-0 w-[58%]">
            <Photo src={cover} alt="" sizes="60vw" priority />
            <div className="absolute inset-0 bg-gradient-to-r from-[#16120D] via-[#16120D]/20 to-transparent" />
          </div>
          <FavouriteButton
            kind="restaurant"
            id={restaurant.id}
            name={restaurant.name}
            initial={favourites.restaurant}
            signedIn={favourites.signedIn}
            look="cover"
            className="absolute right-5 top-5 z-10"
          />
          <div className="relative flex h-full w-[52%] flex-col justify-center gap-3 p-10">
            {kicker && <span className="text-xs font-semibold uppercase tracking-[2px] text-brand">{kicker}</span>}
            <h1 className="font-display text-[54px] leading-none">{restaurant.name}</h1>
            {subtitle && <p className="line-clamp-2 text-[15px] text-[#D8D2C8]">{subtitle}</p>}
            <div className="mt-1.5 flex flex-wrap gap-2.5">
              {rating && (
                <span className="flex h-8 items-center rounded-lg bg-brand px-3 text-[13px] font-bold text-on-brand">
                  ★ {rating.avg} · {rating.count} {rating.count === 1 ? "rating" : "ratings"}
                </span>
              )}
              {facts.map((fact) => (
                <span key={fact} className="flex h-8 items-center rounded-lg bg-[#2A241C] px-3 text-[13px]">
                  {fact}
                </span>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-[1280px] flex-1 px-4 pb-32 lg:px-12 lg:pb-12 lg:pt-8">
          <StorefrontMenu restaurant={restaurant} sections={sections} canOrder={status.canOrder} favourites={favourites} />

          {/* About and contact */}
          {(restaurant.description || restaurant.about || restaurant.address_text || restaurant.phone || closedDays) && (
            <section className="mt-10 flex max-w-3xl flex-col gap-2 border-t border-border pt-6">
              <h2 className="font-display text-2xl">About {restaurant.name}</h2>
              {(restaurant.about ?? restaurant.description) && (
                <p className="text-[15px] leading-relaxed text-stone-600">{restaurant.about ?? restaurant.description}</p>
              )}
              {(restaurant.address_text || restaurant.phone) && (
                <p className="text-sm text-stone-500">
                  {restaurant.address_text}
                  {restaurant.address_text && restaurant.phone && " · "}
                  {restaurant.phone && (
                    <a href={`tel:${restaurant.phone}`} className="font-semibold text-accent hover:underline">
                      {restaurant.phone}
                    </a>
                  )}
                </p>
              )}
              {closedDays && <p className="text-sm text-stone-500">{closedDays}</p>}
            </section>
          )}

          <p className="pt-6 text-[11px] font-semibold text-stone-500">
            Powered by <span className="font-display text-sm text-foreground">PaliaEats</span>
          </p>
        </div>
      </div>

      <CartBar restaurantId={restaurant.id} />
    </div>
  );
}
