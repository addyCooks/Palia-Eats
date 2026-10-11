import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getT } from "@/lib/i18n/server";
import { requireUser } from "@/lib/auth/session";
import { getMyAddress } from "@/lib/queries/account";
import { isUuid } from "@/lib/validation/menu";
import { AddressForm } from "@/components/forms/AddressForm";

export async function generateMetadata(): Promise<Metadata> {
  return { title: (await getT())("addr.edit_title") };
}

export default async function EditAddressPage({ params }: PageProps<"/account/addresses/[id]">) {
  const t = await getT();
  const { id } = await params;
  await requireUser(`/account/addresses/${id}`);
  if (!isUuid(id)) notFound();

  const address = await getMyAddress(id);
  if (!address) notFound();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-5 px-4 pb-28 pt-6 lg:pb-14">
      <Link href="/account/addresses" className="text-sm text-stone-500 hover:underline">
        {t("addr.back_addresses")}
      </Link>
      <section className="flex flex-col gap-4 rounded-[22px] bg-surface p-5 shadow-card sm:p-6">
        <h1 className="font-display text-[28px] leading-none">{t("addr.edit_title")}</h1>
        <AddressForm address={address} />
      </section>
    </main>
  );
}
