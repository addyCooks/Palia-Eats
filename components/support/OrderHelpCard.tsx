import { supportLinks } from "@/lib/utils/support";
import { SupportActions } from "@/components/support/SupportActions";

// "Need help with this order?" on the order page. PaliaEats support handles everything
// (late, wrong or missing food, quality ...) and talks to the restaurant when needed. While an
// order is still on its way, calling the restaurant is quicker, so its number is offered too.
export function OrderHelpCard({
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
  const { hours } = supportLinks();
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card">
      <h2 className="text-lg font-semibold">Need help with this order?</h2>
      <p className="text-sm text-stone-600">
        Late, wrong or missing something? Tell us and we&apos;ll sort it out with the restaurant.
        {hours ? ` We reply ${hours}.` : ""}
      </p>
      <SupportActions context={{ orderNumber, restaurantName }} />
      {restaurantPhone && (active || cancelled) && (
        <p className="border-t border-border pt-3 text-sm text-stone-600">
          {active
            ? `In a hurry? For an order that is still on its way, calling ${restaurantName ?? "the restaurant"} is quickest: `
            : `Want to know why it was cancelled? Call ${restaurantName ?? "the restaurant"}: `}
          <a href={`tel:${restaurantPhone}`} className="font-semibold text-accent hover:underline">
            {restaurantPhone}
          </a>
        </p>
      )}
    </section>
  );
}
