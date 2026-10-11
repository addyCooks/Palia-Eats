// Tests for the admin "Ratings check" rules (lib/ratings/checks.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  checkRatings,
  normalizeEmail,
  normalizePhone,
  type CustomerInput,
  type OrderInput,
  type RatingInput,
  type RestaurantInput,
} from "../lib/ratings/checks.ts";

test("rating checks flag fake-looking ratings and leave ordinary ones alone", () => {
  const T0 = Date.parse("2026-10-08T12:00:00Z");
  const at = (minutes: number) => new Date(T0 + minutes * 60_000).toISOString();

  // ---- normalisers
  assert.equal(normalizePhone("+91 98765 43210"), "9876543210");
  assert.equal(normalizePhone("09876543210"), "9876543210");
  assert.equal(normalizePhone("12345"), null);
  assert.equal(normalizeEmail("Ra.hul+test1@Gmail.com"), "rahul@gmail.com");
  assert.equal(normalizeEmail("rahul@googlemail.com"), "rahul@gmail.com");
  assert.equal(normalizeEmail("a.b@example.com"), "a.b@example.com"); // dots only ignored for Gmail
  assert.equal(normalizeEmail("x@whatsapp.invalid"), null);
  assert.equal(normalizeEmail("nonsense"), null);

  const restaurants: RestaurantInput[] = [
    { id: "R1", name: "Brown Pizza", phones: ["98000 11111", null], email: "owner.brown@gmail.com", addressText: "Main Chowk, Palia Kalan" },
    { id: "R2", name: "Blue Cafe", phones: ["97000 22222"], email: "bluecafe@gmail.com", addressText: "Station Road" },
  ];

  let n = 0;
  function order(o: Partial<OrderInput> & { customerId: string; restaurantId: string }): OrderInput {
    n++;
    return {
      id: `O${n}`, orderNumber: 1000 + n, cancelled: false, placedAt: at(0), deliveredAt: at(45),
      phones: ["99999 00000", null], addressLine: "House 14, Ward 6", lat: null, lng: null, ...o,
    };
  }
  function rating(orderId: string, customerId: string, restaurantId: string, extra: Partial<RatingInput> = {}): RatingInput {
    return { orderId, customerId, restaurantId, stars: 5, comment: null, createdAt: at(50), ...extra };
  }
  const ids = (row: { flags: { id: string }[] }) => row.flags.map((f) => f.id).sort();

  // ---- 1. A perfectly ordinary customer: no flags at all
  {
    const o = order({ customerId: "C1", restaurantId: "R1" });
    const other = order({ customerId: "C1", restaurantId: "R2" });
    const { rows } = checkRatings({
      ratings: [rating(o.id, "C1", "R1")],
      orders: [o, other],
      customers: [{ id: "C1", phone: "96000 33333", email: "asha@example.com" }],
      restaurants,
    });
    assert.deepEqual(ids(rows[0]), [], "ordinary customer should have no flags");
    assert.equal(rows[0].level, "none");
  }

  // ---- 2. The obvious fake: the owner's own phone, email alias, address, delivered in 2 minutes
  {
    const o = order({
      customerId: "C2", restaurantId: "R1", phones: ["+91 98000 11111"], addressLine: "Main Chowk, Palia Kalan, near temple",
      deliveredAt: at(2),
    });
    const { rows } = checkRatings({
      ratings: [rating(o.id, "C2", "R1", { createdAt: at(2.5) })],
      orders: [o],
      customers: [{ id: "C2", phone: null, email: "owner.brown+x9@gmail.com" }],
      restaurants,
    });
    assert.deepEqual(ids(rows[0]), ["fast_delivery", "own_address", "own_email", "own_phone", "quick_rating"]);
    assert.equal(rows[0].level, "high");
    assert.ok(rows[0].score >= 5);
  }

  // ---- 3. Four accounts behind one Gmail inbox, same phone, same pin, same address, same comment
  {
    const accountsList: CustomerInput[] = ["a.rav", "arav+1", "arav+2", "ar.av+3"].map((local, i) => ({
      id: `F${i}`, phone: null, email: `${local}@gmail.com`,
    }));
    const orders = accountsList.map((c) =>
      order({ customerId: c.id, restaurantId: "R2", phones: ["95000 44444"], addressLine: "Shop 7 Bazaar Road", lat: 28.43171, lng: 80.58292 }),
    );
    const ratings = accountsList.map((c, i) => rating(orders[i].id, c.id, "R2", { comment: "Best food in town, loved it!" }));
    const { rows } = checkRatings({ ratings, orders, customers: accountsList, restaurants });
    for (const row of rows) {
      assert.deepEqual(ids(row), ["only_here", "quick_rating", "same_address", "same_comment", "same_email", "same_phone", "same_pin"].filter((x) => x !== "only_here" && x !== "quick_rating"));
      assert.equal(row.level, "high");
    }
    assert.match(rows[0].flags.find((f) => f.id === "same_email")!.text, /^3 other accounts/);
  }

  // ---- 4. Two customers who simply share a family address: only a medium-weight, "low" level flag
  {
    const o1 = order({ customerId: "H1", restaurantId: "R1", phones: ["90000 10001", null], addressLine: "House 3, Gali 2, Palia" });
    const o2 = order({ customerId: "H2", restaurantId: "R1", phones: ["90000 10002", null], addressLine: "house 3 gali 2 palia" });
    const { rows } = checkRatings({
      ratings: [rating(o1.id, "H1", "R1")],
      orders: [o1, o2],
      customers: [{ id: "H1", phone: null, email: "h1@example.com" }, { id: "H2", phone: null, email: "h2@example.com" }],
      restaurants,
    });
    assert.deepEqual(ids(rows[0]), ["same_address"]);
    assert.equal(rows[0].level, "low"); // a family sharing a house is not "needs a look" on its own
  }

  // ---- 5. Three orders to the same restaurant in a day, and a loyal customer who only uses one restaurant
  {
    const a = order({ customerId: "L1", restaurantId: "R1", placedAt: at(0) });
    const b = order({ customerId: "L1", restaurantId: "R1", placedAt: at(300) });
    const c = order({ customerId: "L1", restaurantId: "R1", placedAt: at(600) });
    const { rows } = checkRatings({
      ratings: [rating(a.id, "L1", "R1")],
      orders: [a, b, c],
      customers: [{ id: "L1", phone: null, email: "l1@example.com" }],
      restaurants,
    });
    assert.deepEqual(ids(rows[0]), ["many_orders", "only_here"]);
    assert.equal(rows[0].level, "medium");
  }

  // ---- 6. Cancelled orders don't count as "orders from this restaurant"
  {
    const a = order({ customerId: "K1", restaurantId: "R1" });
    const x = order({ customerId: "K1", restaurantId: "R1", cancelled: true });
    const { rows } = checkRatings({
      ratings: [rating(a.id, "K1", "R1")],
      orders: [a, x],
      customers: [{ id: "K1", phone: null, email: "k1@example.com" }],
      restaurants,
    });
    assert.deepEqual(ids(rows[0]), []);
  }

  // ---- 7. Summary: removing the flagged ratings changes the average
  {
    const good = order({ customerId: "S1", restaurantId: "R1" });
    const goodOther = order({ customerId: "S1", restaurantId: "R2" });
    const fake = order({ customerId: "S2", restaurantId: "R1", phones: ["98000 11111"], deliveredAt: at(1) });
    const { summaries } = checkRatings({
      ratings: [rating(good.id, "S1", "R1", { stars: 3 }), rating(fake.id, "S2", "R1", { stars: 5 })],
      orders: [good, goodOther, fake],
      customers: [{ id: "S1", phone: null, email: "s1@example.com" }, { id: "S2", phone: null, email: "s2@example.com" }],
      restaurants,
    });
    assert.equal(summaries.length, 1);
    assert.equal(summaries[0].ratings, 2);
    assert.equal(summaries[0].flagged, 1);
    assert.equal(summaries[0].average, 4);
    assert.equal(summaries[0].averageWithoutFlagged, 3);
    assert.equal(summaries[0].fastestMinutes, 1);
  }
});
