import type { OrderStatus } from "@/types/app";
import type { MessageKey, T } from "@/lib/i18n/messages";

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

// The same words as ORDER_STATUS_LABELS, in the reader's language (customer pages).
const STATUS_KEYS: Record<OrderStatus, MessageKey> = {
  pending: "status.pending",
  accepted: "status.pending",
  preparing: "status.preparing",
  out_for_delivery: "status.out_for_delivery",
  delivered: "status.delivered",
  rejected: "status.cancelled",
  cancelled: "status.cancelled",
};
export const statusLabel = (t: T, status: OrderStatus): string => t(STATUS_KEYS[status]);

export const ACTIVE_STATUSES: OrderStatus[] = ["pending", "accepted", "preparing", "out_for_delivery"];
export const CANCELLED_STATUSES: OrderStatus[] = ["cancelled", "rejected"];

export const isCancelled = (status: OrderStatus) => CANCELLED_STATUSES.includes(status);
