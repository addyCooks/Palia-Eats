"use client";

import Link from "next/link";
import { deleteAddress, setDefaultAddress } from "@/lib/actions/account";
import type { Address } from "@/types/app";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AddressCard({ address }: { address: Address }) {
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            {address.label}
            {address.is_default && <Badge tone="success">Default</Badge>}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{address.address_line}</p>
          {address.landmark && (
            <p className="text-sm text-stone-500">Landmark: {address.landmark}</p>
          )}
          {address.phone && <p className="text-sm text-stone-500">Phone: {address.phone}</p>}
          {address.latitude != null && address.longitude != null ? (
            <p className="mt-1 text-sm font-medium text-accent">📍 Location pin added</p>
          ) : (
            <p className="mt-1 text-sm text-stone-500">No location pin yet · add one from Edit</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/account/addresses/${address.id}`}
          className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm font-medium hover:bg-muted"
        >
          Edit
        </Link>
        {!address.is_default && (
          <form action={setDefaultAddress}>
            <input type="hidden" name="addressId" value={address.id} />
            <Button type="submit" variant="ghost" size="sm">
              Make default
            </Button>
          </form>
        )}
        <form
          action={deleteAddress}
          onSubmit={(event) => {
            if (!window.confirm(`Delete the address "${address.label}"?`)) event.preventDefault();
          }}
        >
          <input type="hidden" name="addressId" value={address.id} />
          <Button type="submit" variant="ghost" size="sm">
            Delete
          </Button>
        </form>
      </div>
    </Card>
  );
}
