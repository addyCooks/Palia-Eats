"use client";

import { useActionState } from "react";
import { keepValues } from "@/lib/forms";
import { verifyTotpLogin, type TotpResult } from "@/lib/actions/mfa";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// The second step of an admin login: the 6-digit code from the authenticator app.
export function TotpForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<TotpResult | undefined, FormData>(verifyTotpLogin, undefined);

  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Input
        label="6-digit code"
        name="code"
        inputMode="numeric"
        autoComplete="one-time-code"
        pattern="[0-9 ]{6,7}"
        maxLength={7}
        required
        autoFocus
      />
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-[54px]" disabled={pending}>
        {pending ? "Checking..." : "Continue"}
      </Button>
    </form>
  );
}
