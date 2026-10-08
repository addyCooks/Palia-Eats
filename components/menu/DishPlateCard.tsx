import Link from "next/link";
import { Plus } from "lucide-react";
import type { PublicDish } from "@/lib/queries/public";
import { formatPrice } from "@/lib/utils/format";
import { dishPhoto } from "@/lib/utils/placeholder";
import { publicRating } from "@/lib/utils/rating";
import { Photo } from "@/components/ui/Photo";

const rupees = (amount: number) => formatPrice(amount).replace(/\.00$/, "");

// The v2 dish card: a round plate overlapping the top edge, centred name, place and price
// with a small + button. `highlight` is the one saffron card per row.
// Phones get 100px plates (v2 4b), laptops 120–132px (4a, 8a). `compact` makes the whole
// card about 14% smaller on phones (the home page's "Popular today" row); laptops unchanged.
export function DishPlateCard({
  dish,
  highlight = false,
  compact = false,
}: {
  dish: PublicDish;
  highlight?: boolean;
  compact?: boolean;
}) {
  const meta = [
    dish.restaurants.name,
    publicRating(dish.restaurants) ? `★ ${publicRating(dish.restaurants)!.avg}` : null,
    dish.prep_minutes ? `${dish.prep_minutes} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/restaurants/${dish.restaurants.slug}#dish-${dish.id}`}
      className={`relative flex h-full flex-col items-center rounded-2xl text-center transition-transform duration-500 hover:-translate-y-1 lg:gap-2.5 lg:px-5 lg:pb-5 lg:pt-[86px] ${
        compact ? "gap-[7px] px-3 pb-3 pt-[55px]" : "gap-2 px-3.5 pb-3.5 pt-16"
      } ${
        highlight ? "bg-brand text-on-brand shadow-saffron" : "bg-surface shadow-card"
      }`}
    >
      <span
        className={`absolute left-1/2 -translate-x-1/2 overflow-hidden rounded-full shadow-plate lg:-top-[62px] lg:size-[132px] ${
          compact ? "-top-[38px] size-[86px]" : "-top-11 size-[100px]"
        }`}
      >
        <Photo src={dishPhoto(dish)} alt="" sizes="132px" />
      </span>
      <span
        className={`line-clamp-2 font-semibold leading-tight lg:min-h-10 lg:text-base ${compact ? "min-h-[31px] text-[12px]" : "min-h-9 text-sm"}`}
      >
        {dish.name}
      </span>
      <span className={`line-clamp-1 lg:text-xs ${compact ? "text-[10.5px]" : "text-xs"} ${highlight ? "opacity-80" : "text-stone-500"}`}>
        {meta}
      </span>
      <span className={`flex items-center justify-between self-stretch lg:mt-1 ${compact ? "mt-0.5" : "mt-1"}`}>
        <span className={`font-bold tabular-nums lg:text-lg ${compact ? "text-[14px]" : "text-base"}`}>{rupees(dish.price)}</span>
        <span
          aria-hidden
          className={`grid place-items-center rounded-[7px] lg:size-[26px] ${compact ? "size-[22px]" : "size-[26px]"} ${
            highlight ? "bg-[#1A1206] text-brand" : "bg-brand text-on-brand"
          }`}
        >
          <Plus className="size-3" strokeWidth={3.5} />
        </span>
      </span>
    </Link>
  );
}
