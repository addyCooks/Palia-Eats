import type { Metadata } from "next";
import { getErrors } from "@/lib/queries/errors";
import { formatDateTime } from "@/lib/utils/format";
import { ErrorResolveButton } from "@/components/admin/ErrorResolveButton";
import { Badge } from "@/components/ui/Badge";
import { FilterChips, PageHeader, Panel, param } from "@/components/ui/page";

export const metadata: Metadata = { title: "Problems" };

const CHIPS = [
  { key: "open", label: "Not fixed" },
  { key: "fixed", label: "Fixed" },
  { key: "all", label: "All" },
];

// Every crash the website has hit, grouped (the same problem is one line with a count). New
// problems also arrive by email. Mark one fixed once you have dealt with it: if it happens again
// it reopens by itself.
export default async function AdminErrorsPage({ searchParams }: PageProps<"/admin/errors">) {
  const raw = param((await searchParams).show);
  const filter = raw === "fixed" || raw === "all" ? raw : "open";
  const errors = await getErrors(filter);

  return (
    <>
      <PageHeader
        title="Problems"
        sub="Pages or actions that crashed for someone. Addresses, emails and phone numbers are removed from these notes."
      />
      <FilterChips
        label="Filter problems"
        chips={CHIPS}
        active={filter}
        hrefFor={(key) => (key === "open" ? "/admin/errors" : `/admin/errors?show=${key}`)}
      />

      {errors.length === 0 ? (
        <Panel>
          <p className="py-6 text-center text-sm text-stone-500">
            {filter === "open" ? "No open problems. Nothing has crashed lately." : "Nothing here."}
          </p>
        </Panel>
      ) : (
        <ul className="flex flex-col gap-3">
          {errors.map((error) => (
            <li key={error.id} className="flex flex-col gap-3 rounded-[18px] bg-surface p-5 shadow-card">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 flex-col gap-1">
                  <p className="break-words font-semibold">{error.message}</p>
                  <p className="text-[13px] text-stone-500">
                    {error.path ?? "unknown place"} · {error.source === "server" ? "on our server" : "in a visitor's browser"}
                  </p>
                </div>
                <div className="flex items-center gap-2.5">
                  <Badge tone={error.occurrences >= 5 ? "error" : "warm"}>
                    {error.occurrences}× seen
                  </Badge>
                  <ErrorResolveButton id={error.id} resolved={error.resolved} />
                </div>
              </div>
              <p className="text-[13px] text-stone-500">
                First {formatDateTime(error.first_seen)} · last {formatDateTime(error.last_seen)}
              </p>
              {(error.stack || error.digest) && (
                <details className="text-[13px]">
                  <summary className="cursor-pointer font-semibold text-accent">Technical details</summary>
                  {error.digest && <p className="mt-2 text-stone-500">Reference: {error.digest}</p>}
                  {error.stack && (
                    <pre className="mt-2 max-h-72 overflow-auto whitespace-pre-wrap rounded-xl bg-muted p-3 text-xs">{error.stack}</pre>
                  )}
                  {error.user_agent && <p className="mt-2 break-words text-stone-500">{error.user_agent}</p>}
                </details>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
