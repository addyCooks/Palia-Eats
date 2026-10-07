"use client";

import { useFormStatus } from "react-dom";
import { signInWithGoogle } from "@/lib/actions/auth";

// Google's own four-colour "G" (their sign-in buttons must use it unchanged).
function GoogleMark() {
  return (
    <svg viewBox="0 0 48 48" className="size-5 shrink-0" aria-hidden>
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="press flex h-[52px] w-full items-center justify-center gap-3 rounded-xl border-[1.5px] border-border bg-surface text-[15px] font-semibold text-foreground hover:bg-muted disabled:cursor-wait disabled:opacity-80"
    >
      {pending ? (
        <span className="size-5 animate-spin rounded-full border-2 border-stone-300 border-t-brand" aria-hidden />
      ) : (
        <GoogleMark />
      )}
      {pending ? "Opening Google…" : "Continue with Google"}
    </button>
  );
}

// Only shown when NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true (after Google is set up
// in Supabase), so visitors never see a button that doesn't work.
export function GoogleButton({ next }: { next?: string }) {
  if (process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "true") return null;

  return (
    <>
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next ?? ""} />
        <Submit />
      </form>
      <div className="flex items-center gap-3 text-xs text-stone-500">
        <span className="h-px flex-1 bg-border" />
        or with email
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
