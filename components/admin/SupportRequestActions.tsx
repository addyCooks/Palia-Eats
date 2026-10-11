"use client";

import { useActionState } from "react";
import { keepValues } from "@/lib/forms";
import { updateSupportRequest, type SupportUpdateState } from "@/lib/actions/support";
import type { SupportStatus } from "@/lib/support/topics";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";

// Reply happens by email or WhatsApp (buttons on the page); this records where the request
// stands and keeps a private note.
export function SupportRequestActions({
  id,
  status,
  note,
}: {
  id: string;
  status: SupportStatus;
  note: string | null;
}) {
  const [state, formAction, pending] = useActionState<SupportUpdateState, FormData>(updateSupportRequest, undefined);

  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-3">
      <input type="hidden" name="id" value={id} />
      <Textarea
        label="Private note (only admins see this)"
        name="note"
        rows={3}
        maxLength={600}
        defaultValue={note ?? ""}
        placeholder="What you told them, or what is still pending"
      />
      {state?.error && (
        <p role="alert" className="text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="text-sm font-medium text-amber-900">
          Saved.
        </p>
      )}
      <div className="flex flex-wrap gap-2.5">
        {status !== "answered" && (
          <Button type="submit" name="status" value="answered" disabled={pending}>
            Mark answered
          </Button>
        )}
        {status !== "closed" && (
          <Button type="submit" name="status" value="closed" variant="secondary" disabled={pending}>
            Close
          </Button>
        )}
        {status !== "open" && (
          <Button type="submit" name="status" value="open" variant="secondary" disabled={pending}>
            Reopen
          </Button>
        )}
      </div>
    </form>
  );
}
