import type { OrderStatus } from "@/types/app";

// What each order status is called on screen, and which badge color it gets.
// Flow: Order placed -> Cooking -> Out for delivery -> Delivered (or Cancelled).
// "accepted" and "rejected" are older values that are no longer used.
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "Order placed",
  accepted: "Order placed",
  preparing: "Cooking",
  out_for_delivery: "Out for delivery",
  delivered: "Delivered",
  rejected: "Cancelled",
  cancelled: "Cancelled",
};

export const ORDER_STATUS_TONES: Record<OrderStatus, "neutral" | "success" | "warning" | "danger"> = {
  pending: "warning",
  accepted: "warning",
  preparing: "success",
  out_for_delivery: "success",
  delivered: "neutral",
  rejected: "danger",
  cancelled: "danger",
};
