// Tests that the English and Hindi texts stay in step (lib/i18n): every line exists in both, no Hindi
// line is empty, the {placeholders} match, and the Hindi really is Hindi.
import assert from "node:assert/strict";
import { test } from "node:test";
import { en } from "../lib/i18n/en.ts";
import { hi } from "../lib/i18n/hi.ts";
import { interpolate } from "../lib/i18n/interpolate.ts";

const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

test("English and Hindi have exactly the same keys", () => {
  const english = Object.keys(en).sort();
  const hindi = Object.keys(hi).sort();
  assert.deepEqual(
    english.filter((key) => !hindi.includes(key)),
    [],
    "missing in Hindi",
  );
  assert.deepEqual(
    hindi.filter((key) => !english.includes(key)),
    [],
    "only in Hindi",
  );
});

test("no line is empty, and every {placeholder} appears in both languages", () => {
  for (const key of Object.keys(en) as (keyof typeof en)[]) {
    assert.ok(en[key].trim(), `English is empty: ${key}`);
    assert.ok(hi[key].trim(), `Hindi is empty: ${key}`);
    assert.deepEqual(placeholders(hi[key]), placeholders(en[key]), `placeholders differ: ${key}`);
  }
});

test("Hindi lines contain Devanagari letters (not a pasted English line)", () => {
  // A few lines are meant to be the same in both languages (a brand name, a number).
  const sameOnPurpose = new Set(["footer.copyright", "lang.switch_to"]);
  for (const key of Object.keys(hi) as (keyof typeof hi)[]) {
    if (sameOnPurpose.has(key)) continue;
    assert.match(hi[key], /[ऀ-ॿ]/, `no Hindi letters in: ${key}`);
  }
});

test("placeholders are filled in, and left visible when no value is given", () => {
  assert.equal(interpolate("Order #{n} from {name}", { n: 1058, name: "Brown Pizza" }), "Order #1058 from Brown Pizza");
  assert.equal(interpolate("Order #{n}", {}), "Order #{n}");
  assert.equal(interpolate("No placeholders"), "No placeholders");
});
