import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { formatPrice } from "@/lib/utils/format";
import { HoursForm } from "@/components/panel/HoursForm";
import { OpenClosedSwitch } from "@/components/panel/OpenClosedSwitch";
import { ShareCard } from "@/components/restaurant/ShareCard";
import { PageHeader, Panel } from "@/components/ui/page";
import { PanelHelpCard } from "@/components/support/PanelHelp";

export const metadata: Metadata = { title: "Settings" };

export default async function PanelSettingsPage() {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  const { data: charges } = await createAdminClient()
    .from("restaurants")
    .select("delivery_fee, min_order_amount")
    .eq("id", restaurant.id)
    .single();

  return (
    <>
      <PageHeader title="Settings" sub="Opening hours, days off and your ordering link">
        <Link
          href={`/restaurants/${restaurant.slug}`}
          target="_blank"
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-surface px-[18px] text-sm font-semibold shadow-card hover:bg-muted"
        >
          See my page <span aria-hidden>↗</span>
        </Link>
      </PageHeader>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <div className="flex flex-col gap-5">
          <OpenClosedSwitch
          accepting={restaurant.is_accepting_orders}
          status={getRestaurantStatus(restaurant)}
          settingUp={restaurant.setting_up}
        />
          <HoursForm
            openingTime={restaurant.opening_time}
            closingTime={restaurant.closing_time}
            closedDays={restaurant.closed_days}
          />
          <Panel title="Delivery charges">
            <p className="-mt-2 text-sm text-stone-600">Set by PaliaEats. To change them, please contact us.</p>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-stone-500">Delivery fee</dt>
                <dd className="text-lg font-bold tabular-nums">{formatPrice(charges?.delivery_fee ?? 0)}</dd>
              </div>
              <div>
                <dt className="text-stone-500">Minimum order</dt>
                <dd className="text-lg font-bold tabular-nums">{formatPrice(charges?.min_order_amount ?? 0)}</dd>
              </div>
            </dl>
          </Panel>
        </div>
        <div className="flex flex-col gap-5">
          <ShareCard name={restaurant.name} slug={restaurant.slug} />
          <PanelHelpCard restaurantName={restaurant.name} />
        </div>
      </div>
    </>
  );
}
