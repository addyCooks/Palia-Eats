import "server-only";
import { sendEmail } from "@/lib/email/mailer";
import { button, escapeHtml, siteUrl } from "@/lib/email/shared";
import { createAdminClient } from "@/lib/supabase/admin";
import { formatTime } from "@/lib/utils/hours";

// Emails for restaurant registration requests. None of them may break the request itself:
// sendEmail never throws, and every function here swallows its own errors.

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

const wrap = (html: string) => `<div style="font-family:Arial,sans-serif;max-width:520px">${html}</div>`;

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
    ["Mobile", `+91 ${app.phone}`],
    ["Email", app.email],
    ["Area", app.area],
    ["Address", app.address],
    ["Cuisines", app.cuisines.join(", ") || "Not given"],
    ["Hours", hours],
    ["FSSAI licence", app.fssai ?? "Not given"],
    ["Message", app.message ?? "None"],
  ];
}

// To the admin(s): a new request is waiting.
export async function emailNewApplication(app: Application): Promise<void> {
  try {
    const link = `${siteUrl()}/admin/requests/${app.id}`;
    const rows = details(app);
    for (const to of await adminEmails()) {
      await sendEmail({
        to,
        subject: `New restaurant request: ${app.restaurant_name}`,
        text: `${rows.map(([k, v]) => `${k}: ${v}`).join("\n")}\n\nReview it: ${link}\n`,
        html: wrap(
          `<h2 style="margin:0 0 8px">New restaurant request</h2>` +
            `<table style="border-collapse:collapse;font-size:14px">${rows
              .map(
                ([k, v]) =>
                  `<tr><td style="padding:4px 12px 4px 0;color:#8a8378;vertical-align:top">${k}</td><td style="padding:4px 0">${escapeHtml(v)}</td></tr>`,
              )
              .join("")}</table>` +
            button(link, "Review the request"),
        ),
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
    html: wrap(
      `<p>Hi ${escapeHtml(app.owner_name)},</p>` +
        `<p>Thanks for asking to add <b>${escapeHtml(name)}</b> to PaliaEats. We'll check the details and email you here, usually within 1–2 days.</p>`,
    ),
  });
}

// To the restaurant: approved, here is your panel.
export async function emailApplicationApproved(app: Application, panelLink: string): Promise<boolean> {
  const name = app.restaurant_name;
  const result = await sendEmail({
    to: app.email,
    subject: `${name} is approved on PaliaEats`,
    text:
      `Hi ${app.owner_name},\n\nGood news: ${name} is approved.\n\n` +
      `Open your restaurant panel (keep this link private, it works like a password):\n${panelLink}\n\n` +
      `What to do next:\n1. Add your menu: categories first (for example "Pizza"), then your dishes with prices.\n` +
      `2. Check your opening hours in Settings.\n` +
      `3. Tell us when you're ready. We'll then show ${name} to customers.\n\n` +
      `New orders will also be emailed to you here, each with a fresh panel link.\n`,
    html: wrap(
      `<p>Hi ${escapeHtml(app.owner_name)},</p>` +
        `<h2 style="margin:0 0 8px">${escapeHtml(name)} is approved</h2>` +
        `<p>Your restaurant panel is ready. Keep this link private: it works like a password.</p>` +
        button(panelLink, "Open your restaurant panel") +
        `<p><b>What to do next</b></p><ol style="padding-left:20px">` +
        `<li>Add your menu: categories first (for example &ldquo;Pizza&rdquo;), then your dishes with prices.</li>` +
        `<li>Check your opening hours in Settings.</li>` +
        `<li>Tell us when you're ready. We'll then show ${escapeHtml(name)} to customers.</li></ol>` +
        `<p style="color:#8a8378;font-size:13px">New orders will also be emailed to you here, each with a fresh panel link.</p>`,
    ),
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
    html: wrap(
      `<p>Hi ${escapeHtml(app.owner_name)},</p>` +
        `<p>Thanks for your interest in PaliaEats. We can't add <b>${escapeHtml(name)}</b> right now.</p>` +
        (reason ? `<p><b>Reason:</b> ${escapeHtml(reason)}</p>` : "") +
        `<p>You're welcome to apply again later.</p>`,
    ),
  });
}

// To the admin(s): a restaurant that is setting up says its menu is ready.
export async function emailRestaurantReady(restaurant: { id: string; name: string; dishes: number }): Promise<void> {
  try {
    const link = `${siteUrl()}/admin/restaurants/${restaurant.id}`;
    for (const to of await adminEmails()) {
      await sendEmail({
        to,
        subject: `${restaurant.name} is ready to go live`,
        text: `${restaurant.name} says their menu is ready (${restaurant.dishes} dishes). Check it and make it visible: ${link}
`,
        html: wrap(
          `<h2 style="margin:0 0 8px">${escapeHtml(restaurant.name)} is ready to go live</h2>` +
            `<p>They say their menu is ready (${restaurant.dishes} ${restaurant.dishes === 1 ? "dish" : "dishes"}). Have a look, then make it visible.</p>` +
            button(link, "Open the restaurant"),
        ),
      });
    }
  } catch (error) {
    console.error("[email] Could not send the ready email:", error instanceof Error ? error.message : error);
  }
}

export type { Application };
