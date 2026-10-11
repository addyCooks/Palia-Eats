"use client";

import Link from "next/link";
import { keepValues } from "@/lib/forms";
import { useActionState } from "react";
import { forgotPassword } from "@/lib/actions/auth";
import { useT } from "@/lib/i18n/client";
import { BotTraps } from "@/components/forms/BotTraps";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ForgotPasswordForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState(forgotPassword, undefined);

  if (state?.message) {
    return (
      <div className="flex flex-col gap-4">
        <p role="status" className="rounded-xl bg-amber-50 p-4 text-sm text-amber-900">
          {state.message}
        </p>
        <Link href="/login" className="text-center text-sm font-semibold text-accent hover:underline">
          {t("auth.forgot.back")}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={keepValues(formAction)} className="relative flex flex-col gap-4">
      <BotTraps />
      <Input label={t("auth.field.email")} name="email" type="email" autoComplete="email" required />
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-[54px]" disabled={pending}>
        {pending ? t("auth.forgot.submitting") : t("auth.forgot.submit")}
      </Button>
      <Link href="/login" className="text-center text-sm font-semibold text-accent hover:underline">
        {t("auth.forgot.back")}
      </Link>
    </form>
  );
}
