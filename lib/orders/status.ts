import type { OrderStatus } from "@/types/app";

// What each order status is called on screen, and which pill color it gets.
// Flow: Placed -> Cooking -> On the way -> Delivered (or Cancelled).
// "accepted" and "rejected" are older values that are no longer used.
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Placed",
  accepted: "Placed",
  preparing: "Cooking",
  out_for_delivery: "On the way",
  delivered: "Delivered",
  rejected: "Cancelled",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_TONES: Record<OrderStatus, "new" | "warm" | "neutral" | "error"> = {
  pending: "new",
  accepted: "new",
  preparing: "warm",
  out_for_delivery: "warm",
  delivered: "neutral",
  rejected: "error",
  cancelled: "error",
};

export const ACTIVE_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "out_for_delivery"];
export const CANCELLED_STATUSES: OrderStatus[] = ["cancelled", "rejected"];

export const isCancelled = (status: OrderStatus) => CANCELLED_STATUSES.includes(status);
