import type { Metadata } from "next";
import { getSupportRequests } from "@/lib/queries/support";
import type { SupportStatus } from "@/lib/support/topics";
import { formatDateTime } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { Cell, DataRow, DataTable, FilterChips, PageHeader, TableEmpty, param } from "@/components/ui/page";

export const metadata: Metadata = { title: "Support" };

const CHIPS: { key: SupportStatus | "all"; label: string }[] = [
  { key: "open", label: "Waiting for a reply" },
  { key: "answered", label: "Answered" },
  { key: "closed", label: "Closed" },
  { key: "all", label: "All" },
];
const LABEL = { open: "Waiting", answered: "Answered", closed: "Closed" } as const;
const TONE = { open: "new", answered: "warm", closed: "neutral" } as const;
const COLUMNS = "minmax(0,1.2fr) minmax(0,1.3fr) minmax(0,1.6fr) 150px 100px";

// Help requests sent from the Help page (customers) and the restaurant panel (restaurants).
export default async function AdminSupportPage({ searchParams }: PageProps<"/admin/support">) {
  const raw = param((await searchParams).show);
  const filter = CHIPS.some((chip) => chip.key === raw) ? (raw as SupportStatus | "all") : "open";
  const requests = await getSupportRequests(filter);

  return (
    <>
      <PageHeader
        title="Support"
        sub="Messages from the Help page and from restaurants' panels. Reply by email or WhatsApp, then mark it answered."
      />
      <FilterChips
        label="Filter requests"
        chips={CHIPS}
        active={filter}
        hrefFor={(key) => (key === "open" ? "/admin/support" : `/admin/support?show=${key}`)}
      />
      <DataTable
        columns={COLUMNS}
        headers={["FROM", "TOPIC", "MESSAGE", "SENT", "STATUS"]}
        empty={
          requests.length === 0 ? (
            <TableEmpty>{filter === "open" ? "Nothing waiting. All caught up." : "No requests here."}</TableEmpty>
          ) : undefined
        }
      >
        {requests.map((request) => (
          <DataRow key={request.id} columns={COLUMNS} href={`/admin/support/${request.id}`}>
            <Cell strong>
              {request.name ?? "Unknown"}
              {request.kind === "restaurant" ? " (restaurant)" : ""}
            </Cell>
            <Cell>{request.topic}</Cell>
            <Cell>{request.message}</Cell>
            <Cell className="text-stone-500">{formatDateTime(request.created_at)}</Cell>
            <Cell>
              <Badge tone={TONE[request.status]}>{LABEL[request.status]}</Badge>
            </Cell>
          </DataRow>
        ))}
      </DataTable>
      <p className="text-xs text-stone-500">Closed requests are deleted a year after they were answered.</p>
    </>
  );
}
