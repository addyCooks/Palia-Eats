export default function PanelLockedPage() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-3 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">This link can&apos;t be used</h1>
      <p className="text-stone-600">
        Your panel link may have expired or been replaced. Open the link from your most recent
        new-order email, or ask PaliaEats for a new one.
      </p>
    </main>
  );
}
