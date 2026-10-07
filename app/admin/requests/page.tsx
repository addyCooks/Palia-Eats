import type { Metadata } from "next";
import { getApplications, type ApplicationStatus } from "@/lib/queries/applications";
import { formatDateTime } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Cell, DataRow, DataTable, FilterChips, PageHeader, TableEmpty, param } from "@/components/ui/page";

export const metadata: Metadata = { title: "Restaurant requests" };

const CHIPS: { key: ApplicationStatus | "all"; label: string }[] = [
  { key: "pending", label: "Waiting" },
  { key: "approved", label: "Approved" },
  { key: "rejected", label: "Rejected" },
  { key: "all", label: "All" },
];
const LABEL = { pending: "Waiting", approved: "Approved", rejected: "Rejected" } as const;
const TONE = { pending: "new", approved: "warm", rejected: "neutral" } as const;
const COLUMNS = "minmax(0,1.4fr) minmax(0,1.1fr) minmax(0,1fr) 130px 150px 100px";

// Restaurants that asked to join (the public "Add your restaurant" page).
export default async function AdminRequestsPage({ searchParams }: PageProps<"/admin/requests">) {
  const raw = param((await searchParams).show);
  const filter = CHIPS.some((chip) => chip.key === raw) ? (raw as ApplicationStatus | "all") : "pending";
  const requests = await getApplications(filter);

  return (
    <>
      <PageHeader
        title="Restaurant requests"
        sub="Restaurants that asked to join through the “Add your restaurant” page (/join)."
      />
      <FilterChips
        label="Filter requests"
        chips={CHIPS}
        active={filter}
        hrefFor={(key) => (key === "pending" ? "/admin/requests" : `/admin/requests?show=${key}`)}
      />
      <DataTable
        columns={COLUMNS}
        headers={["RESTAURANT", "OWNER", "AREA", "MOBILE", "SENT", "STATUS"]}
        empty={
          requests.length === 0 ? (
            <TableEmpty>{filter === "pending" ? "No requests waiting." : "No requests here."}</TableEmpty>
          ) : undefined
        }
      >
        {requests.map((request) => (
          <DataRow key={request.id} columns={COLUMNS} href={`/admin/requests/${request.id}`}>
            <Cell strong>{request.restaurant_name}</Cell>
            <Cell>{request.owner_name}</Cell>
            <Cell>{request.area}</Cell>
            <Cell className="tabular-nums">+91 {request.phone}</Cell>
            <Cell className="text-stone-500">{formatDateTime(request.created_at)}</Cell>
            <Cell>
              <Badge tone={TONE[request.status]}>{LABEL[request.status]}</Badge>
            </Cell>
          </DataRow>
        ))}
      </DataTable>
    </>
  );
}
