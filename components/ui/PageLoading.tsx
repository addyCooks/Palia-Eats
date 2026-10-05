// A calm "loading" placeholder shown while a page's data is being fetched.
export function PageLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="flex flex-1 flex-col items-center justify-center gap-3 py-24">
      <span className="size-8 animate-spin rounded-full border-4 border-border border-t-brand" />
      <span className="text-sm text-stone-500">{label}</span>
    </div>
  );
}
