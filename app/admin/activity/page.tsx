import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime } from "@/lib/utils/format";
import { Cell, DataRow, DataTable, PageHeader, Pagination, TableEmpty, pageNumber } from "@/components/ui/page";

export const metadata: Metadata = { title: "Activity" };

const PAGE_SIZE = 50;
const COLUMNS = "150px 140px minmax(0,1fr)";

type AuditRow = { id: number; created_at: string; actor_name: string | null; summary: string };

// The admin's "who did what" diary. Entries are written by the website when an admin blocks a
// customer, changes a restaurant, cancels an order and so on. Nobody can edit or delete them.
export default async function AdminActivityPage({ searchParams }: PageProps<"/admin/activity">) {
  const page = pageNumber((await searchParams).page);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const { data, count } = await supabase
    .from("admin_audit_log")
    .select("id, created_at, actor_name, summary", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);
  const rows = (data ?? []) as AuditRow[];

  return (
    <>
      <PageHeader title="Activity" sub="Who did what in the admin area. This record can't be edited or deleted." />
      <DataTable
        columns={COLUMNS}
        headers={["WHEN", "WHO", "WHAT"]}
        empty={rows.length === 0 ? <TableEmpty>Nothing recorded yet.</TableEmpty> : undefined}
        footer={
          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            total={count ?? 0}
            hrefFor={(n) => (n === 1 ? "/admin/activity" : `/admin/activity?page=${n}`)}
          />
        }
      >
        {rows.map((row) => (
          <DataRow key={row.id} columns={COLUMNS}>
            <Cell className="text-stone-500">{formatDateTime(row.created_at)}</Cell>
            <Cell strong>{row.actor_name ?? "Admin"}</Cell>
            <span className="min-w-0 break-words text-stone-700">{row.summary}</span>
          </DataRow>
        ))}
      </DataTable>
    </>
  );
}
