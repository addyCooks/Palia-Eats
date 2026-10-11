import { getT } from "@/lib/i18n/server";
import { SupportActions } from "@/components/support/SupportActions";

// "Need help with this order?" on the order page. PaliaEats support handles everything
// (late, wrong or missing food, quality ...) and talks to the restaurant when needed. While an
// order is still on its way, calling the restaurant is quicker, so its number is offered too.
export async function OrderHelpCard({
  orderNumber,
  restaurantName,
  restaurantPhone,
  active,
  cancelled,
}: {
  orderNumber: number;
  restaurantName: string | null;
  restaurantPhone: string | null;
  active: boolean;
  cancelled: boolean;
}) {
  const t = await getT();
  const name = restaurantName ?? t("order_help.the_restaurant");
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card">
      <h2 className="text-lg font-semibold">{t("order_help.title")}</h2>
      <p className="text-sm text-stone-600">{t("order_help.body")}</p>
      <SupportActions
        context={{ orderNumber, restaurantName }}
        messageHref={`/help?order=${orderNumber}#message`}
        labels={{
          whatsapp: t("support.whatsapp_us"),
          email: t("support.email_us"),
          message: t("order_help.message"),
        }}
      />
      {restaurantPhone && (active || cancelled) && (
        <p className="border-t border-border pt-3 text-sm text-stone-600">
          {active ? t("order_help.call_active", { name }) : t("order_help.call_cancelled", { name })}
          <a href={`tel:${restaurantPhone}`} className="font-semibold text-accent hover:underline">
            {restaurantPhone}
          </a>
        </p>
      )}
    </section>
  );
}
