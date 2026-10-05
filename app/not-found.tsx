import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <p className="text-5xl font-bold text-brand">404</p>
      <h1 className="text-2xl font-bold">Page not found</h1>
      <p className="text-stone-600">That page doesn&apos;t exist, or it has moved.</p>
      <Link
        href="/"
        className="rounded-xl bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
      >
        Back to PaliaEats
      </Link>
    </main>
  );
}
