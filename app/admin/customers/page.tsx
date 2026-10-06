import type { Metadata } from "next";
import { ADMIN_PAGE_SIZE, FREQUENT_ORDERS, getAdminCustomers, type CustomerFilter } from "@/lib/queries/admin";
import { wholeRupees } from "@/lib/orders/stats";
import { Badge } from "@/components/ui/Badge";
import {
  Cell,
  DataRow,
  DataTable,
  FilterChips,
  PageHeader,
  Pagination,
  SearchBox,
  TableEmpty,
  hrefWith,
  pageNumber,
  param,
} from "@/components/ui/page";

export const metadata: Metadata = { title: "Customers" };

const CHIPS: { key: CustomerFilter; label: string }[] = [
  { key: "all", label: "All" },
  { key: "new", label: "New" },
  { key: "frequent", label: "Frequent" },
  { key: "blocked", label: "Blocked" },
];

const COLUMNS = "minmax(0,1.4fr) minmax(0,1.2fr) minmax(0,1fr) 90px 110px 100px";
const TONE = { Active: "warm", New: "new", Blocked: "error" } as const;

// "+91 98765 43210"
function prettyPhone(phone: string | null): string {
  const digits = (phone ?? "").replace(/\D/g, "").slice(-10);
  return digits.length === 10 ? `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` : (phone ?? "—");
}

export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const params = await searchParams;
  const search = param(params.q);
  const raw = param(params.show);
  const filter: CustomerFilter = CHIPS.some((chip) => chip.key === raw) ? (raw as CustomerFilter) : "all";
  const page = pageNumber(params.page);

  const { customers, matching, registered, newThisWeek } = await getAdminCustomers({ filter, search, page });
  const keep = { q: search || undefined, show: filter === "all" ? undefined : filter };

  return (
    <>
      <PageHeader
        title="Customers"
        sub={`${registered.toLocaleString("en-IN")} registered · ${newThisWeek} new this week`}
      >
        <SearchBox action="/admin/customers" value={search} placeholder="Name or phone number" keep={{ show: keep.show }} />
      </PageHeader>

      <FilterChips
        label="Filter customers"
        chips={CHIPS}
        active={filter}
        hrefFor={(key) => hrefWith("/admin/customers", keep, { show: key === "all" ? undefined : key, page: undefined })}
      />

      <DataTable
        columns={COLUMNS}
        headers={["CUSTOMER", "PHONE", "AREA", "ORDERS", "SPENT", "STATUS"]}
        empty={customers.length === 0 ? <TableEmpty>No customers found.</TableEmpty> : undefined}
        footer={
          <Pagination
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={matching}
            hrefFor={(n) => hrefWith("/admin/customers", keep, { page: n > 1 ? String(n) : undefined })}
          />
        }
      >
        {customers.map((customer) => (
          <DataRow key={customer.id} columns={COLUMNS} href={`/admin/customers/${customer.id}`}>
            <Cell strong>
              {customer.full_name ?? "No name yet"}
              {customer.role === "admin" && <span className="ml-1.5 text-xs font-semibold text-accent">Admin</span>}
            </Cell>
            <Cell>{prettyPhone(customer.phone ?? customer.whatsapp_phone)}</Cell>
            <Cell>{customer.area ?? "—"}</Cell>
            <Cell>{customer.orderCount}</Cell>
            <Cell strong>{wholeRupees(customer.spent)}</Cell>
            <span>
              <Badge tone={TONE[customer.state]}>{customer.state}</Badge>
            </span>
          </DataRow>
        ))}
      </DataTable>
      <p className="text-xs text-stone-500">
        New = joined in the last 7 days · Frequent = {FREQUENT_ORDERS}+ orders · Spent leaves out cancelled orders.
      </p>
    </>
  );
}
