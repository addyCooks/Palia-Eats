import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

// v2 status pills: warm (in progress), neutral (done / paused), error (cancelled, blocked),
// new (just arrived), live (open for orders). The older names still work.
type Tone = "warm" | "neutral" | "error" | "new" | "live" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  warm: "bg-amber-100 text-amber-800",
  neutral: "bg-muted text-stone-700",
  error: "bg-red-100 text-red-700",
  new: "bg-amber-50 text-amber-800",
  live: "bg-brand text-on-brand",
  success: "bg-amber-100 text-amber-800",
  warning: "bg-amber-50 text-amber-800",
  danger: "bg-red-100 text-red-700",
};

type BadgeProps = HTMLAttributes<HTMLSpanElement> & { tone?: Tone };

export function Badge({ tone = "neutral", className, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center whitespace-nowrap rounded-[7px] px-2.5 text-xs font-semibold",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}

export type BadgeTone = Tone;
