"use client";

import { keepValues } from "@/lib/forms";
import { useActionState, useState } from "react";
import Link from "next/link";
import {
  createMenuItem,
  updateMenuItem,
  type MenuFormState,
} from "@/lib/actions/menu";
import type { MenuCategory, MenuItem } from "@/types/app";
import { placeholderForDish } from "@/lib/utils/placeholder";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { FormToggle } from "@/components/ui/Toggle";

type MenuAction = (prev: MenuFormState, formData: FormData) => Promise<MenuFormState>;
type ServerUpload = (formData: FormData) => Promise<{ url?: string; error?: string }>;

type MenuItemFormProps = {
  restaurantId: string;
  // Which server actions save the item. Defaults to the admin's; the restaurant panel
  // passes its own, which are limited to that restaurant.
  actions?: { create: MenuAction; update: MenuAction };
  // The panel uploads photos through the server; admins upload straight to storage.
  serverUpload?: ServerUpload;
  categories: MenuCategory[];
  item?: MenuItem; // present when editing
  defaultCategoryId?: string;
  backHref: string; // where Cancel goes ("Menu")
};

const DIETS = [
  { key: "veg", label: "Veg" },
  { key: "nonveg", label: "Non-veg" },
  { key: "egg", label: "Egg" },
] as const;

const fieldClass =
  "min-h-[50px] w-full rounded-xl border-[1.5px] border-border bg-surface px-3.5 text-[15px] outline-none transition-colors focus:border-brand";

function Field({
  label,
  hint,
  wide,
  children,
  htmlFor,
}: {
  label: string;
  hint?: string;
  wide?: boolean;
  children: React.ReactNode;
  htmlFor: string;
}) {
  return (
    <div className={`flex flex-col gap-1.5 ${wide ? "sm:col-span-2" : ""}`}>
      <label htmlFor={htmlFor} className="text-[13px] font-semibold text-stone-600">
        {label}
      </label>
      {children}
      {hint && <span className="text-xs text-stone-500">{hint}</span>}
    </div>
  );
}

