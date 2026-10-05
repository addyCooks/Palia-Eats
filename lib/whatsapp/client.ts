import "server-only";
import { canSendWhatsApp, whatsappConfig } from "@/lib/whatsapp/config";

// What we can send. These map onto the official WhatsApp Cloud API message types.
export type OutMessage =
  | { type: "text"; body: string }
  | {
      type: "buttons"; // up to 3 quick-reply buttons
      body: string;
      buttons: { id: string; title: string }[];
    }
  | {
      type: "list"; // a menu with up to 10 rows in total
      body: string;
      buttonLabel: string;
      header?: string;
      rows: { id: string; title: string; description?: string }[];
    }
  | { type: "template"; name: string; language: string; params: string[] };

export type SendResult =
  | { ok: true; dryRun?: boolean }
  | { ok: false; error: string; outsideWindow?: boolean };

const clip = (value: string, max: number) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

// WhatsApp error codes meaning "this person hasn't written to us in the last 24 hours".
const OUTSIDE_WINDOW_CODES = [131047, 131051];

function toApiPayload(to: string, message: OutMessage) {
  const base = { messaging_product: "whatsapp", recipient_type: "individual", to };

  switch (message.type) {
    case "text":
      return { ...base, type: "text", text: { body: clip(message.body, 4000), preview_url: false } };

    case "buttons":
      return {
        ...base,
        type: "interactive",
        interactive: {
          type: "button",
          body: { text: clip(message.body, 1024) },
          action: {
            buttons: message.buttons.slice(0, 3).map((button) => ({
              type: "reply",
              reply: { id: button.id.slice(0, 256), title: clip(button.title, 20) },
            })),
          },
        },
      };

    case "list":
      return {
        ...base,
        type: "interactive",
        interactive: {
          type: "list",
          ...(message.header ? { header: { type: "text", text: clip(message.header, 60) } } : {}),
          body: { text: clip(message.body, 1024) },
          action: {
            button: clip(message.buttonLabel, 20),
            sections: [
              {
                title: "Choose one",
                rows: message.rows.slice(0, 10).map((row) => ({
                  id: row.id.slice(0, 200),
                  title: clip(row.title, 24),
                  ...(row.description ? { description: clip(row.description, 72) } : {}),
                })),
              },
            ],
          },
        },
      };

    case "template":
      return {
        ...base,
        type: "template",
        template: {
          name: message.name,
          language: { code: message.language },
          components: message.params.length
            ? [
                {
                  type: "body",
                  parameters: message.params.map((text) => ({ type: "text", text: clip(text, 500) })),
                },
              ]
            : [],
        },
      };
  }
}

// Sends one WhatsApp message. NEVER throws: a failed message must not break an order.
export async function sendWhatsApp(to: string, message: OutMessage): Promise<SendResult> {
  const config = whatsappConfig();

  if (!canSendWhatsApp()) {
    if (config.dryRun) {
      console.log(`\n[whatsapp dry-run] To: ${to}\n${JSON.stringify(toApiPayload(to, message), null, 2)}\n`);
      return { ok: true, dryRun: true };
    }
    return { ok: false, error: "WhatsApp is not configured" };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);
  try {
    const response = await fetch(
      `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(toApiPayload(to, message)),
        signal: controller.signal,
      },
    );

    if (response.ok) return { ok: true };

    const body = (await response.json().catch(() => null)) as {
      error?: { message?: string; code?: number };
    } | null;
    const code = body?.error?.code;
    const text = `${body?.error?.message ?? `HTTP ${response.status}`}${code ? ` (code ${code})` : ""}`;
    console.error("[whatsapp] Send failed:", text);
    return { ok: false, error: text, outsideWindow: code !== undefined && OUTSIDE_WINDOW_CODES.includes(code) };
  } catch (error) {
    const text = error instanceof Error ? error.message : String(error);
    console.error("[whatsapp] Send failed:", text);
    return { ok: false, error: text };
  } finally {
    clearTimeout(timer);
  }
}
