// Tests for the search filters (lib/search/filters.ts) and opening-time wording (lib/utils/hours.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import * as f from "../lib/search/filters.ts";
import * as h from "../lib/utils/hours.ts";

test("search filters and opening-time wording", () => {
  // ---- parseFilters
  assert.deepEqual(f.parseFilters({}), f.NO_FILTERS);
  assert.deepEqual(f.parseFilters({ sort: "rating", diet: "veg,egg,jain", cuisine: ["Pizza", "Chinese,Pizza"], min: "250", max: "100" }), {
    sort: "rating", diet: ["veg", "egg"], cuisine: ["Pizza", "Chinese"], min: 100, max: 250,
  });
  assert.equal(f.parseFilters({ sort: "bogus" }).sort, "relevance");
  assert.equal(f.parseFilters({ min: "abc", max: "-5" }).min, null);
  assert.equal(f.parseFilters({ min: "abc", max: "-5" }).max, null);
  assert.equal(f.parseFilters({ min: "" }).min, null);
  assert.equal(f.parseFilters({ min: "0" }).min, 0);

  // ---- href round trip
  const filters = { sort: "price", diet: ["veg"], cuisine: ["North Indian"], min: 60, max: 300 } as const satisfies f.SearchFilters;
  const href = f.searchHref("paneer", filters);
  assert.equal(href, "/search?q=paneer&sort=price&diet=veg&cuisine=North+Indian&min=60&max=300");
  const back = f.parseFilters(Object.fromEntries(new URL("http://x" + href).searchParams));
  assert.deepEqual(back, filters);
  assert.equal(f.searchHref("", f.NO_FILTERS), "/search");
  assert.equal(f.activeFilterCount(filters), 3);

  // ---- matching
  const veg = { price: 120, is_veg: true, contains_egg: false, cuisines: ["Pizza"] };
  const egg = { price: 90, is_veg: false, contains_egg: true, cuisines: ["Chinese"] };
  const meat = { price: 260, is_veg: false, contains_egg: false, cuisines: ["North Indian", "Chinese"] };
  const all = [veg, egg, meat];
  const count = (x: Partial<f.SearchFilters>) => all.filter((d) => f.matchesFilters(d, { ...f.NO_FILTERS, ...x })).length;
  assert.equal(count({}), 3);
  assert.equal(count({ diet: ["veg"] }), 1);
  assert.equal(count({ diet: ["egg", "nonveg"] }), 2);
  assert.equal(count({ cuisine: ["Chinese"] }), 2);
  assert.equal(count({ min: 100 }), 2);
  assert.equal(count({ max: 120 }), 2);
  assert.equal(count({ min: 100, max: 200, diet: ["veg"] }), 1);
  assert.deepEqual(f.priceBounds(all), { low: 90, high: 260 });
  assert.deepEqual(f.priceBounds([{ price: 95 }, { price: 101 }]), { low: 90, high: 110 });
  assert.equal(f.priceBounds([{ price: 100 }]), null);
  assert.equal(f.priceBounds([]), null);

  // ---- nextOpening (times are India time; 2026-10-07 is a Wednesday = 3)
  const at = (iso: string) => new Date(iso + "+05:30");
  const r = { opening_time: "11:00:00", closing_time: "22:00:00", closed_days: [] };
  assert.equal(h.nextOpening(r, at("2026-10-07T09:00:00")), "today at 11:00 AM");
  assert.equal(h.nextOpening(r, at("2026-10-07T23:00:00")), "tomorrow at 11:00 AM");
  assert.equal(h.nextOpening({ ...r, closed_days: [4] }, at("2026-10-07T23:00:00")), "on Friday at 11:00 AM");
  assert.equal(h.nextOpening({ ...r, closed_days: [3] }, at("2026-10-07T09:00:00")), "tomorrow at 11:00 AM");
  assert.equal(h.nextOpening({ ...r, closed_days: [0, 1, 2, 3, 4, 5, 6] }, at("2026-10-07T09:00:00")), null);
  assert.equal(h.nextOpening({ opening_time: null, closing_time: null, closed_days: [3] }, at("2026-10-07T09:00:00")), "tomorrow");
  // late-night kitchen 6 PM – 2 AM, at 3 AM: opens tonight
  assert.equal(h.nextOpening({ opening_time: "18:00:00", closing_time: "02:00:00", closed_days: [] }, at("2026-10-07T03:00:00")), "today at 6:00 PM");
  // and the status agrees it is closed then
  assert.equal(h.getRestaurantStatus({ opening_time: "18:00:00", closing_time: "02:00:00", closed_days: [], is_accepting_orders: true }, at("2026-10-07T03:00:00")).canOrder, false);
});
