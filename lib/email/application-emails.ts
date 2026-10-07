import "server-only";
import { sendEmail } from "@/lib/email/mailer";
import { escapeHtml, siteUrl } from "@/lib/email/shared";
import { emailButton, emailDetails, emailLayout, emailNote, emailParagraph, emailSmall } from "@/lib/email/layout";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatTime } from "@/lib/utils/hours";

// Emails for restaurant registration requests, in the PaliaEats email design
// (lib/email/layout.ts). None of them may break the request itself: sendEmail never
// throws, and every function here swallows its own errors.

type Application = {
  id: string;
  restaurant_name: string;
  owner_name: string;
  phone: string;
  email: string;
  area: string;
  address: string;
  cuisines: string[];
  opening_time: string | null;
  closing_time: string | null;
  fssai: string | null;
  message: string | null;
};

// Every admin's login email.
async function adminEmails(): Promise<string[]> {
  const admin = createAdminClient();
  const { data } = await admin.from("profiles").select("id").eq("role", "admin");
  const emails = await Promise.all(
    (data ?? []).map(async (row) => (await admin.auth.admin.getUserById(row.id)).data.user?.email ?? null),
  );
  return emails.filter((email): email is string => Boolean(email && !email.endsWith(".invalid")));
}

function details(app: Application): [string, string][] {
  const hours =
    app.opening_time && app.closing_time ? `${formatTime(app.opening_time)} – ${formatTime(app.closing_time)}` : "Not given";
  return [
    ["Restaurant", app.restaurant_name],
    ["Owner", app.owner_name],
    ["Mobile", `+91 ${app.phone.slice(0, 5)} ${app.phone.slice(5)}`],
    ["Email", app.email],
    ["Area", app.area],
    ["Address", app.address],
    ["Cuisines", app.cuisines.join(", ") || "Not given"],
    ["Hours", hours],
    ["FSSAI licence", app.fssai ?? "Not given"],
  ];
}

