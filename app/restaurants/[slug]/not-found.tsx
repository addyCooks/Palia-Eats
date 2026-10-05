import Link from "next/link";

export default function RestaurantNotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-4 px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">We couldn&apos;t find that restaurant</h1>
      <p className="text-stone-600">
        It may have moved or isn&apos;t available right now.
      </p>
      <Link
        href="/"
        className="rounded-xl bg-brand px-5 py-3 font-medium text-white hover:bg-brand-dark"
      >
        See all restaurants
      </Link>
    </main>
  );
}
