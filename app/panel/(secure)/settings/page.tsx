import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPanelRestaurant } from "@/lib/panel/session";
import { formatPrice } from "@/lib/utils/format";
import { Card } from "@/components/ui/Card";
import { HoursForm } from "@/components/panel/HoursForm";

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
      <h1 className="text-xl font-bold">Settings</h1>

      <HoursForm
        openingTime={restaurant.opening_time}
        closingTime={restaurant.closing_time}
        closedDays={restaurant.closed_days}
      />

      <Card className="flex flex-col gap-2">
        <h2 className="text-lg font-semibold">Delivery charges</h2>
        <p className="text-sm text-stone-600">
          Set by PaliaEats. To change them, please contact us.
        </p>
        <dl className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <dt className="text-stone-500">Delivery fee</dt>
            <dd className="font-semibold">{formatPrice(charges?.delivery_fee ?? 0)}</dd>
          </div>
          <div>
            <dt className="text-stone-500">Minimum order</dt>
            <dd className="font-semibold">{formatPrice(charges?.min_order_amount ?? 0)}</dd>
          </div>
        </dl>
      </Card>
    </>
  );
}
