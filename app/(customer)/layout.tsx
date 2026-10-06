import { Header } from "@/components/layout/Header";
import { BottomTabBar } from "@/components/layout/BottomTabBar";

// Shared layout for the customer-facing PaliaEats pages (homepage, cart, orders...).
// Restaurant storefronts have their own look and don't use this header.
export default function CustomerLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <Header />
      {children}
      <footer className="border-t border-border bg-surface pb-24 lg:pb-0">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-1 px-4 py-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            Palia<span className="font-display font-extrabold text-brand-dark">Eats</span> · Local food from
            Palia&apos;s own kitchens
          </p>
          <p>Pay in cash on delivery. Delivered by the restaurant.</p>
        </div>
      </footer>
      <BottomTabBar />
    </>
  );
}
