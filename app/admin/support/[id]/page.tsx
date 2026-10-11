import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Mail, MessageCircle } from "lucide-react";
import { getSupportRequest } from "@/lib/queries/support";
import { isUuid } from "@/lib/validation/menu";
import { formatDateTime } from "@/lib/utils/format";
import { SupportRequestActions } from "@/components/admin/SupportRequestActions";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Panel } from "@/components/ui/page";

export const metadata: Metadata = { title: "Help request" };

const LABEL = { open: "Waiting", answered: "Answered", closed: "Closed" } as const;
const TONE = { open: "new", answered: "warm", closed: "neutral" } as const;

export default async function AdminSupportRequestPage({ params }: PageProps<"/admin/support/[id]">) {
  const { id } = await params;
  if (!isUuid(id)) notFound();
  const request = await getSupportRequest(id);
  if (!request) notFound();

  const subject = encodeURIComponent(`Re: ${request.topic}${request.order_number ? ` (order #${request.order_number})` : ""}`);
  const greeting = encodeURIComponent(`Hi ${request.name?.split(/\s+/)[0] ?? ""},\n\n`);
  const whatsapp = request.contact_phone
    ? `https://wa.me/91${request.contact_phone}?text=${encodeURIComponent(`Hi ${request.name?.split(/\s+/)[0] ?? ""}, this is PaliaEats support about your message: "${request.topic}".`)}`
    : null;

  const rows: [string, React.ReactNode][] = [
    ["From", `${request.name ?? "Unknown"}${request.kind === "restaurant" ? " (restaurant)" : ""}`],
    ["Topic", request.topic],
  ];
  if (request.order_number && request.order_id) {
    rows.push([
      "Order",
      <Link key="order" href={`/admin/orders/${request.order_id}`} className="font-semibold text-accent hover:underline">
        #{request.order_number}
      </Link>,
    ]);
  }
  if (request.restaurant_id) {
    rows.push([
      "Restaurant",
      <Link key="rest" href={`/admin/restaurants/${request.restaurant_id}`} className="font-semibold text-accent hover:underline">
        {request.restaurant_name ?? "Open restaurant"}
      </Link>,
    ]);
  }
  if (request.user_id) {
    rows.push([
      "Account",
      <Link key="user" href={`/admin/customers/${request.user_id}`} className="font-semibold text-accent hover:underline">
        Open customer
      </Link>,
    ]);
  }
  rows.push(["Email", request.contact_email ?? "—"], ["Phone", request.contact_phone ? `+91 ${request.contact_phone}` : "—"]);
  rows.push(["Message", request.message]);

  return (
    <>
      <PageHeader
        crumb={
          <>
            <Link href="/admin/support" className="hover:underline">
              Support
            </Link>{" "}
            › {request.topic}
          </>
        }
        title={request.topic}
        sub={`Sent ${formatDateTime(request.created_at)}`}
      >
        <Badge tone={TONE[request.status]}>{LABEL[request.status]}</Badge>
      </PageHeader>

      <Panel>
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[140px_minmax(0,1fr)]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-stone-500">{label}</dt>
              <dd className="min-w-0 whitespace-pre-line break-words">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap gap-2.5 border-t border-border pt-4">
          {request.contact_email && (
            <a
              href={`mailto:${request.contact_email}?subject=${subject}&body=${greeting}`}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand px-4 text-sm font-bold text-on-brand hover:bg-brand-dark"
            >
              <Mail className="size-[18px]" aria-hidden />
              Reply by email
            </a>
          )}
          {whatsapp && (
            <a
              href={whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-xl border-[1.5px] border-border bg-surface px-4 text-sm font-semibold hover:bg-muted"
            >
              <MessageCircle className="size-[18px]" aria-hidden />
              Reply on WhatsApp
            </a>
          )}
          {!request.contact_email && !request.contact_phone && (
            <p className="text-sm text-stone-500">This person left no contact details.</p>
          )}
        </div>
      </Panel>

      <Panel title="Where it stands">
        <SupportRequestActions id={request.id} status={request.status} note={request.admin_note} />
      </Panel>
    </>
  );
}
