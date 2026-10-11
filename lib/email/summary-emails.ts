import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { createPanelToken } from "@/lib/panel/token";
import { sendEmail } from "@/lib/email/mailer";
import { escapeHtml, siteUrl } from "@/lib/email/shared";
import { emailButton, emailDetails, emailLayout, emailParagraph, emailSmall } from "@/lib/email/layout";
import { percentChange, type WeekSummary } from "@/lib/reports/weekly";
import { formatPrice } from "@/lib/utils/format";
import { formatKeyRange, formatKeyShort, weekdayShortOfKey } from "@/lib/utils/time";

type SummaryArgs = {
  restaurantId: string;
  restaurantName: string;
  to: string;
  event: string; // "weekly_summary_2026-10-05": makes sure a week is emailed only once
  weekStart: string;
  weekEnd: string;
  summary: WeekSummary;
  previous: WeekSummary;
  ratings: number[];
};

function changeText(current: number, previous: number): string {
  const change = percentChange(current, previous);
  if (change === null) return "";
  return change === 0 ? " (same as the week before)" : ` (${change > 0 ? "+" : ""}${change}% vs the week before)`;
}

// The Monday "your week" email. Returns true when it was sent. Never throws.
export async function sendWeeklySummary(args: SummaryArgs): Promise<boolean> {
  try {
    const { summary, previous, ratings } = args;
    const range = formatKeyRange(args.weekStart, args.weekEnd);
    const panelLink = `${siteUrl()}/panel/enter/${createPanelToken(args.restaurantId, new Date(), 30)}`;

    const rows: [string, string][] = [
      ["Orders delivered", `${summary.delivered}${changeText(summary.delivered, previous.delivered)}`],
      ["Sales", `${formatPrice(summary.sales)}${changeText(summary.sales, previous.sales)}`],
    ];
    if (summary.delivered > 0) rows.push(["Average order", formatPrice(summary.averageOrder)]);
    if (summary.bestDay) {
      rows.push([
        "Best day",
        `${weekdayShortOfKey(summary.bestDay.dayKey)} ${formatKeyShort(summary.bestDay.dayKey)}: ${formatPrice(summary.bestDay.sales)} from ${summary.bestDay.orders} order${summary.bestDay.orders === 1 ? "" : "s"}`,
      ]);
    }
    if (summary.topDishes.length) {
      rows.push(["Most ordered", summary.topDishes.map((dish) => `${dish.name} (${dish.quantity})`).join("\n")]);
    }
    if (ratings.length) {
      const average = ratings.reduce((sum, stars) => sum + stars, 0) / ratings.length;
      rows.push(["New ratings", `${ratings.length} (average ${average.toFixed(1)} stars)`]);
    }
    if (summary.cancelled) rows.push(["Cancelled orders", String(summary.cancelled)]);

    const intro =
      summary.delivered > 0
        ? `Here is how <b style="color:#16120D">${escapeHtml(args.restaurantName)}</b> did on PaliaEats last week.`
        : `There were no delivered orders at <b style="color:#16120D">${escapeHtml(args.restaurantName)}</b> last week. Keep your menu fresh and your panel open at opening time, and the orders will come.`;

    const html = emailLayout({
      preheader: `${summary.delivered} orders and ${formatPrice(summary.sales)} last week.`,
      kicker: `Weekly summary · ${range}`,
      title: `Your week at ${args.restaurantName}`,
      content:
        emailParagraph(intro) +
        emailDetails(rows) +
        emailButton(panelLink, "Open your orders panel") +
        emailSmall("Don't want this email? Open your panel, go to Settings and switch off “Weekly summary email”."),
      footer: "PaliaEats · weekly summary for restaurants",
    });

    const text =
      `Your week at ${args.restaurantName} (${range})\n\n` +
      rows.map(([label, value]) => `${label}: ${value.replace(/\n/g, ", ")}`).join("\n") +
      `\n\nOpen your orders panel: ${panelLink}\n\nTo stop these emails, switch off "Weekly summary email" in Settings.\n`;

    const result = await sendEmail({ to: args.to, subject: `Your week at ${args.restaurantName}: ${range}`, html, text });
    await createAdminClient()
      .from("notification_log")
      .insert({
        order_id: null,
        channel: "email",
        recipient_type: "restaurant",
        event: args.event,
        recipient: args.to,
        status: result.ok ? "sent" : "failed",
        error: result.ok ? null : result.error.slice(0, 500),
      });
    return result.ok;
  } catch (error) {
    console.error("[email] Could not send the weekly summary:", error instanceof Error ? error.message : error);
    return false;
  }
}
