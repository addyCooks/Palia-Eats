"use client";

import { keepValues } from "@/lib/forms";
import { useActionState } from "react";
import { signup } from "@/lib/actions/auth";
import { useT } from "@/lib/i18n/client";
import { BotTraps } from "@/components/forms/BotTraps";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function SignupForm({ next }: { next?: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(signup, undefined);

  if (state?.message) {
    return (
      <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
        {state.message}
      </p>
    );
  }

  return (
    <form onSubmit={keepValues(formAction)} className="relative flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <BotTraps />
      <Input
        label={t("auth.field.full_name")}
        name="fullName"
        autoComplete="name"
        required
      />
      <Input
        label={t("auth.field.email")}
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <Input
        label={t("auth.field.password_new")}
        name="password"
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
        {pending ? t("auth.signup.submitting") : t("auth.signup.submit")}
      </Button>
    </form>
  );
}
