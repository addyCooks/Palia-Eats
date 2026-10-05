import type { Metadata } from "next";
import Link from "next/link";
import { getCurrentUser, requireUser } from "@/lib/auth/session";
import { ProfileForm } from "@/components/forms/ProfileForm";
import { Card } from "@/components/ui/Card";

export const metadata: Metadata = { title: "My account" };

export default async function AccountPage() {
  const profile = await requireUser("/account");
  const user = await getCurrentUser();

  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col gap-6 px-4 py-8">
      <h1 className="text-2xl font-bold">My account</h1>

      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">Your details</h2>
        <ProfileForm profile={profile} email={user?.email ?? ""} />
      </Card>

      <Link
        href="/account/addresses"
        className="rounded-2xl border border-border bg-surface p-4 font-semibold shadow-sm hover:bg-muted"
      >
        Saved addresses →
      </Link>
      <Link
        href="/orders"
        className="rounded-2xl border border-border bg-surface p-4 font-semibold shadow-sm hover:bg-muted"
      >
        My orders →
      </Link>
    </main>
  );
}
