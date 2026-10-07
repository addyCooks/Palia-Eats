"use client";

import { useActionState } from "react";
import Link from "next/link";
import { keepValues } from "@/lib/forms";
import { submitApplication } from "@/lib/actions/applications";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ProblemScreen, problemActionClass } from "@/components/ui/ProblemScreen";

// "Add your restaurant": the request goes to the admin, who approves it and emails the
// restaurant its panel link.
export function JoinForm() {
  const [state, formAction, pending] = useActionState(submitApplication, undefined);

  if (state?.done) {
    return (
      <ProblemScreen
        glyph="✓"
        title="Request sent"
        action={
          <Link href="/" className={problemActionClass}>
            Back to PaliaEats
          </Link>
        }
      >
        Thanks! We&apos;ll check the details for {state.done.name} and email you
        {state.done.email ? ` at ${state.done.email}` : ""}, usually within 1–2 days. Once approved, you&apos;ll get
        a link to your restaurant panel.
      </ProblemScreen>
    );
  }

  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-4">
      {/* Left empty by people; bots fill it in. */}
      <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>

      <Input label="Restaurant name" name="restaurant_name" required maxLength={80} autoComplete="organization" />
      <Input label="Owner's name" name="owner_name" required maxLength={80} autoComplete="name" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input label="Mobile number" name="phone" type="tel" inputMode="numeric" required maxLength={16} placeholder="98765 43210" autoComplete="tel-national" />
        <Input label="Email (your panel link comes here)" name="email" type="email" required maxLength={120} autoComplete="email" />
      </div>
      <Input label="Area" name="area" required maxLength={60} placeholder="For example Main Chowk" />
      <Textarea label="Full address" name="address" required maxLength={300} rows={2} />
      <Input label="What do you cook? (optional, separate with commas)" name="cuisines" maxLength={200} placeholder="Biryani, North Indian, Chinese" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Opens at (optional)" name="opening_time" type="time" />
        <Input label="Closes at (optional)" name="closing_time" type="time" />
      </div>
      <Input label="FSSAI licence number (optional)" name="fssai" inputMode="numeric" maxLength={17} placeholder="14 digits" />
      <Textarea label="Anything else we should know? (optional)" name="message" maxLength={600} />

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      <Button type="submit" size="lg" className="h-[54px]" disabled={pending}>
        {pending ? "Sending…" : "Send request"}
      </Button>
      <p className="text-center text-xs text-stone-500">We&apos;ll only use these details to set up your restaurant.</p>
    </form>
  );
}
