"use client";

import { keepValues } from "@/lib/forms";
import { useActionState } from "react";
import { resetPassword } from "@/lib/actions/auth";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ResetPasswordForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState(resetPassword, undefined);

  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-4">
      <Input
        label={t("auth.field.password_new_only")}
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      <Input
        label={t("auth.field.password_confirm")}
        name="confirm"
        type="password"
        autoComplete="new-password"
        minLength={8}
        required
      />
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-[54px]" disabled={pending}>
        {pending ? t("auth.reset.saving") : t("auth.reset.submit")}
      </Button>
    </form>
  );
}
