import type { Metadata } from "next";
import { getNotificationLog } from "@/lib/queries/admin";
import { formatDateTime } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";
import { FilterChips, PageHeader } from "@/components/ui/page";

export const metadata: Metadata = { title: "Message log" };

const TONES = { sent: "neutral", failed: "error", skipped: "new" } as const;

export default async function AdminNotificationsPage({ searchParams }: PageProps<"/admin/notifications">) {
  const { show } = await searchParams;
  const onlyProblems = show !== "all";
  const rows = await getNotificationLog(onlyProblems);

  return (
    <>
      <PageHeader
        crumb="Settings › Message log"
        title="Message log"
        sub="Every email and WhatsApp message we try to send about an order."
      />
      <p className="-mt-2 max-w-2xl text-sm text-stone-600">
        &ldquo;Failed&rdquo; means the provider refused it after 3 tries; &ldquo;skipped&rdquo; usually means a
        restaurant has no notification email set.
      </p>

      <FilterChips
        label="Filter"
        chips={[
          { key: "problems", label: "Problems" },
          { key: "all", label: "Everything" },
        ]}
        active={onlyProblems ? "problems" : "all"}
        hrefFor={(key) => (key === "all" ? "/admin/notifications?show=all" : "/admin/notifications")}
      />

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
          {onlyProblems ? "No problems. Everything was delivered." : "Nothing sent yet."}
        </p>
      ) : (
        <ul className="overflow-hidden rounded-[18px] bg-surface shadow-card">
          {rows.map((row) => (
            <li key={row.id} className="flex flex-col gap-1 border-b border-muted px-5 py-3.5 last:border-b-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-semibold">
                  {row.orders ? `Order #${row.orders.order_number}` : "No order"} · {row.event.replaceAll("_", " ")}
                </p>
                <Badge tone={TONES[row.status]}>{row.status}</Badge>
              </div>
              <p className="text-sm text-stone-600">
                {row.channel} to the {row.recipient_type}
                {row.recipient ? ` (${row.recipient})` : ""} · {formatDateTime(row.created_at)}
                {row.attempts > 1 ? ` · ${row.attempts} attempts` : ""}
              </p>
              {row.error && <p className="text-sm text-red-700">{row.error}</p>}
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-stone-500">Showing the latest 100.</p>
    </>
  );
}
