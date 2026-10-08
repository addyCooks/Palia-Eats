"use client";

import { keepValues } from "@/lib/forms";
import { useActionState } from "react";
import {
  createRestaurant,
  updateRestaurant,
  type RestaurantFormState,
} from "@/lib/actions/restaurants";
import type { AdminRestaurant } from "@/types/app";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { ClosedDaysField } from "@/components/restaurant/ClosedDaysField";
import { FormToggle } from "@/components/ui/Toggle";

// Postgres returns times as "10:00:00"; <input type="time"> wants "10:00".
const toTimeInput = (time: string | null | undefined) => time?.slice(0, 5) ?? "";

// One form for both "add restaurant" (no props) and "edit restaurant".
export function RestaurantForm({ restaurant }: { restaurant?: AdminRestaurant }) {
  const isEdit = Boolean(restaurant);
  const [state, formAction, pending] = useActionState<RestaurantFormState, FormData>(
    isEdit ? updateRestaurant : createRestaurant,
    undefined,
  );
  const priv = restaurant?.restaurant_private;

  return (
    <form onSubmit={keepValues(formAction)} className="flex flex-col gap-6">
      {restaurant && <input type="hidden" name="restaurantId" value={restaurant.id} />}

      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">Basic details</h2>
        <Input label="Restaurant name" name="name" defaultValue={restaurant?.name} required />
        {isEdit ? (
          <Input
            label="Web address"
            value={`/restaurants/${restaurant?.slug}`}
            readOnly
            disabled
          />
        ) : (
          <Input
            label="Web address (optional)"
            name="slug"
            placeholder="brown-pizza"
            pattern="[a-z0-9]+(-[a-z0-9]+)*"
            title="Lowercase letters, numbers and dashes only"
          />
        )}
        <Input label="Tagline" name="tagline" defaultValue={restaurant?.tagline ?? ""} />
        <Textarea label="Short description" name="description" defaultValue={restaurant?.description ?? ""} />
        <Textarea label="About (longer story)" name="about" defaultValue={restaurant?.about ?? ""} />
        <Input
          label="Cuisines (comma separated)"
          name="cuisine_tags"
          placeholder="Pizza, Italian"
          defaultValue={restaurant?.cuisine_tags.join(", ") ?? ""}
        />
        <Input label="Phone" name="phone" type="tel" defaultValue={restaurant?.phone ?? ""} />
        <Input label="Address" name="address_text" defaultValue={restaurant?.address_text ?? ""} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Area (shown to customers)"
            name="area"
            placeholder="Main Chowk"
            maxLength={60}
            defaultValue={restaurant?.area ?? ""}
          />
          <Input
            label="Owner name (private)"
            name="owner_name"
            maxLength={80}
            defaultValue={priv?.owner_name ?? ""}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">Images</h2>
        {restaurant ? (
          <>
            <ImageUpload
              name="logo_url"
              label="Logo"
              restaurantId={restaurant.id}
              folder="logo"
              defaultUrl={restaurant.logo_url}
            />
            <ImageUpload
              name="cover_url"
              label="Cover photo"
              restaurantId={restaurant.id}
              folder="cover"
              defaultUrl={restaurant.cover_url}
            />
          </>
        ) : (
          <p className="text-sm text-stone-600">
            Create the restaurant first, then you can upload its logo and cover photo.
          </p>
        )}
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">Hours and charges</h2>
        <ClosedDaysField defaultClosed={restaurant?.closed_days ?? []} />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Opens at" name="opening_time" type="time" defaultValue={toTimeInput(restaurant?.opening_time)} />
          <Input label="Closes at" name="closing_time" type="time" defaultValue={toTimeInput(restaurant?.closing_time)} />
          <Input
            label="Minimum order (₹)"
            name="min_order_amount"
            type="number"
            min="0"
            step="0.01"
            defaultValue={restaurant?.min_order_amount ?? 0}
          />
          <Input
            label="Delivery fee (₹)"
            name="delivery_fee"
            type="number"
            min="0"
            step="0.01"
            defaultValue={restaurant?.delivery_fee ?? 0}
          />
        </div>
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">Branding</h2>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Brand color"
            name="brand"
            type="color"
            defaultValue={restaurant?.theme.brand ?? "#ea580c"}
            className="p-1"
          />
          <Input
            label="Darker shade (hover)"
            name="brandDark"
            type="color"
            defaultValue={restaurant?.theme.brandDark ?? "#c2410c"}
            className="p-1"
          />
        </div>
        <Input
          label="Custom design key (optional)"
          name="template_key"
          placeholder="Leave empty for the default design"
          defaultValue={restaurant?.template_key ?? ""}
        />
      </Card>

      <Card className="flex flex-col gap-4">
        <h2 className="font-semibold">Order notifications (private)</h2>
        <Input
          label="Email for new orders"
          name="notification_email"
          type="email"
          defaultValue={priv?.notification_email ?? ""}
        />
        <Input
          label="Phone for new orders (optional)"
          name="notification_phone"
          type="tel"
          defaultValue={priv?.notification_phone ?? ""}
        />
        {/* COMMISSION OFF
        <Input
          label="PaliaEats commission (%)"
          name="commission_percent"
          type="number"
          min="0"
          max="50"
          step="0.01"
          defaultValue={priv?.commission_percent ?? 8}
        />
        */}
      </Card>

      <Card className="flex flex-col gap-3">
        <h2 className="font-semibold">Status</h2>
        <label className="flex items-center justify-between gap-3 text-sm font-medium">
          Visible on the website (off = waiting for approval)
          <FormToggle name="is_active" defaultChecked={restaurant?.is_active ?? true} label="Visible on the website" />
        </label>
        <label className="flex items-center justify-between gap-3 text-sm font-medium">
          Currently accepting orders
          <FormToggle
            name="is_accepting_orders"
            defaultChecked={restaurant?.is_accepting_orders ?? true}
            label="Currently accepting orders"
          />
        </label>
      </Card>

      {state?.error && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
          {state.error}
        </p>
      )}
      {state?.saved && (
        <p role="status" className="rounded-xl bg-amber-50 p-3 text-sm font-medium text-amber-900">
          Changes saved.
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? "Saving..." : isEdit ? "Save changes" : "Create restaurant"}
      </Button>
    </form>
  );
}
