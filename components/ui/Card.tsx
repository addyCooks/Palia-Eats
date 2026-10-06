import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

// v2 card: white (charcoal in dark mode), 18px corners, soft warm shadow, no border.
export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("rounded-[18px] bg-surface p-5 shadow-card", className)} {...props} />;
}
