"use client";

import { useActionState, useEffect, useRef } from "react";
import {
  createCategory,
  deleteCategory,
  updateCategory,
  type MenuFormState,
} from "@/lib/actions/menu";
import type { MenuCategory } from "@/types/app";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type MenuAction = (prev: MenuFormState, formData: FormData) => Promise<MenuFormState>;

// Which server actions the category forms call. Defaults to the admin's; the restaurant
// panel passes its own, which are limited to that restaurant.
export type CategoryActions = { create: MenuAction; update: MenuAction; remove: MenuAction };
const ADMIN_CATEGORY_ACTIONS: CategoryActions = {
  create: createCategory,
  update: updateCategory,
  remove: deleteCategory,
};

export function AddCategoryForm({
  restaurantId,
  actions = ADMIN_CATEGORY_ACTIONS,
}: {
  restaurantId: string;
  actions?: CategoryActions;
}) {
  const [state, formAction, pending] = useActionState<MenuFormState, FormData>(
    actions.create,
    undefined,
  );
  const formRef = useRef<HTMLFormElement>(null);

  // Clear the form after a successful add.
  useEffect(() => {
    if (state?.saved) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      <div className="flex-1">
        <Input label="New category" name="name" placeholder="e.g. Starters" required />
      </div>
      <div className="sm:w-24">
        <Input label="Order" name="sort_order" type="number" defaultValue={0} />
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Adding..." : "Add"}
      </Button>
      {state?.error && (
        <p role="alert" className="text-sm text-red-600 sm:basis-full">
          {state.error}
        </p>
      )}
    </form>
  );
}

// One editable row per existing category: rename, reorder, delete.
export function CategoryRow({
  restaurantId,
  category,
  actions = ADMIN_CATEGORY_ACTIONS,
}: {
  restaurantId: string;
  category: MenuCategory;
  actions?: CategoryActions;
}) {
  const [saveState, saveAction, saving] = useActionState<MenuFormState, FormData>(
    actions.update,
    undefined,
  );
  const [deleteState, deleteAction, deleting] = useActionState<MenuFormState, FormData>(
    actions.remove,
    undefined,
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <form action={saveAction} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="restaurantId" value={restaurantId} />
          <input type="hidden" name="categoryId" value={category.id} />
          <Input
            aria-label="Category name"
            name="name"
            defaultValue={category.name}
            className="w-full"
            required
          />
          <Input
            aria-label="Order"
            name="sort_order"
            type="number"
            defaultValue={category.sort_order}
            className="w-20"
          />
          <Button type="submit" variant="secondary" size="sm" disabled={saving}>
            {saving ? "..." : "Save"}
          </Button>
        </form>
        <form
          action={deleteAction}
          onSubmit={(event) => {
            if (!window.confirm(`Delete the category "${category.name}"?`)) {
              event.preventDefault();
            }
          }}
        >
          <input type="hidden" name="restaurantId" value={restaurantId} />
          <input type="hidden" name="categoryId" value={category.id} />
          <Button type="submit" variant="ghost" size="sm" disabled={deleting}>
            Delete
          </Button>
        </form>
      </div>
      {(saveState?.error || deleteState?.error) && (
        <p role="alert" className="text-sm text-red-600">
          {saveState?.error ?? deleteState?.error}
        </p>
      )}
      {saveState?.saved && <p className="text-sm text-green-700">Saved.</p>}
    </div>
  );
}
