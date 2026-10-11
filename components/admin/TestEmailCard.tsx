"use client";

import { useState, useTransition } from "react";
import { sendTestEmail, type TestEmailState } from "@/lib/actions/admin-email";
import { Button } from "@/components/ui/Button";

export function TestEmailCard({ configured, host, from }: { configured: boolean; host: string | null; from: string | null }) {
  const [result, setResult] = useState<TestEmailState>(undefined);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col gap-3 text-sm">
      {configured ? (
        <p className="text-stone-600">
          Sending through <b>{host}</b> as <b className="break-all">{from}</b>.
        </p>
      ) : (
        <p className="rounded-xl bg-red-50 p-3 text-red-700">
          Email is not set up on this server, so no emails are sent. See docs/email-setup.md.
        </p>
      )}
      <Button
        variant="secondary"
        className="self-start"
        loading={pending}
        disabled={pending || !configured}
        onClick={() => {
          setResult(undefined);
          startTransition(async () => setResult(await sendTestEmail()));
        }}
      >
        Send a test email to me
      </Button>
      {result?.sentTo && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 font-medium text-amber-900">
          Sent to {result.sentTo}. Check your inbox (and spam).
        </p>
      )}
      {result?.error && (
        <p role="alert" className="break-words rounded-xl bg-red-50 p-3 text-red-700">
          Could not send: {result.error}
        </p>
      )}
    </div>
  );
}
