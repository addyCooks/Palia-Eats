import { ORDER_STATUS_LABELS, ORDER_STATUS_TONES } from "@/lib/orders/status";
import { Badge } from "@/components/ui/Badge";
import type { OrderStatus } from "@/types/app";

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_STATUS_TONES[status]}>{ORDER_STATUS_LABELS[status]}</Badge>;
}
