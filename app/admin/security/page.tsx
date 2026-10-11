import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { TwoFactorSetup } from "@/components/admin/TwoFactorSetup";
import { PageHeader, Panel } from "@/components/ui/page";

export const metadata: Metadata = { title: "Security" };

export default async function AdminSecurityPage() {
  await requireAdmin();
  const supabase = await createClient();
  const { data: factors } = await supabase.auth.mfa.listFactors();
  const enabled = Boolean(factors?.totp?.length);

  return (
    <>
      <PageHeader title="Security" sub="Protect the admin login." />
      <Panel title="2-step login">
        <TwoFactorSetup enabled={enabled} />
      </Panel>
    </>
  );
}
