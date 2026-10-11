"use client";

import Link from "next/link";
import { keepValues } from "@/lib/forms";
import { useActionState } from "react";
import { login } from "@/lib/actions/auth";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function LoginForm({ next }: { next?: string }) {
  const t = useT();
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Input
        label={t("auth.field.email")}
        name="email"
        type="email"
        autoComplete="email"
        required
      />
      <div className="flex flex-col gap-1.5">
        <Input
          label={t("auth.field.password")}
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
        <Link href="/forgot-password" className="self-end text-[13px] font-semibold text-accent hover:underline">
          {t("auth.forgot.link")}
        </Link>
      </div>
      {state?.error && (
        <p role="alert" className="text-sm text-red-600">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-[54px]" disabled={pending}>
        {pending ? t("auth.login.submitting") : t("auth.login.submit")}
      </Button>
    </form>
  );
}
