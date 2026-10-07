"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "dark";
type Size = "sm" | "md" | "lg";

// v2 buttons: saffron with dark text (never white), dark "raised", bordered secondary.
const variants: Record<Variant, string> = {
  primary: "bg-brand font-bold text-on-brand hover:bg-brand-dark",
  dark: "bg-[#16120D] font-semibold text-white hover:bg-black dark:bg-[#2A241C]",
  secondary: "border-[1.5px] border-border bg-surface font-semibold text-foreground hover:bg-muted",
  ghost: "font-medium text-foreground hover:bg-muted",
  danger: "bg-red-100 font-semibold text-red-700 hover:bg-red-200",
};

const sizes: Record<Size, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-[15px]",
  lg: "h-[52px] px-6 text-base",
};

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  // Show the spinner (for buttons that do their work outside a form)
  loading?: boolean;
};

// A submit button spins by itself while its form is being sent, and can't be pressed
// twice. (With several submit buttons sharing a name, only the pressed one spins.)
export function Button({
  variant = "primary",
  size = "md",
  className,
  type = "button",
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const form = useFormStatus();
  const sending = type === "submit" && form.pending;
  const pressed =
    sending && (!props.name || form.data === null || form.data.get(props.name) === String(props.value ?? ""));
  const busy = loading || pressed;

  return (
    <button
      type={type}
      disabled={disabled || sending}
      aria-busy={busy || undefined}
      className={cn(
        "inline-flex items-center justify-center rounded-xl transition-colors",
        "disabled:cursor-not-allowed disabled:opacity-50 aria-busy:cursor-wait aria-busy:opacity-80",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {busy && <span className="pe-spinner mr-2" aria-hidden />}
      {children}
    </button>
  );
}
