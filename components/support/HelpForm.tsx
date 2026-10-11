"use client";

import { useActionState } from "react";
import { keepValues } from "@/lib/forms";
import { sendHelpRequest, type HelpState } from "@/lib/actions/support";
import { CUSTOMER_TOPICS } from "@/lib/support/topics";
import { useT } from "@/lib/i18n/client";
import type { MessageKey } from "@/lib/i18n/messages";
import { BotTraps } from "@/components/forms/BotTraps";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export const selectClass =
  "h-[50px] rounded-xl border-[1.5px] border-border bg-surface px-3 text-[15px] outline-none transition-colors focus:border-brand";

// "Send us a message" on the Help page. Signed-in customers don't retype their details.
export function HelpForm({
  signedInEmail,
  defaultOrder,
  hours,
}: {
  signedInEmail: string | null;
  defaultOrder: string;
  hours: string;
}) {
  const t = useT();
  const [state, formAction, pending] = useActionState<HelpState, FormData>(sendHelpRequest, undefined);

  if (state?.done) {
    return (
      <div role="status" className="flex flex-col gap-3 rounded-2xl bg-amber-50 p-5 text-amber-900">
        <p className="text-lg font-semibold">{t("help.done.title")}</p>
        <p className="text-sm">{t("help.done.body", { hours })}</p>
        <a href="/help#message" className="self-start text-sm font-semibold underline">
          {t("help.done.again")}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={keepValues(formAction)} className="relative flex flex-col gap-4">
      <BotTraps />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="topic" className="text-[13px] font-semibold text-stone-600">
          {t("help.form.topic")}
        </label>
        <select id="topic" name="topic" required defaultValue={defaultOrder ? "order_problem" : ""} className={selectClass}>
          <option value="" disabled>
            {t("help.form.topic_choose")}
          </option>
          {CUSTOMER_TOPICS.map((topic) => (
            <option key={topic.code} value={topic.code}>
              {t(`help.topic.${topic.code}` as MessageKey)}
            </option>
          ))}
        </select>
      </div>

      <Input
        label={t("help.form.order")}
        name="order"
        inputMode="numeric"
        maxLength={10}
        placeholder={t("help.form.order_placeholder")}
        defaultValue={defaultOrder}
      />
      <Textarea label={t("help.form.message")} name="message" rows={5} maxLength={1000} required />

      {signedInEmail ? (
        <p className="text-sm text-stone-600">{t("help.form.sending_as", { email: signedInEmail })}</p>
      ) : (
        <div className="flex flex-col gap-4">
          <Input label={t("help.form.name")} name="name" autoComplete="name" maxLength={80} required />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label={t("help.form.email")} name="email" type="email" autoComplete="email" maxLength={120} />
            <Input label={t("help.form.phone")} name="phone" type="tel" autoComplete="tel" inputMode="numeric" maxLength={14} />
          </div>
          <p className="-mt-2 text-[13px] text-stone-500">{t("help.form.contact_note")}</p>
        </div>
      )}

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("help.form.sending") : t("help.form.submit")}
      </Button>
    </form>
  );
}
