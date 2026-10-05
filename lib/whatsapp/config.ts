import "server-only";

// All WhatsApp settings come from environment variables (see .env.example).
// Nothing here is secret-printing: it only reads them.
export function whatsappConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN ?? "",
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID ?? "",
    appSecret: process.env.WHATSAPP_APP_SECRET ?? "",
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN ?? "",
    apiVersion: process.env.WHATSAPP_API_VERSION ?? "v21.0",
    // Pre-approved message template used when we must message someone outside the
    // 24-hour chat window (see docs/whatsapp-setup.md).
    templateName: process.env.WHATSAPP_TEMPLATE_ORDER_UPDATE ?? "",
    templateLanguage: process.env.WHATSAPP_TEMPLATE_LANGUAGE ?? "en",
    // Development only: print messages to the server console instead of sending them.
    dryRun: process.env.WHATSAPP_DRY_RUN === "true",
  };
}

// True when we can really send messages.
export function canSendWhatsApp(): boolean {
  const config = whatsappConfig();
  return Boolean(config.accessToken && config.phoneNumberId);
}
