import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { handleBotMessage } from "@/lib/whatsapp/bot";
import { sendWhatsApp } from "@/lib/whatsapp/client";
import type { Inbound } from "@/lib/whatsapp/inbound";
import { toNationalNumber } from "@/lib/whatsapp/phone";
import { recordInbound } from "@/lib/whatsapp/sessions";

const OPT_OUT_WORDS = ["stop", "unsubscribe", "stop updates", "opt out", "optout"];

// Handles one person asking us to stop sending WhatsApp updates.
async function handleOptOut(message: Inbound): Promise<void> {
  const admin = createAdminClient();
  const national = toNationalNumber(message.from);

  // Matches both bot customers (by WhatsApp number) and website customers (by mobile number).
  const filters = [`whatsapp_phone.eq.${message.from}`];
  if (national) filters.push(`phone.eq.${national}`);
  await admin.from("profiles").update({ whatsapp_opt_in: false }).or(filters.join(","));

  await sendWhatsApp(message.from, {
    type: "text",
    body: "Done. You won't get order updates on WhatsApp any more. You can still check your orders on the website.",
  });
}

// Processes messages received from WhatsApp. Runs after the webhook has already answered
// "200 OK", so slow work here can never make WhatsApp retry. Never throws.
export async function processInbound(messages: Inbound[]): Promise<void> {
  const admin = createAdminClient();

  for (const message of messages) {
    try {
      // WhatsApp sometimes delivers the same message twice: handle each id once.
      const { error } = await admin.from("whatsapp_processed").insert({ message_id: message.id });
      if (error) {
        if (error.code === "23505") continue; // already handled
        console.error("[whatsapp] Could not mark message handled:", error.message);
        continue;
      }

      await recordInbound(message.from);

      const typed = message.kind === "text" ? (message.text ?? "").trim().toLowerCase() : "";
      if (OPT_OUT_WORDS.includes(typed)) {
        await handleOptOut(message);
        continue;
      }
      await handleBotMessage(message);
    } catch (error) {
      console.error("[whatsapp] Could not process a message:", error instanceof Error ? error.message : error);
    }
  }

  // Housekeeping: forget message ids older than a week.
  await admin
    .from("whatsapp_processed")
    .delete()
    .lt("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
}
