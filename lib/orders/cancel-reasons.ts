// Quick reasons offered when cancelling an order. The chosen text is stored in
// orders.rejection_reason and shown to the customer.
export const CANCEL_REASONS = [
  "An item is out of stock",
  "We're too busy right now",
  "We're closing early",
  "Your address is outside our delivery area",
  "Couldn't reach you to confirm",
  "Customer asked to cancel",
] as const;

export const OTHER_REASON = "Other";
export const MAX_REASON_LENGTH = 200;
