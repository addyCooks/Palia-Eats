"use client";

import type { ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

// A plain submit button that shows a spinner (and optional "Logging out…" text) while its
// form is being sent, and can't be pressed twice.
export function SubmitButton({
  children,
  pendingText,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} aria-busy={pending || undefined} {...props}>
      {pending && <span className="pe-spinner mr-2 align-[-2px]" aria-hidden />}
      {pending && pendingText ? pendingText : children}
    </button>
  );
}
