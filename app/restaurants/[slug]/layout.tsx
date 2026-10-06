import { Header } from "@/components/layout/Header";

// Restaurant pages: on laptops the PaliaEats nav sits above the restaurant's hero (v2 5b).
// Phones go straight to the cover photo with its own back / share / cart buttons (6a).
export default function RestaurantLayout({ children }: LayoutProps<"/restaurants/[slug]">) {
  return (
    <>
      <Header className="hidden lg:block" />
      {children}
    </>
  );
}
