// Warning signs for fake orders and fake ratings (used by Admin > Ratings).
//
// A restaurant moves its own orders to "Delivered", and a rating only needs an own delivered
// order, so a restaurant could place orders from made-up accounts, deliver them to itself and
// rate itself 5 stars. Nothing here can PROVE that. It looks for the traces such a loop leaves
// behind (a restaurant's own phone or email, one inbox behind many accounts, an order
// "delivered" in two minutes ...) and gives each rating a score. Family members can share a
// phone or an address, so a flag is a reason to look, never proof.
//
// This file has no imports on purpose: it is plain logic that can be tested on its own.

export type FlagId =
  | "own_phone"
  | "own_email"
  | "own_address"
  | "same_phone"
  | "same_email"
  | "same_pin"
  | "same_address"
  | "fast_delivery"
  | "same_comment"
  | "many_orders"
  | "quick_rating"
  | "only_here";

export type Flag = { id: FlagId; weight: 1 | 2 | 3; text: string };
export type Level = "high" | "medium" | "low" | "none";

export const FAST_DELIVERY_MINUTES = 10;
export const QUICK_RATING_SECONDS = 60;
export const MANY_ORDERS = 3;
export const MANY_ORDERS_HOURS = 24;

export type RatingInput = {
  orderId: string;
  customerId: string;
  restaurantId: string;
  stars: number;
  comment: string | null;
  createdAt: string;
};

export type OrderInput = {
  id: string;
  orderNumber: number;
  customerId: string;
  restaurantId: string;
  cancelled: boolean;
  placedAt: string;
  deliveredAt: string | null;
  // The phone typed for the order, and the one saved on the address (any may be missing)
  phones: (string | null)[];
  addressLine: string | null;
  lat: number | null;
  lng: number | null;
};

export type CustomerInput = {
  id: string;
  phone: string | null;
  email: string | null;
};

export type RestaurantInput = {
  id: string;
  name: string;
  phones: (string | null)[];
  email: string | null;
  addressText: string | null;
};

export type CheckedRating = RatingInput & {
  orderNumber: number | null;
  placedAt: string | null;
  deliveredAt: string | null;
  deliveredMinutes: number | null;
  flags: Flag[];
  score: number;
  level: Level;
};

export type RestaurantSummary = {
  restaurantId: string;
  name: string;
  ratings: number;
  fiveStarShare: number; // 0..1
  flagged: number; // medium or high
  average: number;
  averageWithoutFlagged: number | null;
  fastestMinutes: number | null;
};

// ------------------------------------------------------------------ small helpers

// The last 10 digits, so "+91 98765 43210", "09876543210" and "9876543210" match.
export function normalizePhone(raw: string | null | undefined): string | null {
  const digits = (raw ?? "").replace(/\D/g, "");
  return digits.length >= 10 ? digits.slice(-10) : null;
}

// One inbox, however it is written: Gmail ignores dots and anything after a "+", so
// name+1@gmail.com, n.ame@gmail.com and name@googlemail.com are all "name@gmail.com".
export function normalizeEmail(raw: string | null | undefined): string | null {
  const value = (raw ?? "").trim().toLowerCase();
  const at = value.lastIndexOf("@");
  if (at < 1) return null;
  let local = value.slice(0, at).split("+")[0];
  let domain = value.slice(at + 1);
  if (!domain || domain.endsWith("whatsapp.invalid")) return null; // made-up address for WhatsApp customers
  if (domain === "googlemail.com") domain = "gmail.com";
  if (domain === "gmail.com") local = local.replace(/\./g, "");
  return local ? `${local}@${domain}` : null;
}

export function normalizeText(raw: string | null | undefined): string {
  return (raw ?? "").toLowerCase().replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}

// About 11 metres: two accounts on the same map pin are almost certainly at the same door.
function pinKey(lat: number | null, lng: number | null): string | null {
  return lat === null || lng === null ? null : `${lat.toFixed(4)},${lng.toFixed(4)}`;
}

function addTo(map: Map<string, Set<string>>, key: string, id: string) {
  const set = map.get(key);
  if (set) set.add(id);
  else map.set(key, new Set([id]));
}

const others = (map: Map<string, Set<string>>, key: string | null, self: string): number => {
  if (!key) return 0;
  const set = map.get(key);
  if (!set) return 0;
  return set.size - (set.has(self) ? 1 : 0);
};

const accounts = (n: number) => `${n} other ${n === 1 ? "account" : "accounts"}`;

