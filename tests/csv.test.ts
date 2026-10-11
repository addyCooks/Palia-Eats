// Tests for the spreadsheet downloads (lib/utils/csv.ts): quoting, and keeping customer-typed text
// from being run as a spreadsheet formula.
import assert from "node:assert/strict";
import { test } from "node:test";
import { csvCell, toCsv } from "../lib/utils/csv.ts";

test("plain values stay plain", () => {
  assert.equal(csvCell("Butter Chicken"), "Butter Chicken");
  assert.equal(csvCell(249.5), "249.5");
  assert.equal(csvCell(null), "");
  assert.equal(csvCell(undefined), "");
});

test("commas, quotes and line breaks are quoted", () => {
  assert.equal(csvCell("Ward 4, near temple"), '"Ward 4, near temple"');
  assert.equal(csvCell('He said "hi"'), '"He said ""hi"""');
  assert.equal(csvCell("line one\nline two"), '"line one\nline two"');
});

test("text that a spreadsheet would run as a formula is neutralised", () => {
  assert.equal(csvCell('=HYPERLINK("http://evil","click")'), `"'=HYPERLINK(""http://evil"",""click"")"`);
  assert.equal(csvCell("@SUM(A1:A9)"), "'@SUM(A1:A9)");
  assert.equal(csvCell("+cmd|' /C calc'!A0"), `'+cmd|' /C calc'!A0`);
  assert.equal(csvCell("-2+3+cmd"), "'-2+3+cmd");
});

test("phone numbers and negative amounts are left as they are", () => {
  assert.equal(csvCell("+91 98765 43210"), "+91 98765 43210");
  assert.equal(csvCell("-50"), "-50");
  assert.equal(csvCell(-12.5), "-12.5");
});

test("a whole file starts with a byte-order mark and uses Windows line ends", () => {
  const csv = toCsv(["Name", "Total"], [["Asha", 120], ["Ravi, Jr", 80]]);
  assert.ok(csv.startsWith("﻿Name,Total\r\n"));
  assert.ok(csv.includes('Asha,120\r\n'));
  assert.ok(csv.includes('"Ravi, Jr",80\r\n'));
});
