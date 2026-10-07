"use client";

import { deleteMenuItem } from "@/lib/actions/menu";
import { SubmitButton } from "@/components/ui/SubmitButton";

export function DeleteItemButton({
  restaurantId,
  itemId,
  itemName,
  action = deleteMenuItem,
}: {
  restaurantId: string;
  itemId: string;
  itemName: string;
  action?: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      className="flex flex-wrap items-center justify-between gap-3 rounded-[18px] border-[1.5px] border-dashed border-border p-4"
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${itemName}"? Past orders are not affected.`)) {
          event.preventDefault();
        }
      }}
    >
      <span className="text-sm text-stone-600">
        Not making this any more? Turn off &ldquo;In stock&rdquo; to hide it for today, or delete it for good.
      </span>
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="itemId" value={itemId} />
      <SubmitButton
        pendingText="Deleting…"
        className="h-10 rounded-xl bg-red-100 px-4 text-sm font-semibold text-red-700 hover:bg-red-200"
      >
        Delete dish
      </SubmitButton>
    </form>
  );
}
