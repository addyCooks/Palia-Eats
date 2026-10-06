import Link from "next/link";
import { Plus } from "lucide-react";
import type { PublicDish } from "@/lib/queries/public";
import { formatPrice } from "@/lib/utils/format";
import { dishPhoto } from "@/lib/utils/placeholder";
import { Photo } from "@/components/ui/Photo";

const rupees = (amount: number) => formatPrice(amount).replace(/\.00$/, "");

// The v2 dish card: a round plate overlapping the top edge, centred name, place and price
// with a small + button. `highlight` is the one saffron card per row.
// Phones get 100px plates (v2 4b), laptops 120–132px (4a, 8a).
export function DishPlateCard({ dish, highlight = false }: { dish: PublicDish; highlight?: boolean }) {
  const meta = [
    dish.restaurants.name,
    dish.restaurants.rating_avg !== null ? `★ ${Number(dish.restaurants.rating_avg).toFixed(1)}` : null,
    dish.prep_minutes ? `${dish.prep_minutes} min` : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return (
    <Link
      href={`/restaurants/${dish.restaurants.slug}#dish-${dish.id}`}
      className={`relative flex h-full flex-col items-center gap-2 rounded-2xl px-3.5 pb-3.5 pt-16 text-center transition-transform hover:-translate-y-0.5 lg:gap-2.5 lg:px-5 lg:pb-5 lg:pt-[86px] ${
        highlight ? "bg-brand text-on-brand shadow-saffron" : "bg-surface shadow-card"
      }`}
    >
      <span className="absolute -top-11 left-1/2 size-[100px] -translate-x-1/2 overflow-hidden rounded-full shadow-plate lg:-top-[62px] lg:size-[132px]">
        <Photo src={dishPhoto(dish)} alt="" sizes="132px" />
      </span>
      <span className="line-clamp-2 min-h-9 text-sm font-semibold leading-tight lg:min-h-10 lg:text-base">
        {dish.name}
      </span>
      <span className={`line-clamp-1 text-xs ${highlight ? "opacity-80" : "text-stone-500"}`}>{meta}</span>
      <span className="mt-1 flex items-center justify-between self-stretch">
        <span className="text-base font-bold tabular-nums lg:text-lg">{rupees(dish.price)}</span>
        <span
          aria-hidden
          className={`grid size-[26px] place-items-center rounded-[7px] ${highlight ? "bg-[#1A1206] text-brand" : "bg-brand text-on-brand"}`}
        >
          <Plus className="size-3" strokeWidth={3.5} />
        </span>
      </span>
    </Link>
  );
}
