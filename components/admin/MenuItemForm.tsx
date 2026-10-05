"use client";

import { useActionState } from "react";
import {
  createMenuItem,
  updateMenuItem,
  type MenuFormState,
} from "@/lib/actions/menu";
import type { MenuCategory, MenuItem } from "@/types/app";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUpload } from "@/components/admin/ImageUpload";

type MenuAction = (prev: MenuFormState, formData: FormData) => Promise<MenuFormState>;

type MenuItemFormProps = {
  restaurantId: string;
  // Which server actions save the item. Defaults to the admin's; the restaurant panel
  // passes its own, which are limited to that restaurant.
  actions?: { create: MenuAction; update: MenuAction };
  // Photo upload needs an admin login, so the panel hides it (the photo stays as it is).
  allowImage?: boolean;
  categories: MenuCategory[];
  item?: MenuItem; // present when editing
  defaultCategoryId?: string;
};

export function MenuItemForm({
  restaurantId,
  categories,
  item,
  defaultCategoryId,
  actions = { create: createMenuItem, update: updateMenuItem },
  allowImage = true,
}: MenuItemFormProps) {
  const isEdit = Boolean(item);
  const [state, formAction, pending] = useActionState<MenuFormState, FormData>(
    isEdit ? actions.update : actions.create,
    undefined,
  );

  return (
    <form action={formAction}>
      <Card className="flex flex-col gap-4">
        <input type="hidden" name="restaurantId" value={restaurantId} />
        {item && <input type="hidden" name="itemId" value={item.id} />}

        <Input label="Item name" name="name" defaultValue={item?.name} required />
        <Textarea label="Description" name="description" defaultValue={item?.description ?? ""} />

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Price (₹)"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={item?.price}
            required
          />
          <Input label="Order in category" name="sort_order" type="number" defaultValue={item?.sort_order ?? 0} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="category_id" className="text-sm font-medium">
            Category
          </label>
          <select
            id="category_id"
            name="category_id"
            defaultValue={item?.category_id ?? defaultCategoryId ?? ""}
            required
            className="h-11 rounded-xl border border-border bg-surface px-3 text-base outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="" disabled>
              Choose a category
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        {allowImage ? (
          <ImageUpload
            name="image_url"
            label="Photo"
            restaurantId={restaurantId}
            folder="menu"
            defaultUrl={item?.image_url}
          />
        ) : (
          <p className="text-sm text-stone-500">To add or change the photo, contact PaliaEats.</p>
        )}

        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="is_veg" defaultChecked={item?.is_veg ?? true} className="size-5 accent-green-600" />
          Vegetarian
        </label>
        <label className="flex items-center gap-3 text-sm">
          <input type="checkbox" name="is_available" defaultChecked={item?.is_available ?? true} className="size-5 accent-brand" />
          Available to order
        </label>

        {state?.error && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state?.saved && (
          <p role="status" className="rounded-xl bg-green-50 p-3 text-sm text-green-800">
            Changes saved.
          </p>
        )}

        <Button type="submit" size="lg" disabled={pending}>
          {pending ? "Saving..." : isEdit ? "Save changes" : "Add item"}
        </Button>
      </Card>
    </form>
  );
}
