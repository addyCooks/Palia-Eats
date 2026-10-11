// Tests for what the crash log ignores and hides (lib/monitoring/noise.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import { isNoise, redact, safePath } from "../lib/monitoring/noise.ts";

test("errors that are not our bugs are ignored", () => {
  assert.ok(isNoise("NEXT_REDIRECT"));
  assert.ok(isNoise("Failed to fetch"));
  assert.ok(isNoise("Load failed"));
  assert.ok(isNoise("Script error."));
  assert.ok(isNoise("ResizeObserver loop completed with undelivered notifications."));
  assert.ok(isNoise("boom", "at chrome-extension://abc/content.js:1:1"));
});

test("real errors are kept", () => {
  assert.ok(!isNoise("Cannot read properties of undefined (reading 'id')"));
  assert.ok(!isNoise("Could not load orders: permission denied for table orders"));
});

test("emails, long numbers and login tokens are removed from error text", () => {
  assert.equal(redact("duplicate key for asha.k@example.com"), "duplicate key for [email]");
  assert.equal(redact("phone 9876543210 rejected"), "phone [number] rejected");
  assert.equal(
    redact("bad token eyJhbGciOiJIUzI1NiIsInR5cCI6.eyJzdWIiOiIxMjM0NTY3ODkwIiwi.SflKxwRJSMeKKF2QT4fw"),
    "bad token [token]",
  );
  assert.equal(redact("nothing private here"), "nothing private here");
});

test("page addresses lose their query part and any secret-looking piece", () => {
  assert.equal(safePath("/orders/6f1c2a4e-8b3d-4c1a-9e7f-0123456789ab"), "/orders/:id");
  assert.equal(safePath("/search?q=biryani&email=a@b.c"), "/search");
  assert.equal(safePath("/panel/enter/abcdefghijklmnopqrstuvwxyz0123456789ABCDEF"), "/panel/enter/:id");
  assert.equal(safePath("/restaurants/brown-pizza"), "/restaurants/brown-pizza");
});
