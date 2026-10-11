import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES, statusLabel } from "@/lib/orders/status";
import type { T } from "@/lib/i18n/messages";
import { Badge } from "@/components/ui/Badge";
import type { OrderStatus } from "@/types/app";

// `translate` is given on customer pages (their language); the admin and panel leave it out (English).
export function OrderStatusBadge({ status, translate }: { status: OrderStatus; translate?: T }) {
  return (
    <Badge tone={ORDER_STATUS_TONES[status]}>
      {translate ? statusLabel(translate, status) : ORDER_STATUS_LABELS[status]}
    </Badge>
  );
}
