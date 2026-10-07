import { getProfile, getRealtimeToken } from "@/lib/auth/session";
import { getMyActiveOrder, getRatePromptOrder } from "@/lib/queries/orders";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ActiveOrderBanner } from "@/components/layout/ActiveOrderBanner";
import { RatePrompt } from "@/components/order/RatePrompt";

// Shared layout for the customer-facing PaliaEats pages (homepage, cart, orders...).
// Restaurant storefronts have their own header and don't use this one.
export default async function CustomerLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();
  const [activeOrder, accessToken, rateOrder] = profile
    ? await Promise.all([getMyActiveOrder(), getRealtimeToken(), getRatePromptOrder()])
    : [null, null, null];

  return (
    <>
      <Header />
      {/* Always at least one screen tall (minus the top bar), so the footer sits below the
          fold on short pages and never jumps up while a page is loading. */}
      <div className="flex min-h-[calc(100dvh-4rem)] flex-col lg:min-h-[calc(100dvh-90px)]">
        {profile && <ActiveOrderBanner order={activeOrder} customerId={profile.id} accessToken={accessToken} />}
        {children}
      </div>
      <Footer />
      <BottomTabBar />
      {profile && <RatePrompt order={rateOrder} />}
    </>
  );
}
