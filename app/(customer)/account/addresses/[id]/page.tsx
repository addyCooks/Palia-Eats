import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/session";
import { getMyAddress } from "@/lib/queries/account";
import { isUuid } from "@/lib/validation/menu";
import { AddressForm } from "@/components/forms/AddressForm";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "Edit address" };

export default async function EditAddressPage({
  params,
}: PageProps<"/account/addresses/[id]">) {
  const { id } = await params;
  await requireUser(`/account/addresses/${id}`);
  if (!isUuid(id)) notFound();

  const address = await getMyAddress(id);
  if (!address) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <div>
        <Link href="/account/addresses" className="text-sm text-stone-500 hover:underline">
          ← Saved addresses
        </Link>
        <h1 className="mt-2 text-2xl font-bold">Edit address</h1>
      </div>
      <Card>
        <AddressForm address={address} />
      </Card>
    </main>
  );
}
