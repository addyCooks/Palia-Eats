"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { keepValues } from "@/lib/forms";
import { approveApplication, rejectApplication } from "@/lib/actions/applications";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

// Approve (creates the restaurant in "setting up" mode and emails the panel link) or
// reject (emails the reason) a restaurant request.
export function ApplicationDecision({
  applicationId,
  suggestedSlug,
  email,
}: {
  applicationId: string;
  suggestedSlug: string;
  email: string;
}) {
  const router = useRouter();
  const [approved, approve, approving] = useActionState(approveApplication, undefined);
  const [rejected, reject, rejecting] = useActionState(rejectApplication, undefined);
  const busy = approving || rejecting;

  // Done: reload the page to show the result.
  const doneKey = approved?.approved?.emailed ? "a" : rejected && !rejected.error ? "r" : null;
  useEffect(() => {
    if (doneKey) router.refresh();
  }, [doneKey, router]);

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <form onSubmit={keepValues(approve)} className="flex flex-col gap-4 rounded-[18px] bg-surface p-5 shadow-card">
        <input type="hidden" name="applicationId" value={applicationId} />
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Approve</h2>
          <p className="text-sm text-stone-600">
            Creates the restaurant, hidden from customers while it sets up, and emails its panel link to {email}.
          </p>
        </div>
        <Input label="Web address (paliaeats…/restaurants/…)" name="slug" defaultValue={suggestedSlug} required maxLength={60} />
        <Input label="Commission %" name="commission_percent" type="number" min={0} max={100} step="0.5" defaultValue={8} required />
        {approved?.error && (
          <p role="alert" className="text-sm text-red-700">
            {approved.error}
          </p>
        )}
        {approved?.approved && !approved.approved.emailed && (
          <p role="alert" className="rounded-xl bg-amber-50 p-3 text-sm text-amber-900">
            Approved, but the email with the panel link could not be sent.{" "}
            <a href={`/admin/restaurants/${approved.approved.restaurantId}/edit`} className="font-semibold underline">
              Open the restaurant
            </a>{" "}
            and create a panel link to send them yourself.
          </p>
        )}
        <Button type="submit" disabled={busy}>
          {approving ? "Approving…" : "Approve and send panel link"}
        </Button>
      </form>

      <form
        onSubmit={(event) => {
          if (!window.confirm("Reject this request? The restaurant gets an email.")) {
            event.preventDefault();
            return;
          }
          keepValues(reject)(event);
        }}
        className="flex flex-col gap-4 rounded-[18px] bg-surface p-5 shadow-card"
      >
        <input type="hidden" name="applicationId" value={applicationId} />
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold">Reject</h2>
          <p className="text-sm text-stone-600">The restaurant gets a polite email, with your reason if you give one.</p>
        </div>
        <Textarea label="Reason (optional, they will see it)" name="reason" maxLength={300} />
        {rejected?.error && (
          <p role="alert" className="text-sm text-red-700">
            {rejected.error}
          </p>
        )}
        <Button type="submit" variant="danger" disabled={busy}>
          {rejecting ? "Rejecting…" : "Reject request"}
        </Button>
      </form>
    </div>
  );
}
