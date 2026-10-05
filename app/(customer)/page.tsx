import { getActiveRestaurants } from "@/lib/queries/public";
import { LiveUpdates } from "@/components/LiveUpdates";
import { RestaurantCard } from "@/components/restaurant/RestaurantCard";

export default async function HomePage() {
  const restaurants = await getActiveRestaurants();

  return (
    <main className="flex-1">
      {/* A restaurant opening or closing updates its tile instantly */}
      <LiveUpdates tables={[{ table: "restaurants" }]} />
      <section className="border-b border-border bg-surface">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 px-4 py-12 sm:py-16">
          <h1 className="max-w-xl text-3xl font-bold leading-tight sm:text-4xl">
            Good food from Palia&apos;s own kitchens, delivered by the people who cook it.
          </h1>
          <p className="max-w-xl text-lg text-stone-600">
            Pick a restaurant, build your order, and pay when it arrives.
          </p>
        </div>
      </section>

      <section className="mx-auto w-full max-w-5xl px-4 py-10">
        <h2 className="mb-5 text-xl font-bold">Our restaurants</h2>

        {restaurants.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border p-10 text-center text-stone-500">
            Restaurants are joining soon. Check back shortly!
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {restaurants.map((restaurant) => (
              <li key={restaurant.id}>
                <RestaurantCard restaurant={restaurant} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
