import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPanelRestaurant } from "@/lib/panel/session";
import { getRestaurantStatus } from "@/lib/utils/hours";
import { formatPrice } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { HoursForm } from "@/components/panel/HoursForm";
import { OpenClosedSwitch } from "@/components/panel/OpenClosedSwitch";
import { ShareCard } from "@/components/restaurant/ShareCard";

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
      <h1 className="font-display text-2xl font-extrabold">Store settings</h1>

      <OpenClosedSwitch accepting={restaurant.is_accepting_orders} status={getRestaurantStatus(restaurant)} />

      <HoursForm
        openingTime={restaurant.opening_time}
        closingTime={restaurant.closing_time}
        closedDays={restaurant.closed_days}
      />

      <Card className="flex flex-col gap-2 rounded-[18px] border-0 shadow-card">
        <h2 className="text-lg font-bold">Delivery charges</h2>
        <p className="text-sm text-stone-600">Set by PaliaEats. To change them, please contact us.</p>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-stone-500">Delivery fee</dt>
            <dd className="font-extrabold tabular-nums">{formatPrice(charges?.delivery_fee ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Minimum order</dt>
            <dd className="font-extrabold tabular-nums">{formatPrice(charges?.min_order_amount ?? 0)}</dd>
          </div>
        </dl>
      </Card>

      <ShareCard name={restaurant.name} slug={restaurant.slug} />

      <Link
        href={`/restaurants/${restaurant.slug}`}
        target="_blank"
        className="flex items-center justify-between rounded-[18px] bg-surface p-4 text-[15px] font-bold shadow-card hover:bg-background"
      >
        See my page as customers see it
        <span aria-hidden>↗</span>
      </Link>
    </>
  );
}
