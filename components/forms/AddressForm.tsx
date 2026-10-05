"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createAddress,
  updateAddress,
  type AccountFormState,
} from "@/lib/actions/account";
import type { Address } from "@/types/app";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

// One form for both "add address" (no props) and "edit address".
type AddressFormProps = {
  address?: Address;
  defaultPhone?: string | null;
  // "/checkout" when the customer came from checkout: we send them back after saving
  next?: string;
};

export function AddressForm({ address, defaultPhone, next }: AddressFormProps) {
  const isEdit = Boolean(address);
  const [state, formAction, pending] = useActionState<AccountFormState, FormData>(
    isEdit ? updateAddress : createAddress,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the "add" form after a successful save.
  useEffect(() => {
    if (!isEdit && state?.saved) formRef.current?.reset();
  }, [isEdit, state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-4">
      {address && <input type="hidden" name="addressId" value={address.id} />}
      {next && <input type="hidden" name="next" value={next} />}

      <Input
        label="Name this address"
        name="label"
        placeholder="Home, Work, Mom's place..."
        defaultValue={address?.label}
        maxLength={30}
        required
      />
      <Textarea
        label="Full address"
        name="address_line"
        placeholder="House / flat no., street, area"
        defaultValue={address?.address_line}
        maxLength={300}
        required
      />
      <Input
        label="Landmark (optional)"
        name="landmark"
        placeholder="Near the temple"
        defaultValue={address?.landmark ?? ""}
        maxLength={100}
      />
      <Input
        label="Phone for delivery (optional)"
        name="phone"
        type="tel"
        placeholder="98765 43210"
        defaultValue={address?.phone ?? defaultPhone ?? ""}
      />
      <label className="flex items-center gap-3 text-sm">
        <input
          type="checkbox"
          name="is_default"
          defaultChecked={address?.is_default ?? false}
          disabled={address?.is_default}
          className="size-5 accent-brand"
        />
        {address?.is_default ? "This is your default address" : "Use as my default address"}
      </label>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
          Address saved.
        </p>
      )}

      <Button type="submit" disabled={pending}>
        {pending ? "Saving..." : isEdit ? "Save address" : "Add address"}
      </Button>
    </form>
  );
}
