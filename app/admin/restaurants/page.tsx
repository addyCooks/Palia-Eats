import type { Metadata } from "next";
import Link from "next/link";
import { getAdminRestaurantsTable, type RestaurantFilter } from "@/lib/queries/admin";
import { Badge } from "@/components/ui/Badge";
import {
  Cell,
  DataRow,
  DataTable,
  FilterChips,
  PageHeader,
  SearchBox,
  TableEmpty,
  hrefWith,
  param,
} from "@/components/ui/page";

export const metadata: Metadata = { title: "Restaurants" };

const CHIPS: { key: RestaurantFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "live", label: "Live" },
  { key: "paused", label: "Paused" },
  { key: "pending", label: "Pending" },
];

const COLUMNS = "minmax(0,1.5fr) minmax(0,1.2fr) minmax(0,1fr) 80px 110px 100px";
const TONE = { Live: "live", Paused: "neutral", Pending: "error" } as const;

export default async function AdminRestaurantsPage({ searchParams }: PageProps<"/admin/restaurants">) {
  const params = await searchParams;
  const search = param(params.q);
  const raw = param(params.status);
  const filter: RestaurantFilter = CHIPS.some((chip) => chip.key === raw) ? (raw as RestaurantFilter) : "all";

  const { rows, total, pending } = await getAdminRestaurantsTable({ filter, search });
  const keep = { q: search || undefined, status: filter === "all" ? undefined : filter };

  return (
    <>
      <PageHeader
        title="Restaurants"
        sub={`${total} ${total === 1 ? "partner" : "partners"}${pending > 0 ? ` · ${pending} waiting for approval` : ""}`}
      >
        <SearchBox action="/admin/restaurants" value={search} placeholder="Restaurant or owner" keep={{ status: keep.status }} />
        <Link
          href="/admin/restaurants/new"
          className="inline-flex h-11 items-center rounded-xl bg-brand px-5 text-sm font-bold text-on-brand hover:bg-brand-dark"
        >
          + Add restaurant
        </Link>
      </PageHeader>

      <FilterChips
        label="Filter restaurants"
        chips={CHIPS}
        active={filter}
        hrefFor={(key) => hrefWith("/admin/restaurants", keep, { status: key === "all" ? undefined : key })}
      />

      <DataTable
        columns={COLUMNS}
        headers={["RESTAURANT", "OWNER", "AREA", "RATING", "ORDERS / WK", "STATUS"]}
        empty={
          rows.length === 0 ? (
            <TableEmpty>{total === 0 ? "No restaurants yet. Add your first one." : "No restaurants match that."}</TableEmpty>
          ) : undefined
        }
        footer={
          <p className="px-5 py-3.5 text-[13px] text-stone-600">
            Showing {rows.length} of {total}
          </p>
        }
      >
        {rows.map((row) => (
          <DataRow key={row.id} columns={COLUMNS} href={`/admin/restaurants/${row.id}`}>
            <Cell strong>
              {row.name}
              {!row.notification_email && (
                <span className="ml-2 text-xs font-semibold text-red-700" title="This restaurant isn't told about new orders">
                  · no order email
                </span>
              )}
            </Cell>
            <Cell>{row.owner_name ?? "—"}</Cell>
            <Cell>{row.area ?? "—"}</Cell>
            <Cell strong>{row.rating_avg !== null ? `★ ${Number(row.rating_avg).toFixed(1)}` : "—"}</Cell>
            <Cell>{row.ordersThisWeek}</Cell>
            <span>
              <Badge tone={TONE[row.state]}>{row.state}</Badge>
            </span>
          </DataRow>
        ))}
      </DataTable>
      <p className="text-xs text-stone-500">
        Live = taking orders · Paused = visible but not taking orders · Pending = hidden until you approve it.
      </p>
    </>
  );
}
