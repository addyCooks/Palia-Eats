import type { Metadata } from "next";
import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getMyAddresses } from "@/lib/queries/account";
import { AccountCard } from "@/components/account/AccountCard";
import { AddressCard } from "@/components/account/AddressCard";
import { AddressForm } from "@/components/forms/AddressForm";

export const metadata: Metadata = { title: "Saved addresses" };

export default async function AddressesPage({ searchParams }: PageProps<"/account/addresses">) {
  const profile = await requireUser("/account/addresses");
  const addresses = await getMyAddresses();

  // Coming from checkout? Offer a way back.
  const { next } = await searchParams;
  const backToCheckout = next === "/checkout";

  return (
    <main className="mx-auto grid w-full max-w-[1280px] flex-1 items-start gap-8 px-4 pb-28 pt-6 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:px-12 lg:pb-14 lg:pt-8">
      <div className="hidden lg:block">
        <AccountCard profile={profile} active="/account/addresses" />
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-1">
          {backToCheckout ? (
            <Link href="/checkout" className="text-sm font-semibold text-accent hover:underline">
              ← Back to checkout
            </Link>
          ) : (
            <Link href="/account" className="text-sm text-stone-500 hover:underline lg:hidden">
              ← My account
            </Link>
          )}
          <h1 className="font-display text-[34px] leading-none sm:text-[44px]">Saved addresses</h1>
        </div>

        <div className="grid items-start gap-5 xl:grid-cols-2">
          <section className="flex flex-col gap-3">
            {addresses.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border p-6 text-center text-stone-500">
                You haven&apos;t saved an address yet.
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {addresses.map((address) => (
                  <li key={address.id}>
                    <AddressCard address={address} />
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="flex flex-col gap-4 rounded-[22px] bg-surface p-5 shadow-card sm:p-6">
            <h2 className="font-display text-[28px] leading-none">Where should we deliver?</h2>
            <AddressForm defaultPhone={profile.phone} next={backToCheckout ? "/checkout" : undefined} />
          </section>
        </div>
      </div>
    </main>
  );
}