export function levelFor(score: number): Level {
  return score >= 5 ? "high" : score >= 3 ? "medium" : score >= 1 ? "low" : "none";
}

const minutesBetween = (from: string, to: string) => (new Date(to).getTime() - new Date(from).getTime()) / 60_000;

// ------------------------------------------------------------------ the checks

export function checkRatings(input: {
  ratings: RatingInput[];
  orders: OrderInput[]; // every order on the platform (to see what else a customer ordered)
  customers: CustomerInput[];
  restaurants: RestaurantInput[];
}): { rows: CheckedRating[]; summaries: RestaurantSummary[] } {
  const orderById = new Map(input.orders.map((order) => [order.id, order]));
  const customerById = new Map(input.customers.map((customer) => [customer.id, customer]));
  const restaurantById = new Map(input.restaurants.map((restaurant) => [restaurant.id, restaurant]));

  // Who ordered from each restaurant with what (a Set of accounts per phone, inbox, pin, address)
  const phoneAccounts = new Map<string, Set<string>>();
  const emailAccounts = new Map<string, Set<string>>();
  const pinAccounts = new Map<string, Set<string>>();
  const addressAccounts = new Map<string, Set<string>>();
  const ordersByCustomer = new Map<string, OrderInput[]>(); // across all rated restaurants
  for (const order of input.orders) {
    for (const phone of order.phones) {
      const key = normalizePhone(phone);
      if (key) addTo(phoneAccounts, `${order.restaurantId}|${key}`, order.customerId);
    }
    const email = normalizeEmail(customerById.get(order.customerId)?.email);
    if (email) addTo(emailAccounts, `${order.restaurantId}|${email}`, order.customerId);
    const pin = pinKey(order.lat, order.lng);
    if (pin) addTo(pinAccounts, `${order.restaurantId}|${pin}`, order.customerId);
    const address = normalizeText(order.addressLine);
    if (address.length >= 8) addTo(addressAccounts, `${order.restaurantId}|${address}`, order.customerId);
    const list = ordersByCustomer.get(order.customerId) ?? [];
    list.push(order);
    ordersByCustomer.set(order.customerId, list);
  }

  // The same words from different accounts
  const commentAccounts = new Map<string, Set<string>>();
  for (const rating of input.ratings) {
    const text = normalizeText(rating.comment);
    if (text.length >= 8) addTo(commentAccounts, `${rating.restaurantId}|${text}`, rating.customerId);
  }

  const rows: CheckedRating[] = input.ratings.map((rating) => {
    const order = orderById.get(rating.orderId) ?? null;
    const customer = customerById.get(rating.customerId) ?? null;
    const restaurant = restaurantById.get(rating.restaurantId) ?? null;
    const flags: Flag[] = [];
    const flag = (id: FlagId, weight: 1 | 2 | 3, text: string) => flags.push({ id, weight, text });

    const deliveredMinutes = order?.deliveredAt ? minutesBetween(order.placedAt, order.deliveredAt) : null;

    // --- The restaurant itself
    const restaurantPhones = new Set((restaurant?.phones ?? []).map(normalizePhone).filter(Boolean) as string[]);
    const customerPhones = [...(order?.phones ?? []), customer?.phone].map(normalizePhone).filter(Boolean) as string[];
    if (customerPhones.some((phone) => restaurantPhones.has(phone))) {
      flag("own_phone", 3, "Ordered with the restaurant's own phone number");
    }

    const restaurantEmail = normalizeEmail(restaurant?.email);
    if (restaurantEmail && restaurantEmail === normalizeEmail(customer?.email)) {
      flag("own_email", 3, "The customer's email is the restaurant's email (or an alias of it, like name+1@gmail.com)");
    }

    const there = normalizeText(restaurant?.addressText);
    const here = normalizeText(order?.addressLine);
    if (there.length >= 8 && here.length >= 8 && (here.includes(there) || there.includes(here))) {
      flag("own_address", 3, "Delivered to the restaurant's own address");
    }

    // --- Many accounts, one person
    const samePhone = Math.max(
      0,
      ...(order?.phones ?? []).map((phone) => {
        const key = normalizePhone(phone);
        return key ? others(phoneAccounts, `${rating.restaurantId}|${key}`, rating.customerId) : 0;
      }),
    );
    if (samePhone > 0) flag("same_phone", 3, `${accounts(samePhone)} ordered from this restaurant with the same phone number`);

    const email = normalizeEmail(customer?.email);
    const sameEmail = email ? others(emailAccounts, `${rating.restaurantId}|${email}`, rating.customerId) : 0;
    if (sameEmail > 0) flag("same_email", 3, `${accounts(sameEmail)} use the same email inbox (for example name+1@gmail.com)`);

    const pin = pinKey(order?.lat ?? null, order?.lng ?? null);
    const samePin = pin ? others(pinAccounts, `${rating.restaurantId}|${pin}`, rating.customerId) : 0;
    if (samePin > 0) flag("same_pin", 3, `${accounts(samePin)} ordered from the exact same map pin`);

    const address = normalizeText(order?.addressLine);
    const sameAddress = address.length >= 8 ? others(addressAccounts, `${rating.restaurantId}|${address}`, rating.customerId) : 0;
    if (sameAddress > 0) flag("same_address", 2, `${accounts(sameAddress)} used the same delivery address`);

    // --- A loop that is too fast or too neat
    if (deliveredMinutes !== null && deliveredMinutes < FAST_DELIVERY_MINUTES) {
      const shown = deliveredMinutes < 1 ? "under a minute" : `${Math.round(deliveredMinutes)} min`;
      flag("fast_delivery", 2, `Marked delivered only ${shown} after it was ordered`);
    }

    const comment = normalizeText(rating.comment);
    const sameComment = comment.length >= 8 ? others(commentAccounts, `${rating.restaurantId}|${comment}`, rating.customerId) : 0;
    if (sameComment > 0) flag("same_comment", 2, `Same comment as ${accounts(sameComment)}`);

    if (order) {
      const t = new Date(order.placedAt).getTime();
      const near = (ordersByCustomer.get(rating.customerId) ?? []).filter(
        (other) =>
          other.restaurantId === rating.restaurantId &&
          !other.cancelled &&
          Math.abs(new Date(other.placedAt).getTime() - t) <= MANY_ORDERS_HOURS * 3_600_000,
      ).length;
      if (near >= MANY_ORDERS) flag("many_orders", 2, `${near} orders to this restaurant within ${MANY_ORDERS_HOURS} hours`);
    }

    if (order?.deliveredAt) {
      const seconds = (new Date(rating.createdAt).getTime() - new Date(order.deliveredAt).getTime()) / 1000;
      if (seconds >= 0 && seconds < QUICK_RATING_SECONDS) {
        flag("quick_rating", 1, `Rated ${Math.round(seconds)} seconds after delivery`);
      }
    }

    const mine = (ordersByCustomer.get(rating.customerId) ?? []).filter((other) => !other.cancelled);
    if (mine.length >= 2 && mine.every((other) => other.restaurantId === rating.restaurantId)) {
      flag("only_here", 1, `All ${mine.length} of this customer's orders are from this restaurant`);
    }

    const score = flags.reduce((sum, item) => sum + item.weight, 0);
    return {
      ...rating,
      orderNumber: order?.orderNumber ?? null,
      placedAt: order?.placedAt ?? null,
      deliveredAt: order?.deliveredAt ?? null,
      deliveredMinutes,
      flags: flags.sort((a, b) => b.weight - a.weight),
      score,
      level: levelFor(score),
    };
  });

  // One line per restaurant: how the ratings look, and what the average would be without
  // the ones that need a look.
  const summaries: RestaurantSummary[] = [];
  const byRestaurant = new Map<string, CheckedRating[]>();
  for (const row of rows) byRestaurant.set(row.restaurantId, [...(byRestaurant.get(row.restaurantId) ?? []), row]);
  for (const [restaurantId, list] of byRestaurant) {
    const clean = list.filter((row) => row.score < 3);
    const mean = (items: CheckedRating[]) => items.reduce((sum, row) => sum + row.stars, 0) / items.length;
    const times = list.map((row) => row.deliveredMinutes).filter((value): value is number => value !== null);
    summaries.push({
      restaurantId,
      name: restaurantById.get(restaurantId)?.name ?? "Restaurant",
      ratings: list.length,
      fiveStarShare: list.filter((row) => row.stars === 5).length / list.length,
      flagged: list.length - clean.length,
      average: mean(list),
      averageWithoutFlagged: clean.length > 0 ? mean(clean) : null,
      fastestMinutes: times.length > 0 ? Math.min(...times) : null,
    });
  }
  summaries.sort((a, b) => b.flagged - a.flagged || b.ratings - a.ratings);

  return { rows, summaries };
}