// The dish editor (v2 9b): round photo with in-stock and bestseller switches on the left,
// the details on the right. Shared by the restaurant panel and the admin.
export function MenuItemForm({
  restaurantId,
  categories,
  item,
  defaultCategoryId,
  actions = { create: createMenuItem, update: updateMenuItem },
  serverUpload,
  backHref,
}: MenuItemFormProps) {
  const isEdit = Boolean(item);
  const [state, formAction, pending] = useActionState<MenuFormState, FormData>(
    isEdit ? actions.update : actions.create,
    undefined,
  );
  const [name, setName] = useState(item?.name ?? "");
  const [categoryId, setCategoryId] = useState(item?.category_id ?? defaultCategoryId ?? "");
  const [diet, setDiet] = useState<string>(item ? (item.is_veg ? "veg" : item.contains_egg ? "egg" : "nonveg") : "veg");
  const categoryName = categories.find((category) => category.id === categoryId)?.name;

  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-5">
      <input type="hidden" name="restaurantId" value={restaurantId} />
      {item && <input type="hidden" name="itemId" value={item.id} />}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="text-[13px] text-stone-500">
            <Link href={backHref} className="hover:underline">
              Menu
            </Link>
            {categoryName ? ` › ${categoryName}` : ""}
          </span>
          <h1 className="truncate font-display text-[32px] leading-none sm:text-[40px]">
            {name.trim() || (isEdit ? "Untitled dish" : "New dish")}
          </h1>
        </div>
        <div className="flex gap-2.5">
          <Link
            href={backHref}
            className="inline-flex h-[46px] items-center rounded-xl bg-surface px-5 font-semibold shadow-card hover:bg-muted"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="inline-flex h-[46px] items-center rounded-xl bg-brand px-[22px] font-bold text-on-brand hover:bg-brand-dark disabled:opacity-60"
          >
            {pending ? "Saving…" : isEdit ? "Save changes" : "Add dish"}
          </button>
        </div>
      </div>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900">
          Changes saved. Customers see them straight away.
        </p>
      )}

      <div className="grid items-start gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="flex flex-col items-center gap-3.5 rounded-[18px] bg-surface p-[22px] shadow-card">
          <ImageUpload
            name="image_url"
            label={name || "Dish photo"}
            restaurantId={restaurantId}
            folder="menu"
            defaultUrl={item?.image_url}
            shape="plate"
            previewFallback={name.trim() ? placeholderForDish(name, item?.id) : undefined}
            serverUpload={serverUpload}
          />
          <div className="h-px self-stretch bg-muted" />
          <label className="flex items-center justify-between self-stretch text-sm font-medium">
            In stock
            <FormToggle name="is_available" defaultChecked={item?.is_available ?? true} label="In stock" />
          </label>
          <label className="flex items-center justify-between self-stretch text-sm font-medium">
            Show as bestseller
            <FormToggle name="is_bestseller" defaultChecked={item?.is_bestseller ?? false} label="Show as bestseller" />
          </label>
        </div>

        <div className="grid gap-[18px] rounded-[18px] bg-surface p-5 shadow-card sm:grid-cols-2 sm:p-6">
          <Field label="Dish name" htmlFor="name" wide>
            <input
              id="name"
              name="name"
              required
              maxLength={120}
              value={name}
              onChange={(event) => setName(event.target.value)}
              className={fieldClass}
            />
          </Field>
          <Field label="Price (₹)" htmlFor="price">
            <input
              id="price"
              name="price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              required
              defaultValue={item?.price}
              className={fieldClass}
            />
          </Field>
          <Field label="Category" htmlFor="category_id">
            <select
              id="category_id"
              name="category_id"
              required
              value={categoryId}
              onChange={(event) => setCategoryId(event.target.value)}
              className={fieldClass}
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
          </Field>
          <Field label="Description" htmlFor="description" wide>
            <textarea
              id="description"
              name="description"
              rows={3}
              maxLength={600}
              defaultValue={item?.description ?? ""}
              className={`${fieldClass} py-3 leading-[1.45]`}
            />
          </Field>
          <Field label="Half plate price (₹)" htmlFor="half_price" hint="Leave empty if there is no half plate.">
            <input
              id="half_price"
              name="half_price"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              defaultValue={item?.half_price ?? ""}
              className={fieldClass}
            />
          </Field>
          <Field label="Prep time (minutes)" htmlFor="prep_minutes" hint="Optional.">
            <input
              id="prep_minutes"
              name="prep_minutes"
              type="number"
              inputMode="numeric"
              min="1"
              max="240"
              step="1"
              defaultValue={item?.prep_minutes ?? ""}
              className={fieldClass}
            />
          </Field>
          <Field label="Position in its category" htmlFor="sort_order" hint="Lower numbers show first.">
            <input
              id="sort_order"
              name="sort_order"
              type="number"
              step="1"
              defaultValue={item?.sort_order ?? 0}
              className={fieldClass}
            />
          </Field>

          <fieldset className="flex flex-col gap-2 sm:col-span-2">
            <legend className="mb-2 text-[13px] font-semibold text-stone-600">Diet</legend>
            <div className="flex flex-wrap gap-2">
              {DIETS.map((option) => {
                const on = diet === option.key;
                return (
                  <label
                    key={option.key}
                    className={`flex h-[38px] cursor-pointer items-center rounded-[10px] px-3.5 text-sm transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand/40 ${
                      on ? "bg-deep font-semibold text-brand" : "border-[1.5px] border-border hover:bg-muted"
                    }`}
                  >
                    <input
                      type="radio"
                      name="diet"
                      value={option.key}
                      checked={on}
                      onChange={() => setDiet(option.key)}
                      className="sr-only"
                    />
                    {option.label}
                  </label>
                );
              })}
            </div>
          </fieldset>
        </div>
      </div>
    </form>
  );
}
