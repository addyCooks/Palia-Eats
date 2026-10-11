"use client";

import Link from "next/link";
import { useT } from "@/lib/i18n/client";
import { addressLabel } from "@/lib/utils/address-label";
import { deleteAddress, setDefaultAddress } from "@/lib/actions/account";
import type { Address } from "@/types/app";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export function AddressCard({ address }: { address: Address }) {
  const t = useT();
  const label = addressLabel(address.label, t);
  return (
    <Card className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 font-semibold">
            {label}
            {address.is_default && <Badge tone="success">{t("addr.default_badge")}</Badge>}
          </p>
          <p className="mt-1 whitespace-pre-line text-sm text-stone-700">{address.address_line}</p>
          {address.landmark && (
            <p className="text-sm text-stone-500">{t("ord.landmark", { landmark: address.landmark })}</p>
          )}
          {address.phone && <p className="text-sm text-stone-500">{t("addr.phone_line", { phone: address.phone })}</p>}
          {address.latitude != null && address.longitude != null ? (
            <p className="mt-1 text-sm font-medium text-accent">{t("addr.pin_added")}</p>
          ) : (
            <p className="mt-1 text-sm text-stone-500">{t("addr.pin_none")}</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Link
          href={`/account/addresses/${address.id}`}
          className="inline-flex h-9 items-center rounded-xl border border-border px-3 text-sm font-medium hover:bg-muted"
        >
          {t("addr.edit")}
        </Link>
        {!address.is_default && (
          <form action={setDefaultAddress}>
            <input type="hidden" name="addressId" value={address.id} />
            <Button type="submit" variant="ghost" size="sm">
              {t("addr.make_default")}
            </Button>
          </form>
        )}
        <form
          action={deleteAddress}
          onSubmit={(event) => {
            if (!window.confirm(t("addr.delete_confirm", { label }))) event.preventDefault();
          }}
        >
          <input type="hidden" name="addressId" value={address.id} />
          <Button type="submit" variant="ghost" size="sm">
            {t("addr.delete")}
          </Button>
        </form>
      </div>
    </Card>
  );
}
