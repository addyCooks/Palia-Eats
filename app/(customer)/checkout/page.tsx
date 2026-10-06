import type { Metadata } from "next";
import { requireUser } from "@/lib/auth/session";
import { getMyAddresses } from "@/lib/queries/account";
import { CheckoutView } from "@/components/checkout/CheckoutView";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({ searchParams }: PageProps<"/checkout">) {
  const profile = await requireUser("/checkout");
  const addresses = await getMyAddresses();

  // ?address=<id> is set when the customer has just added an address here.
  const { address } = await searchParams;
  const initialAddressId =
    typeof address === "string" && addresses.some((a) => a.id === address) ? address : undefined;

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6 lg:px-12">
      <CheckoutView
        addresses={addresses}
        profilePhone={profile.phone}
        initialAddressId={initialAddressId}
      />
    </main>
  );
}
