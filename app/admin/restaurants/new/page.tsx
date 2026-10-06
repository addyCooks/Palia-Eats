import type { Metadata } from "next";
import Link from "next/link";
import { RestaurantForm } from "@/components/admin/RestaurantForm";
import { PageHeader } from "@/components/ui/page";

export const metadata: Metadata = { title: "Add restaurant" };

export default function NewRestaurantPage() {
  return (
    <>
      <PageHeader
        crumb={
          <Link href="/admin/restaurants" className="hover:underline">
            Restaurants
          </Link>
        }
        title="Add restaurant"
        sub="Leave “Visible on the website” off to keep it pending until it's ready."
      />
      <div className="max-w-3xl">
        <RestaurantForm />
      </div>
    </>
  );
}
