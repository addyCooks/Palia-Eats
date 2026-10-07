"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import {
  createAddress,
  updateAddress,
  type AccountFormState,
} from "@/lib/actions/account";
import type { Address } from "@/types/app";
import { keepValues } from "@/lib/forms";
import { Input } from "@/components/ui/Input";
import { FormToggle } from "@/components/ui/Toggle";
import { LocationField } from "@/components/forms/LocationField";

// One form for both "add address" (no props) and "edit address" (v2 8d).
type AddressFormProps = {
  address?: Address;
  defaultPhone?: string | null;
  // "/checkout" when the customer came from checkout: we send them back after saving
  next?: string;
};

const TYPES = ["Home", "Work", "Other"] as const;

export function AddressForm({ address, defaultPhone, next }: AddressFormProps) {
  const isEdit = Boolean(address);
  const [state, formAction, pending] = useActionState<AccountFormState, FormData>(
    isEdit ? updateAddress : createAddress,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);
  const startType = address ? (address.label === "Home" || address.label === "Work" ? address.label : "Other") : "Home";
  const [type, setType] = useState<(typeof TYPES)[number]>(startType);
  const [customLabel, setCustomLabel] = useState(startType === "Other" ? (address?.label ?? "") : "");
  // Bumped after a successful "add" so the location pin clears with the rest of the form.
  const [resetCount, setResetCount] = useState(0);

  // Clear the "add" form after a successful save.
  useEffect(() => {
    if (!isEdit && state?.saved) {
      formRef.current?.reset();
      // eslint-disable-next-line react-hooks/set-state-in-effect -- reset the chips with the form
      setType("Home");
      setCustomLabel("");
      setResetCount((count) => count + 1);
    }
  }, [isEdit, state]);

  const label = type === "Other" ? customLabel.trim() || "Other" : type;

  return (
    <form ref={formRef} onSubmit={keepValues(formAction)} className="flex flex-col gap-3.5">
      {address && <input type="hidden" name="addressId" value={address.id} />}
      {next && <input type="hidden" name="next" value={next} />}
      <input type="hidden" name="label" value={label} />

      <Input
        label="House / shop number, street"
        name="address_line"
        placeholder="House 14, Ward 6"
        defaultValue={address?.address_line}
        maxLength={300}
        required
      />
      <Input
        label="Landmark"
        name="landmark"
        placeholder="Near Hanuman Mandir"
        defaultValue={address?.landmark ?? ""}
        maxLength={100}
      />
      <LocationField
        key={resetCount}
        initial={
          address?.latitude != null && address?.longitude != null ? { lat: address.latitude, lng: address.longitude } : null
        }
      />
      <Input
        label="Phone for the rider"
        name="phone"
        type="tel"
        inputMode="numeric"
        placeholder="98765 43210"
        defaultValue={address?.phone ?? defaultPhone ?? ""}
      />

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1.5 text-[13px] font-semibold text-stone-600">Save as</legend>
        <div className="flex gap-2">
          {TYPES.map((option) => (
            <button
              key={option}
              type="button"
              aria-pressed={type === option}
              onClick={() => setType(option)}
              className={`h-[42px] flex-1 rounded-[10px] text-sm font-semibold transition-colors ${
                type === option ? "bg-deep text-brand" : "bg-surface text-stone-700 shadow-card"
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        {type === "Other" && (
          <input
            value={customLabel}
            onChange={(event) => setCustomLabel(event.target.value)}
            maxLength={30}
            placeholder="Name it, e.g. Mom's place"
            aria-label="Name for this address"
            className="mt-1 h-[50px] rounded-xl border-[1.5px] border-border bg-surface px-3.5 text-[15px] outline-none focus:border-brand"
          />
        )}
      </fieldset>

      <label className="flex items-center justify-between gap-3 text-sm font-medium">
        {address?.is_default ? "This is your default address" : "Use as my default address"}
        <FormToggle name="is_default" defaultChecked={address?.is_default ?? false} label="Default address" />
      </label>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900">
          Address saved.
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 h-14 rounded-[14px] bg-brand text-base font-bold text-on-brand hover:bg-brand-dark disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save address"}
      </button>
    </form>
  );
}
