import "server-only";
import { sendEmail } from "@/lib/email/mailer";
import { escapeHtml, siteUrl } from "@/lib/email/shared";
import { emailButton, emailLayout, emailParagraph, emailSmall } from "@/lib/email/layout";
import { SUPPORT_EMAIL } from "@/lib/utils/support";

// A short confirmation after someone deletes their account (so a stranger who did it from an
// unlocked phone can't do so silently). Never throws.
export async function sendAccountDeletedEmail(to: string, name: string | null): Promise<void> {
  try {
    const hi = name ? `Hi ${name.split(/\s+/)[0]},` : "Hi,";
    await sendEmail({
      to,
      subject: "Your PaliaEats account was deleted",
      text:
        `${hi}\n\nYour PaliaEats account has been deleted, and your name, phone number, addresses and ` +
        `favourites are gone. Your past orders stay in the restaurants' records without your details.\n\n` +
        `If this wasn't you, write to ${SUPPORT_EMAIL} right away.\n\nPaliaEats\n`,
      html: emailLayout({
        preheader: "Your PaliaEats account has been deleted.",
        kicker: "Account",
        title: "Your account was deleted",
        content:
          emailParagraph(`${escapeHtml(hi)} your PaliaEats account has been deleted. Your name, phone number, addresses and favourites are gone, and your past orders stay in the restaurants' records without your details.`) +
          emailParagraph(`You are always welcome back.`) +
          emailButton(siteUrl(), "Visit PaliaEats") +
          emailSmall(`If this wasn't you, write to ${escapeHtml(SUPPORT_EMAIL)} right away.`),
      }),
    });
  } catch (error) {
    console.error("[email] Could not send the account-deleted email:", error instanceof Error ? error.message : error);
  }
}
