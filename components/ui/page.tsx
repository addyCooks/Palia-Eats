import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils/cn";

// Building blocks for the panel and admin pages (v2 "denser layout for daily work").

export type QueryParams = Record<string, string | undefined>;

// Builds "/admin/orders?status=cooking&page=2", dropping empty values.
export function hrefWith(path: string, params: QueryParams, changes: QueryParams = {}): string {
  const merged = { ...params, ...changes };
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(merged)) {
    if (value) query.set(key, value);
  }
  const text = query.toString();
  return text ? `${path}?${text}` : path;
}

// Reads ?key= as a plain string (Next gives string | string[] | undefined).
export function param(value: string | string[] | undefined, max = 80): string {
  return (typeof value === "string" ? value : "").slice(0, max);
}

export function pageNumber(value: string | string[] | undefined): number {
  const n = Number(param(value, 6));
  return Number.isInteger(n) && n > 1 ? Math.min(n, 10_000) : 1;
}

export function PageHeader({
  title,
  sub,
  crumb,
  children,
}: {
  title: string;
  sub?: ReactNode;
  crumb?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-5">
      <div className="flex min-w-0 flex-col gap-1">
        {crumb && <div className="text-[13px] text-stone-500">{crumb}</div>}
        <h1 className="font-display text-[32px] leading-none sm:text-[40px]">{title}</h1>
        {sub && <p className="text-sm text-stone-600">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
    </div>
  );
}

// GET search box: works without JavaScript, keeps the other filters.
export function SearchBox({
  action,
  value,
  placeholder,
  keep = {},
}: {
  action: string;
  value: string;
  placeholder: string;
  keep?: QueryParams;
}) {
  return (
    <form action={action} role="search" className="w-full sm:w-[300px]">
      {Object.entries(keep).map(([key, v]) => (v ? <input key={key} type="hidden" name={key} value={v} /> : null))}
      <label className="flex h-11 items-center gap-2.5 rounded-xl bg-surface px-3.5 shadow-card focus-within:ring-2 focus-within:ring-brand/40">
        <Search className="size-4 shrink-0 text-stone-500" aria-hidden />
        <span className="sr-only">{placeholder}</span>
        <input
          name="q"
          type="search"
          defaultValue={value}
          placeholder={placeholder}
          autoComplete="off"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-stone-500"
        />
      </label>
    </form>
  );
}

export function FilterChips({
  chips,
  active,
  hrefFor,
  label,
}: {
  chips: { key: string; label: string }[];
  active: string;
  hrefFor: (key: string) => string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0">
      {chips.map((chip) => {
        const on = chip.key === active;
        return (
          <Link
            key={chip.key}
            href={hrefFor(chip.key)}
            aria-current={on ? "page" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center rounded-[10px] px-3.5 text-[13px] font-medium transition-colors",
              on ? "bg-deep text-brand" : "bg-surface text-stone-700 hover:bg-muted",
            )}
          >
            {chip.label}
          </Link>
        );
      })}
    </nav>
  );
}

// White table card. On laptops and tablets: columns with a header row. On phones each row
// becomes a compact wrapped line (no sideways scrolling); the header row is hidden.
export function DataTable({
  columns,
  headers,
  minWidth = 760,
  children,
  footer,
  empty,
}: {
  columns: string;
  headers: string[];
  minWidth?: number;
  children: ReactNode;
  footer?: ReactNode;
  empty?: ReactNode;
}) {
  const style = { gridTemplateColumns: columns } as CSSProperties;
  return (
    <div className="overflow-hidden rounded-[18px] bg-surface shadow-card">
      <div className="md:overflow-x-auto">
        <div style={{ "--table-min": `${minWidth}px` } as CSSProperties} className="stagger-rows md:min-w-[var(--table-min)]">
          <div
            style={style}
            className="hidden gap-4 border-b border-muted px-5 py-3.5 text-xs font-semibold tracking-[.5px] text-stone-500 md:grid"
          >
            {headers.map((header) => (
              <span key={header}>{header}</span>
            ))}
          </div>
          {empty ?? children}
        </div>
      </div>
      {footer}
    </div>
  );
}

