import type { Metadata } from "next";
import Link from "next/link";
import { getNotificationLog } from "@/lib/queries/admin";
import { formatDateTime } from "@/lib/utils/format";
import { Badge } from "@/components/ui/Badge";

export const metadata: Metadata = { title: "Notifications" };

const TONES = { sent: "success", failed: "danger", skipped: "warning" } as const;

export default async function AdminNotificationsPage({
  searchParams,
}: PageProps<"/admin/notifications">) {
  const { show } = await searchParams;
  const onlyProblems = show !== "all";
  const rows = await getNotificationLog(onlyProblems);

  const tabs = [
    { key: "problems", label: "Problems", href: "/admin/notifications" },
    { key: "all", label: "Everything", href: "/admin/notifications?show=all" },
  ];

  return (
    <>
      <h1 className="text-2xl font-bold">Notifications</h1>
      <p className="mt-1 text-sm text-stone-600">
        Every email we try to send about an order. &ldquo;Failed&rdquo; means the email provider refused
        it after 3 tries; &ldquo;skipped&rdquo; usually means a restaurant has no notification email set.
      </p>

      <nav aria-label="Filter" className="mt-4 flex gap-2">
        {tabs.map((tab) => {
          const active = (tab.key === "problems") === onlyProblems;
          return (
            <Link
              key={tab.key}
              href={tab.href}
              aria-current={active ? "page" : undefined}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium ${
                active ? "border-brand bg-brand text-white" : "border-border bg-surface hover:bg-muted"
              }`}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <p className="mt-8 rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">
          {onlyProblems ? "No problems. Everything was delivered." : "Nothing sent yet."}
        </p>
      ) : (
        <ul className="mt-6 flex flex-col gap-2">
          {rows.map((row) => (
            <li
              key={row.id}
              className="flex flex-col gap-1 rounded-2xl border border-border bg-surface p-4 shadow-sm"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-medium">
                  {row.orders ? `Order #${row.orders.order_number}` : "No order"} ·{" "}
                  {row.event.replaceAll("_", " ")}
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
      <p className="mt-6 text-xs text-stone-500">Showing the latest 100.</p>
    </>
  );
}
