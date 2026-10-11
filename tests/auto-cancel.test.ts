// Tests for what happens to an order nobody answers (lib/orders/auto-cancel.ts).
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  AUTO_CANCEL_AFTER_MINUTES,
  REMIND_AFTER_MINUTES,
  STALE_AFTER_HOURS,
  pendingAction,
} from "../lib/orders/auto-cancel.ts";

const NOW = Date.parse("2026-10-11T12:00:00Z");
const ago = (minutes: number) => NOW - minutes * 60_000;

test("a fresh order is left alone", () => {
  assert.equal(pendingAction(ago(0), NOW), "none");
  assert.equal(pendingAction(ago(REMIND_AFTER_MINUTES - 0.1), NOW), "none");
});

test("after 5 minutes the restaurant is reminded", () => {
  assert.equal(pendingAction(ago(REMIND_AFTER_MINUTES), NOW), "remind");
  assert.equal(pendingAction(ago(AUTO_CANCEL_AFTER_MINUTES - 0.1), NOW), "remind");
});

test("after 15 minutes the order is cancelled and the customer told", () => {
  assert.equal(pendingAction(ago(AUTO_CANCEL_AFTER_MINUTES), NOW), "cancel");
  assert.equal(pendingAction(ago(60), NOW), "cancel");
  assert.equal(pendingAction(ago(STALE_AFTER_HOURS * 60 - 1), NOW), "cancel");
});

test("a day-old leftover is tidied away without emailing anyone", () => {
  assert.equal(pendingAction(ago(STALE_AFTER_HOURS * 60), NOW), "cancel_quietly");
  assert.equal(pendingAction(ago(10 * 24 * 60), NOW), "cancel_quietly");
});

test("the times are in a sensible order", () => {
  assert.ok(REMIND_AFTER_MINUTES < AUTO_CANCEL_AFTER_MINUTES);
  assert.ok(AUTO_CANCEL_AFTER_MINUTES < STALE_AFTER_HOURS * 60);
});
