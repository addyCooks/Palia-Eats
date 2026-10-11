import "server-only";
import { sendEmail } from "@/lib/email/mailer";
import { escapeHtml, siteUrl } from "@/lib/email/shared";
import { emailButton, emailDetails, emailLayout, emailParagraph, emailSmall } from "@/lib/email/layout";
import { SUPPORT_EMAIL, SUPPORT_HOURS } from "@/lib/utils/support";

export type SupportRow = {
  id: string;
  kind: "customer" | "restaurant";
  topic: string;
  message: string;
  name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  order_number?: number | null;
  restaurant_name?: string | null;
};

// To the admin: a new help request arrived. Never throws.
export async function emailNewSupportRequest(row: SupportRow): Promise<void> {
  try {
    const link = `${siteUrl()}/admin/support/${row.id}`;
    const rows: [string, string][] = [
      ["From", `${row.name ?? "Unknown"}${row.kind === "restaurant" ? " (restaurant)" : ""}`],
      ["Topic", row.topic],
    ];
    if (row.order_number) rows.push(["Order", `#${row.order_number}`]);
    if (row.restaurant_name) rows.push(["Restaurant", row.restaurant_name]);
    if (row.contact_email) rows.push(["Email", row.contact_email]);
    if (row.contact_phone) rows.push(["Phone", row.contact_phone]);
    rows.push(["Message", row.message]);

    await sendEmail({
      to: SUPPORT_EMAIL,
      subject: `Help request: ${row.topic}${row.order_number ? ` (order #${row.order_number})` : ""}`,
      text:
        rows.map(([label, value]) => `${label}: ${value}`).join("\n") +
        `\n\nOpen it in Admin: ${link}\n`,
      html: emailLayout({
        preheader: row.message.slice(0, 90),
        kicker: row.kind === "restaurant" ? "Help request · restaurant" : "Help request · customer",
        title: row.topic,
        content: emailDetails(rows) + emailButton(link, "Open in Admin"),
        footer: "PaliaEats · support inbox",
      }),
    });
  } catch (error) {
    console.error("[email] Could not send the help-request alert:", error instanceof Error ? error.message : error);
  }
}

// To a logged-in customer: we got your message. Never throws.
export async function emailSupportReceived(to: string, name: string | null, topic: string): Promise<void> {
  try {
    const hi = name ? `Hi ${name.split(/\s+/)[0]},` : "Hi,";
    await sendEmail({
      to,
      subject: "We got your message",
      text:
        `${hi}\n\nWe got your message about "${topic}". We'll reply ${SUPPORT_HOURS}.\n\n` +
        `You can reply to this email to add more.\n\nPaliaEats\n`,
      html: emailLayout({
        preheader: "We got your message and will reply soon.",
        kicker: "Help request",
        title: "We got your message",
        content:
          emailParagraph(`${escapeHtml(hi)} thanks for writing to us about <b style="color:#16120D">${escapeHtml(topic)}</b>.`) +
          emailParagraph(`We'll reply ${escapeHtml(SUPPORT_HOURS)}. You can reply to this email to add more details.`) +
          emailSmall("PaliaEats support"),
      }),
    });
  } catch (error) {
    console.error("[email] Could not send the receipt:", error instanceof Error ? error.message : error);
  }
}
