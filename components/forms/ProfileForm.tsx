"use client";

import { keepValues } from "@/lib/forms";
import { useActionState } from "react";
import { updateProfile, type AccountFormState } from "@/lib/actions/account";
import type { Profile } from "@/types/app";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ProfileForm({ profile, email }: { profile: Profile; email: string }) {
  const [state, formAction, pending] = useActionState<AccountFormState, FormData>(
    updateProfile,
    undefined,
  );

  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-4">
      <Input label="Email" value={email} readOnly disabled />
      <Input
        label="Full name"
        name="full_name"
        autoComplete="name"
        defaultValue={profile.full_name ?? ""}
        required
      />
      <Input
        label="Mobile number"
        name="phone"
        type="tel"
        autoComplete="tel"
        placeholder="98765 43210"
        defaultValue={profile.phone ?? ""}
      />
      <label className="flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          name="whatsapp_opt_in"
          defaultChecked={profile.whatsapp_opt_in}
          className="mt-0.5 size-5 accent-brand"
        />
        <span>
          Send my order updates on WhatsApp
          <span className="block text-stone-500">
            To the mobile number above. Reply STOP to a message any time to switch it off.
          </span>
        </span>
      </label>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
          Details saved.
        </p>
      )}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : "Save details"}
      </Button>
    </form>
  );
}
