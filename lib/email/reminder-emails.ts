import "server-only";
import { sendEmail } from "@/lib/email/mailer";
import { button, escapeHtml, siteUrl } from "@/lib/email/shared";

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
    html:
      `<div style="font-family:Arial,sans-serif;max-width:480px">` +
      `<p>${escapeHtml(hello)}</p>` +
      `<h2 style="margin:0 0 8px">${escapeHtml(name)} is open now</h2>` +
      `<p>They're taking orders again. You asked us to let you know.</p>` +
      button(link, `Order from ${escapeHtml(name)}`) +
      `<p style="color:#8a8378;font-size:13px">This was a one-time reminder. You won't get more emails about it.</p>` +
      `</div>`,
  });
  return result.ok;
}
