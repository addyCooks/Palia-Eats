import { CookingPot, LoadingLine } from "@/components/ui/FoodLoader";

// Shown while a page's data is on its way: a cooking pot with steam. It fills the whole
// space under the top bar, so the footer stays out of sight instead of jumping up.
export function PageLoading({ label = "Cooking up your page" }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="anim-fade-in flex min-h-[70dvh] flex-1 flex-col items-center justify-center gap-4 py-16"
    >
      <CookingPot className="size-28" />
      <LoadingLine label={label} />
    </div>
  );
}
