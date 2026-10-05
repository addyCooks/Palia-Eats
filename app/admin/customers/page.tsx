import type { Metadata } from "next";
import Link from "next/link";
import { getAdminCustomers } from "@/lib/queries/admin";
import { formatDateTime, formatPrice } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Customers" };

export default async function AdminCustomersPage({ searchParams }: PageProps<"/admin/customers">) {
  const params = await searchParams;
  const search = typeof params.q === "string" ? params.q.slice(0, 80) : "";
  const customers = await getAdminCustomers(search);

  return (
    <>
      <h1 className="text-2xl font-bold">Customers</h1>

      <form className="mt-4 flex gap-2" role="search">
        <input
          name="q"
          defaultValue={search}
          placeholder="Search by name, phone or email"
          aria-label="Search customers"
          className="h-11 flex-1 rounded-xl border border-border bg-surface px-3 outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button type="submit" className="rounded-xl bg-brand px-5 font-medium text-white hover:bg-brand-dark">
          Search
        </button>
      </form>

      {customers.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
          No customers found.
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {customers.map((customer) => (
            <li key={customer.id}>
              <Link
                href={`/admin/customers/${customer.id}`}
                className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 shadow-sm hover:bg-muted sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="flex items-center gap-2 font-semibold">
                    <span className="truncate">{customer.full_name ?? "No name yet"}</span>
                    {customer.role === "admin" && <Badge tone="neutral">Admin</Badge>}
                  </p>
                  <p className="truncate text-sm text-stone-600">
                    {customer.email ?? "No email"}
                    {customer.phone ? ` · ${customer.phone}` : ""}
                  </p>
                </div>
                <div className="text-sm text-stone-600 sm:text-right">
                  <p>
                    <strong className="text-foreground">{customer.orderCount}</strong>{" "}
                    {customer.orderCount === 1 ? "order" : "orders"} · {formatPrice(customer.spent)}
                  </p>
                  <p className="text-xs">
                    {customer.lastOrderAt
                      ? `Last order ${formatDateTime(customer.lastOrderAt)}`
                      : customer.created_at
                        ? `Joined ${formatDateTime(customer.created_at)}`
                        : ""}
                  </p>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
      <p className="mt-6 text-xs text-stone-500">Total spent excludes cancelled orders.</p>
    </>
  );
}
