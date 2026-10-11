"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { keepValues } from "@/lib/forms";
import { submitApplication } from "@/lib/actions/applications";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";
import { BotTraps } from "@/components/forms/BotTraps";

// "Add your restaurant": the request goes to the admin, who approves it and emails the
// restaurant its panel link.
export function JoinForm() {
  const t = useT();
  const [state, formAction, pending] = useActionState(submitApplication, undefined);

  if (state?.done) {
    return (
      <ProblemScreen
        glyph="✓"
        title={t("join.done_title")}
        action={
          <Link href="/" className={problemActionClass}>
            {t("goodbye.home")}
          </Link>
        }
      >
        {state.done.email
          ? t("join.done_body_email", { name: state.done.name, email: state.done.email })
          : t("join.done_body", { name: state.done.name })}
      </ProblemScreen>
    );
  }

  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-4">
      {/* Left empty by people; bots fill it in, or send the form faster than a person could. */}
      <BotTraps />

      <Input label={t("join.f.name")} name="restaurant_name" required maxLength={80} autoComplete="organization" />
      <Input label={t("join.f.owner")} name="owner_name" required maxLength={80} autoComplete="name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label={t("account.profile.phone")} name="phone" type="tel" inputMode="numeric" required maxLength={16} placeholder="98765 43210" autoComplete="tel-national" />
        <Input label={t("join.f.email")} name="email" type="email" required maxLength={120} autoComplete="email" />
      </div>
      <Input label={t("join.f.area")} name="area" required maxLength={60} placeholder={t("join.f.area_ph")} />
      <Textarea label={t("join.f.address")} name="address" required maxLength={300} rows={2} />
      <Input label={t("join.f.cuisines")} name="cuisines" maxLength={200} placeholder="Biryani, North Indian, Chinese" />
      <div className="grid grid-cols-2 gap-4">
        <Input label={t("join.f.opens")} name="opening_time" type="time" />
        <Input label={t("join.f.closes")} name="closing_time" type="time" />
      </div>
      <Input label={t("join.f.fssai")} name="fssai" inputMode="numeric" maxLength={17} placeholder={t("join.f.fssai_ph")} />
      <Textarea label={t("join.f.message")} name="message" maxLength={600} />

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-[54px]" disabled={pending}>
        {pending ? t("rate.sending") : t("join.send")}
      </Button>
      <p className="text-center text-xs text-stone-500">{t("join.note")}</p>
    </form>
  );
}
