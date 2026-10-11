"use client";

import { keepValues } from "@/lib/forms";
import { useActionState } from "react";
import { changePassword, type AccountFormState } from "@/lib/actions/account";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ChangePasswordForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState<AccountFormState, FormData>(changePassword, undefined);

  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-4">
      <Input
        label={t("auth.field.password_current")}
        name="current"
        type="password"
        autoComplete="current-password"
        required
      />
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
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900">
          {t("account.password.saved")}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("auth.reset.saving") : t("account.password.submit")}
      </Button>
    </form>
  );
}
