import type { ReactNode } from "react";
import type { MenuItem } from "@/types/app";
import { formatPrice } from "@/lib/utils/format";
import { dishPhoto } from "@/lib/utils/placeholder";
import { VegMark } from "@/components/menu/VegMark";
import { Photo } from "@/components/ui/Photo";

type MenuItemCardProps = {
  item: MenuItem;
  // The ADD button / quantity stepper, drawn over the bottom edge of the plate
  action?: ReactNode;
  // Opens the dish sheet (big photo, half / full, quantity)
  onOpen?: () => void;
};

const rupees = (amount: number) => formatPrice(amount).replace(/\.00$/, "");

// One dish on a restaurant's menu (v2 "menu row"): text on the left, a round plate photo on
// the right with the ADD button overlapping its bottom edge.
export function MenuItemCard({ item, action, onOpen }: MenuItemCardProps) {
  const soldOut = !item.is_available;

  return (
    <li id={`dish-${item.id}`} className="flex scroll-mt-40 items-center gap-4 rounded-[18px] bg-surface py-4 pl-[18px] pr-3.5 shadow-[0_6px_20px_rgba(120,70,0,.05)] transition-shadow duration-500 hover:shadow-[0_14px_34px_rgba(120,70,0,.12)] sm:gap-5 sm:py-[18px] sm:pl-[22px] sm:pr-[18px] dark:shadow-none">
      <div className={`flex min-w-0 flex-1 flex-col gap-1.5 ${soldOut ? "opacity-60" : ""}`}>
        <div className="flex items-center gap-2">
          <VegMark isVeg={item.is_veg} egg={item.contains_egg} />
          {item.is_bestseller && <span className="text-[11px] font-bold tracking-[.6px] text-accent">BESTSELLER</span>}
        </div>
        <h3 className="text-base font-semibold leading-snug sm:text-lg">
          {onOpen ? (
            <button type="button" onClick={onOpen} className="text-left hover:underline">
              {item.name}
            </button>
          ) : (
            item.name
          )}
        </h3>
        {item.description && (
          <p className="line-clamp-3 text-pretty text-[13px] leading-normal text-stone-600 sm:text-sm">{item.description}</p>
        )}
        <p className="mt-1 flex flex-wrap items-baseline gap-x-2 tabular-nums">
          <span className="text-[17px] font-bold">{rupees(item.price)}</span>
          {item.half_price !== null && <span className="text-[13px] text-stone-500">Half {rupees(item.half_price)}</span>}
        </p>
        {soldOut && <p className="text-xs font-bold text-red-700 sm:text-[13px]">Sold out today</p>}
      </div>

      <div className="relative h-[112px] w-[100px] shrink-0 sm:h-[132px] sm:w-[120px]">
        <button
          type="button"
          onClick={onOpen}
          disabled={!onOpen}
          tabIndex={-1}
          aria-hidden
          className={`relative block size-[100px] overflow-hidden rounded-full shadow-[0_10px_22px_rgba(0,0,0,.18)] sm:size-[120px] ${
            soldOut ? "grayscale" : ""
          }`}
        >
          <Photo src={dishPhoto(item)} alt="" sizes="120px" />
        </button>
        {!soldOut && action && <div className="absolute inset-x-1.5 bottom-0 sm:inset-x-2.5">{action}</div>}
      </div>
    </li>
  );
}
