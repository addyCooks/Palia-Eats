import "server-only";
import { escapeHtml } from "@/lib/email/shared";

// One look for every PaliaEats email (the app's v2 theme): a dark header with the
// wordmark, a white card, a saffron button, a quiet footer. Built from tables with inline
// styles, which is what email apps (Gmail, Outlook, phone mail) display reliably.

const C = {
  paper: "#F7F6F3",
  card: "#FFFFFF",
  ink: "#16120D",
  body: "#5C564E",
  meta: "#8A8378",
  line: "#ECE7DF",
  saffron: "#F5A524",
  onSaffron: "#1A1206",
  accent: "#C2410C",
  soft: "#FFF3DA",
};
const SERIF = "'DM Serif Display', Georgia, 'Times New Roman', serif";
const SANS = "'Outfit', 'Helvetica Neue', Helvetica, Arial, sans-serif";

// The big saffron button.
export function emailButton(href: string, label: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 8px"><tr>` +
    `<td style="border-radius:12px;background:${C.saffron}">` +
    `<a href="${href}" style="display:inline-block;padding:15px 26px;font-family:${SANS};font-size:15px;font-weight:700;color:${C.onSaffron};text-decoration:none;border-radius:12px">${escapeHtml(label)} &rarr;</a>` +
    `</td></tr></table>`
  );
}

// Label / value rows, e.g. the details of a restaurant request.
export function emailDetails(rows: [string, string][]): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 4px;border-top:1px solid ${C.line}">` +
    rows
      .map(
        ([label, value]) =>
          `<tr><td style="padding:11px 12px 11px 0;border-bottom:1px solid ${C.line};width:34%;vertical-align:top;font-family:${SANS};font-size:13px;color:${C.meta}">${escapeHtml(label)}</td>` +
          `<td style="padding:11px 0;border-bottom:1px solid ${C.line};vertical-align:top;font-family:${SANS};font-size:14px;color:${C.ink};font-weight:500">${escapeHtml(value).replace(/\n/g, "<br>")}</td></tr>`,
      )
      .join("") +
    `</table>`
  );
}

// Dish lines with prices, and the total underneath.
export function emailItems(items: { quantity: number; item_name: string; line_total: number }[], total: string, totalNote: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:20px 0 0;border-top:1px solid ${C.line}">` +
    items
      .map(
        (item) =>
          `<tr><td style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;color:${C.ink}">` +
          `<span style="color:${C.accent};font-weight:700">${item.quantity}&times;</span>&nbsp; ${escapeHtml(item.item_name)}</td>` +
          `<td align="right" style="padding:10px 0;border-bottom:1px solid ${C.line};font-family:${SANS};font-size:14px;color:${C.ink};white-space:nowrap">&#8377;${Number(item.line_total).toFixed(0)}</td></tr>`,
      )
      .join("") +
    `<tr><td style="padding:14px 0 0;font-family:${SANS};font-size:13px;color:${C.meta}">${escapeHtml(totalNote)}</td>` +
    `<td align="right" style="padding:14px 0 0;font-family:${SERIF};font-size:24px;color:${C.ink};white-space:nowrap">${escapeHtml(total)}</td></tr>` +
    `</table>`
  );
}

// A soft highlighted box (a note, a reason, a warning).
export function emailNote(label: string, text: string): string {
  return (
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:18px 0 0"><tr>` +
    `<td style="background:${C.soft};border-radius:12px;padding:12px 14px;font-family:${SANS};font-size:14px;color:${C.ink};line-height:1.5">` +
    `<strong>${escapeHtml(label)}</strong> ${escapeHtml(text)}</td></tr></table>`
  );
}

export function emailParagraph(html: string): string {
  return `<p style="margin:12px 0 0;font-family:${SANS};font-size:15px;line-height:1.6;color:${C.body}">${html}</p>`;
}

export function emailSmall(html: string): string {
  return `<p style="margin:18px 0 0;font-family:${SANS};font-size:12px;line-height:1.55;color:${C.meta}">${html}</p>`;
}

// The whole email. `brand` is what the header says: "PaliaEats" by default, or a
// restaurant's name on emails a customer gets about their order.
export function emailLayout({
  preheader,
  kicker,
  title,
  content,
  brand,
  footer = "PaliaEats · food from Palia's own kitchens · Palia Kalan, Uttar Pradesh",
}: {
  preheader: string;
  kicker: string;
  title: string;
  content: string;
  brand?: string;
  footer?: string;
}): string {
  const header = brand
    ? `<div style="font-family:${SANS};font-size:10px;letter-spacing:3px;color:${C.saffron};font-weight:700">ORDERED ON PALIAEATS</div>` +
      `<div style="font-family:${SERIF};font-size:28px;line-height:1.15;color:#FFFFFF;margin-top:4px">${escapeHtml(brand)}</div>`
    : `<div style="font-family:${SANS};font-size:10px;letter-spacing:3px;color:${C.saffron};font-weight:700">PALIA</div>` +
      `<div style="font-family:${SERIF};font-size:32px;line-height:1;color:#FFFFFF;margin-top:2px">Eats<span style="color:${C.saffron}">&#9679;</span></div>`;

  return (
    `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="color-scheme" content="light only"><title>${escapeHtml(title)}</title></head>` +
    `<body style="margin:0;padding:0;background:${C.paper}">` +
    // Shown as the grey preview line in the inbox, hidden in the email itself.
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(preheader)}</div>` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:${C.paper}"><tr><td align="center" style="padding:28px 14px">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="max-width:560px">` +
    // Header
    `<tr><td style="background:${C.ink};border-radius:20px 20px 0 0;padding:26px 30px">${header}</td></tr>` +
    // Saffron rule
    `<tr><td style="background:${C.saffron};height:4px;line-height:4px;font-size:0">&nbsp;</td></tr>` +
    // Card
    `<tr><td style="background:${C.card};border-radius:0 0 20px 20px;padding:30px 30px 32px">` +
    `<div style="font-family:${SANS};font-size:12px;letter-spacing:2px;text-transform:uppercase;color:${C.accent};font-weight:700">${escapeHtml(kicker)}</div>` +
    `<h1 style="margin:8px 0 0;font-family:${SERIF};font-weight:400;font-size:30px;line-height:1.15;color:${C.ink}">${escapeHtml(title)}</h1>` +
    content +
    `</td></tr>` +
    // Footer
    `<tr><td align="center" style="padding:20px 10px 0;font-family:${SANS};font-size:12px;line-height:1.6;color:${C.meta}">${escapeHtml(footer)}</td></tr>` +
    `</table></td></tr></table></body></html>`
  );
}
