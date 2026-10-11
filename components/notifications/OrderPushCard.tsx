import { getT } from "@/lib/i18n/server";
import { PushToggle } from "@/components/notifications/PushToggle";

// On an order that is still in progress: offer notifications for this phone. Shows nothing when
// notifications aren't set up (no keys) or the browser can't do them.
export async function OrderPushCard() {
  if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) return null;
  const t = await getT();
  return (
    <section className="flex flex-col gap-3 rounded-[22px] bg-surface p-6 shadow-card">
      <h2 className="text-lg font-semibold">{t("push.order_card.title")}</h2>
      <p className="text-sm text-stone-600">{t("push.order_card.body")}</p>
      <PushToggle />
    </section>
  );
}
