import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyAddresses } from "@/lib/queries/account";
import { AddressCard } from "@/components/account/AddressCard";
import { AddressForm } from "@/components/forms/AddressForm";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Saved addresses" };

export default async function AddressesPage({
  searchParams,
}: PageProps<"/account/addresses">) {
  const profile = await requireUser("/account/addresses");
  const addresses = await getMyAddresses();

  // Coming from checkout? Offer a way back.
  const { next } = await searchParams;
  const backToCheckout = next === "/checkout";

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        {backToCheckout ? (
          <Link href="/checkout" className="text-sm font-medium text-brand hover:underline">
            ← Back to checkout
          </Link>
        ) : (
          <Link href="/account" className="text-sm text-stone-500 hover:underline">
            ← My account
          </Link>
        )}
        <h1 className="mt-2 text-2xl font-bold">Saved addresses</h1>
      </div>

      {addresses.length === 0 ? (
        <p className="text-stone-600">You haven&apos;t saved an address yet. Add one below.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {addresses.map((address) => (
            <li key={address.id}>
              <AddressCard address={address} />
            </li>
          ))}
        </ul>
      )}

      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">Add a new address</h2>
        <AddressForm
          defaultPhone={profile.phone}
          next={backToCheckout ? "/checkout" : undefined}
        />
      </Card>
    </main>
  );
}
