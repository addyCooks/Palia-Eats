import "server-only";
import { sendEmail } from "@/lib/email/mailer";
import { escapeHtml, siteUrl } from "@/lib/email/shared";
import { emailButton, emailLayout, emailParagraph, emailSmall } from "@/lib/email/layout";

// "Brown Pizza is open now": the one email a customer asked for on the closed screen.
export async function sendOpenReminder({
  to,
  customerName,
  restaurant,
}: {
  to: string;
  customerName: string | null;
  restaurant: { name: string; slug: string };
}): Promise<boolean> {
  const link = `${siteUrl()}/restaurants/${restaurant.slug}`;
  const hello = customerName?.trim() ? `Hi ${customerName.trim().split(/\s+/)[0]},` : "Hi,";
  const name = restaurant.name;

  const result = await sendEmail({
    to,
    subject: `${name} is open now`,
    text:
      `${hello}\n\n${name} is taking orders again. You asked us to let you know.\n\n` +
      `Order here: ${link}\n\n` +
      `This was a one-time reminder. You won't get more emails about it.\n`,
    html: emailLayout({
      brand: name,
      preheader: `${name} is taking orders again.`,
      kicker: "Open now",
      title: `${name} is open now`,
      content:
        emailParagraph(`${escapeHtml(hello)} they're taking orders again. You asked us to let you know.`) +
        emailButton(link, `Order from ${name}`) +
        emailSmall("This was a one-time reminder. You won't get more emails about it."),
      footer: `${name} · on PaliaEats`,
    }),
  });
  return result.ok;
}
