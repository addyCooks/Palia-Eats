"use client";

import { deleteMenuItem } from "@/lib/actions/menu";
import { Button } from "@/components/ui/Button";

export function DeleteItemButton({
  restaurantId,
  itemId,
  itemName,
}: {
  restaurantId: string;
  itemId: string;
  itemName: string;
}) {
  return (
    <form
      action={deleteMenuItem}
      onSubmit={(event) => {
        if (!window.confirm(`Delete "${itemName}"? Past orders are not affected.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <input type="hidden" name="itemId" value={itemId} />
      <Button type="submit" variant="danger">
        Delete item
      </Button>
    </form>
  );
}
