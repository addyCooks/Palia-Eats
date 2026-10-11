import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";

// The admin's "who did what" diary (Admin -> Activity). Called by admin actions after the
// admin check. Rows can only be added by the server and can't be edited or deleted from the
// site, so it is a trustworthy record. NEVER throws: a failed diary entry must not undo the
// action that already happened.
export type AuditEntry = {
  action: string; // short code, e.g. "customer.block"
  summary: string; // one plain sentence, e.g. "Blocked customer Asha"
  targetType?: string;
  targetId?: string;
  details?: Record<string, unknown>;
};

export async function logAdminAction(
  actor: { id: string; full_name: string | null },
  entry: AuditEntry,
): Promise<void> {
  try {
    const { error } = await createAdminClient()
      .from("admin_audit_log")
      .insert({
        actor_id: actor.id,
        actor_name: actor.full_name?.slice(0, 80) ?? null,
        action: entry.action,
        summary: entry.summary.slice(0, 300),
        target_type: entry.targetType ?? null,
        target_id: entry.targetId ?? null,
        details: entry.details ?? null,
      });
    if (error) console.error("[audit] Could not write the activity log:", error.message);
  } catch (caught) {
    console.error("[audit] Could not write the activity log:", caught instanceof Error ? caught.message : caught);
  }
}
