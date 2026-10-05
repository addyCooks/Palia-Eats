import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getPanelRestaurant } from "@/lib/panel/session";
import { ShareCard } from "@/components/restaurant/ShareCard";

export const metadata: Metadata = { title: "Share your link" };

export default async function PanelSharePage() {
  const restaurant = await getPanelRestaurant();
  if (!restaurant) redirect("/panel/locked");

  return <ShareCard name={restaurant.name} slug={restaurant.slug} />;
}
