import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// WhatsApp only allows free-form messages within 24 hours of the person's last message.
const WINDOW_MS = 24 * 60 * 60 * 1000;
// A chat that has been quiet this long starts again from the beginning.
export const SESSION_IDLE_MS = 3 * 60 * 60 * 1000;

export type SessionRow = {
  phone: string;
  data: Record<string, unknown>;
  last_inbound_at: string | null;
  updated_at: string;
};

export async function getSession(phone: string): Promise<SessionRow | null> {
  const { data } = await createAdminClient()
    .from("whatsapp_sessions")
    .select("phone, data, last_inbound_at, updated_at")
    .eq("phone", phone)
    .maybeSingle();
  return (data as SessionRow | null) ?? null;
}

// Called for every message we receive: remembers when they last wrote.
export async function recordInbound(phone: string): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await createAdminClient()
    .from("whatsapp_sessions")
    .upsert({ phone, last_inbound_at: now }, { onConflict: "phone", ignoreDuplicates: false });
  if (error) console.error("[whatsapp] Could not record inbound:", error.message);
}

export async function saveSessionData(phone: string, data: Record<string, unknown>): Promise<void> {
  const { error } = await createAdminClient()
    .from("whatsapp_sessions")
    .upsert({ phone, data, updated_at: new Date().toISOString() }, { onConflict: "phone" });
  if (error) console.error("[whatsapp] Could not save session:", error.message);
}

// Can we send this number a free-form message right now?
export async function isWindowOpen(phone: string): Promise<boolean> {
  const session = await getSession(phone);
  if (!session?.last_inbound_at) return false;
  return Date.now() - new Date(session.last_inbound_at).getTime() < WINDOW_MS;
}
