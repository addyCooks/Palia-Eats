import type { Metadata } from "next";
import Link from "next/link";
import { RestaurantForm } from "@/components/admin/RestaurantForm";

export const metadata: Metadata = { title: "Add restaurant" };

export default function NewRestaurantPage() {
  return (
    <>
      <Link href="/admin/restaurants" className="text-sm text-stone-500 hover:underline">
        ← All restaurants
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold">Add restaurant</h1>
      <RestaurantForm />
    </>
  );
}
