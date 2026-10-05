import type { RestaurantStatus } from "@/lib/utils/hours";
import { Badge } from "@/components/ui/Badge";

const TONES = {
  open: "success",
  closed: "danger",
  paused: "warning",
} as const;

export function StatusBadge({ status }: { status: RestaurantStatus }) {
  return <Badge tone={TONES[status.state]}>{status.label}</Badge>;
}
