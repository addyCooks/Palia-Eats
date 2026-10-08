import Link from "next/link";
import type { RatingCheckRow } from "@/lib/queries/ratings-check";
import type { Level } from "@/lib/ratings/checks";
import { formatDateTime } from "@/lib/utils/format";
import { BlockCustomerButton } from "@/components/admin/BlockCustomerButton";
import { RemoveRatingButton } from "@/components/admin/RemoveRatingButton";
import { Badge } from "@/components/ui/Badge";

const LEVEL: Record<Level, { label: string; tone: "error" | "warm" | "neutral" }> = {
  high: { label: "Look at this first", tone: "error" },
  medium: { label: "Needs a look", tone: "warm" },
  low: { label: "Minor signs", tone: "neutral" },
  none: { label: "No signs", tone: "neutral" },
};

const DOT = { 3: "bg-red-600", 2: "bg-amber-400", 1: "bg-stone-300" } as const;
const WEIGHT = { 3: "Strong sign", 2: "Medium sign", 1: "Weak sign" } as const;

// "+91 98765 43210"
function prettyPhone(phone: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : (phone ?? "");
}

const stars = (n: number) => "★".repeat(n) + "☆".repeat(5 - n);

export function RatingCard({ row }: { row: RatingCheckRow }) {
  const level = LEVEL[row.level];
  return (
    <article className="flex flex-col gap-3 rounded-[18px] bg-surface p-4 shadow-card sm:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
            <span className="text-lg tracking-[1px] text-brand" aria-label={`${row.stars} stars`}>
              {stars(row.stars)}
            </span>
            <b className="truncate">{row.restaurantName}</b>
          </p>
          <p className="text-[13px] text-stone-500">
            {row.orderNumber !== null ? (
              <Link href={`/admin/orders/${row.orderId}`} className="font-semibold text-accent hover:underline">
                Order #{row.orderNumber}
              </Link>
            ) : (
              "Order"
            )}{" "}
            · rated {formatDateTime(row.createdAt)}
          </p>
        </div>
        <Badge tone={level.tone}>
          {level.label}
          {row.score > 0 ? ` · score ${row.score}` : ""}
        </Badge>
      </header>

      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
        <b>{row.customerName}</b>
        {row.customerPhone && <span className="text-stone-600">{prettyPhone(row.customerPhone)}</span>}
        {row.customerEmail && <span className="break-all text-stone-600">{row.customerEmail}</span>}
        {row.customerBlocked && <Badge tone="error">Blocked</Badge>}
      </p>

      {row.comment && (
        <p className="rounded-xl bg-background px-3.5 py-2.5 text-sm italic text-stone-700">&ldquo;{row.comment}&rdquo;</p>
      )}

      {row.flags.length > 0 ? (
        <ul className="flex flex-col gap-1.5">
          {row.flags.map((flag) => (
            <li key={flag.id} className="flex items-start gap-2.5 text-sm">
              <span className={`mt-[7px] size-2 shrink-0 rounded-full ${DOT[flag.weight]}`} title={WEIGHT[flag.weight]} aria-hidden />
              <span>
                {flag.text} <span className="text-xs text-stone-500">· {WEIGHT[flag.weight].toLowerCase()}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-stone-500">None of the checks found anything.</p>
      )}

      {row.placedAt && (
        <p className="text-xs text-stone-500">
          Ordered {formatDateTime(row.placedAt)}
          {row.deliveredAt && row.deliveredMinutes !== null
            ? ` · delivered ${row.deliveredMinutes < 1 ? "under a minute" : `${Math.round(row.deliveredMinutes)} min`} later`
            : " · no delivery time recorded"}
        </p>
      )}

      <div className="flex flex-wrap items-start gap-2.5 pt-1">
        <RemoveRatingButton orderId={row.orderId} stars={row.stars} restaurant={row.restaurantName} />
        <BlockCustomerButton customerId={row.customerId} blocked={row.customerBlocked} name={row.customerName} />
      </div>
    </article>
  );
}
