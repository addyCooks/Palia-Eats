import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProfile } from "@/lib/auth/session";
import { postLoginPath, safeNextPath } from "@/lib/auth/redirect";
import { createClient } from "@/lib/supabase/server";
import { TotpForm } from "@/components/forms/TotpForm";

export const metadata: Metadata = { title: "2-step login", robots: { index: false } };

// Shown to an admin who has 2-step login turned on, right after the password.
export default async function VerifyTwoFactorPage({ searchParams }: PageProps<"/verify-2fa">) {
  const params = await searchParams;
  const next = safeNextPath(typeof params.next === "string" ? params.next : null);

  const profile = await getProfile();
  if (!profile) redirect("/login?next=/admin");

  // Nothing to check (no 2-step login, or already checked in this session): carry on.
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (!(data?.nextLevel === "aal2" && data.currentLevel !== "aal2")) {
    redirect(postLoginPath(next, profile.role));
  }

  return (
    <>
      <div className="flex flex-col gap-1.5 sm:text-center">
        <h1 className="font-display text-[34px] leading-[1.05]">One more step</h1>
        <p className="text-[15px] text-stone-600">
          Open your authenticator app and type the 6-digit code for PaliaEats.
        </p>
      </div>
      <TotpForm next={next ?? undefined} />
    </>
  );
}
