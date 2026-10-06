import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string;
};

export function Textarea({ label, id, className, ...props }: TextareaProps) {
  const textareaId = id ?? props.name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="text-[13px] font-semibold text-stone-600">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        rows={3}
        className={cn(
          "rounded-xl border-[1.5px] border-border bg-surface px-3.5 py-3 text-[15px] leading-[1.45] outline-none transition-colors",
          "focus:border-brand",
          className,
        )}
        {...props}
      />
    </div>
  );
}
