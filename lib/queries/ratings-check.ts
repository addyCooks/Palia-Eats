import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/session";
import { emailsById, eventsFor } from "@/lib/queries/admin";
import { checkRatings, type CheckedRating, type RestaurantSummary } from "@/lib/ratings/checks";
import { CANCELLED_STATUSES } from "@/lib/orders/status";
import type { Order, OrderStatus } from "@/types/app";

// Admin > Ratings. Reads the latest ratings with everything needed to look for fake ones,
// runs the warning-sign checks (lib/ratings/checks.ts) and returns them worst-first.

export const RATINGS_LOOKED_AT = 500;
export const RATINGS_PAGE_SIZE = 15;
export type RatingsFilter = "needs" | "all";

export type RatingCheckRow = CheckedRating & {
  restaurantName: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  customerBlocked: boolean;
};

const chunk = <T>(items: T[], size: number): T[][] =>
  Array.from({ length: Math.ceil(items.length / size) }, (_, i) => items.slice(i * size, i * size + size));

export async function getRatingsCheck({
  filter,
  search,
  page,
}: {
  filter: RatingsFilter;
  search: string;
  page: number;
}): Promise<{
  rows: RatingCheckRow[];
  matching: number;
  analysed: number;
  needsLook: number;
  summaries: RestaurantSummary[];
}> {
  await requireAdmin();
  const supabase = await createClient();

  const { data: ratingData, error } = await supabase
    .from("order_ratings")
    .select("order_id, customer_id, restaurant_id, stars, comment, created_at")
    .order("created_at", { ascending: false })
    .limit(RATINGS_LOOKED_AT);
  if (error) throw new Error(`Could not load ratings: ${error.message}`);
  const ratings = (ratingData ?? []).map((row) => ({
    orderId: row.order_id as string,
    customerId: row.customer_id as string,
    restaurantId: row.restaurant_id as string,
    stars: Number(row.stars),
    comment: (row.comment as string | null) ?? null,
    createdAt: row.created_at as string,
  }));
  if (ratings.length === 0) return { rows: [], matching: 0, analysed: 0, needsLook: 0, summaries: [] };

  const restaurantIds = [...new Set(ratings.map((rating) => rating.restaurantId))];
  const ratedOrderIds = ratings.map((rating) => rating.orderId);
  const ratingCustomerIds = [...new Set(ratings.map((rating) => rating.customerId))];

  const [orderResult, restaurantResult, emails, events, profiles] = await Promise.all([
    // Every order: what else a customer ordered, and who shares a phone or address, matters.
    supabase
      .from("orders")
      .select("id, order_number, customer_id, restaurant_id, status, status_updated_at, placed_at, customer_name, customer_phone, delivery_address")
      .limit(20000),
    supabase
      .from("restaurants")
      .select("id, name, phone, address_text, restaurant_private(notification_email, notification_phone)")
      .in("id", restaurantIds),
    emailsById(),
    eventsFor(ratedOrderIds),
    Promise.all(
      chunk(ratingCustomerIds, 100).map((ids) =>
        supabase.from("profiles").select("id, full_name, phone, is_blocked").in("id", ids),
      ),
    ),
  ]);
  if (orderResult.error) throw new Error(`Could not load orders: ${orderResult.error.message}`);
  if (restaurantResult.error) throw new Error(`Could not load restaurants: ${restaurantResult.error.message}`);

  // When each rated order was marked delivered (the latest time, if it was undone and redone)
  const deliveredAt = new Map<string, string>();
  for (const event of events) {
    if (event.status !== "delivered") continue;
    const known = deliveredAt.get(event.order_id);
    if (!known || event.at > known) deliveredAt.set(event.order_id, event.at);
  }

  type OrderRow = {
    id: string;
    order_number: number;
    customer_id: string;
    restaurant_id: string;
    status: OrderStatus;
    status_updated_at: string;
    placed_at: string;
    customer_name: string;
    customer_phone: string | null;
    delivery_address: Order["delivery_address"] | null;
  };
  const orders = (orderResult.data ?? []) as OrderRow[];
  const orderById = new Map(orders.map((order) => [order.id, order]));

  const profileById = new Map(
    profiles.flatMap((result) => result.data ?? []).map((profile) => [profile.id as string, profile]),
  );
  const customerIds = [...new Set(orders.map((order) => order.customer_id))];

  const restaurants = (restaurantResult.data ?? []).map((row) => {
    const priv = Array.isArray(row.restaurant_private) ? row.restaurant_private[0] : row.restaurant_private;
    return {
      id: row.id as string,
      name: row.name as string,
      phones: [row.phone as string | null, (priv?.notification_phone as string | null) ?? null],
      email: (priv?.notification_email as string | null) ?? null,
      addressText: (row.address_text as string | null) ?? null,
    };
  });

  const { rows: checked, summaries } = checkRatings({
    ratings,
    orders: orders.map((order) => {
      const address = order.delivery_address;
      return {
        id: order.id,
        orderNumber: order.order_number,
        customerId: order.customer_id,
        restaurantId: order.restaurant_id,
        cancelled: CANCELLED_STATUSES.includes(order.status),
        placedAt: order.placed_at,
        // Orders from before the status history existed fall back to their last status change
        deliveredAt: deliveredAt.get(order.id) ?? (order.status === "delivered" ? order.status_updated_at : null),
        phones: [order.customer_phone, address?.phone ?? null],
        addressLine: address?.address_line ?? null,
        lat: typeof address?.lat === "number" ? address.lat : null,
        lng: typeof address?.lng === "number" ? address.lng : null,
      };
    }),
    customers: customerIds.map((id) => ({
      id,
      phone: (profileById.get(id)?.phone as string | null | undefined) ?? null,
      email: emails.get(id) ?? null,
    })),
    restaurants,
  });

  const restaurantName = new Map(restaurants.map((restaurant) => [restaurant.id, restaurant.name]));
  const decorated: RatingCheckRow[] = checked.map((row) => {
    const profile = profileById.get(row.customerId);
    const order = orderById.get(row.orderId);
    return {
      ...row,
      restaurantName: restaurantName.get(row.restaurantId) ?? "Restaurant",
      customerName: (profile?.full_name as string | null) ?? order?.customer_name ?? "Customer",
      customerPhone: order?.customer_phone ?? (profile?.phone as string | null) ?? null,
      customerEmail: emails.get(row.customerId) ?? null,
      customerBlocked: Boolean(profile?.is_blocked),
    };
  });

  const needle = search.trim().toLowerCase();
  const needleDigits = needle.replace(/\D/g, "");
  const matchesSearch = (row: RatingCheckRow) =>
    !needle ||
    [row.customerName, row.restaurantName, row.customerEmail ?? "", String(row.orderNumber ?? "")].some((text) =>
      text.toLowerCase().includes(needle),
    ) ||
    (needleDigits.length >= 4 && (row.customerPhone ?? "").replace(/\D/g, "").includes(needleDigits));

  const needsLook = decorated.filter((row) => row.score >= 3).length;
  const wanted = decorated
    .filter((row) => (filter === "all" ? true : row.score >= 3))
    .filter(matchesSearch)
    .sort((a, b) => b.score - a.score || b.createdAt.localeCompare(a.createdAt));

  return {
    rows: wanted.slice((page - 1) * RATINGS_PAGE_SIZE, page * RATINGS_PAGE_SIZE),
    matching: wanted.length,
    analysed: decorated.length,
    needsLook,
    summaries,
  };
}
