import type { Metadata } from "next";
import {
  RATINGS_LOOKED_AT,
  RATINGS_PAGE_SIZE,
  getRatingsCheck,
  type RatingsFilter,
} from "@/lib/queries/ratings-check";
import { FAST_DELIVERY_MINUTES, MANY_ORDERS, MANY_ORDERS_HOURS } from "@/lib/ratings/checks";
import { MIN_RATINGS_TO_SHOW } from "@/lib/utils/rating";
import { RatingCard } from "@/components/admin/RatingCard";
import { Badge } from "@/components/ui/Badge";
import {
  Cell,
  DataRow,
  DataTable,
  FilterChips,
  PageHeader,
  Pagination,
  Panel,
  SearchBox,
  TableEmpty,
  hrefWith,
  pageNumber,
  param,
} from "@/components/ui/page";

export const metadata: Metadata = { title: "Ratings check" };

const SUMMARY_COLUMNS = "minmax(0,1.4fr) 80px 100px 130px 90px 90px 110px";

const oneDecimal = (n: number) => n.toFixed(1);

export default async function AdminRatingsPage({ searchParams }: PageProps<"/admin/ratings">) {
  const params = await searchParams;
  const search = param(params.q);
  const filter: RatingsFilter = param(params.show) === "all" ? "all" : "needs";
  const page = pageNumber(params.page);

  const { rows, matching, analysed, needsLook, summaries } = await getRatingsCheck({ filter, search, page });
  const keep = { q: search || undefined, show: filter === "all" ? undefined : filter };

  return (
    <>
      <PageHeader
        title="Ratings check"
        sub={
          analysed === 0
            ? "No ratings yet."
            : `${needsLook} of the latest ${analysed} ${analysed === 1 ? "rating needs" : "ratings need"} a look`
        }
      >
        <SearchBox action="/admin/ratings" value={search} placeholder="Customer, restaurant, order or phone" keep={{ show: keep.show }} />
      </PageHeader>

      <FilterChips
        label="Filter ratings"
        chips={[
          { key: "needs", label: `Needs a look (${needsLook})` },
          { key: "all", label: `All (${analysed})` },
        ]}
        active={filter}
        hrefFor={(key) => hrefWith("/admin/ratings", keep, { show: key === "needs" ? undefined : key, page: undefined })}
      />

      {summaries.length > 0 && (
        <DataTable
          columns={SUMMARY_COLUMNS}
          headers={["RESTAURANT", "RATINGS", "AVERAGE", "WITHOUT FLAGGED", "5★ SHARE", "FLAGGED", "FASTEST"]}
        >
          {summaries.map((summary) => (
            <DataRow key={summary.restaurantId} columns={SUMMARY_COLUMNS} href={`/admin/restaurants/${summary.restaurantId}`}>
              <Cell strong>{summary.name}</Cell>
              <Cell>{summary.ratings}</Cell>
              <Cell>★ {oneDecimal(summary.average)}</Cell>
              <Cell>{summary.averageWithoutFlagged !== null ? `★ ${oneDecimal(summary.averageWithoutFlagged)}` : "—"}</Cell>
              <Cell>{Math.round(summary.fiveStarShare * 100)}%</Cell>
              <span>
                {summary.flagged > 0 ? <Badge tone="warm">{summary.flagged}</Badge> : <Cell>0</Cell>}
              </span>
              <Cell>{summary.fastestMinutes !== null ? `${Math.max(0, Math.round(summary.fastestMinutes))} min` : "—"}</Cell>
            </DataRow>
          ))}
        </DataTable>
      )}

      {rows.length === 0 ? (
        <Panel>
          <TableEmpty>
            {analysed === 0
              ? "No ratings yet. When customers rate their orders, they appear here."
              : search
                ? "No ratings match that search."
                : "Nothing needs a look right now. Choose “All” to see every rating."}
          </TableEmpty>
        </Panel>
      ) : (
        <div className="stagger flex flex-col gap-3.5">
          {rows.map((row) => (
            <RatingCard key={row.orderId} row={row} />
          ))}
        </div>
      )}

      {matching > RATINGS_PAGE_SIZE && (
        <div className="overflow-hidden rounded-[18px] bg-surface shadow-card">
          <Pagination
            page={page}
            pageSize={RATINGS_PAGE_SIZE}
            total={matching}
            hrefFor={(n) => hrefWith("/admin/ratings", keep, { page: n > 1 ? String(n) : undefined })}
          />
        </div>
      )}

      <Panel title="How this works">
        <div className="flex flex-col gap-3 text-sm text-stone-600">
          <p>
            A restaurant moves its own orders to &ldquo;Delivered&rdquo;, so a restaurant could order from made-up
            accounts and rate itself. These checks look for the traces that leaves. A sign is a reason to look, not
            proof: a family can share a phone or an address.
          </p>
          <ul className="flex flex-col gap-1.5">
            <li>
              <b className="text-foreground">Strong signs (3 points):</b> ordered with the restaurant&apos;s own phone,
              email or address; other accounts with the same phone, the same email inbox (name+1@gmail.com) or the same
              map pin.
            </li>
            <li>
              <b className="text-foreground">Medium signs (2 points):</b> marked delivered in under {FAST_DELIVERY_MINUTES}{" "}
              minutes; other accounts with the same address or the same comment; {MANY_ORDERS}+ orders to the same
              restaurant within {MANY_ORDERS_HOURS} hours.
            </li>
            <li>
              <b className="text-foreground">Weak signs (1 point):</b> rated within a minute of delivery; the
              customer&apos;s only orders are from this one restaurant.
            </li>
          </ul>
          <p>
            Score 5 or more: look first. 3–4: worth a look. 1–2: minor. The table &ldquo;Without flagged&rdquo; shows
            the average if the ratings that need a look were removed. Customers only see stars once a restaurant has{" "}
            {MIN_RATINGS_TO_SHOW} ratings. This page checks the latest {RATINGS_LOOKED_AT} ratings. It can&apos;t see
            devices or internet addresses, because PaliaEats doesn&apos;t keep them.
          </p>
        </div>
      </Panel>
    </>
  );
}
