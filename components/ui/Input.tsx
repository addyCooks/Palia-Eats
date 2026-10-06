import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
};

// v2 input: 50px tall, 1.5px border, saffron border on focus, red border + helper on error.
export function Input({ label, error, id, className, ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-[13px] font-semibold text-stone-600">
          {label}
        </label>
      )}
      <input
        id={inputId}
        aria-invalid={error ? true : undefined}
        className={cn(
          "h-[50px] rounded-xl border-[1.5px] bg-surface px-3.5 text-[15px] outline-none transition-colors",
          "focus:border-brand disabled:bg-muted disabled:text-stone-500",
          error ? "border-red-600" : "border-border",
          className,
        )}
        {...props}
      />
      {error && <p className="text-[13px] text-red-700">{error}</p>}
    </div>
  );
}
