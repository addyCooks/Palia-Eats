import type { Metadata } from "next";
import { CartView } from "@/components/cart/CartView";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: t("cart.title") };
}

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-12">
      <CartView />
    </main>
  );
}
