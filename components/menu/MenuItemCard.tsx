import type { ReactNode } from "react";
import Image from "next/image";
import type { MenuItem } from "@/types/app";
import { formatPrice } from "@/lib/utils/format";
import { VegMark } from "@/components/menu/VegMark";
import { Badge } from "@/components/ui/Badge";
import { cn } from "@/lib/utils/cn";

type MenuItemCardProps = {
  item: MenuItem;
  // Slot for the "Add" button (added with the cart in the next step)
  action?: ReactNode;
};

export function MenuItemCard({ item, action }: MenuItemCardProps) {
  return (
    <li
      className={cn(
        "flex gap-4 rounded-2xl border border-border bg-surface p-4",
        !item.is_available && "opacity-60",
      )}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <VegMark isVeg={item.is_veg} />
          {!item.is_available && <Badge tone="warning">Sold out</Badge>}
        </div>
        <h3 className="font-semibold leading-snug">{item.name}</h3>
        <p className="font-medium">{formatPrice(item.price)}</p>
        {item.description && (
          <p className="line-clamp-2 text-sm text-stone-600">{item.description}</p>
        )}
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2">
        {item.image_url && (
          <div className="relative size-24 overflow-hidden rounded-xl bg-muted sm:size-28">
            <Image
              src={item.image_url}
              alt={item.name}
              fill
              sizes="112px"
              unoptimized
              className="object-cover"
            />
          </div>
        )}
        {item.is_available && action}
      </div>
    </li>
  );
}