// To the admin(s): a new request is waiting.
export async function emailNewApplication(app: Application): Promise<void> {
  try {
    const link = `${siteUrl()}/admin/requests/${app.id}`;
    const rows = details(app);
    const html = emailLayout({
      preheader: `${app.restaurant_name} in ${app.area} wants to join PaliaEats.`,
      kicker: "New restaurant request",
      title: `${app.restaurant_name} wants to join`,
      content:
        emailParagraph(
          `<b style="color:#16120D">${escapeHtml(app.owner_name)}</b> asked to add their restaurant in ${escapeHtml(app.area)}. Check the details, then approve or reject it.`,
        ) +
        emailDetails(rows) +
        (app.message ? emailNote("Their message:", app.message) : "") +
        emailButton(link, "Review the request") +
        emailSmall("Approving creates the restaurant hidden from customers and emails the owner their panel link."),
    });
    for (const to of await adminEmails()) {
      await sendEmail({
        to,
        subject: `New restaurant request: ${app.restaurant_name}`,
        text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}${app.message ? `\nMessage: ${app.message}` : ""}\n\nReview it: ${link}\n`,
        html,
      });
    }
  } catch (error) {
    console.error("[email] Could not tell the admin about a request:", error instanceof Error ? error.message : error);
  }
}

// To the restaurant: we've got it.
export async function emailApplicationReceived(app: Application): Promise<void> {
  const name = app.restaurant_name;
  await sendEmail({
    to: app.email,
    subject: `We've got your request for ${name}`,
    text:
      `Hi ${app.owner_name},\n\nThanks for asking to add ${name} to PaliaEats. We'll check the details and ` +
      `email you here, usually within 1-2 days.\n`,
    html: emailLayout({
      preheader: `Thanks for asking to add ${name} to PaliaEats.`,
      kicker: "Request received",
      title: `Thanks, ${app.owner_name.split(/\s+/)[0]}`,
      content:
        emailParagraph(
          `We've got your request to add <b style="color:#16120D">${escapeHtml(name)}</b> to PaliaEats. We'll check the details and email you here, usually within 1–2 days.`,
        ) +
        emailDetails(details(app).slice(0, 6)) +
        emailSmall("Once you're approved you'll get a private link to your restaurant panel, where you add your menu and hours."),
    }),
  });
}

// To the restaurant: approved, here is your panel.
export async function emailApplicationApproved(app: Application, panelLink: string): Promise<boolean> {
  const name = app.restaurant_name;
  const step = (n: number, html: string) =>
    `<tr><td style="padding:8px 12px 8px 0;vertical-align:top;width:30px"><div style="width:26px;height:26px;border-radius:50%;background:#16120D;color:#F5A524;font:700 13px/26px Arial,sans-serif;text-align:center">${n}</div></td>` +
    `<td style="padding:8px 0;font:15px/1.5 'Outfit',Helvetica,Arial,sans-serif;color:#5C564E">${html}</td></tr>`;
  const result = await sendEmail({
    to: app.email,
    subject: `${name} is approved on PaliaEats`,
    text:
      `Hi ${app.owner_name},\n\nGood news: ${name} is approved.\n\n` +
      `Open your restaurant panel (keep this link private, it works like a password):\n${panelLink}\n\n` +
      `What to do next:\n1. Add your menu: categories first (for example "Pizza"), then your dishes with prices.\n` +
      `2. Check your opening hours in Settings.\n` +
      `3. Tap "My menu is ready" in the panel. We'll then show ${name} to customers.\n\n` +
      `New orders will also be emailed to you here, each with a fresh panel link.\n`,
    html: emailLayout({
      preheader: `${name} is approved. Your restaurant panel is ready.`,
      kicker: "You're approved",
      title: `Welcome to PaliaEats, ${name}`,
      content:
        emailParagraph(`Hi ${escapeHtml(app.owner_name)}, your restaurant panel is ready. Keep this button private: it opens your panel without a password.`) +
        emailButton(panelLink, "Open your restaurant panel") +
        `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0 0">` +
        step(1, `<b style="color:#16120D">Add your menu</b>: categories first (for example &ldquo;Pizza&rdquo;), then your dishes with prices and photos.`) +
        step(2, `<b style="color:#16120D">Check your opening hours</b> in Settings.`) +
        step(3, `Tap <b style="color:#16120D">My menu is ready</b> in the panel. We'll then show ${escapeHtml(name)} to customers.`) +
        `</table>` +
        emailSmall("New orders will also be emailed to you here, each with a fresh panel link."),
    }),
  });
  return result.ok;
}

// To the restaurant: not this time.
export async function emailApplicationRejected(app: Application, reason: string | null): Promise<void> {
  const name = app.restaurant_name;
  await sendEmail({
    to: app.email,
    subject: `About your PaliaEats request for ${name}`,
    text:
      `Hi ${app.owner_name},\n\nThanks for your interest in PaliaEats. We can't add ${name} right now.` +
      `${reason ? `\n\nReason: ${reason}` : ""}\n\nYou're welcome to apply again later.\n`,
    html: emailLayout({
      preheader: `About your request to add ${name}.`,
      kicker: "About your request",
      title: `We can't add ${name} just yet`,
      content:
        emailParagraph(`Hi ${escapeHtml(app.owner_name)}, thanks for your interest in PaliaEats. We can't add <b style="color:#16120D">${escapeHtml(name)}</b> right now.`) +
        (reason ? emailNote("Reason:", reason) : "") +
        emailParagraph("You're welcome to apply again later."),
    }),
  });
}

// To the admin(s): a restaurant that is setting up says its menu is ready.
export async function emailRestaurantReady(restaurant: { id: string; name: string; dishes: number }): Promise<void> {
  try {
    const link = `${siteUrl()}/admin/restaurants/${restaurant.id}`;
    const html = emailLayout({
      preheader: `${restaurant.name} says its menu is ready.`,
      kicker: "Ready to go live",
      title: `${restaurant.name} is ready`,
      content:
        emailParagraph(
          `They say their menu is ready (${restaurant.dishes} ${restaurant.dishes === 1 ? "dish" : "dishes"}). Have a look, then tap <b style="color:#16120D">Make visible</b> to show them to customers.`,
        ) + emailButton(link, "Open the restaurant"),
    });
    for (const to of await adminEmails()) {
      await sendEmail({
        to,
        subject: `${restaurant.name} is ready to go live`,
        text: `${restaurant.name} says their menu is ready (${restaurant.dishes} dishes). Check it and make it visible: ${link}\n`,
        html,
      });
    }
  } catch (error) {
    console.error("[email] Could not send the ready email:", error instanceof Error ? error.message : error);
  }
}

export type { Application };
