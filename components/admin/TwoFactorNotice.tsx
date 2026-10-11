import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

// A gentle reminder at the top of the admin dashboard until 2-step login is turned on.
export async function TwoFactorNotice() {
  const supabase = await createClient();
  const { data } = await supabase.auth.mfa.listFactors();
  if (data?.totp?.length) return null;

  return (
    <Link
      href="/admin/security"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900 hover:bg-amber-100"
    >
      <span>
        <b>Protect the admin with 2-step login.</b> This area shows every customer&apos;s phone number and address. A
        password alone can be stolen.
      </span>
      <span className="font-semibold underline">Turn it on →</span>
    </Link>
  );
}
