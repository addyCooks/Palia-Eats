"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth/session";
import { logAdminAction } from "@/lib/admin/audit";
import { createClient } from "@/lib/supabase/server";

// "Mark fixed" / "Reopen" on a problem in Admin -> Problems. A fixed problem that happens again
// is reopened by itself (and emailed to the admin again).
export async function setErrorResolved(input: { id: number; resolved: boolean }): Promise<{ error?: string }> {
  const admin = await requireAdmin();
  const id = Number(input?.id);
  if (!Number.isInteger(id) || id < 1) return { error: "Missing problem." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("error_log")
    .update({ resolved: Boolean(input.resolved), resolved_at: input.resolved ? new Date().toISOString() : null })
    .eq("id", id)
    .select("id");
  if (error || !data?.length) return { error: "Could not change this. Please try again." };

  await logAdminAction(admin, {
    action: input.resolved ? "error.resolve" : "error.reopen",
    summary: `${input.resolved ? "Marked a problem fixed" : "Reopened a problem"}`,
    targetType: "error",
    targetId: String(id),
  });
  revalidatePath("/admin/errors");
  revalidatePath("/admin", "layout");
  return {};
}
