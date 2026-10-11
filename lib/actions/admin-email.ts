"use server";

import { requireAdmin } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/admin/audit";
import { sendEmail } from "@/lib/email/mailer";
import { emailLayout, emailParagraph, emailSmall } from "@/lib/email/layout";
import { allow } from "@/lib/utils/rate-limit";

export type TestEmailState = { error?: string; sentTo?: string } | undefined;

// Admin -> Settings -> "Send a test email": sends one email to the admin's own address and says
// whether the email setup (SMTP) worked, with the provider's error message if not. This is how you
// check a new email provider after changing it.
export async function sendTestEmail(): Promise<TestEmailState> {
  const admin = await requireAdmin();
  const { createClient } = await import("@/lib/supabase/server");
  const { data } = await (await createClient()).auth.getUser();
  const to = data.user?.email;
  if (!to) return { error: "Your account has no email address." };
  if (!(await allow(`test-email:${admin.id}`, 6, 3600))) return { error: "Too many test emails. Try again later." };

  const result = await sendEmail({
    to,
    subject: "PaliaEats test email",
    text: "This is a test email from PaliaEats. If you can read this, sending works.",
    html: emailLayout({
      preheader: "If you can read this, sending works.",
      kicker: "Test",
      title: "Email sending works",
      content:
        emailParagraph("This is a test email from the PaliaEats admin. If you can read this, orders and updates can be emailed.") +
        emailSmall("Check that it landed in your inbox, not in spam. If it went to spam, the sender is not trusted yet (see docs/email-setup.md)."),
    }),
  });

  await logAdminAction(admin, {
    action: "email.test",
    summary: result.ok ? "Sent a test email" : "Tried a test email, it failed",
    details: result.ok ? undefined : { error: result.error.slice(0, 200) },
  });
  return result.ok ? { sentTo: to } : { error: result.error };
}
