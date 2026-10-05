import { signInWithGoogle } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";

// Only shown when NEXT_PUBLIC_GOOGLE_AUTH_ENABLED=true (after Google is set up
// in Supabase), so visitors never see a button that doesn't work.
export function GoogleButton({ next }: { next?: string }) {
  if (process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED !== "true") return null;

  return (
    <>
      <form action={signInWithGoogle}>
        <input type="hidden" name="next" value={next ?? ""} />
        <Button type="submit" variant="secondary" className="w-full">
          Continue with Google
        </Button>
      </form>
      <div className="flex items-center gap-3 text-xs text-stone-500">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
    </>
  );
}
