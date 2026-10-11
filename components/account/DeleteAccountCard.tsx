"use client";

import { useActionState, useState } from "react";
import { keepValues } from "@/lib/forms";
import { deleteAccount, type DeleteAccountState } from "@/lib/actions/account";
import { useT } from "@/lib/i18n/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

// "Your data": download a copy, or delete the account (typing DELETE to confirm).
export function DeleteAccountCard() {
  const t = useT();
  const [open, setOpen] = useState(false);
  const [state, formAction, pending] = useActionState<DeleteAccountState, FormData>(deleteAccount, undefined);

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-stone-600">{t("account.data.intro")}</p>
      <div className="flex flex-wrap gap-2.5">
        <a
          href="/account/export"
          download
          className="press inline-flex h-11 items-center rounded-xl border-[1.5px] border-border bg-surface px-5 text-[15px] font-semibold hover:bg-muted"
        >
          {t("account.data.download")}
        </a>
        {!open && (
          <Button variant="danger" onClick={() => setOpen(true)}>
            {t("account.delete.open")}
          </Button>
        )}
      </div>

      {open && (
        <form onSubmit={keepValues(formAction)} className="flex flex-col gap-3 rounded-2xl bg-red-50 p-4 dark:bg-red-950/30">
          <p className="text-sm leading-relaxed text-red-800 dark:text-red-200">{t("account.delete.warning")}</p>
          <Input label={t("account.delete.type")} name="confirm" autoComplete="off" autoCapitalize="characters" required />
          {state?.error && (
            <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-300">
              {state.error}
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            <Button type="submit" variant="danger" disabled={pending}>
              {pending ? t("account.delete.deleting") : t("account.delete.submit")}
            </Button>
            <Button variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
              {t("account.delete.cancel")}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
