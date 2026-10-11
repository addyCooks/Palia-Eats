// Tests for the numbers in the Monday summary email (lib/reports/weekly.ts) and the Monday-to-Sunday
// week maths it relies on (lib/utils/time.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { percentChange, summarizeWeek } from "../lib/reports/weekly.ts";
import { addDaysToKey, istDateKey, mondayOfKey } from "../lib/utils/time.ts";

// Indian times written as IST so the day boundaries are easy to see.
const ist = (iso: string) => new Date(`${iso}+05:30`).toISOString();

test("totals, best day and top dishes for a week", () => {
  const orders = [
    { placed_at: ist("2026-10-05T12:00:00"), total: 300, status: "delivered" },
    { placed_at: ist("2026-10-05T20:00:00"), total: 200, status: "delivered" },
    { placed_at: ist("2026-10-07T13:00:00"), total: 450, status: "delivered" },
    { placed_at: ist("2026-10-07T19:00:00"), total: 999, status: "cancelled" },
  ];
  const items = [
    { item_name: "Butter Chicken (Half)", quantity: 2 },
    { item_name: "Butter Chicken", quantity: 1 },
    { item_name: "Naan", quantity: 5 },
    { item_name: "Lassi", quantity: 1 },
  ];
  const summary = summarizeWeek(orders, items, istDateKey);
  assert.equal(summary.delivered, 3);
  assert.equal(summary.cancelled, 1);
  assert.equal(summary.sales, 950);
  assert.equal(summary.averageOrder, 317);
  // Monday 5 Oct brought in 300 + 200 = 500, more than Wednesday's 450
  assert.deepEqual(summary.bestDay, { dayKey: "2026-10-05", sales: 500, orders: 2 });
  assert.deepEqual(summary.topDishes, [
    { name: "Naan", quantity: 5 },
    { name: "Butter Chicken", quantity: 3 },
    { name: "Lassi", quantity: 1 },
  ]);
});

test("an empty week", () => {
  const summary = summarizeWeek([], [], istDateKey);
  assert.equal(summary.delivered, 0);
  assert.equal(summary.sales, 0);
  assert.equal(summary.averageOrder, 0);
  assert.equal(summary.bestDay, null);
  assert.deepEqual(summary.topDishes, []);
});

test("a late-night order belongs to the Indian day it was placed on", () => {
  // 11:30 PM IST on Sunday is still Sunday, even though it is 18:00 UTC.
  const summary = summarizeWeek([{ placed_at: ist("2026-10-11T23:30:00"), total: 100, status: "delivered" }], [], istDateKey);
  assert.equal(summary.bestDay?.dayKey, "2026-10-11");
});

test("percent change against the week before", () => {
  assert.equal(percentChange(120, 100), 20);
  assert.equal(percentChange(80, 100), -20);
  assert.equal(percentChange(100, 100), 0);
  assert.equal(percentChange(50, 0), null);
});

test("the week that just ended, whatever day the timer runs on a Monday", () => {
  // Monday 12 Oct 2026: the summary covers Monday 5 Oct to Sunday 11 Oct.
  const thisMonday = mondayOfKey("2026-10-12");
  assert.equal(thisMonday, "2026-10-12");
  assert.equal(addDaysToKey(thisMonday, -7), "2026-10-05");
  assert.equal(addDaysToKey(thisMonday, -1), "2026-10-11");
  // Any day in the week gives the same Monday.
  for (const day of ["2026-10-12", "2026-10-14", "2026-10-18"]) assert.equal(mondayOfKey(day), "2026-10-12");
});
