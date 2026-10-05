import type { CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import type { StorefrontProps } from "@/components/storefronts/types";
import { formatPrice } from "@/lib/utils/format";
import { formatTime, getRestaurantStatus } from "@/lib/utils/hours";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { CartBar } from "@/components/cart/CartBar";
import { CartLink } from "@/components/cart/CartLink";
import { MenuItemCard } from "@/components/menu/MenuItemCard";
import { ClosedBanner } from "@/components/restaurant/ClosedBanner";
import { StatusBadge } from "@/components/restaurant/StatusBadge";

// The standard restaurant website. Colors come from the restaurant's theme.
export function DefaultStorefront({ restaurant, categories, items }: StorefrontProps) {
  const status = getRestaurantStatus(restaurant);
  const brand = restaurant.theme.brand ?? "#ea580c";
  const brandDark = restaurant.theme.brandDark ?? brand;

  // Overriding these two variables re-colors every `bg-brand` / `text-brand` below.
  const themeStyle = { "--brand": brand, "--brand-dark": brandDark } as CSSProperties;

  const sections = categories
    .map((category) => ({
      category,
      items: items.filter((item) => item.category_id === category.id),
    }))
    .filter((section) => section.items.length > 0);

  // Not taking orders (switched off, or outside opening hours): the page goes black and white.
  const unavailable = !status.canOrder;

  return (
    <div style={themeStyle} className="flex flex-1 flex-col bg-background">
      {/* Everything except the floating cart bar. The grayscale filter lives on this
          wrapper only, because a filter would break the cart bar's fixed position. */}
      <div className={`flex flex-1 flex-col ${unavailable ? "grayscale" : ""}`}>
      {/* Top bar */}
      <div className="border-b border-border bg-surface">
        <div className="mx-auto flex h-12 w-full max-w-3xl items-center justify-between px-4 text-sm">
          <Link href="/" className="text-stone-500 hover:text-foreground">
            ← PaliaEats
          </Link>
          <CartLink />
        </div>
      </div>

      {unavailable && <ClosedBanner status={status} variant="page" />}

      {/* Cover */}
      <div className="relative h-40 w-full bg-brand sm:h-56">
        {restaurant.cover_url && (
          <Image
            src={restaurant.cover_url}
            alt=""
            fill
            priority
            sizes="100vw"
            unoptimized
            className="object-cover"
          />
        )}
      </div>

      <div className="mx-auto w-full max-w-3xl flex-1 px-4 pb-28">
        {/* Identity */}
        <header className="flex flex-col gap-3 pb-6">
          <div className="-mt-10 flex items-end gap-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-brand shadow-sm">
              {restaurant.logo_url ? (
                <Image src={restaurant.logo_url} alt={`${restaurant.name} logo`} fill sizes="80px" unoptimized className="object-cover" />
              ) : (
                <span className="flex size-full items-center justify-center text-3xl font-bold text-white">
                  {restaurant.name.charAt(0)}
                </span>
              )}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold leading-tight sm:text-3xl">{restaurant.name}</h1>
            {restaurant.tagline && <p className="mt-1 text-stone-600">{restaurant.tagline}</p>}
          </div>

          {restaurant.cuisine_tags.length > 0 && (
            <ul className="flex flex-wrap gap-2">
              {restaurant.cuisine_tags.map((tag) => (
                <li key={tag} className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-stone-700">
                  {tag}
                </li>
              ))}
            </ul>
          )}

          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-stone-600">
            {!unavailable && <StatusBadge status={status} />}
            {restaurant.opening_time && restaurant.closing_time && (
              <span>
                {formatTime(restaurant.opening_time)} – {formatTime(restaurant.closing_time)}
              </span>
            )}
            <span>
              {restaurant.delivery_fee > 0
                ? `Delivery ${formatPrice(restaurant.delivery_fee)}`
                : "Free delivery"}
            </span>
            {restaurant.min_order_amount > 0 && (
              <span>Min. order {formatPrice(restaurant.min_order_amount)}</span>
            )}
          </div>

          {(restaurant.description || restaurant.about) && (
            <p className="text-stone-700">{restaurant.about ?? restaurant.description}</p>
          )}

          {(restaurant.address_text || restaurant.phone) && (
            <p className="text-sm text-stone-500">
              {restaurant.address_text}
              {restaurant.address_text && restaurant.phone && " · "}
              {restaurant.phone && (
                <a href={`tel:${restaurant.phone}`} className="hover:underline">
                  {restaurant.phone}
                </a>
              )}
            </p>
          )}
        </header>

        {/* Category quick links */}
        {sections.length > 1 && (
          <nav
            aria-label="Menu categories"
            className="sticky top-0 z-10 -mx-4 mb-6 overflow-x-auto border-b border-border bg-background/95 px-4 py-3 backdrop-blur"
          >
            <ul className="flex gap-2">
              {sections.map(({ category }) => (
                <li key={category.id}>
                  <a
                    href={`#category-${category.id}`}
                    className="inline-block whitespace-nowrap rounded-full border border-border bg-surface px-4 py-1.5 text-sm font-medium hover:border-brand hover:text-brand"
                  >
                    {category.name}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        )}

        {/* Menu */}
        {sections.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
            The menu is coming soon.
          </p>
        ) : (
          <div className="flex flex-col gap-10">
            {sections.map(({ category, items: categoryItems }) => (
              <section key={category.id} id={`category-${category.id}`} className="scroll-mt-20">
                <h2 className="mb-4 text-xl font-bold">{category.name}</h2>
                <ul className="flex flex-col gap-3">
                  {categoryItems.map((item) => (
                    <MenuItemCard
                      key={item.id}
                      item={item}
                      action={
                        <AddToCartButton
                          restaurant={restaurant}
                          item={item}
                          canOrder={status.canOrder}
                        />
                      }
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>
      </div>

      <CartBar restaurantId={restaurant.id} />
    </div>
  );
}
