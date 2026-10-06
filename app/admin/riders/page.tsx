import type { Metadata } from "next";
import { getRiders } from "@/lib/queries/admin";
import { AddRiderForm, EditRiderForm, RiderActiveToggle } from "@/components/admin/RiderForms";
import { Badge } from "@/components/ui/Badge";
import { PageHeader, Panel } from "@/components/ui/page";

export const metadata: Metadata = { title: "Riders" };

export default async function AdminRidersPage() {
  const { riders, restaurants } = await getRiders();
  const working = riders.filter((rider) => rider.is_active).length;
  const busy = riders.filter((rider) => rider.onTheWay > 0).length;

  return (
    <>
      <PageHeader
        title="Riders"
        sub={`${working} working · ${busy} on a delivery right now`}
      />

      <Panel title="Add a rider">
        <AddRiderForm restaurants={restaurants} />
        <p className="text-xs text-stone-500">
          PaliaEats riders can deliver for any restaurant. A restaurant&apos;s own rider is only offered for that
          restaurant&apos;s orders. Put a rider on an order from its page under Orders.
        </p>
      </Panel>

      {riders.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-border p-8 text-center text-stone-500">No riders yet.</p>
      ) : (
        <ul className="overflow-hidden rounded-[18px] bg-surface shadow-card">
          {riders.map((rider) => (
            <li key={rider.id} className="flex flex-col gap-1 border-b border-muted px-5 py-3.5 last:border-b-0">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="grid size-10 shrink-0 place-items-center rounded-full bg-amber-100 font-display text-lg text-amber-800">
                  {rider.name.charAt(0)}
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className={`truncate font-semibold ${rider.is_active ? "" : "text-stone-500"}`}>{rider.name}</span>
                  <a href={`tel:${rider.phone}`} className="text-[13px] text-stone-500 hover:underline">
                    {rider.phone} · {rider.restaurantName ? `${rider.restaurantName}'s rider` : "PaliaEats rider"}
                  </a>
                </span>
                <span className="text-[13px] text-stone-600">{rider.delivered} delivered (30 days)</span>
                {rider.onTheWay > 0 && <Badge tone="warm">On a delivery</Badge>}
                {!rider.is_active && <Badge tone="neutral">Off duty</Badge>}
                <RiderActiveToggle riderId={rider.id} active={rider.is_active} name={rider.name} />
              </div>
              <details className="group pl-14">
                <summary className="cursor-pointer list-none text-[13px] font-semibold text-accent marker:content-none">
                  <span className="group-open:hidden">Edit details</span>
                  <span className="hidden group-open:inline">Close</span>
                </summary>
                <EditRiderForm rider={rider} restaurants={restaurants} />
              </details>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
