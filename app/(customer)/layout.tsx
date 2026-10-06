import { getProfile } from "@/lib/auth/session";
import { getMyActiveOrder } from "@/lib/queries/orders";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { BottomTabBar } from "@/components/layout/BottomTabBar";
import { ActiveOrderBanner } from "@/components/layout/ActiveOrderBanner";

// Shared layout for the customer-facing PaliaEats pages (homepage, cart, orders...).
// Restaurant storefronts have their own header and don't use this one.
export default async function CustomerLayout({ children }: LayoutProps<"/">) {
  const profile = await getProfile();
  const activeOrder = profile ? await getMyActiveOrder() : null;

  return (
    <>
      <Header />
      {profile && <ActiveOrderBanner order={activeOrder} customerId={profile.id} />}
      {children}
      <Footer />
      <BottomTabBar />
    </>
  );
}
