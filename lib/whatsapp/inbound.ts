// Turns WhatsApp's webhook payload into a simple list of messages we can act on.

export type Inbound = {
  id: string; // WhatsApp message id (used to ignore retries)
  from: string; // sender's WhatsApp number, e.g. "919876543210"
  profileName: string | null; // the name shown on their WhatsApp
  kind: "text" | "reply" | "location" | "other";
  text: string | null; // typed text
  replyId: string | null; // id of the button / list row they tapped
  location: { latitude: number; longitude: number; name?: string; address?: string } | null;
};

type Obj = Record<string, unknown>;
const isObj = (value: unknown): value is Obj => typeof value === "object" && value !== null;
const str = (value: unknown): string | null => (typeof value === "string" ? value : null);

export function parseInbound(payload: unknown): Inbound[] {
  const result: Inbound[] = [];
  if (!isObj(payload) || !Array.isArray(payload.entry)) return result;

  for (const entry of payload.entry) {
    if (!isObj(entry) || !Array.isArray(entry.changes)) continue;
    for (const change of entry.changes) {
      if (!isObj(change) || !isObj(change.value)) continue;
      const value = change.value;
      const messages = Array.isArray(value.messages) ? value.messages : [];

      // contacts[] carries the sender's WhatsApp display name, keyed by number
      const names = new Map<string, string>();
      if (Array.isArray(value.contacts)) {
        for (const contact of value.contacts) {
          if (isObj(contact) && str(contact.wa_id) && isObj(contact.profile) && str(contact.profile.name)) {
            names.set(contact.wa_id as string, contact.profile.name as string);
          }
        }
      }

      for (const message of messages) {
        if (!isObj(message)) continue;
        const id = str(message.id);
        const from = str(message.from);
        if (!id || !from || !/^[0-9]{8,15}$/.test(from)) continue;

        const base = { id, from, profileName: names.get(from) ?? null };
        const type = str(message.type);

        if (type === "text" && isObj(message.text) && str(message.text.body) !== null) {
          result.push({
            ...base,
            kind: "text",
            text: (message.text.body as string).slice(0, 1000),
            replyId: null,
            location: null,
          });
        } else if (type === "interactive" && isObj(message.interactive)) {
          const reply = isObj(message.interactive.button_reply)
            ? message.interactive.button_reply
            : isObj(message.interactive.list_reply)
              ? message.interactive.list_reply
              : null;
          const replyId = reply ? str(reply.id) : null;
          result.push(
            replyId
              ? { ...base, kind: "reply", text: str(reply?.title), replyId, location: null }
              : { ...base, kind: "other", text: null, replyId: null, location: null },
          );
        } else if (type === "button" && isObj(message.button)) {
          // Replies to template buttons
          const payloadText = str(message.button.payload) ?? str(message.button.text);
          result.push({ ...base, kind: "text", text: payloadText, replyId: null, location: null });
        } else if (type === "location" && isObj(message.location)) {
          const { latitude, longitude } = message.location;
          if (typeof latitude === "number" && typeof longitude === "number") {
            result.push({
              ...base,
              kind: "location",
              text: null,
              replyId: null,
              location: {
                latitude,
                longitude,
                name: str(message.location.name) ?? undefined,
                address: str(message.location.address) ?? undefined,
              },
            });
          }
        } else {
          result.push({ ...base, kind: "other", text: null, replyId: null, location: null });
        }
      }
    }
  }
  return result;
}
