import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getApplication } from "@/lib/queries/applications";
import { isUuid } from "@/lib/validation/menu";
import { formatDateTime, slugify } from "@/lib/utils/format";
import { formatTime } from "@/lib/utils/hours";
import { ApplicationDecision } from "@/components/admin/ApplicationDecision";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Panel } from "@/components/ui/page";

export const metadata: Metadata = { title: "Restaurant request" };

export default async function AdminRequestPage({ params }: PageProps<"/admin/requests/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const request = await getApplication(id);
  if (!request) notFound();

  const rows: [string, React.ReactNode][] = [
    ["Owner", request.owner_name],
    [
      "Mobile",
      <a key="phone" href={`tel:+91${request.phone}`} className="font-semibold text-accent hover:underline">
        +91 {request.phone.slice(0, 5)} {request.phone.slice(5)}
      </a>,
    ],
    [
      "Email",
      <a key="email" href={`mailto:${request.email}`} className="break-all font-semibold text-accent hover:underline">
        {request.email}
      </a>,
    ],
    ["Area", request.area],
    ["Address", request.address],
    ["Cuisines", request.cuisines.join(", ") || "—"],
    [
      "Hours",
      request.opening_time && request.closing_time
        ? `${formatTime(request.opening_time)} – ${formatTime(request.closing_time)}`
        : "—",
    ],
    ["FSSAI licence", request.fssai ?? "—"],
    ["Message", request.message ?? "—"],
  ];

  return (
    <>
      <PageHeader
        crumb={
          <>
            <Link href="/admin/requests" className="hover:underline">
              Requests
            </Link>{" "}
            › {request.restaurant_name}
          </>
        }
        title={request.restaurant_name}
        sub={`Sent ${formatDateTime(request.created_at)}`}
      />

      <Panel>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-stone-500">{label}</dt>
              <dd className="min-w-0 whitespace-pre-line">{value}</dd>
            </div>
          ))}
        </dl>
      </Panel>

      {request.status === "pending" ? (
        <ApplicationDecision applicationId={request.id} suggestedSlug={slugify(request.restaurant_name)} email={request.email} />
      ) : (
        <Panel>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <Badge tone={request.status === "approved" ? "warm" : "neutral"}>
              {request.status === "approved" ? "Approved" : "Rejected"}
            </Badge>
            {request.decided_at && <span className="text-stone-500">{formatDateTime(request.decided_at)}</span>}
            {request.status === "approved" && request.restaurant_id && (
              <Link href={`/admin/restaurants/${request.restaurant_id}`} className="font-semibold text-accent hover:underline">
                Open the restaurant →
              </Link>
            )}
          </div>
          {request.status === "approved" && (
            <p className="text-sm text-stone-600">
              Their panel link was emailed to {request.email}. The restaurant stays hidden from customers until you make it
              visible on its page.
            </p>
          )}
          {request.reject_reason && <p className="text-sm text-stone-600">Reason given: {request.reject_reason}</p>}
        </Panel>
      )}
    </>
  );
}