export function DataRow({
  columns,
  href,
  children,
  className,
}: {
  columns: string;
  href?: string;
  children: ReactNode;
  className?: string;
}) {
  const style = { "--cols": columns } as CSSProperties;
  const classes = cn(
    "flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b border-muted px-4 py-3 text-sm last:border-b-0",
    "md:grid md:min-h-[58px] md:gap-4 md:px-5 md:py-2 md:[grid-template-columns:var(--cols)]",
    href && "transition-colors hover:bg-background",
    className,
  );
  return href ? (
    <Link href={href} style={style} className={classes}>
      {children}
    </Link>
  ) : (
    <div style={style} className={classes}>
      {children}
    </div>
  );
}

// A table cell that never wraps: long names get "…".
export function Cell({ children, strong, className }: { children: ReactNode; strong?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        "min-w-0 max-w-full truncate",
        strong ? "font-semibold text-foreground" : "text-stone-600",
        className,
      )}
    >
      {children}
    </span>
  );
}

export function TableEmpty({ children }: { children: ReactNode }) {
  return <p className="px-5 py-10 text-center text-sm text-stone-500">{children}</p>;
}

export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);

  // Show at most 5 page buttons around the current one.
  const start = Math.max(1, Math.min(page - 2, pages - 4));
  const numbers = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i);

  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5 text-[13px] text-stone-600">
      <span>
        Showing {from}–{to} of {total.toLocaleString("en-IN")}
      </span>
      {pages > 1 && (
        <nav aria-label="Pages" className="flex gap-1.5">
          {numbers.map((n) => (
            <Link
              key={n}
              href={hrefFor(n)}
              aria-current={n === page ? "page" : undefined}
              className={cn(
                "grid size-8 place-items-center rounded-lg tabular-nums",
                n === page ? "bg-deep font-bold text-brand" : "bg-background hover:bg-muted",
              )}
            >
              {n}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

// KPI card. `dark` is the highlighted one (ink card with saffron text).
export function Kpi({
  label,
  value,
  delta,
  dark,
  size = "lg",
}: {
  label: string;
  value: string;
  delta?: string;
  dark?: boolean;
  size?: "lg" | "md";
}) {
  return (
    <div
      className={cn(
        "lift flex min-w-0 flex-col gap-1.5 rounded-[18px] p-5",
        dark ? "bg-[#16120D] text-brand dark:bg-[#2A241C]" : "bg-surface text-foreground shadow-card",
      )}
    >
      <span className={cn("text-[13px]", dark ? "opacity-80" : "text-stone-500")}>{label}</span>
      <span className={cn("truncate font-display leading-none", size === "lg" ? "text-[34px] sm:text-[38px]" : "text-[28px] sm:text-[32px]")}>
        {value}
      </span>
      {delta && <span className="text-[13px] font-semibold">{delta}</span>}
    </div>
  );
}

// Simple bar chart: label under each bar, optional value on top.
export function Bars({
  bars,
  height = 200,
}: {
  bars: { label: string; value: number; display?: string; tone: "hot" | "high" | "low" }[];
  height?: number;
}) {
  const max = Math.max(1, ...bars.map((bar) => bar.value));
  const tones = { hot: "bg-[#C2410C]", high: "bg-brand", low: "bg-[#FDE7BC] dark:bg-[#3A2C14]" };
  return (
    <div className="flex items-end gap-2 sm:gap-3" style={{ height }}>
      {bars.map((bar, i) => (
        <div key={bar.label} className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-1.5">
          {bar.display && (
            <span className="anim-fade-in text-[11px] font-semibold text-stone-600" style={{ animationDelay: `${300 + i * 60}ms` }}>
              {bar.display}
            </span>
          )}
          <div
            className={cn("pe-grow w-full rounded-md", tones[bar.tone])}
            style={{ height: `${Math.max(2, Math.round((bar.value / max) * 86))}%`, animationDelay: `${150 + i * 60}ms` }}
            title={`${bar.label}: ${bar.display ?? bar.value}`}
          />
          <span className="text-[11px] text-stone-500 sm:text-xs">{bar.label}</span>
        </div>
      ))}
    </div>
  );
}

export function Panel({ title, children, className }: { title?: string; children: ReactNode; className?: string }) {
  return (
    <section className={cn("flex min-w-0 flex-col gap-4 rounded-[18px] bg-surface p-5 shadow-card", className)}>
      {title && <h2 className="text-[17px] font-semibold">{title}</h2>}
      {children}
    </section>
  );
}
