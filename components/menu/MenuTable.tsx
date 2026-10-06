import Link from "next/link";
import type { MenuCategory, MenuItem } from "@/types/app";
import { wholeRupees } from "@/lib/orders/stats";
import { dishPhoto } from "@/lib/utils/placeholder";
import { VegMark } from "@/components/menu/VegMark";
import { StockToggle } from "@/components/menu/StockToggle";
import { Badge } from "@/components/ui/Badge";
import { Photo } from "@/components/ui/Photo";
import { Cell, DataRow, DataTable, TableEmpty } from "@/components/ui/page";

const COLUMNS = "minmax(0,2.4fr) minmax(0,1fr) 0.8fr 0.8fr 0.6fr";

type StockAction = (input: { itemId: string; available: boolean }) => Promise<{ error?: string }>;

function DishPlate({ item, size }: { item: MenuItem; size: number }) {
  return (
    <span
      className={`relative shrink-0 overflow-hidden rounded-full shadow-[0_4px_10px_rgba(0,0,0,.12)] ${
        item.is_available ? "" : "grayscale"
      }`}
      style={{ width: size, height: size }}
    >
      <Photo src={dishPhoto(item)} alt="" sizes={`${size}px`} />
    </span>
  );
}

function priceText(item: MenuItem) {
  return item.half_price !== null
    ? `${wholeRupees(item.price)} · half ${wholeRupees(item.half_price)}`
    : wholeRupees(item.price);
}

// The menu manager list (v2 7b): photo, dish, category, price, plates sold this week and
// the in-stock switch. A table on laptops, cards on phones. Shared by panel and admin.
export function MenuTable({
  categories,
  items,
  weekly,
  editHref,
  stockAction,
}: {
  categories: MenuCategory[];
  items: MenuItem[];
  weekly: Map<string, number>;
  editHref: (itemId: string) => string;
  stockAction: StockAction;
}) {
  const categoryName = new Map(categories.map((category) => [category.id, category.name]));
  const order = new Map(categories.map((category, i) => [category.id, i]));
  const sorted = [...items].sort(
    (a, b) =>
      (order.get(a.category_id ?? "") ?? 999) - (order.get(b.category_id ?? "") ?? 999) ||
      a.sort_order - b.sort_order ||
      a.name.localeCompare(b.name),
  );

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          columns={COLUMNS}
          headers={["DISH", "CATEGORY", "PRICE", "ORDERS / WEEK", "IN STOCK"]}
          empty={sorted.length === 0 ? <TableEmpty>No dishes yet. Add your first dish.</TableEmpty> : undefined}
        >
          {sorted.map((item) => (
            <DataRow key={item.id} columns={COLUMNS} className={item.is_available ? "" : "[&>*:not(:last-child)]:opacity-55"}>
              <span className="flex min-w-0 items-center gap-3.5">
                <DishPlate item={item} size={48} />
                <span className="flex min-w-0 flex-col">
                  <Link href={editHref(item.id)} className="flex min-w-0 items-center gap-2 font-semibold hover:underline">
                    <VegMark isVeg={item.is_veg} egg={item.contains_egg} />
                    <span className="truncate">{item.name}</span>
                  </Link>
                  {item.is_bestseller && <span className="kicker text-[10px]">Bestseller</span>}
                </span>
              </span>
              <Cell>{categoryName.get(item.category_id ?? "") ?? "—"}</Cell>
              <Cell strong>{priceText(item)}</Cell>
              <Cell>{weekly.get(item.id) ?? 0}</Cell>
              <StockToggle itemId={item.id} available={item.is_available} name={item.name} action={stockAction} />
            </DataRow>
          ))}
        </DataTable>
      </div>

      <div className="flex flex-col gap-5 md:hidden">
        {categories.map((category) => {
          const list = sorted.filter((item) => item.category_id === category.id);
          if (list.length === 0) return null;
          return (
            <section key={category.id} className="flex flex-col gap-2.5">
              <h2 className="font-display text-xl">{category.name}</h2>
              {list.map((item) => (
                <article key={item.id} className="flex items-center gap-3 rounded-[18px] bg-surface p-3 shadow-card">
                  <DishPlate item={item} size={52} />
                  <div className={`min-w-0 flex-1 ${item.is_available ? "" : "opacity-60"}`}>
                    <Link href={editHref(item.id)} className="flex items-center gap-1.5 text-[15px] font-semibold">
                      <VegMark isVeg={item.is_veg} egg={item.contains_egg} />
                      <span className="truncate">{item.name}</span>
                    </Link>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-sm">
                      <b className="tabular-nums">{priceText(item)}</b>
                      <span className="text-xs text-stone-500">{weekly.get(item.id) ?? 0} this week</span>
                      {!item.is_available && <Badge tone="error">Out of stock</Badge>}
                    </p>
                  </div>
                  <StockToggle itemId={item.id} available={item.is_available} name={item.name} action={stockAction} />
                </article>
              ))}
            </section>
          );
        })}
        {sorted.length === 0 && (
          <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
            No dishes yet. Add your first dish.
          </p>
        )}
      </div>
    </>
  );
}
